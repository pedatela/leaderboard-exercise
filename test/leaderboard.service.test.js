import { jest } from '@jest/globals';
import { pool } from '../src/db.js';
import { setNow } from '../src/lib/clock.js';
import { LeaderboardService } from '../src/service/leaderbord.service.js';

const WINDOW_END = '2026-11-12T12:00:00.000Z';
const WINDOW_START = '2026-10-13T12:00:00.000Z';
const INSIDE_WINDOW = '2026-11-01T12:00:00.000Z';

describe('LeaderboardService (PostgreSQL)', () => {
  const service = new LeaderboardService();
  let client;

  beforeAll(async () => {
    client = await pool.connect();
  });

  beforeEach(async () => {
    setNow(WINDOW_END);
    // Temporary tables shadow the application tables on this connection only.
    // Rollback removes all fixtures without touching persistent data.
    await client.query('BEGIN');
    await client.query(`
      CREATE TEMP TABLE organizations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      ) ON COMMIT DROP;
      INSERT INTO organizations (id, name) VALUES
        (1, 'Acme Contact Centers'), (2, 'Northwind Health');
      CREATE TEMP TABLE learners (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL
      ) ON COMMIT DROP;
      CREATE TEMP TABLE practice_sessions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        learner_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        score INTEGER,
        completed_at TIMESTAMPTZ
      ) ON COMMIT DROP;
    `);
    jest.spyOn(pool, 'query').mockImplementation((...args) => client.query(...args));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    setNow(null);
    if (client) await client.query('ROLLBACK');
  });

  afterAll(async () => {
    if (client) client.release();
    await pool.end();
  });

  async function addLearner(firstName, organizationId = 1) {
    const { rows } = await client.query(
      `INSERT INTO learners (organization_id, first_name, last_name, email)
       VALUES ($1, $2, 'SecretSurname', 'private@example.test') RETURNING id`,
      [organizationId, firstName],
    );
    return rows[0].id;
  }

  async function addSessions(learnerId, scores, {
    organizationId = 1,
    status = 'completed',
    completedAt = INSIDE_WINDOW,
  } = {}) {
    await client.query(
      `INSERT INTO practice_sessions
         (organization_id, learner_id, status, score, completed_at)
       SELECT $1, $2, $3, score, $4::timestamptz
       FROM unnest($5::integer[]) AS scores(score)`,
      [organizationId, learnerId, status, completedAt, scores],
    );
  }

  it('averages every qualifying session and returns only the public response fields', async () => {
    const learnerId = await addLearner('Maria');
    await addSessions(learnerId, [700, 800, 900, 1000]);

    const result = await service.getOrgLeaderboard(1);

    expect(result).toEqual({
      organization_id: 1,
      organization_name: 'Acme Contact Centers',
      window: { start: WINDOW_START, end: WINDOW_END },
      entries: [{
        rank: 1,
        learner_id: learnerId,
        display_name: 'Maria S.',
        score_pct: 85,
        session_count: 4,
      }],
    });
    expect(JSON.stringify(result)).not.toContain('SecretSurname');
    expect(JSON.stringify(result)).not.toContain('private@example.test');
  });

  it('includes both window boundaries and requires three completed sessions inside the window', async () => {
    const qualified = await addLearner('Qualified');
    await addSessions(qualified, [800], { completedAt: WINDOW_START });
    await addSessions(qualified, [900]);
    await addSessions(qualified, [1000], { completedAt: WINDOW_END });

    const excluded = await addLearner('Excluded');
    await addSessions(excluded, [1000, 1000]);
    for (const learnerId of [qualified, excluded]) {
      await addSessions(learnerId, [0], { completedAt: '2026-10-13T11:59:59.999Z' });
      await addSessions(learnerId, [0], { completedAt: '2026-11-12T12:00:00.001Z' });
      await addSessions(learnerId, [0], { status: 'in_progress' });
      await addSessions(learnerId, [0], { status: 'abandoned' });
      await addSessions(learnerId, [0], { completedAt: null });
    }

    const { entries } = await service.getOrgLeaderboard(1);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ learner_id: qualified, session_count: 3, score_pct: 90 });
  });

  it('checks the organization of both the learner and their sessions', async () => {
    const local = await addLearner('Local');
    await addSessions(local, [800, 800, 800]);
    await addSessions(local, [1000, 1000, 1000], { organizationId: 2 });
    const foreign = await addLearner('Foreign', 2);
    await addSessions(foreign, [1000, 1000, 1000], { organizationId: 2 });
    await addSessions(foreign, [1000, 1000, 1000]);
    const mismatched = await addLearner('Mismatched');
    await addSessions(mismatched, [1000, 1000, 1000], { organizationId: 2 });

    const { entries } = await service.getOrgLeaderboard(1);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ learner_id: local, session_count: 3, score_pct: 80 });
  });

  it('shares and skips ranks for exact ties, sorts tied names, and ranks before rounding', async () => {
    const top = await addLearner('Top');
    const zed = await addLearner('Zed');
    const amy = await addLearner('Amy');
    const lower = await addLearner('Aaron');
    const higher = await addLearner('Zoe');
    await addSessions(top, [1000, 1000, 1000]);
    await addSessions(zed, [900, 900, 900]);
    await addSessions(amy, [800, 900, 1000]);
    await addSessions(lower, [874, 874, 874]);
    await addSessions(higher, [874, 874, 875]);

    const { entries } = await service.getOrgLeaderboard(1);

    expect(entries.map(entry => entry.learner_id)).toEqual([top, amy, zed, higher, lower]);
    expect(entries.map(entry => entry.rank)).toEqual([1, 2, 2, 4, 5]);
    expect(entries.map(entry => entry.score_pct)).toEqual([100, 90, 90, 87.4, 87.4]);
  });

  it('returns at most ten entries even when a tie crosses the cutoff', async () => {
    const expectedIds = [];
    for (let index = 11; index >= 0; index -= 1) {
      const learnerId = await addLearner(`Learner${String(index).padStart(2, '0')}`);
      await addSessions(learnerId, [900, 900, 900]);
      expectedIds.unshift(learnerId);
    }

    const { entries } = await service.getOrgLeaderboard(1);

    expect(entries).toHaveLength(10);
    expect(entries.map(entry => entry.learner_id)).toEqual(expectedIds.slice(0, 10));
    expect(entries.every(entry => entry.rank === 1)).toBe(true);
  });

  it('returns an empty entries array when no learner qualifies', async () => {
    const learnerId = await addLearner('NotYet');
    await addSessions(learnerId, [1000, 1000]);

    expect(await service.getOrgLeaderboard(1)).toEqual({
      organization_id: 1,
      organization_name: 'Acme Contact Centers',
      window: { start: WINDOW_START, end: WINDOW_END },
      entries: [],
    });
  });

  it('returns the requested organization name even when it has no learners', async () => {
    expect(await service.getOrgLeaderboard(2)).toEqual({
      organization_id: 2,
      organization_name: 'Northwind Health',
      window: { start: WINDOW_START, end: WINDOW_END },
      entries: [],
    });
  });

  it('returns a null organization name and empty entries for an unknown organization', async () => {
    expect(await service.getOrgLeaderboard(999)).toEqual({
      organization_id: 999,
      organization_name: null,
      window: { start: WINDOW_START, end: WINDOW_END },
      entries: [],
    });
  });
});
