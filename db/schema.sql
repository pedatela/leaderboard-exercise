-- RemoteBridge practice platform (trimmed schema for the exercise)

DROP TABLE IF EXISTS practice_sessions;
DROP TABLE IF EXISTS learners;
DROP TABLE IF EXISTS organizations;

CREATE TABLE organizations (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL
);

CREATE TABLE learners (
  id               SERIAL PRIMARY KEY,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id),
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE
);

CREATE TABLE practice_sessions (
  id               SERIAL PRIMARY KEY,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id),
  learner_id       INTEGER NOT NULL REFERENCES learners(id),
  scenario         TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  -- Score is stored in TENTHS of a percent: 0..1000 (875 = 87.5%).
  -- NULL until the session has been scored.
  score            INTEGER CHECK (score BETWEEN 0 AND 1000),
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ
);

CREATE INDEX practice_sessions_org_completed_idx
  ON practice_sessions (organization_id, completed_at);
