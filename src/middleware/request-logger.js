import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { logger } from "../lib/logger.js";

const httpMethods = new Set([
  "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH",
]);

export function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const startedAt = performance.now();
  let logged = false;

  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  function complete(aborted) {
    if (logged) return;
    logged = true;

    // Route definitions are safe to log; original URLs can contain private data.
    // Express may restore baseUrl before finish, so keep the route template alone.
    const route = typeof req.route?.path === "string" ? req.route.path : "<unmatched>";
    const fields = {
      ...res.locals.errorLog,
      request_id: requestId,
      method: httpMethods.has(req.method) ? req.method : "OTHER",
      route,
      status_code: res.statusCode,
      duration_ms: Math.round((performance.now() - startedAt) * 100) / 100,
    };

    if (aborted) {
      logger.warn("request_aborted", fields);
    } else if (res.statusCode >= 500) {
      logger.error("request_completed", fields);
    } else if (res.statusCode >= 400) {
      logger.warn("request_completed", fields);
    } else {
      logger.info("request_completed", fields);
    }
  }

  res.once("finish", () => complete(false));
  res.once("close", () => complete(!res.writableFinished));
  next();
}
