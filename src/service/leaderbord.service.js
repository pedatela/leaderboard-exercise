import { pool } from "../db.js";
import { now } from "../lib/clock.js";

export class LeaderboardService {
  async getOrgLeaderboard(orgId) {
    const windowStart = now();
    const end = windowStart.toISOString();
    windowStart.setTime(windowStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = windowStart.toISOString();

    const { rows } = await pool.query(
      `WITH learner_scores AS (
        SELECT
          l.id AS learner_id,
          l.first_name,
          l.first_name || ' ' || LEFT(l.last_name, 1) || '.' AS display_name,
          AVG(s.score) AS average_score,
          COUNT(*)::integer AS session_count
        FROM learners l
        JOIN practice_sessions s
          ON s.learner_id = l.id
          AND s.organization_id = l.organization_id
        WHERE l.organization_id = $1
          AND s.status = 'completed'
          AND s.completed_at >= $2::timestamptz
          AND s.completed_at <= $3::timestamptz
        GROUP BY l.id, l.first_name, l.last_name
        HAVING COUNT(*) >= 3
      ), ranked_learners AS (
        SELECT *,
          RANK() OVER (ORDER BY average_score DESC NULLS LAST)::integer AS rank
        FROM learner_scores
      )
      SELECT
        o.name AS organization_name,
        r.rank,
        r.learner_id,
        r.display_name,
        ROUND(r.average_score / 10, 1)::double precision AS score_pct,
        r.session_count
      FROM organizations o
      LEFT JOIN ranked_learners r ON TRUE
      WHERE o.id = $1
      ORDER BY r.rank, r.first_name, r.learner_id
      LIMIT 10`,
      [orgId, start, end],
    );

    return {
      organization_id: orgId,
      organization_name: rows[0]?.organization_name ?? null,
      window: { start, end },
      entries: rows
        .filter((row) => row.learner_id !== null)
        .map(({ rank, learner_id, display_name, score_pct, session_count }) => ({
          rank,
          learner_id,
          display_name,
          score_pct,
          session_count,
        })),
    };
  }
}
