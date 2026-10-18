-- PFG-64 (continued): duplicate-submission prevention.
-- Works alongside 002_create_team_health_responses.sql. This table
-- intentionally does NOT reference team_health_responses in any way —
-- there is no foreign key between a receipt and a response. That gap is
-- the whole point: it lets us block a second submission from the same
-- member/period without ever being able to say which response was theirs.

CREATE TABLE IF NOT EXISTS team_health_submission_receipts (
  receipt_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id  UUID NOT NULL REFERENCES project_memberships(membership_id) ON DELETE CASCADE,
  period_start   DATE NOT NULL,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (membership_id, period_start)
);

-- The UNIQUE constraint above is the real enforcement (belt-and-braces
-- against race conditions); the repository's hasSubmitted() check is the
-- friendly pre-check that lets the API return a clean 409 instead of a
-- raw DB constraint error.
