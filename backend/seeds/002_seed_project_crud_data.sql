-- ============================================================
-- ProjectForge Seed: Project Discovery Data
-- Complements 001_seed_development_data.sql
-- ============================================================

BEGIN;


-- ============================================================
-- 1. SEED SKILLS
--
-- Skills are matched by their unique name rather than by a
-- fixed UUID so this seed remains safe if a skill was already
-- created through the application.
-- ============================================================

INSERT INTO skills (
    name,
    category
)
VALUES
    (
        'React',
        'Software Engineering'
    ),
    (
        'Node.js',
        'Software Engineering'
    ),
    (
        'C++',
        'Embedded Systems'
    ),
    (
        'FreeRTOS',
        'Embedded Systems'
    ),
    (
        'PostgreSQL',
        'Software Engineering'
    )
ON CONFLICT (name)
DO UPDATE
SET category = EXCLUDED.category;


-- ============================================================
-- 2. SEED OPEN POSITIONS FOR EXISTING PROJECTS
-- ============================================================

INSERT INTO project_positions (
    position_id,
    project_id,
    title,
    description,
    status
)
VALUES
    (
        '00000000-0000-0000-0000-000000000501',
        '00000000-0000-0000-0000-000000000301',
        'Full-Stack React Engineer',
        'Build live energy telemetry dashboards and REST API endpoints.',
        'OPEN'
    ),
    (
        '00000000-0000-0000-0000-000000000502',
        '00000000-0000-0000-0000-000000000301',
        'Database & Backend Architect',
        'Design efficient PostgreSQL queries and ingestion pipelines.',
        'OPEN'
    ),
    (
        '00000000-0000-0000-0000-000000000503',
        '00000000-0000-0000-0000-000000000302',
        'Embedded Firmware Developer',
        'Write C++ motor control drivers and FreeRTOS tasks.',
        'OPEN'
    )
ON CONFLICT (position_id)
DO NOTHING;


-- ============================================================
-- 3. LINK POSITIONS TO SKILLS
--
-- Resolve the real skill UUID by skill name rather than
-- assuming a fixed skill_id.
-- ============================================================

INSERT INTO position_skills (
    position_id,
    skill_id
)
SELECT
    mapping.position_id,
    s.skill_id
FROM (
    VALUES
        (
            '00000000-0000-0000-0000-000000000501'::uuid,
            'React'
        ),
        (
            '00000000-0000-0000-0000-000000000501'::uuid,
            'Node.js'
        ),
        (
            '00000000-0000-0000-0000-000000000502'::uuid,
            'PostgreSQL'
        ),
        (
            '00000000-0000-0000-0000-000000000503'::uuid,
            'C++'
        ),
        (
            '00000000-0000-0000-0000-000000000503'::uuid,
            'FreeRTOS'
        )
) AS mapping(
    position_id,
    skill_name
)
JOIN skills s
    ON s.name = mapping.skill_name
ON CONFLICT DO NOTHING;


COMMIT;