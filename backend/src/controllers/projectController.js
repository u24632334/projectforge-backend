/**
 * ProjectForge - Project Management & Listing Controller
 *
 * Handles:
 * - Project creation
 * - Project editing
 * - Open positions and required skills
 * - Project Lead membership creation
 * - Project discovery and filtering
 * - User project memberships
 * - Individual project retrieval
 * - Project completion
 * - Mentor-support project settings
 */

const db =
    require("../config/db");


const pool =
    db.pool || db;


// ============================================================
// VALIDATION LIMITS
// ============================================================

const MAX_PROJECT_TITLE_LENGTH =
    120;

const MAX_PROJECT_DESCRIPTION_LENGTH =
    1000;

const MAX_PROJECT_CATEGORY_LENGTH =
    120;

const MAX_POSITION_TITLE_LENGTH =
    120;

const MAX_SKILL_NAME_LENGTH =
    120;


// ============================================================
// HELPERS
// ============================================================

/**
 * Validates an optional external repository URL.
 *
 * ProjectForge v1.0 supports GitHub and GitLab HTTPS links.
 */
function isValidRepositoryUrl(
    repositoryUrl
) {
    if (
        repositoryUrl === undefined ||
        repositoryUrl === null ||
        String(
            repositoryUrl
        ).trim() === ""
    ) {
        return true;
    }


    try {
        const parsedUrl =
            new URL(
                String(
                    repositoryUrl
                ).trim()
            );


        return (
            parsedUrl.protocol ===
                "https:" &&
            (
                parsedUrl.hostname ===
                    "github.com" ||
                parsedUrl.hostname ===
                    "www.github.com" ||
                parsedUrl.hostname ===
                    "gitlab.com" ||
                parsedUrl.hostname ===
                    "www.gitlab.com"
            )
        );
    }
    catch {
        return false;
    }
}


/**
 * Validates the common project fields used by both
 * project creation and project editing.
 */
function validateProjectFields({
    title,
    description,
    category,
    expectedHoursPerWeek,
    repositoryUrl,
    allowMentorSupport
}) {
    if (
        typeof title !==
            "string" ||
        !title.trim()
    ) {
        return {
            isValid: false,
            error:
                "Project title is required."
        };
    }


    if (
        title.trim().length >
        MAX_PROJECT_TITLE_LENGTH
    ) {
        return {
            isValid: false,
            error:
                `Maximum characters exceeded. Project title may not exceed ${MAX_PROJECT_TITLE_LENGTH} characters.`
        };
    }


    if (
        typeof description !==
            "string" ||
        !description.trim()
    ) {
        return {
            isValid: false,
            error:
                "Project description is required."
        };
    }


    if (
        description.length >
        MAX_PROJECT_DESCRIPTION_LENGTH
    ) {
        return {
            isValid: false,
            error:
                `Maximum characters exceeded. Project description may not exceed ${MAX_PROJECT_DESCRIPTION_LENGTH} characters.`
        };
    }


    if (
        typeof category !==
            "string" ||
        !category.trim()
    ) {
        return {
            isValid: false,
            error:
                "Project category is required."
        };
    }


    if (
        category.trim().length >
        MAX_PROJECT_CATEGORY_LENGTH
    ) {
        return {
            isValid: false,
            error:
                `Project category must be ${MAX_PROJECT_CATEGORY_LENGTH} characters or fewer.`
        };
    }


    const hours =
        Number(
            expectedHoursPerWeek
        );


    if (
        !Number.isFinite(
            hours
        ) ||
        !Number.isInteger(
            hours
        ) ||
        hours < 1 ||
        hours > 168
    ) {
        return {
            isValid: false,
            error:
                "Expected commitment must be a whole number between 1 and 168 hours."
        };
    }


    if (
        !isValidRepositoryUrl(
            repositoryUrl
        )
    ) {
        return {
            isValid: false,
            error:
                "Repository URL must be a valid GitHub or GitLab HTTPS URL."
        };
    }


    if (
        allowMentorSupport !==
            undefined &&
        typeof allowMentorSupport !==
            "boolean"
    ) {
        return {
            isValid: false,
            error:
                "Mentor-support preference must be true or false."
        };
    }


    return {
        isValid: true,
        hours
    };
}


/**
 * Validates one project position.
 */
