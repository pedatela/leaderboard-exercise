import express from "express";
import { LeaderboardController } from "../controllers/leaderbord.controller.js";
import { validateOrganizationParams } from "../middleware/validate-organization-params.js";

const router = express.Router();

const controller = new LeaderboardController();

// Leaderbord Request
router.get(
  "/orgs/:orgId/leaderboard",
  validateOrganizationParams,
  (req, res, next) => controller.getOrgLeaderboard(req, res, next),
);

export default router;
