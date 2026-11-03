-- Seed data. Tests assume clock.now() = 2026-11-12T12:00:00Z.

INSERT INTO organizations (id, name) VALUES
  (1, 'Acme Contact Centers'),
  (2, 'Northwind Health');

INSERT INTO learners (id, organization_id, first_name, last_name, email) VALUES
  (1, 1, 'Maria', 'Gonzalez', 'maria.gonzalez@acme.example'),
  (2, 1, 'David', 'Chen',     'david.chen@acme.example'),
  (3, 1, 'Priya', 'Patel',    'priya.patel@acme.example'),
  (4, 1, 'James', 'Okafor',   'james.okafor@acme.example'),
  (5, 1, 'Sofia', 'Rossi',    'sofia.rossi@acme.example'),
  (6, 1, 'Liam',  'Walsh',    'liam.walsh@acme.example'),
  (7, 2, 'Ava',   'Thompson', 'ava.thompson@northwind.example');

INSERT INTO practice_sessions (organization_id, learner_id, scenario, status, score, started_at, completed_at) VALUES
  -- Maria
  (1, 1, 'Billing dispute',      'completed', 920, '2026-11-10T14:00:00Z', '2026-11-10T14:12:00Z'),
  (1, 1, 'Angry caller',         'completed', 780, '2026-10-25T09:00:00Z', '2026-10-25T09:15:00Z'),
  (1, 1, 'Plan upgrade',         'completed', 850, '2026-11-03T16:00:00Z', '2026-11-03T16:09:00Z'),
  -- David
  (1, 2, 'Billing dispute',      'completed', 900, '2026-11-11T10:00:00Z', '2026-11-11T10:11:00Z'),
  (1, 2, 'Angry caller',         'completed', 900, '2026-10-30T13:00:00Z', '2026-10-30T13:14:00Z'),
  (1, 2, 'Plan upgrade',         'completed', 840, '2026-10-18T11:00:00Z', '2026-10-18T11:10:00Z'),
  (1, 2, 'Cancellation save',    'completed', 300, '2026-10-12T09:00:00Z', '2026-10-12T09:20:00Z'),
  -- Priya
  (1, 3, 'Billing dispute',      'completed', 950, '2026-11-09T15:00:00Z', '2026-11-09T15:10:00Z'),
  (1, 3, 'Angry caller',         'completed', 700, '2026-10-20T10:00:00Z', '2026-10-20T10:16:00Z'),
  (1, 3, 'Plan upgrade',         'completed', 790, '2026-11-01T12:00:00Z', '2026-11-01T12:08:00Z'),
  -- James
  (1, 4, 'Billing dispute',      'completed', 880, '2026-11-05T09:30:00Z', '2026-11-05T09:41:00Z'),
  (1, 4, 'Angry caller',         'completed', 860, '2026-10-28T14:00:00Z', '2026-10-28T14:13:00Z'),
  (1, 4, 'Plan upgrade',         'in_progress', 990, '2026-11-12T10:00:00Z', NULL),
  -- Sofia
  (1, 5, 'Billing dispute',      'completed', 870, '2026-11-02T08:00:00Z', '2026-11-02T08:12:00Z'),
  (1, 5, 'Angry caller',         'completed', 890, '2026-10-27T17:00:00Z', '2026-10-27T17:14:00Z'),
  (1, 5, 'Plan upgrade',         'completed', 890, '2026-11-08T11:00:00Z', '2026-11-08T11:07:00Z'),
  (1, 5, 'Cancellation save',    'abandoned', 410, '2026-11-07T16:00:00Z', '2026-11-07T16:04:00Z'),
  -- Liam
  (1, 6, 'Billing dispute',      'completed', 900, '2026-11-06T13:00:00Z', '2026-11-06T13:10:00Z'),
  (1, 6, 'Angry caller',         'completed', 820, '2026-10-22T10:00:00Z', '2026-10-22T10:15:00Z'),
  (1, 6, 'Plan upgrade',         'completed', 880, '2026-10-15T15:00:00Z', '2026-10-15T15:09:00Z'),
  (1, 6, 'Cancellation save',    'completed', 860, '2026-11-04T09:00:00Z', '2026-11-04T09:18:00Z'),
  -- Ava (different organization)
  (2, 7, 'Patient intake',       'completed', 990, '2026-11-08T09:00:00Z', '2026-11-08T09:10:00Z'),
  (2, 7, 'Insurance question',   'completed', 980, '2026-11-01T10:00:00Z', '2026-11-01T10:12:00Z'),
  (2, 7, 'Appointment reschedule','completed', 995, '2026-10-24T14:00:00Z', '2026-10-24T14:06:00Z');

SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));
SELECT setval('learners_id_seq', (SELECT MAX(id) FROM learners));
