-- ============================================================
-- ProjectForge
-- PFG-74: Mentor Guidance
-- Stores guidance submitted by approved mentor accounts.
-- ============================================================

BEGIN;

CREATE TABLE mentor_guidance (
    guidance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,
    mentor_user_id UUID NOT NULL,
    guidance TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mentor_guidance_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mentor_guidance_mentor
        FOREIGN KEY (mentor_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_mentor_guidance_not_blank
        CHECK (btrim(guidance) <> '')
);

CREATE INDEX idx_mentor_guidance_project
    ON mentor_guidance(project_id);

CREATE INDEX idx_mentor_guidance_mentor
    ON mentor_guidance(mentor_user_id);

CREATE INDEX idx_mentor_guidance_created_at
    ON mentor_guidance(created_at);

COMMIT;
