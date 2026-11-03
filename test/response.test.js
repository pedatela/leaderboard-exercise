import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { RosterService } from '../src/service/roster.service.js';
import { LeaderboardService } from '../src/service/leaderbord.service.js';

afterEach(() => jest.restoreAllMocks());

it.each([
  ['roster', RosterService, 'getOrgRoster', { organization_id: 1, learners: [] }],
  ['leaderboard', LeaderboardService, 'getOrgLeaderboard', {
    organization_id: 1,
    organization_name: 'Acme Contact Centers',
    window: { start: '2026-10-13T12:00:00.000Z', end: '2026-11-12T12:00:00.000Z' },
    entries: [],
  }],
])('wraps the %s result without changing its domain data', async (route, Service, method, data) => {
  jest.spyOn(Service.prototype, method).mockResolvedValue(data);

  const res = await request(app).get(`/api/orgs/1/${route}`);

  expect(res.status).toBe(200);
  expect(Service.prototype[method]).toHaveBeenCalledWith(1);
  expect(res.body).toEqual({ data, error: false, code: 0, msg: 'Request completed successfully.' });
});

it('uses the same success envelope for health checks', async () => {
  const res = await request(app).get('/api/health');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    data: { status: 'healthy' }, error: false, code: 0, msg: 'Request completed successfully.',
  });
});

it('returns a JSON error envelope for unknown routes', async () => {
  const res = await request(app).get('/api/missing');

  expect(res.status).toBe(404);
  expect(res.headers['content-type']).toMatch(/application\/json/);
  expect(res.body).toEqual({ data: {}, error: true, code: 1002, msg: 'Route not found.' });
});

it('keeps parser failures in the error envelope without reflecting the request body', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});

  const res = await request(app).post('/api/health')
    .set('Content-Type', 'application/json').send('{"private":');

  expect(res.status).toBe(500);
  expect(res.body).toEqual({
    data: {}, error: true, code: 1000, msg: 'Internal server error.',
  });
});
