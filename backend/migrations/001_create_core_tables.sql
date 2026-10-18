-- ============================================================
-- ProjectForge
-- PFG-8: Core Database Setup
-- Initial PostgreSQL migration
-- ============================================================

BEGIN;

-- Required for UUID generation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 1. IDENTITY, PROFILES AND SKILLS
-- ============================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    system_role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_email_not_blank
        CHECK (btrim(email) <> ''),

    CONSTRAINT chk_users_password_hash_not_blank
        CHECK (btrim(password_hash) <> ''),

    CONSTRAINT chk_users_system_role
        CHECK (system_role IN ('STUDENT', 'MENTOR', 'ADMIN')),

    CONSTRAINT chk_users_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

-- Email addresses should be unique regardless of letter case.
CREATE UNIQUE INDEX uq_users_email
    ON users (LOWER(email));


CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    display_name VARCHAR(120) NOT NULL,
    bio TEXT NOT NULL DEFAULT '',

    interests TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    availability_hours_per_week INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_profiles_display_name_not_blank
        CHECK (btrim(display_name) <> ''),

    CONSTRAINT chk_profiles_availability
        CHECK (
            availability_hours_per_week >= 0
            AND availability_hours_per_week <= 168
        )
);


CREATE TABLE skills (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(120) NOT NULL,

    CONSTRAINT chk_skills_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT chk_skills_category_not_blank
        CHECK (btrim(category) <> '')
);


CREATE TABLE user_skills (
    user_id UUID NOT NULL,
    skill_id UUID NOT NULL,

    proficiency VARCHAR(20) NOT NULL,

    PRIMARY KEY (user_id, skill_id),

    CONSTRAINT fk_user_skills_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_user_skills_proficiency
        CHECK (
            proficiency IN (
                'BEGINNER',
                'INTERMEDIATE',
                'ADVANCED'
            )
        )
);


-- ============================================================
-- 2. PROJECTS AND TEAM FORMATION
-- ============================================================

CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(120) NOT NULL,

    expected_hours_per_week INTEGER NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    repository_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_projects_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT chk_projects_category_not_blank
        CHECK (btrim(category) <> ''),

    CONSTRAINT chk_projects_expected_hours
        CHECK (
            expected_hours_per_week >= 0
            AND expected_hours_per_week <= 168
        ),

    CONSTRAINT chk_projects_status
        CHECK (
            status IN (
                'DRAFT',
                'ACTIVE',
                'COMPLETED',
                'ARCHIVED'
            )
        ),

    CONSTRAINT chk_projects_repository_url
        CHECK (
            repository_url IS NULL
            OR btrim(repository_url) <> ''
        )
);


CREATE TABLE project_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,

    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    CONSTRAINT fk_project_positions_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_project_positions_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT chk_project_positions_status
        CHECK (status IN ('OPEN', 'CLOSED'))
);


CREATE TABLE position_skills (
    position_id UUID NOT NULL,
    skill_id UUID NOT NULL,

    PRIMARY KEY (position_id, skill_id),

    CONSTRAINT fk_position_skills_position
        FOREIGN KEY (position_id)
        REFERENCES project_positions(position_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_position_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id)
        ON DELETE CASCADE
);


CREATE TABLE project_applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    position_id UUID NOT NULL,
    applicant_user_id UUID NOT NULL,

    message TEXT NOT NULL DEFAULT '',

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_applications_position
        FOREIGN KEY (position_id)
        REFERENCES project_positions(position_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_applications_user
        FOREIGN KEY (applicant_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_project_applications_status
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'REJECTED',
                'WITHDRAWN'
            )
        )
);

-- A user may not have two pending applications for
-- the same project position.
CREATE UNIQUE INDEX uq_project_applications_pending
    ON project_applications (
        position_id,
        applicant_user_id
    )
    WHERE status = 'PENDING';


CREATE TABLE project_memberships (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,
    user_id UUID NOT NULL,

    position_id UUID,

    member_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',

    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_project_memberships_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_memberships_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_memberships_position
        FOREIGN KEY (position_id)
        REFERENCES project_positions(position_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_project_memberships_position
        UNIQUE (position_id),

    CONSTRAINT chk_project_memberships_role
        CHECK (member_role IN ('LEAD', 'MEMBER'))
);

-- Prevent duplicate active membership for the same
-- user and project while still allowing historical
-- inactive membership records.
CREATE UNIQUE INDEX uq_project_memberships_active
    ON project_memberships (
        project_id,
        user_id
    )
    WHERE active = TRUE;

-- A project may have only one active Project Lead.
CREATE UNIQUE INDEX uq_project_active_lead
    ON project_memberships (project_id)
    WHERE active = TRUE
      AND member_role = 'LEAD';


-- ============================================================
-- 3. PROJECT WORKSPACE
-- ============================================================

CREATE TABLE milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    due_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    CONSTRAINT fk_milestones_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_milestones_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT chk_milestones_status
        CHECK (status IN ('OPEN', 'COMPLETE'))
);


CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    milestone_id UUID NOT NULL,

    assignee_membership_id UUID,

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'TODO',

    due_date DATE,

    CONSTRAINT fk_tasks_milestone
        FOREIGN KEY (milestone_id)
        REFERENCES milestones(milestone_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_tasks_assignee
        FOREIGN KEY (assignee_membership_id)
        REFERENCES project_memberships(membership_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_tasks_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT chk_tasks_status
        CHECK (
            status IN (
                'TODO',
                'IN_PROGRESS',
                'BLOCKED',
                'DONE'
            )
        )
);


CREATE TABLE development_updates (
    update_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    author_membership_id UUID NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_development_updates_membership
        FOREIGN KEY (author_membership_id)
        REFERENCES project_memberships(membership_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_development_updates_content
        CHECK (btrim(content) <> '')
);


CREATE TABLE team_radio_requests (
    radio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    author_membership_id UUID NOT NULL,

    category VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_team_radio_requests_membership
        FOREIGN KEY (author_membership_id)
        REFERENCES project_memberships(membership_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_team_radio_requests_category
        CHECK (
            category IN (
                'TECHNICAL',
                'DEPENDENCY',
                'RESOURCE',
                'COMMUNICATION',
                'OTHER'
            )
        ),

    CONSTRAINT chk_team_radio_requests_message
        CHECK (btrim(message) <> ''),

    CONSTRAINT chk_team_radio_requests_status
        CHECK (status IN ('OPEN', 'RESOLVED'))
);


-- ============================================================
-- SUPPORTING FOREIGN-KEY INDEXES
-- ============================================================

CREATE INDEX idx_user_skills_skill
    ON user_skills(skill_id);

CREATE INDEX idx_project_positions_project
    ON project_positions(project_id);

CREATE INDEX idx_position_skills_skill
    ON position_skills(skill_id);

CREATE INDEX idx_project_applications_user
    ON project_applications(applicant_user_id);

CREATE INDEX idx_project_memberships_project
    ON project_memberships(project_id);

CREATE INDEX idx_project_memberships_user
    ON project_memberships(user_id);

CREATE INDEX idx_milestones_project
    ON milestones(project_id);

CREATE INDEX idx_tasks_milestone
    ON tasks(milestone_id);

CREATE INDEX idx_tasks_assignee
    ON tasks(assignee_membership_id);

CREATE INDEX idx_development_updates_author
    ON development_updates(author_membership_id);

CREATE INDEX idx_team_radio_requests_author
    ON team_radio_requests(author_membership_id);


COMMIT;