function validatePosition(
    position
) {
    if (
        !position ||
        typeof position !==
            "object" ||
        Array.isArray(
            position
        )
    ) {
        return {
            isValid: false,
            error:
                "Each project position must be a valid object."
        };
    }


    if (
        typeof position.title !==
            "string" ||
        !position.title.trim()
    ) {
        return {
            isValid: false,
            error:
                "Each project position requires a role title."
        };
    }


    if (
        position.title.trim()
            .length >
        MAX_POSITION_TITLE_LENGTH
    ) {
        return {
            isValid: false,
            error:
                `Maximum characters exceeded. Role title may not exceed ${MAX_POSITION_TITLE_LENGTH} characters.`
        };
    }


    if (
        position.description !==
            undefined &&
        position.description !==
            null &&
        typeof position.description !==
            "string"
    ) {
        return {
            isValid: false,
            error:
                "Role description must be text."
        };
    }


    if (
        position.skills !==
            undefined &&
        !Array.isArray(
            position.skills
        )
    ) {
        return {
            isValid: false,
            error:
                "Position skills must be supplied as a list."
        };
    }


    if (
        Array.isArray(
            position.skills
        )
    ) {
        for (
            const skillName
            of position.skills
        ) {
            if (
                typeof skillName !==
                    "string"
            ) {
                return {
                    isValid: false,
                    error:
                        "Each required skill must be text."
                };
            }


            if (
                skillName.trim()
                    .length >
                MAX_SKILL_NAME_LENGTH
            ) {
                return {
                    isValid: false,
                    error:
                        `Skill names must be ${MAX_SKILL_NAME_LENGTH} characters or fewer.`
                };
            }
        }
    }


    return {
        isValid: true
    };
}


// ============================================================
// CREATE PROJECT
// ============================================================

/**
 * PFG-33:
 * Create a New Project Listing with Open Positions.
 *
 * POST /api/projects
 */
