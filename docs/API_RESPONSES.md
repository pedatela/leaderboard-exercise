# API response format

All JSON responses use `data`, `error`, `code`, and `msg`.

Successful responses use code `0` and keep the endpoint's domain payload inside `data`:

```json
{
  "data": { "organization_id": 1, "learners": [] },
  "error": false,
  "code": 0,
  "msg": "Request completed successfully."
}
```

Errors keep `data` empty and use a numeric application code, separate from the HTTP status:

```json
{
  "data": {},
  "error": true,
  "code": 1001,
  "msg": "The organization ID is invalid."
}
```

| Code | Meaning | HTTP status |
| --- | --- | --- |
| 0 | Success | 200 for the current endpoints |
| 1000 | Internal error | 500, or the explicit application 5xx status |
| 1001 | Invalid organization ID | 400 |
| 1002 | Unknown route | 404 |
| 1003 | Invalid request parameters | 400 |

Use `successResponse(data, msg?)` and `errorResponse(code, msg)` from
`src/lib/response.js` at the HTTP boundary. Services continue to return domain
objects. For 4xx `AppError` instances, the message is public; keep private
diagnostics in `cause`. Unexpected errors and 5xx messages remain masked.

This envelope supersedes the top-level response layout in `LEADERBOARD_SPEC.md`:
its `organization_id`, `window`, and `entries` fields now live inside `data`.
Empty leaderboard results still return HTTP 200 with `data.entries: []`.
The leaderboard also includes `data.organization_name`, including when the
organization has no qualifying learners. It is `null` if the organization does not exist.
Health checks return `data.status`. The client's `getJson()` unwraps `data` and
throws an error using the public `msg` when the API reports a failure.

## Request validation

`src/validation/validate.js` accepts a Zod schema and `req.params`, `req.query`,
or `req.body`. It returns the parsed data without modifying the request, and
converts validation failures to `AppError` (HTTP 400, default code `1003`).
Raw Zod issues are kept in `cause` and are not sent to the client.

The roster and leaderboard routes run the `validateRequest` middleware with the
shared `organizationParamsSchema`, preserving error code `1001`. The organization ID
must be a nonblank string that converts to an integer in PostgreSQL's integer
range. The middleware stores parsed values in `res.locals.validated.params`;
controllers pass the numeric ID to their services without validating again.

For future endpoints with query parameters, register the middleware in the route:

```js
const querySchema = z.object({
  search: z.string().trim().min(1),
});
router.get('/search',
  validateRequest(querySchema, { source: 'query' }),
  (req, res) => {
    const { search } = res.locals.validated.query;
    // Call the service with the validated search value.
  },
);
```

Repeated query keys can produce arrays; a `z.string()` field rejects these.
This example does not add a search parameter to the existing endpoints.
The middleware defaults to `source: 'params'` and also accepts `'query'` and
`'body'`. Each result is stored under its source in `res.locals.validated`,
so validators can be chained without replacing earlier results or mutating
the original request data. Invalid inputs go directly to the error handler.
