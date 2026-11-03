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
Requirements: Node 20+, Docker.

```bash
npm install
npm run db:up
npm run db:reset
npm test            # the existing roster tests should pass
cd client && npm install && npm run dev
```

If you cannot run Docker, any local Postgres 14+ works. Set `DATABASE_URL`.

The API uses a shared JSON envelope for success and error responses; see
[`docs/API_RESPONSES.md`](docs/API_RESPONSES.md) for the format and internal error codes.

Backend logs are structured JSON with request IDs, status codes, and timings.
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

The client Dockerfile can also be built with
`docker build -t remotebridge-client ./client`; its Nginx configuration expects
the backend to be reachable as `api:3001` on the container network.

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