exports.createProject =
    async (
        req,
        res
    ) => {

        if (
            !req.user ||
            !req.user.id
        ) {
            return res
                .status(401)
                .json({
                    success:
                        false,

                    error:
                        "Authentication required."
                });
        }


        const body =
            req.body || {};


        const {
            title,
            description,
            category,
            expectedHoursPerWeek,
            repositoryUrl,
            positions,
            allowMentorSupport
        } = body;


        const projectValidation =
            validateProjectFields({
                title,
                description,
                category,
                expectedHoursPerWeek,
                repositoryUrl,
                allowMentorSupport
            });


        if (
            !projectValidation
                .isValid
        ) {
            return res
                .status(400)
                .json({
                    error:
                        projectValidation
                            .error
                });
        }


        if (
            !Array.isArray(
                positions
            ) ||
            positions.length ===
                0
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "A project must have at least one open position/role."
                });
        }


        for (
            const position
            of positions
        ) {
            const positionValidation =
                validatePosition(
                    position
                );


            if (
                !positionValidation
                    .isValid
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            positionValidation
                                .error
                    });
            }
        }


        const hours =
            projectValidation.hours;


        const mentorSupport =
            allowMentorSupport ===
            true;


        let client;


        try {
            client =
                await pool.connect();


            await client.query(
                "BEGIN"
            );


            const projectQuery = `
                INSERT INTO projects (
                    title,
                    description,
                    category,
                    expected_hours_per_week,
                    repository_url,
                    allow_mentor_support,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    'ACTIVE'
                )
                RETURNING
                    project_id
                        AS "projectId",
                    title,
                    description,
                    category,
                    expected_hours_per_week
                        AS "expectedHoursPerWeek",
                    status,
                    repository_url
                        AS "repositoryUrl",
                    allow_mentor_support
                        AS "allowMentorSupport",
                    created_at
                        AS "createdAt";
            `;


            const projectResult =
                await client.query(
                    projectQuery,
                    [
                        title.trim(),

                        description
                            .trim(),

                        category.trim(),

                        hours,

                        repositoryUrl &&
                        String(
                            repositoryUrl
                        ).trim()
                            ? String(
                                repositoryUrl
                            ).trim()
                            : null,

                        mentorSupport
                    ]
                );


            const createdProject =
                projectResult
                    .rows[0];


            await client.query(
                `
                    INSERT INTO project_memberships (
                        project_id,
                        user_id,
                        member_role,
                        active
                    )
                    VALUES (
                        $1,
                        $2,
                        'LEAD',
                        TRUE
                    );
                `,
                [
                    createdProject
                        .projectId,

                    req.user.id
                ]
            );


            createdProject
                .positions =
                [];


            for (
                const pos
                of positions
            ) {
                const cleanTitle =
                    pos.title
                        .trim();


                const cleanDescription =
                    typeof pos
                        .description ===
                        "string" &&
                    pos.description
                        .trim()
                        ? pos.description
                            .trim()
                        : cleanTitle;


                const posResult =
                    await client.query(
                        `
                            INSERT INTO project_positions (
                                project_id,
                                title,
                                description,
                                status
                            )
                            VALUES (
                                $1,
                                $2,
                                $3,
                                'OPEN'
                            )
                            RETURNING
                                position_id
                                    AS "positionId",
                                title,
                                description,
                                status;
                        `,
                        [
                            createdProject
                                .projectId,

                            cleanTitle,

                            cleanDescription
                        ]
                    );


                const newPos =
                    posResult
                        .rows[0];


                newPos.skills =
                    [];


                if (
                    Array.isArray(
                        pos.skills
                    )
                ) {
                    const seenSkills =
                        new Set();


                    for (
                        const skillName
                        of pos.skills
                    ) {
                        const cleanSkillName =
                            skillName
                                .trim();


                        if (
                            !cleanSkillName
                        ) {
                            continue;
                        }


                        const skillKey =
                            cleanSkillName
                                .toLowerCase();


                        if (
                            seenSkills.has(
                                skillKey
                            )
                        ) {
                            continue;
                        }


                        seenSkills.add(
                            skillKey
                        );


                        const skillResult =
                            await client.query(
                                `
                                    INSERT INTO skills (
                                        name,
                                        category
                                    )
                                    VALUES (
                                        $1,
                                        $2
                                    )
                                    ON CONFLICT (name)
                                    DO UPDATE SET
                                        name =
                                            EXCLUDED.name
                                    RETURNING
                                        skill_id;
                                `,
                                [
                                    cleanSkillName,

                                    category
                                        .trim()
                                ]
                            );


                        const skillId =
                            skillResult
                                .rows[0]
                                .skill_id;


                        await client.query(
                            `
                                INSERT INTO position_skills (
                                    position_id,
                                    skill_id
                                )
                                VALUES (
                                    $1,
                                    $2
                                )
                                ON CONFLICT
                                DO NOTHING;
                            `,
                            [
                                newPos
                                    .positionId,

                                skillId
                            ]
                        );


                        newPos
                            .skills
                            .push(
                                cleanSkillName
                            );
                    }
                }


                createdProject
                    .positions
                    .push(
                        newPos
                    );
            }


            await client.query(
                "COMMIT"
            );


            return res
                .status(201)
                .json({
                    message:
                        "Project created successfully",

                    project:
                        createdProject
                });
        }
        catch (
            error
        ) {
            if (
                client
            ) {
                try {
                    await client
                        .query(
                            "ROLLBACK"
                        );
                }
                catch (
                    rollbackError
                ) {
                    console.error(
                        "Error rolling back project creation:",
                        rollbackError
                    );
                }
            }


            console.error(
                "Error creating project:",
                error
            );


            return res
                .status(500)
                .json({
                    error:
                        "Failed to create project listing"
                });
        }
        finally {
            if (
                client
            ) {
                client.release();
            }
        }
    };


// ============================================================
// PROJECT DISCOVERY
// ============================================================

/**
 * Query projects using search/filter criteria.
 *
 * GET /api/projects
 */
