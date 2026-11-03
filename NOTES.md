# Implementation Notes

## How to run

Use Node.js 24 (the version selected for the Docker images), npm, and Docker with
Docker Compose. Run the commands below from the repository root.

### Prepare the development database

```bash
npm ci
docker compose up -d --wait db
npm run db:reset
```

`db:reset` **drops and recreates the application tables and reloads the seed**.
Use it only with a disposable development database. The default host connection
targets the Compose PostgreSQL service on port `5433`. To use another database,
set `DATABASE_URL` in the process environment before running the API or scripts.

The seed uses fixed dates in October and November 2026. The running application
uses the real current time, so its results change over time and may eventually
be empty. Leaderboard service tests pin the clock through `src/lib/clock.js`.

### Option A: run the application in Docker

After preparing the database:

```bash
docker compose up -d --build
```

- Client: `http://localhost:8080`
- API health check: `http://localhost:3001/api/health`
- Leaderboard: `http://localhost:3001/api/orgs/1/leaderboard`

The client image builds the React app and serves the output with Nginx. Nginx
forwards `/api/` requests to the API container, preserving the path. The API
connects to PostgreSQL through `db:5432` and waits for the database health check.
Starting the containers does not automatically create the tables or seed them.

View backend logs with:

```bash
docker compose logs -f api
```

### Option B: run Node and Vite locally

Keep the database container running. Start the API in one terminal:

```bash
npm start
```

Start the client in a second terminal:

```bash
npm --prefix client ci
npm --prefix client run dev
```

Open the Vite URL printed in the terminal, normally `http://localhost:5173`.
Vite forwards `/api` requests to port `3001`. Do not run the local API and the
Compose API simultaneously on that port. `ORG_ID` is intentionally fixed to `1`
in `client/src/App.jsx`, as requested by the exercise.

## Tests and verification

```bash
# Frontend behavior tests; no database required
npm --prefix client ci
npm --prefix client test

# Production frontend build
npm --prefix client run build

# Leaderboard SQL tests using temporary PostgreSQL tables
npm test -- --runTestsByPath test/leaderboard.service.test.js

# Full backend suite: use a disposable database
npm test
```

The existing roster integration tests reset the configured database. The
leaderboard SQL tests instead use connection-local temporary tables and rollback,
so they do not replace persistent application data.

Verification completed during implementation:

- 53 targeted backend/API-client tests passed, including request validation,
  response envelopes, error handling, logging, and sensitive-data exclusion.
- 8 leaderboard service tests passed against PostgreSQL, covering the date
  boundaries, eligibility, organization isolation, averages, ties, rounding,
  the top-ten limit, privacy, and organization names for empty results.
- 8 frontend tests passed for loading, populated and empty results, errors,
  retry, invalid response dates, stale requests, and unmount cancellation.
- The frontend production build and client Docker image build passed. Nginx
  configuration validation and Compose configuration validation also passed.
- Browser checks exercised the live API and simulated loading, errors, retry,
  empty results, tied ranks, decimal formatting, and a 375px mobile layout.

These were separate checks, not a claim that the full `npm test` suite or the
complete Compose stack was tested end to end after every change. No database
reset was performed as part of the targeted verification above.

## Decisions and assumptions

### Ranking and privacy

The SQL filters completed sessions for the requested organization within a
30-day window calculated from the shared clock. Both boundaries are inclusive;
future completion timestamps are excluded. The window is 30 periods of 24 hours.

Eligibility requires at least three qualifying sessions for the same learner.
The score averages **all** qualifying sessions. Stored scores are tenths of a
percentage point, so the average is divided by ten before display rounding.
`RANK()` uses the unrounded average, preserving shared ranks and skipped positions.
Equal averages are ordered by first name, with learner ID as a deterministic
fallback. The result is capped at ten entries, even if a tie crosses the cutoff.

The leaderboard query returns only first name plus last initial. Full surnames
and email addresses are not included in leaderboard entries. The existing roster
response remains separate and retains its original fields.

The organization name is returned even when nobody qualifies. For an unknown
organization, the current behavior is HTTP 200 with an empty `entries` array and
`organization_name: null`.

### Application structure and API contract

The project uses ES modules. Routes register reusable Zod validation middleware;
controllers read parsed values from `res.locals.validated` and call services.
Services contain the database queries and return domain objects.

At the HTTP boundary, responses use `{ data, error, code, msg }`. Success uses
`error: false` and code `0`; failures use `data: {}`, a numeric internal code,
and an appropriate HTTP status. This envelope and `organization_name` were added
during the requested iteration, so the payload differs from the original spec's
top-level example. The client unwraps `data` through its shared API helper.

`AppError` represents expected application failures. Unexpected failures are
masked in API responses. Structured backend logs include request IDs, route
templates, status codes, durations, and safe error metadata. Raw request data,
credentials, SQL messages, stacks, and causes are excluded from these logs.

