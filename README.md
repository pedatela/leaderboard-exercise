# RemoteBridge Engineering Exercise: Team Leaderboard

Thanks for taking the time to do this. This exercise mirrors real work on our team.

## The setup
You will implement a small feature in a trimmed copy of the RemoteBridge codebase.
**We expect you to use Claude Code** (or a similar AI coding assistant). That is how our team
works. What we want to see is how you work *with* it: how you direct it, what you check, and
what you decide.

## The task
Implement the feature described in [`docs/LEADERBOARD_SPEC.md`](docs/LEADERBOARD_SPEC.md):

1. A `GET /api/orgs/:orgId/leaderboard` endpoint (Node/Express/Postgres)
2. Tests for the endpoint
3. A `Leaderboard` React component in `client/` that renders the endpoint's data

## Time
Please time-box this to **about 3 hours**. We care more about the quality of your decisions
than about finishing every polish item. If you run out of time, tell us what you would do next.

## Getting started
Requirements: Node 20.12+ (Node 24 recommended), Docker.

```bash
cp .env.example .env
cp client/.env.example client/.env
npm install
npm run db:up
npm run db:reset
npm test            # the existing roster tests should pass
cd client && npm install && npm run dev
```

The API and database scripts load the root `.env` automatically. Configure
`PORT` and the `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` values there.
If you cannot run Docker, any local Postgres 14+ works; `DATABASE_URL` is also
supported as a local override. Existing shell variables take precedence.

Vite reads `client/.env`: `DEV_PORT` controls its port and `API_PROXY_TARGET`
controls the `/api` proxy. If you change the local API's `PORT`, update that
target as well. Keep credentials out of `VITE_*` variables, which are public.
The real `.env` files are excluded from Git and Docker build contexts.

The API uses a shared JSON envelope for success and error responses; see
[`docs/API_RESPONSES.md`](docs/API_RESPONSES.md) for the format and internal error codes.

Backend logs use a NestJS-style text format with request IDs, status codes, and timings.
See [`docs/LOGGING.md`](docs/LOGGING.md) for fields and commands to view them.

## Client and Docker

Run the complete stack from the repository root:

```bash
docker compose up -d --build
```

Open `http://localhost:8080`. The client image builds the React app with Node,
then serves the static output with Nginx. Requests under `/api/` are forwarded
to the `api` service on port 3001. PostgreSQL schema and seed initialization
remain a separate step; containers do not reset existing database data.

Compose reads the root `.env` for the published `CLIENT_PORT`, `PORT`, `PGPORT`
and database credentials. Inside Docker the API remains on port 3001 and the
database on `db:5432`. `DATABASE_URL` is intentionally not passed to the API
container, so a local connection URL cannot override the Compose database.
The client container loads `client/.env`; `API_UPSTREAM` configures its Nginx
proxy at startup (default `http://api:3001`, without a trailing slash).
After editing environment files, run `docker compose up -d` to recreate the
affected containers. Changing database credentials does not update users in
an already initialized PostgreSQL data directory.

The client Dockerfile can also be built with
`docker build -t remotebridge-client ./client`; its Nginx configuration expects
the backend to be reachable as `api:3001` on the container network by default.
Override `API_UPSTREAM` when starting the container to use another address.

Frontend tests: `npm --prefix client test`. They cover loading, populated and
empty leaderboards, API errors, retry, and request cancellation without a database.

## What to send back
Reply to the email you received with:

1. **Your repo** as a link (GitHub, GitLab) or a zip. Please keep your commit history. Small,
   meaningful commits are a plus.
2. **`NOTES.md`** in the repo root covering:
   - How to run your work
   - Decisions and assumptions you made, and why
   - Anything you would raise with the team before this ships
   - What you would do with more time
3. **Your Claude Code session.** Use `/export` to save the conversation(s), or paste your key
   prompts into `NOTES.md`. We read these. We are interested in your process, not just the result.

## Questions
Email john@remotebridge.com. We will try to answer within one business day. If you are waiting
on an answer, make the call you would defend in a code review, write it down in `NOTES.md`, and
keep going.
