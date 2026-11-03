import express from "express";
import { successResponse } from "../lib/response.js";

const router = express.Router();

// Health check endpoint.
router.get("/", async (req, res) => {
  res.status(200).json(successResponse({ status: "healthy" }));
});

export default router;
