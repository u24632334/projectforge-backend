-- ============================================================
-- ProjectForge
-- Report and Moderation Setup
-- ============================================================

BEGIN;


-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reporter_user_id UUID NOT NULL,

    reported_user_id UUID,
    reported_project_id UUID,

    reason TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    reviewed_by_user_id UUID,
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,


    CONSTRAINT fk_reports_reported_user
        FOREIGN KEY (reported_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,


    CONSTRAINT fk_reports_reported_project
        FOREIGN KEY (reported_project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,


    CONSTRAINT fk_reports_reviewer
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,


    CONSTRAINT chk_reports_reason_not_blank
        CHECK (btrim(reason) <> ''),


    CONSTRAINT chk_reports_status
        CHECK (
            status IN (
                'PENDING',
                'DISMISSED'
            )
        ),


    -- A report must target either a user OR a project.
    -- It may not target both or neither.
    CONSTRAINT chk_reports_single_target
        CHECK (
            (
                reported_user_id IS NOT NULL
                AND reported_project_id IS NULL
            )
            OR
            (
                reported_user_id IS NULL
                AND reported_project_id IS NOT NULL
            )
        )
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_reports_reporter
    ON reports(reporter_user_id);

CREATE INDEX idx_reports_reported_user
    ON reports(reported_user_id);

CREATE INDEX idx_reports_reported_project
    ON reports(reported_project_id);

CREATE INDEX idx_reports_status
    ON reports(status);


COMMIT;