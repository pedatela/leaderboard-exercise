# Backend logs

The API writes one NestJS-style text log line when each request completes. It also records
server startup and interrupted responses. Run `npm start` to see the logs in
the terminal, or `docker compose logs -f api` for the API container.

```text
[Nest] 19096  - 2026-11-03T15:00:00.000Z     LOG [Bootstrap] server_started port=3001
[Nest] 19096  - 2026-11-03T15:00:01.000Z    WARN [HTTP] request_completed error_code=1001 error_type="AppError" request_id="03c90862-6e61-49cc-9765-160523fc4db0" method="GET" route="/orgs/:orgId/roster" status_code=400 duration_ms=2.35
```

The prefix includes the process ID, UTC timestamp, level, and context (`Bootstrap`,
`HTTP`, or `Application`). The existing logger implements this presentation without
adding NestJS as a dependency. Output is plain text without ANSI colors, so it also
works in container logs. Consumers that previously parsed a whole line as JSON must
be updated for this text format.

- `info` displays as `LOG`: startup and successful requests, including redirects.
- `warn` displays as `WARN`: HTTP 4xx responses and interrupted requests.
- `error` displays as `ERROR`: HTTP 5xx responses.

Every request receives a server-generated `X-Request-ID` response header matching
the `request_id` in its log. Use this identifier to find a specific request.
`duration_ms` measures elapsed time with a monotonic clock. Log timestamps use
the real UTC time, independently of the leaderboard's test clock.

Routes are logged as templates, such as `/orgs/:orgId/leaderboard`, without the
router's mount prefix. Unmatched requests use `<unmatched>`. Logs deliberately
exclude raw URLs, query strings, headers, bodies, response data, error messages,
stacks and causes. Errors include their internal application code and type;
PostgreSQL errors can also include their five-character SQLSTATE code.

For application events, import `logger` from `src/lib/logger.js` and call
`logger.info(event, metadata)`, `logger.warn(...)`, or `logger.error(...)`.
Only approved scalar metadata fields are emitted as `key=value` pairs. Strings are
JSON-quoted and control characters are escaped to keep each event on one line.
Do not pass request or error
objects; the error middleware supplies the safe diagnostics for request logs.
