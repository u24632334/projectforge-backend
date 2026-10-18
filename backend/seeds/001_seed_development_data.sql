-- ============================================================
-- ProjectForge
-- PFG-10: Database Seed Scripts
-- Local development and testing data
-- ============================================================

BEGIN;


-- ============================================================
-- 1. SAMPLE STUDENT USERS
-- ============================================================

-- These accounts are fictional and intended for local
-- development/testing only.
--
-- Local development password for all sample users:
-- ProjectForge123!

INSERT INTO users (
    user_id,
    email,
    password_hash,
    system_role,
    status
)
VALUES
(
    '00000000-0000-0000-0000-000000000101',
    'alex.student@projectforge.local',
    crypt('ProjectForge123!', gen_salt('bf', 10)),
    'STUDENT',
    'ACTIVE'
),
(
    '00000000-0000-0000-0000-000000000102',
    'sam.student@projectforge.local',
    crypt('ProjectForge123!', gen_salt('bf', 10)),
    'STUDENT',
    'ACTIVE'
),
(
    '00000000-0000-0000-0000-000000000103',
    'taylor.student@projectforge.local',
    crypt('ProjectForge123!', gen_salt('bf', 10)),
    'STUDENT',
    'ACTIVE'
)
ON CONFLICT (user_id)
DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    system_role = EXCLUDED.system_role,
    status = EXCLUDED.status;


-- ============================================================
-- 2. SAMPLE STUDENT PROFILES
-- ============================================================

INSERT INTO profiles (
    profile_id,
    user_id,
    display_name,
    bio,
    interests,
    availability_hours_per_week
)
VALUES
(
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'Alex Mokoena',
    'Software engineering student interested in backend development and system architecture.',
    ARRAY[
        'Backend Development',
        'Databases',
        'System Architecture'
    ]::TEXT[],
    8
),
(
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'Sam Naidoo',
    'Engineering student interested in frontend development, user experience and collaborative systems.',
    ARRAY[
        'Frontend Development',
        'UI/UX',
        'Team Collaboration'
    ]::TEXT[],
    6
),
(
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    'Taylor Jacobs',
    'Student developer interested in testing, embedded systems and data analysis.',
    ARRAY[
        'Testing',
        'Embedded Systems',
        'Data Analysis'
    ]::TEXT[],
    10
)
ON CONFLICT (user_id)
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    interests = EXCLUDED.interests,
    availability_hours_per_week =
        EXCLUDED.availability_hours_per_week;


-- ============================================================
-- 3. SAMPLE PROJECT LISTINGS
-- ============================================================

INSERT INTO projects (
    project_id,
    title,
    description,
    category,
    expected_hours_per_week,
    status,
    repository_url
)
VALUES
(
    '00000000-0000-0000-0000-000000000301',
    'Smart Campus Energy Monitor',
    'Develop a platform that monitors campus energy usage and presents consumption information to students and staff.',
    'Software and Sustainability',
    8,
    'ACTIVE',
    NULL
),
(
    '00000000-0000-0000-0000-000000000302',
    'Autonomous Delivery Rover',
    'Develop a prototype autonomous rover for small-item delivery within a controlled university environment.',
    'Robotics',
    10,
    'ACTIVE',
    NULL
)
ON CONFLICT (project_id)
DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    expected_hours_per_week =
        EXCLUDED.expected_hours_per_week,
    status = EXCLUDED.status,
    repository_url = EXCLUDED.repository_url;


-- ============================================================
-- 4. SAMPLE PROJECT MEMBERSHIPS
-- ============================================================

-- Membership records allow the sample tasks to be assigned
-- to real project members.

INSERT INTO project_memberships (
    membership_id,
    project_id,
    user_id,
    member_role,
    active
)
VALUES
(
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000101',
    'LEAD',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000102',
    'MEMBER',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000103',
    'MEMBER',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000404',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000102',
    'LEAD',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000405',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000103',
    'MEMBER',
    TRUE
)
ON CONFLICT (membership_id)
DO UPDATE SET
    project_id = EXCLUDED.project_id,
    user_id = EXCLUDED.user_id,
    member_role = EXCLUDED.member_role,
    active = EXCLUDED.active;


-- ============================================================
-- 5. SAMPLE PROJECT MILESTONES
-- ============================================================

INSERT INTO milestones (
    milestone_id,
    project_id,
    title,
    description,
    due_date,
    status
)
VALUES
(
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000301',
    'MVP Prototype',
    'Complete the first working prototype of the energy monitoring platform.',
    CURRENT_DATE + 7,
    'OPEN'
),
(
    '00000000-0000-0000-0000-000000000502',
    '00000000-0000-0000-0000-000000000301',
    'User Testing',
    'Evaluate the prototype with sample users and record feedback.',
    CURRENT_DATE + 14,
    'OPEN'
),
(
    '00000000-0000-0000-0000-000000000503',
    '00000000-0000-0000-0000-000000000302',
    'Navigation Prototype',
    'Demonstrate basic autonomous navigation and obstacle handling.',
    CURRENT_DATE + 10,
    'OPEN'
)
ON CONFLICT (milestone_id)
DO UPDATE SET
    project_id = EXCLUDED.project_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    due_date = EXCLUDED.due_date,
    status = EXCLUDED.status;


-- ============================================================
-- 6. SAMPLE TASKS
-- ============================================================

INSERT INTO tasks (
    task_id,
    milestone_id,
    assignee_membership_id,
    title,
    description,
    status,
    due_date
)
VALUES
(
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000401',
    'Define API endpoints',
    'Define the initial API endpoints required by the energy monitoring dashboard.',
    'IN_PROGRESS',
    CURRENT_DATE + 3
),
(
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000402',
    'Build dashboard components',
    'Create the main frontend components used to display energy consumption information.',
    'TODO',
    CURRENT_DATE + 5
),
(
    '00000000-0000-0000-0000-000000000603',
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000403',
    'Create database queries',
    'Implement the initial queries required to retrieve dashboard information.',
    'DONE',
    CURRENT_DATE + 2
),
(
    '00000000-0000-0000-0000-000000000604',
    '00000000-0000-0000-0000-000000000502',
    '00000000-0000-0000-0000-000000000402',
    'Run usability test',
    'Test the MVP with sample users and record usability feedback.',
    'TODO',
    CURRENT_DATE + 12
),
(
    '00000000-0000-0000-0000-000000000605',
    '00000000-0000-0000-0000-000000000503',
    '00000000-0000-0000-0000-000000000404',
    'Implement route planner',
    'Develop the first version of the rover route-planning logic.',
    'BLOCKED',
    CURRENT_DATE + 7
),
(
    '00000000-0000-0000-0000-000000000606',
    '00000000-0000-0000-0000-000000000503',
    '00000000-0000-0000-0000-000000000405',
    'Build sensor simulator',
    'Create a simple simulator for testing rover sensor input during development.',
    'IN_PROGRESS',
    CURRENT_DATE + 6
)
ON CONFLICT (task_id)
DO UPDATE SET
    milestone_id = EXCLUDED.milestone_id,
    assignee_membership_id =
        EXCLUDED.assignee_membership_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    due_date = EXCLUDED.due_date;


COMMIT;