The React page handles fetching and request cleanup; the `Leaderboard` component
renders the table and loading/error/empty states. The empty-state wording is:
“No one has qualified yet. Complete 3 practice sessions to join the board.”
The UI preserves the API's ranking and formats percentages with one decimal.

See [API_RESPONSES.md](docs/API_RESPONSES.md) and [LOGGING.md](docs/LOGGING.md)
for the detailed response and logging conventions.

## Questions to resolve before shipping

- **Spec example versus ranking rule:** the example scores correspond to each
  learner's highest qualifying score, while the written rule requires an average.
  The implementation follows the written rule. For example, Maria's scores
  of 920, 780, and 850 average to `85.0%`, not the example's `92.0%`.
- **Response compatibility:** confirm the shared envelope, numeric error codes,
  organization-name field, and unknown-organization behavior with API consumers.
- **Missing scores:** the schema allows null scores. Currently `COUNT(*)` counts
  such completed sessions toward eligibility, while PostgreSQL `AVG` ignores null
  scores. A learner with only null scores gets a null score and sorts last.
  Agree whether these sessions should qualify or be rejected at ingestion.
- **Access control:** authentication and authorization are intentionally outside
  the exercise scope. Before deployment, enforce organization membership and the
  roster's admin-only access requirement on the server.
- **Operational readiness:** replace development database credentials, define
  database persistence/backups and migrations, review dependency audit findings,
  and add API health checks and deployment monitoring. Malformed JSON currently
  follows the generic 500 error path; it should be classified as a client error.

## What I would do with more time

1. Resolve the contract and null-score questions, then add regression tests for
   the agreed behavior.
2. Give the entire backend test suite an isolated test database and add a
   repeatable browser test against the complete Docker stack in CI.
3. Profile the SQL with realistic data and `EXPLAIN ANALYZE` before changing indexes.
4. Add migrations, health/readiness checks, graceful shutdown, and centralized
   log collection with a defined retention policy.
5. Improve keyboard/screen-reader verification, localization consistency, and
   date-relative demo fixtures without altering the production clock.

## AI-assisted workflow and key prompts

This work was developed interactively with Codex. Backend architecture and test
agents were used for focused tasks. The implementation evolved through review,
runtime errors, automated tests, and browser checks. Library documentation was
consulted through Context7 when adding framework-specific behavior.

### Specialized agents

The development instructions made the following specialized agent roles available:

| Agent | Responsibility | Use in this project |
| --- | --- | --- |
| `backend-architect` | Backend architecture, APIs, and integration design. | Used to design the shared error class, response helpers, and structured logging. |
| `test-engineer` | Automated tests and coverage analysis. | Used for PostgreSQL leaderboard tests and frontend loading, error, empty, and request-lifecycle tests. |
| `code-reviewer` | Code review, security analysis, and bug detection. | Available; not delegated during this implementation. |
| `debugger` | Complex bug investigation and root-cause analysis. | Available; debugging was handled by the main Codex agent. |
| `performance-engineer` | Performance profiling and bottleneck analysis. | Available; no dedicated performance analysis was performed. |
| `documentation-engineer` | Technical documentation, API references, and architecture notes. | Available; documentation was written by the main Codex agent. |

The main Codex agent coordinated the work, integrated the changes, and ran
verification. Delegated tasks had explicit file ownership to avoid overlapping
edits.

### MCP tools

MCP (Model Context Protocol) tools provided documentation and browser access
during development. The following development servers were exposed in the session:

| MCP server | Purpose | Use in this project |
| --- | --- | --- |
| Context7 (`mcp__context7`) | Resolve libraries and retrieve current documentation. | Used for Node.js, Express, PostgreSQL, React, Zod, Jest, Docker/Compose, and Nginx. |
| Playwright (`mcp__playwright`) | Browser navigation, interaction, snapshots, screenshots, and network inspection. | Used to verify the client against the API, exercise simulated UI states, inspect console output, and check mobile layout. |
| Chrome DevTools (`mcp__chrome_devtools`) | Browser debugging, network/console inspection, performance traces, and audits. | Available; not used for this implementation. |

Additional development-related connectors exposed through the session included
GitHub, Atlassian Jira/Confluence, Codex Document Control, and Sites. Their service
tools were not used to publish code, modify external documents, or deploy this
project. The Sites skill's local development guidance was consulted for the UI;
the application was built and verified locally with Vite and Docker.

These tools belong to the development environment. Running the application or
its automated tests does not require MCP servers, agents, or connector credentials.

### Key prompts

The following are key user prompts from the session, rather than a verbatim transcript:

1. “Replace CommonJS `require` calls with `import` throughout the project.”
2. “Based on `LEADERBOARD_SPEC.md`, write the query inside the leaderboard service.”
3. “Ask the backend architect to analyze the code and create a shared error class.”
4. “Add Zod validation, move it to route middleware, and extract the organization
   validator into its own file.”
5. “Include the organization's name in the leaderboard query.”
6. “Create a client page and component that consume the API and display the data.”
7. “Cover loading, error, and empty states, add backend logs, and Dockerize the client.”
