-- ============================================================
-- ProjectForge
-- PFG-82: Moderation Audit Logging
-- ============================================================

BEGIN;


-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Administrator who performed the action
    admin_user_id UUID NOT NULL,

    -- Examples:
    -- USER_SUSPENDED
    -- CONTENT_REMOVED
    -- REPORT_DISMISSED
    action_type VARCHAR(50) NOT NULL,

    -- What kind of object was affected
    target_type VARCHAR(30) NOT NULL,

    -- UUID of the affected user, project, report, etc.
    target_id UUID NOT NULL,

    -- Optional extra information about the action
    details JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_audit_logs_admin
        FOREIGN KEY (admin_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,


    CONSTRAINT chk_audit_logs_action_type
        CHECK (btrim(action_type) <> ''),


    CONSTRAINT chk_audit_logs_target_type
        CHECK (
            target_type IN (
                'USER',
                'PROJECT',
                'REPORT'
            )
        )
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_audit_logs_admin
    ON audit_logs(admin_user_id);

CREATE INDEX idx_audit_logs_action_type
    ON audit_logs(action_type);

CREATE INDEX idx_audit_logs_target
    ON audit_logs(target_type, target_id);

CREATE INDEX idx_audit_logs_created_at
    ON audit_logs(created_at);


COMMIT;