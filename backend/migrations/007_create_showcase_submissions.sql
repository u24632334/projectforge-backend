-- ============================================================
-- ProjectForge
-- PFG-78: Project Showcase Submissions
-- Stores completed projects that have been published to showcase.
-- ============================================================

BEGIN;

CREATE TABLE showcase_submissions (
    showcase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL UNIQUE,
    submitted_by_user_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_showcase_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_showcase_submitter
        FOREIGN KEY (submitted_by_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_showcase_created_at
    ON showcase_submissions(created_at);

COMMIT;
