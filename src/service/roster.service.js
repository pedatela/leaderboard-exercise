import { pool } from "../db.js";
import { learnerDisplayName } from "../lib/names.js";

export class RosterService {
  async getOrgRoster(orgId) {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email
            FROM learners
            WHERE organization_id = $1
            ORDER BY last_name, first_name`,
      [orgId],
    );

    return {
      organization_id: orgId,
      learners: rows.map((l) => ({
        learner_id: l.id,
        display_name: learnerDisplayName(l),
        email: l.email,
      })),
    };
  }
}
