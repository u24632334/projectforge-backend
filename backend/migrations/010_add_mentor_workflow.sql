-- ============================================================
-- ProjectForge
-- Mentor Workflow
--
-- Adds:
-- - Mentor account applications
-- - Project Mentor-support opt-in
-- - Mentor assignments
-- - Mentor guidance linked to assignments
--
-- Existing Mentor guidance from migration 006 is preserved.
-- ============================================================

BEGIN;


-- ============================================================
-- 1. PROJECT MENTOR SUPPORT
-- ============================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS allow_mentor_support BOOLEAN
NOT NULL
DEFAULT FALSE;


-- Projects that allow Mentor involvement are the projects
-- queried most frequently by the Mentor interface.
CREATE INDEX IF NOT EXISTS
    idx_projects_allow_mentor_support
ON projects(allow_mentor_support)
WHERE allow_mentor_support = TRUE;


-- ============================================================
-- 2. MENTOR ACCOUNT APPLICATIONS
-- ============================================================

CREATE TABLE mentor_applications (
    application_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL
        DEFAULT 'PENDING',

    requested_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    reviewed_at TIMESTAMPTZ,

    reviewed_by_admin_user_id UUID,

    CONSTRAINT fk_mentor_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mentor_applications_admin
        FOREIGN KEY (
            reviewed_by_admin_user_id
        )
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_mentor_applications_status
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED'
            )
        ),

    /*
     * Pending requests have not yet been reviewed.
     * Approved/rejected requests must record both
     * when and by which administrator they were reviewed.
     */
    CONSTRAINT chk_mentor_application_review
        CHECK (
            (
                status = 'PENDING'
                AND reviewed_at IS NULL
                AND reviewed_by_admin_user_id IS NULL
            )
            OR
            (
                status IN (
                    'APPROVED',
                    'REJECTED'
                )
                AND reviewed_at IS NOT NULL
                AND reviewed_by_admin_user_id IS NOT NULL
            )
        )
);


CREATE INDEX idx_mentor_applications_status
    ON mentor_applications(status);


CREATE INDEX idx_mentor_applications_admin
    ON mentor_applications(
        reviewed_by_admin_user_id
    );


-- ============================================================
-- 3. MENTOR ASSIGNMENTS
-- ============================================================

CREATE TABLE mentor_assignments (
    assignment_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,

    mentor_user_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'PENDING',

    requested_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    reviewed_at TIMESTAMPTZ,

    ended_at TIMESTAMPTZ,

    CONSTRAINT fk_mentor_assignments_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mentor_assignments_mentor
        FOREIGN KEY (mentor_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_mentor_assignments_status
        CHECK (
            status IN (
                'PENDING',
                'ACTIVE',
                'ENDED'
            )
        ),

    /*
     * A pending assignment has not yet been reviewed.
     * An ACTIVE assignment must have been reviewed.
     * An ENDED assignment must have both a review and end time.
     */
    CONSTRAINT chk_mentor_assignment_dates
        CHECK (
            (
                status = 'PENDING'
                AND reviewed_at IS NULL
                AND ended_at IS NULL
            )
            OR
            (
                status = 'ACTIVE'
                AND reviewed_at IS NOT NULL
                AND ended_at IS NULL
            )
            OR
            (
                status = 'ENDED'
                AND reviewed_at IS NOT NULL
                AND ended_at IS NOT NULL
            )
        )
);


CREATE INDEX idx_mentor_assignments_project
    ON mentor_assignments(
        project_id
    );


CREATE INDEX idx_mentor_assignments_mentor
    ON mentor_assignments(
        mentor_user_id
    );


CREATE INDEX idx_mentor_assignments_status
    ON mentor_assignments(
        status
    );


/*
 * A Mentor may have historical ENDED assignments,
 * but may not have more than one current PENDING/ACTIVE
 * assignment for the same project.
 */
CREATE UNIQUE INDEX
    uq_mentor_assignments_current
ON mentor_assignments(
    project_id,
    mentor_user_id
)
WHERE status IN (
    'PENDING',
    'ACTIVE'
);


-- ============================================================
-- 4. PRESERVE EXISTING MENTOR WORK
-- ============================================================

/*
 * Migration 006 allowed approved Mentors to submit guidance
 * directly against projects.
 *
 * Existing guidance therefore demonstrates that Mentor
 * involvement was already taking place on that project.
 *
 * Set the new Mentor-support flag to TRUE for those projects
 * before replacing the old relationship model.
 */
UPDATE projects project
SET allow_mentor_support = TRUE
WHERE EXISTS (
    SELECT 1
    FROM mentor_guidance guidance
    WHERE guidance.project_id =
        project.project_id
);


/*
 * Create one ACTIVE assignment for each existing
 * project/Mentor relationship.
 *
 * Existing guidance is grandfathered into an ACTIVE
 * relationship so no historical data is lost.
 */
INSERT INTO mentor_assignments (
    project_id,
    mentor_user_id,
    status,
    requested_at,
    reviewed_at
)
SELECT
    guidance.project_id,
    guidance.mentor_user_id,
    'ACTIVE',
    MIN(guidance.created_at),
    MIN(guidance.created_at)
FROM mentor_guidance guidance
GROUP BY
    guidance.project_id,
    guidance.mentor_user_id
ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. LINK GUIDANCE TO MENTOR ASSIGNMENTS
-- ============================================================

ALTER TABLE mentor_guidance
ADD COLUMN assignment_id UUID;


/*
 * Connect every old guidance record to the ACTIVE
 * MentorAssignment created above.
 */
UPDATE mentor_guidance guidance
SET assignment_id =
    assignment.assignment_id
FROM mentor_assignments assignment
WHERE
    assignment.project_id =
        guidance.project_id
    AND assignment.mentor_user_id =
        guidance.mentor_user_id
    AND assignment.status =
        'ACTIVE';


/*
 * Defensive migration check.
 *
 * Do not continue and remove the old project/Mentor
 * relationship if any historic guidance failed to map.
 */
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM mentor_guidance
        WHERE assignment_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Unable to migrate all Mentor guidance to Mentor assignments.';
    END IF;
END
$$;


ALTER TABLE mentor_guidance
ALTER COLUMN assignment_id
SET NOT NULL;


ALTER TABLE mentor_guidance
ADD CONSTRAINT fk_mentor_guidance_assignment
FOREIGN KEY (assignment_id)
REFERENCES mentor_assignments(
    assignment_id
)
ON DELETE CASCADE;


CREATE INDEX
    idx_mentor_guidance_assignment
ON mentor_guidance(
    assignment_id
);


-- ============================================================
-- 6. REMOVE OLD DUPLICATED GUIDANCE RELATIONSHIPS
-- ============================================================

/*
 * Guidance now obtains its project and Mentor through
 * MentorAssignment.
 *
 * Keeping project_id and mentor_user_id here as well would
 * duplicate the relationship and could allow inconsistent data.
 */

DROP INDEX IF EXISTS
    idx_mentor_guidance_project;


DROP INDEX IF EXISTS
    idx_mentor_guidance_mentor;


ALTER TABLE mentor_guidance
DROP CONSTRAINT IF EXISTS
    fk_mentor_guidance_project;


ALTER TABLE mentor_guidance
DROP CONSTRAINT IF EXISTS
    fk_mentor_guidance_mentor;


ALTER TABLE mentor_guidance
DROP COLUMN project_id;


ALTER TABLE mentor_guidance
DROP COLUMN mentor_user_id;


COMMIT;