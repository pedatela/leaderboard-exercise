import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { errorResponse } from "../lib/response.js";

export function errorHandler(err, req, res, next) {
  // Keep diagnostics useful without logging raw messages, SQL, or request data.
  res.locals ??= {};
  res.locals.errorLog = {
    error_code: err instanceof AppError ? err.code : ERROR_CODES.INTERNAL_ERROR,
    error_type: err instanceof AppError ? "AppError"
      : err instanceof SyntaxError ? "SyntaxError"
      : err instanceof TypeError ? "TypeError" : "Error",
  };
  if (typeof err?.code === "string" && /^[0-9A-Z]{5}$/.test(err.code)) {
    res.locals.errorLog.database_code = err.code;
  }

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError && err.statusCode < 500) {
    return res
      .status(err.statusCode)
      .json(errorResponse(err.code, err.message));
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  return res
    .status(statusCode)
    .json(errorResponse(ERROR_CODES.INTERNAL_ERROR, "Internal server error."));
}
