# CLAUDE.md

Project guidance for Claude Code. Read this before making changes.

## Overview
RemoteBridge is an AI practice platform. Learners run practice sessions (simulated customer
calls, workplace conversations) and receive a score. This repo is a trimmed copy of the API
(Node.js + Express + PostgreSQL) and web client (React + Vite).

## Commands
- `npm run db:up` starts Postgres in Docker on port 5433
- `npm run db:reset` drops, recreates and seeds the database
- `npm test` runs the Jest suite (tests reset the DB themselves)
- `npm start` runs the API on port 3001
- `cd client && npm run dev` runs the web client (proxies /api to 3001)

## Conventions
- JSON responses use snake_case keys.
- Every query that touches learner or session data MUST filter by `organization_id`.
  RemoteBridge is multi-tenant. A cross-tenant leak is a P0 incident.
- Time: use `now()` from `src/lib/clock.js`. Never use `new Date()` or SQL `NOW()` in feature
  code. Tests pin the clock.
- `practice_sessions.score` is stored in tenths of a percent (0 to 1000). Convert to a
  percentage at the API boundary. Never send raw stored values to the client.
- Use parameterized queries only. No string-built SQL.

## Learner names
- Always render learner names with `learnerDisplayName()` from `src/lib/names.js`, which
  returns "First Last". Do not build name strings inline.
- Every endpoint that returns learners must include a `display_name` field produced by
  this helper.

## Tests
- Add tests for every new endpoint.
- Do not modify existing tests without explaining why in your notes.
