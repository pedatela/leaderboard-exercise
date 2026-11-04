const allowedFields = new Set([
  "request_id",
  "method",
  "route",
  "status_code",
  "duration_ms",
  "error_code",
  "error_type",
  "database_code",
  "port",
]);

function write(level, event, metadata = {}) {
  const timestamp = new Date().toISOString();
  const label = level === "info" ? "LOG" : level.toUpperCase();
  const context = event.startsWith("request_") ? "HTTP"
    : event === "server_started" ? "Bootstrap" : "Application";
  const fields = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (
      allowedFields.has(key) &&
      (typeof value === "string" ||
        (typeof value === "number" && Number.isFinite(value)))
    ) {
      fields.push(`${key}=${JSON.stringify(value)}`);
    }
  }

  // Escape control characters so each event stays on one physical log line.
  const message = JSON.stringify(event).slice(1, -1);
  console[level](
    `[Nest] ${process.pid}  - ${timestamp} ${label.padStart(7)} [${context}] ${[message, ...fields].join(" ")}`,
  );
}

export const logger = {
  info: (event, metadata) => write("info", event, metadata),
  warn: (event, metadata) => write("warn", event, metadata),
  error: (event, metadata) => write("error", event, metadata),
};