exports.getProjects =
    async (
        req,
        res
    ) => {
        try {
            const {
                search,
                category,
                maxHours,
                skill
            } = req.query;


            const queryValues =
                [];


            const conditions = [
                "p.status = 'ACTIVE'"
            ];


            if (
                typeof search ===
                    "string" &&
                search.trim() !==
                    ""
            ) {
                queryValues.push(
                    `%${search.trim()}%`
                );


                conditions.push(
                    `(p.title ILIKE $${queryValues.length}
                    OR p.description ILIKE $${queryValues.length})`
                );
            }


            if (
                typeof category ===
                    "string" &&
                category.trim() !==
                    "" &&
                category !==
                    "All"
            ) {
                queryValues.push(
                    category.trim()
                );


                conditions.push(
                    `p.category = $${queryValues.length}`
                );
            }


            if (
                maxHours !==
                    undefined &&
                maxHours !==
                    ""
            ) {
                const parsedMaxHours =
                    Number(
                        maxHours
                    );


                if (
                    !Number.isFinite(
                        parsedMaxHours
                    ) ||
                    !Number.isInteger(
                        parsedMaxHours
                    ) ||
                    parsedMaxHours < 0 ||
                    parsedMaxHours > 168
                ) {
                    return res
                        .status(400)
                        .json({
                            error:
                                "Maximum hours must be a whole number between 0 and 168."
                        });
                }


                queryValues.push(
                    parsedMaxHours
                );


                conditions.push(
                    `p.expected_hours_per_week <= $${queryValues.length}`
                );
            }


            if (
                typeof skill ===
                    "string" &&
                skill.trim() !==
                    ""
            ) {
                queryValues.push(
                    `%${skill.trim()}%`
                );


                conditions.push(
                    `
                        EXISTS (
                            SELECT 1
                            FROM project_positions pos_filter
                            JOIN position_skills ps_filter
                                ON pos_filter.position_id =
                                   ps_filter.position_id
                            JOIN skills s_filter
                                ON ps_filter.skill_id =
                                   s_filter.skill_id
                            WHERE
                                pos_filter.project_id =
                                    p.project_id
                                AND pos_filter.status =
                                    'OPEN'
                                AND s_filter.name ILIKE
                                    $${queryValues.length}
                        )
                    `
                );
            }


            const whereClause =
                conditions.length >
                    0
                    ? `WHERE ${conditions.join(
                        " AND "
                    )}`
                    : "";


            const sqlQuery = `
                SELECT
                    p.project_id
                        AS "projectId",
                    p.title,
                    p.description,
                    p.category,
                    p.expected_hours_per_week
                        AS "expectedHoursPerWeek",
                    p.status,
                    p.repository_url
                        AS "repositoryUrl",
                    p.allow_mentor_support
                        AS "allowMentorSupport",
                    p.created_at
                        AS "createdAt",

                    COALESCE(
                        json_agg(
                            DISTINCT
                            jsonb_build_object(
                                'positionId',
                                    pos.position_id,
                                'title',
                                    pos.title,
                                'status',
                                    pos.status,
                                'skills',
                                    (
                                        SELECT
                                            COALESCE(
                                                json_agg(
                                                    s.name
                                                ),
                                                '[]'::json
                                            )
                                        FROM position_skills ps
                                        JOIN skills s
                                            ON ps.skill_id =
                                               s.skill_id
                                        WHERE
                                            ps.position_id =
                                                pos.position_id
                                    )
                            )
                        )
                        FILTER (
                            WHERE
                                pos.position_id
                                IS NOT NULL
                        ),
                        '[]'
                    ) AS positions

                FROM projects p

                LEFT JOIN project_positions pos
                    ON p.project_id =
                       pos.project_id

                ${whereClause}

                GROUP BY
                    p.project_id

                ORDER BY
                    p.created_at DESC;
            `;


            const result =
                await pool.query(
                    sqlQuery,
                    queryValues
                );


            return res
                .status(200)
                .json({
                    projects:
                        result.rows
                });
        }
        catch (
            error
        ) {
            console.error(
                "Error fetching projects:",
                error
            );


            return res
                .status(500)
                .json({
                    error:
                        "Failed to retrieve project listings"
                });
        }
    };


// ============================================================
// MY PROJECTS
// ============================================================

/**
 * Return active projects for the authenticated user.
 *
 * GET /api/projects/mine
 */
exports.getMyProjects =
    async (
        req,
        res
    ) => {

        if (
            !req.user ||
            !req.user.id
        ) {
            return res
                .status(401)
                .json({
                    success:
                        false,

                    error:
                        "Authentication required."
                });
        }


        try {
            const result =
                await pool.query(
                    `
                        SELECT
                            p.project_id
                                AS "projectId",
                            p.title,
                            p.description,
                            p.category,
                            p.expected_hours_per_week
                                AS "expectedHoursPerWeek",
                            p.status,
                            p.repository_url
                                AS "repositoryUrl",
                            p.allow_mentor_support
                                AS "allowMentorSupport",
                            p.created_at
                                AS "createdAt",

                            pm.membership_id
                                AS "membershipId",
                            pm.member_role
                                AS "memberRole",

                            pp.title
                                AS "positionTitle"

                        FROM project_memberships pm

                        JOIN projects p
                            ON p.project_id =
                               pm.project_id

                        LEFT JOIN project_positions pp
                            ON pp.position_id =
                               pm.position_id

                        WHERE
                            pm.user_id =
                                $1
                            AND pm.active =
                                TRUE
                            AND p.status IN ('ACTIVE', 'COMPLETED')

                        ORDER BY
                            CASE
                                WHEN
                                    pm.member_role =
                                        'LEAD'
                                THEN 0
                                ELSE 1
                            END,
                            p.created_at
                                DESC;
                    `,
                    [
                        req.user.id
                    ]
                );


            return res
                .status(200)
                .json({
                    projects:
                        result.rows
                });
        }
        catch (
            error
        ) {
            console.error(
                "Error fetching user projects:",
                error
            );


            return res
                .status(500)
                .json({
                    error:
                        "Failed to retrieve your projects"
                });
        }
    };


