import express from "express";

import { RosterController } from "../controllers/roster.controller.js";
import { validateOrganizationParams } from "../middleware/validate-organization-params.js";

const router = express.Router();

const controller = new RosterController();

// Admin-only: full roster for an organization.
router.get(
  "/orgs/:orgId/roster",
  validateOrganizationParams,
  (req, res, next) => controller.getOrgRoster(req, res, next),
);

export default router;
