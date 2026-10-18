-- PFG-59: User Check-in Table
-- Stores private Pit Wall check-ins (PF-PIT-01, PF-PIT-02).
-- Adjust the FK to `users` if your team's users table uses a different
-- name/column for its primary key (check with whoever owns PFG-11).

CREATE TABLE IF NOT EXISTS pit_wall_checkins (
  check_in_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  workload      INTEGER NOT NULL CHECK (workload BETWEEN 1 AND 5),
  motivation    INTEGER NOT NULL CHECK (motivation BETWEEN 1 AND 5),
  capacity      INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 5),
  private_note  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every read of this table will always filter by user_id (PF-PIT-03),
-- so index it.
CREATE INDEX IF NOT EXISTS idx_pit_wall_checkins_user_id
  ON pit_wall_checkins (user_id);
