import express from "express";
import { AppError } from "./errors/AppError.js";
import { ERROR_CODES } from "./errors/error-codes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import healthRoutes from "./routes/health.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import rosterRoutes from "./routes/roster.js";

const app = express();
app.use(requestLogger);
app.use(express.json());

app.use("/api", rosterRoutes);
app.use("/api", leaderboardRoutes);
app.use("/api/health", healthRoutes);

app.use((req, res, next) => {
  next(
    new AppError(ERROR_CODES.NOT_FOUND, {
      statusCode: 404,
      message: "Route not found.",
    }),
  );
});

app.use(errorHandler);

export default app;