// ============================================================
// UPDATE PROJECT
// ============================================================

/**
 * Edit an ACTIVE project listing.
 *
 * PATCH /api/projects/:id
 *
 * The route already requires the caller to be
 * the active Project Lead.
 */
exports.updateProject =
    async (
        req,
        res
    ) => {

        if (
            !req.user ||
            !req.user.id
        ) {
            return res
                .status(401)
                .json({
                    success:
                        false,

                    error:
                        "Authentication required."
                });
        }


        if (
            !req.membership ||
            req.membership
                .memberRole !==
                "LEAD" ||
            req.membership
                .projectId !==
                req.params.id
        ) {
            return res
                .status(403)
                .json({
                    success:
                        false,

                    error:
                        "Project Lead access required."
                });
        }


        const {
            title,
            description,
            category,
            expectedHoursPerWeek,
            repositoryUrl,
            allowMentorSupport
        } =
            req.body || {};


        const validation =
            validateProjectFields({
                title,
                description,
                category,
                expectedHoursPerWeek,
                repositoryUrl,
                allowMentorSupport
            });


        if (
            !validation.isValid
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    error:
                        validation.error
                });
        }


        const mentorSupport =
            allowMentorSupport ===
            true;


        try {
            const result =
                await pool.query(
                    `
                        UPDATE projects
                        SET
                            title =
                                $1,
                            description =
                                $2,
                            category =
                                $3,
                            expected_hours_per_week =
                                $4,
                            repository_url =
                                $5,
                            allow_mentor_support =
                                $6
                        WHERE
                            project_id =
                                $7
                            AND status =
                                'ACTIVE'
                        RETURNING
                            project_id
                                AS "projectId",
                            title,
                            description,
                            category,
                            expected_hours_per_week
                                AS "expectedHoursPerWeek",
                            status,
                            repository_url
                                AS "repositoryUrl",
                            allow_mentor_support
                                AS "allowMentorSupport",
                            created_at
                                AS "createdAt";
                    `,
                    [
                        title.trim(),

                        description
                            .trim(),

                        category.trim(),

                        validation.hours,

                        repositoryUrl &&
                        String(
                            repositoryUrl
                        ).trim()
                            ? String(
                                repositoryUrl
                            ).trim()
                            : null,

                        mentorSupport,

                        req.params.id
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        error:
                            "Only active projects can be edited."
                    });
            }


            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Project listing updated successfully.",

                    project:
                        result.rows[0]
                });
        }
        catch (
            error
        ) {
            console.error(
                "Error updating project:",
                error
            );


            return res
                .status(500)
                .json({
                    success:
                        false,

                    error:
                        "Failed to update project listing."
                });
        }
    };


// ============================================================
// COMPLETE PROJECT
// ============================================================

/**
 * PF-SHOW-06:
 * Mark an ACTIVE project as COMPLETED.
 *
 * Group Design rule:
 * A project with incomplete milestones may not be completed.
 */
