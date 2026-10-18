BEGIN;

ALTER TABLE showcase_submissions
    ADD COLUMN IF NOT EXISTS status VARCHAR(20);

ALTER TABLE showcase_submissions
    ADD COLUMN IF NOT EXISTS approved_by_admin_user_id UUID;

ALTER TABLE showcase_submissions
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

UPDATE showcase_submissions
SET status = 'PENDING'
WHERE status IS NULL;

ALTER TABLE showcase_submissions
    ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE showcase_submissions
    ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_showcase_submission_status'
    ) THEN
        ALTER TABLE showcase_submissions
            ADD CONSTRAINT chk_showcase_submission_status
            CHECK (
                status IN (
                    'PENDING',
                    'APPROVED'
                )
            );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_showcase_approved_by_admin'
    ) THEN
        ALTER TABLE showcase_submissions
            ADD CONSTRAINT fk_showcase_approved_by_admin
            FOREIGN KEY (
                approved_by_admin_user_id
            )
            REFERENCES users(user_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS
    idx_showcase_submission_status
ON showcase_submissions(status);

COMMIT;