-- Backs PFG-68 (Aggregated Team-Health Metrics).
-- NOTE: coordinate with whoever builds PFG-63 (Anonymous Team-Health
-- Survey) — that feature is what actually INSERTs rows here. If they've
-- already created this table, don't run this migration twice; just make
-- sure the column names line up with what teamHealthRepository.js expects.
--
-- Deliberately has NO user_id / membership_id column. That's not an
-- oversight — PF-PIT-08 requires that individual responses can never be
-- traced back to a person, even by an administrator.

CREATE TABLE IF NOT EXISTS team_health_responses (
  response_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  period_start      DATE NOT NULL,
  workload          INTEGER NOT NULL CHECK (workload BETWEEN 1 AND 5),
  communication     INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
  blocker_severity  INTEGER NOT NULL CHECK (blocker_severity BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_health_responses_project_period
  ON team_health_responses (project_id, period_start);
