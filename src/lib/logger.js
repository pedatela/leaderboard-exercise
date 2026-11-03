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
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (
      allowedFields.has(key) &&
      (typeof value === "string" ||
        (typeof value === "number" && Number.isFinite(value)))
    ) {
      entry[key] = value;
    }
  }

  console[level](JSON.stringify(entry));
}

export const logger = {
  info: (event, metadata) => write("info", event, metadata),
  warn: (event, metadata) => write("warn", event, metadata),
  error: (event, metadata) => write("error", event, metadata),
};
