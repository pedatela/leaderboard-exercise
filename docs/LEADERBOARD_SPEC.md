# Spec: Team Leaderboard (RC-412)

**Status:** Ready for development
**Owner:** Product
**Surfaces:** API, web client

## Background
Customers tell us friendly competition drives practice volume. Team leads want a leaderboard
that shows who is performing best in their organization's practice sessions over the last month.
The leaderboard is visible to **every learner in the organization**, not just admins.

## API

`GET /api/orgs/:orgId/leaderboard`

### Ranking rules
1. Only sessions with `status = 'completed'` count.
2. Only sessions completed in the **last 30 days** count, measured from `now()` (window start
   is inclusive).
3. A learner must have **at least 3** qualifying sessions to appear on the leaderboard.
4. A learner's leaderboard score is the **average** of their qualifying session scores.
5. Sort by score, highest first. Rank on the unrounded value.
6. Ties share a rank and the next rank is skipped (1, 2, 2, 4). Tied learners are listed
   alphabetically by first name.
7. Return at most 10 entries.
8. Scores are returned as percentages rounded to one decimal place (e.g. `87.5`).

### Privacy requirement
Because every learner in the org can see the leaderboard, **learner last names must never appear
in the leaderboard API response**. Show first name plus last initial, e.g. `Maria G.`. This is a
contractual requirement for two of our enterprise customers. Hiding the last name in the UI is
not sufficient; it must not be in the payload.

### Errors
- `400` if `orgId` is not an integer
- `200` with an empty `entries` array if no learners qualify

### Example response
For organization 1 with the seed data in `db/seed.sql` and `now()` = `2026-11-12T12:00:00Z`:

```json
{
  "organization_id": 1,
  "window": {
    "start": "2026-10-13T12:00:00.000Z",
    "end": "2026-11-12T12:00:00.000Z"
  },
  "entries": [
    { "rank": 1, "learner_id": 3, "display_name": "Priya P.", "score_pct": 95.0, "session_count": 3 },
    { "rank": 2, "learner_id": 1, "display_name": "Maria G.", "score_pct": 92.0, "session_count": 3 },
    { "rank": 3, "learner_id": 2, "display_name": "David C.", "score_pct": 90.0, "session_count": 3 },
    { "rank": 3, "learner_id": 6, "display_name": "Liam W.",  "score_pct": 90.0, "session_count": 4 },
    { "rank": 5, "learner_id": 5, "display_name": "Sofia R.", "score_pct": 89.0, "session_count": 3 }
  ]
}
```

## Web client
Add a `Leaderboard` component to `client/` and render it in `App.jsx` for `ORG_ID`.

- Title: "Team Leaderboard", subtitle showing the date window (e.g. "Oct 13 to Nov 12")
- Columns: Rank, Name, Score, Sessions
- Score shown as a percentage with one decimal (e.g. `87.5%`)
- Loading state, error state, and an empty state ("No one has qualified yet. Complete 3
  practice sessions to join the board.")
- Styling is up to you. Keep it clean; this is not a design test.

## Out of scope
Authentication, pagination, caching, real-time updates.
