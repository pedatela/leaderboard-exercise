import { successResponse } from "../lib/response.js";
import { LeaderboardService } from "../service/leaderbord.service.js";

const leaderboardService = new LeaderboardService();

export class LeaderboardController {
  async getOrgLeaderboard(req, res, next) {
    try {
      const { orgId } = res.locals.validated.params;

      const leaderboard = await leaderboardService.getOrgLeaderboard(orgId);
      return res.json(successResponse(leaderboard));
    } catch (err) {
      next(err);
    }
  }
}
