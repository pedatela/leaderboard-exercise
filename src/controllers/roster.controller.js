import { successResponse } from "../lib/response.js";
import { RosterService } from "../service/roster.service.js";

const rosterService = new RosterService();

export class RosterController {
  async getOrgRoster(req, res, next) {
    try {
      const { orgId } = res.locals.validated.params;

      const roster = await rosterService.getOrgRoster(orgId);
      return res.json(successResponse(roster));
    } catch (err) {
      next(err);
    }
  }
}