exports.completeProject =
    async (
        req,
        res
    ) => {

        if (
            !req.user ||
            !req.user.id
        ) {
            return res
                .status(401)
                .json({
                    success:
                        false,

                    error:
                        "Authentication required."
                });
        }


        if (
            !req.membership ||
            req.membership
                .memberRole !==
                "LEAD" ||
            req.membership
                .projectId !==
                req.params.id
        ) {
            return res
                .status(403)
                .json({
                    success:
                        false,

                    error:
                        "Project Lead access required."
                });
        }


        let client;


        try {
            client =
                await pool.connect();


            await client.query(
                "BEGIN"
            );


            /*
             * Lock the project so its completion state remains
             * consistent while the milestone precondition is checked.
             */
            const projectResult =
                await client.query(
                    `
                        SELECT
                            project_id,
                            status
                        FROM projects
                        WHERE project_id =
                            $1
                        FOR UPDATE;
                    `,
                    [
                        req.params.id
                    ]
                );


            if (
                projectResult.rows.length ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        error:
                            "Project not found."
                    });
            }


            if (
                projectResult
                    .rows[0]
                    .status !==
                "ACTIVE"
            ) {
                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        error:
                            "Only active projects can be marked as completed."
                    });
            }


            const milestoneResult =
                await client.query(
                    `
                        SELECT
                            COUNT(*)::INTEGER
                                AS "incompleteCount"
                        FROM milestones
                        WHERE
                            project_id =
                                $1
                            AND status <>
                                'COMPLETE';
                    `,
                    [
                        req.params.id
                    ]
                );


            const incompleteCount =
                milestoneResult
                    .rows[0]
                    .incompleteCount;


            if (
                incompleteCount >
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        error:
                            "All project milestones must be completed before the project can be marked as completed."
                    });
            }


            const result =
                await client.query(
                    `
                        UPDATE projects
                        SET
                            status =
                                'COMPLETED'
                        WHERE
                            project_id =
                                $1
                            AND status =
                                'ACTIVE'
                        RETURNING
                            project_id
                                AS "projectId",
                            title,
                            description,
                            category,
                            expected_hours_per_week
                                AS "expectedHoursPerWeek",
                            status,
                            repository_url
                                AS "repositoryUrl",
                            allow_mentor_support
                                AS "allowMentorSupport",
                            created_at
                                AS "createdAt";
                    `,
                    [
                        req.params.id
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );


                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        error:
                            "Only active projects can be marked as completed."
                    });
            }


            await client.query(
                "COMMIT"
            );


            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Project marked as completed.",

                    project:
                        result.rows[0]
                });
        }
        catch (
            error
        ) {
            if (
                client
            ) {
                try {
                    await client.query(
                        "ROLLBACK"
                    );
                }
                catch (
                    rollbackError
                ) {
                    console.error(
                        "Error rolling back project completion:",
                        rollbackError
                    );
                }
            }


            console.error(
                "Error completing project:",
                error
            );


            return res
                .status(500)
                .json({
                    success:
                        false,

                    error:
                        "Failed to mark project as completed."
                });
        }
        finally {
            if (
                client
            ) {
                client.release();
            }
        }
    };


// ============================================================
// GET PROJECT
// ============================================================

/**
 * Retrieve one project by ID.
 *
 * GET /api/projects/:id
 */
exports.getProjectById =
    async (
        req,
        res
    ) => {
        try {
            const {
                id
            } = req.params;


            const sqlQuery = `
                SELECT
                    p.project_id
                        AS "projectId",
                    p.title,
                    p.description,
                    p.category,
                    p.expected_hours_per_week
                        AS "expectedHoursPerWeek",
                    p.status,
                    p.repository_url
                        AS "repositoryUrl",
                    p.allow_mentor_support
                        AS "allowMentorSupport",
                    p.created_at
                        AS "createdAt",

                    COALESCE(
                        json_agg(
                            DISTINCT
                            jsonb_build_object(
                                'positionId',
                                    pos.position_id,
                                'title',
                                    pos.title,
                                'status',
                                    pos.status,
                                'skills',
                                    (
                                        SELECT
                                            COALESCE(
                                                json_agg(
                                                    s.name
                                                ),
                                                '[]'::json
                                            )
                                        FROM position_skills ps
                                        JOIN skills s
                                            ON ps.skill_id =
                                               s.skill_id
                                        WHERE
                                            ps.position_id =
                                                pos.position_id
                                    )
                            )
                        )
                        FILTER (
                            WHERE
                                pos.position_id
                                IS NOT NULL
                        ),
                        '[]'
                    ) AS positions

                FROM projects p

                LEFT JOIN project_positions pos
                    ON p.project_id =
                       pos.project_id

                WHERE
                    p.project_id =
                        $1

                GROUP BY
                    p.project_id;
            `;


            const result =
                await pool.query(
                    sqlQuery,
                    [
                        id
                    ]
                );


            if (
                result.rows.length ===
                0
            ) {
                return res
                    .status(404)
                    .json({
                        error:
                            "Project not found"
                    });
            }


            return res
                .status(200)
                .json({
                    project:
                        result.rows[0]
                });
        }
        catch (
            error
        ) {
            console.error(
                "Error fetching project by ID:",
                error
            );


            return res
                .status(500)
                .json({
                    error:
                        "Failed to retrieve project details"
                });
        }
    };