const {
    pool
} = require("../config/db");


/**
 * Find one project.
 */
async function findProjectById(
    projectId
) {
    const result =
        await pool.query(
            `
                SELECT
                    project_id,
                    title,
                    description,
                    category,
                    expected_hours_per_week,
                    repository_url,
                    allow_mentor_support,
                    status,
                    created_at
                FROM projects
                WHERE project_id = $1;
            `,
            [
                projectId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Return ACTIVE projects that explicitly permit
 * Mentor participation.
 *
 * The Mentor's current assignment state is also returned so the
 * UI can distinguish projects that may still be requested from
 * projects already requested/assigned to this Mentor.
 */
async function getEligibleProjectsForMentor(
    mentorUserId
) {
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

                    p.repository_url
                        AS "repositoryUrl",

                    p.allow_mentor_support
                        AS "allowMentorSupport",

                    p.status,

                    p.created_at
                        AS "createdAt",

                    current_assignment.assignment_id
                        AS "assignmentId",

                    current_assignment.status
                        AS "assignmentStatus",

                    COALESCE(
                        lead_profile.display_name,
                        lead_user.email
                    ) AS "leadName"

                FROM projects p

                LEFT JOIN LATERAL (
                    SELECT
                        ma.assignment_id,
                        ma.status

                    FROM mentor_assignments ma

                    WHERE
                        ma.project_id =
                            p.project_id

                        AND ma.mentor_user_id =
                            $1

                        AND ma.status IN (
                            'PENDING',
                            'ACTIVE'
                        )

                    ORDER BY
                        ma.requested_at DESC

                    LIMIT 1

                ) current_assignment
                    ON TRUE

                LEFT JOIN project_memberships lead_membership
                    ON lead_membership.project_id =
                        p.project_id

                    AND lead_membership.member_role =
                        'LEAD'

                    AND lead_membership.active =
                        TRUE

                LEFT JOIN users lead_user
                    ON lead_user.user_id =
                        lead_membership.user_id

                LEFT JOIN profiles lead_profile
                    ON lead_profile.user_id =
                        lead_user.user_id

                WHERE
                    p.status =
                        'ACTIVE'

                    AND p.allow_mentor_support =
                        TRUE

                ORDER BY
                    p.created_at DESC;
            `,
            [
                mentorUserId
            ]
        );


    return result.rows;
}


/**
 * Return a current PENDING or ACTIVE Mentor assignment
 * for one Mentor/project pair.
 */
async function findCurrentAssignment(
    projectId,
    mentorUserId
) {
    const result =
        await pool.query(
            `
                SELECT
                    assignment_id,
                    project_id,
                    mentor_user_id,
                    status,
                    requested_at,
                    reviewed_at,
                    ended_at

                FROM mentor_assignments

                WHERE
                    project_id =
                        $1

                    AND mentor_user_id =
                        $2

                    AND status IN (
                        'PENDING',
                        'ACTIVE'
                    )

                ORDER BY
                    requested_at DESC

                LIMIT 1;
            `,
            [
                projectId,
                mentorUserId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Create a PENDING Mentor assignment request.
 */
async function createMentorAssignment({
    projectId,
    mentorUserId
}) {
    const result =
        await pool.query(
            `
                INSERT INTO mentor_assignments (
                    project_id,
                    mentor_user_id,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    'PENDING'
                )
                RETURNING
                    assignment_id
                        AS "assignmentId",

                    project_id
                        AS "projectId",

                    mentor_user_id
                        AS "mentorUserId",

                    status,

                    requested_at
                        AS "requestedAt",

                    reviewed_at
                        AS "reviewedAt",

                    ended_at
                        AS "endedAt";
            `,
            [
                projectId,
                mentorUserId
            ]
        );


    return result.rows[0];
}


/**
 * Return all Mentor assignments for a project.
 *
 * Used by the Project Lead when reviewing requests
 * and current Mentor participation.
 */
async function getAssignmentsForProject(
    projectId
) {
    const result =
        await pool.query(
            `
                SELECT
                    ma.assignment_id
                        AS "assignmentId",

                    ma.project_id
                        AS "projectId",

                    ma.mentor_user_id
                        AS "mentorUserId",

                    ma.status,

                    ma.requested_at
                        AS "requestedAt",

                    ma.reviewed_at
                        AS "reviewedAt",

                    ma.ended_at
                        AS "endedAt",

                    u.email,

                    COALESCE(
                        p.display_name,
                        u.email
                    ) AS "mentorName"

                FROM mentor_assignments ma

                JOIN users u
                    ON u.user_id =
                        ma.mentor_user_id

                LEFT JOIN profiles p
                    ON p.user_id =
                        u.user_id

                WHERE
                    ma.project_id =
                        $1

                ORDER BY
                    CASE ma.status
                        WHEN 'PENDING'
                            THEN 0

                        WHEN 'ACTIVE'
                            THEN 1

                        ELSE 2
                    END,

                    ma.requested_at DESC;
            `,
            [
                projectId
            ]
        );


    return result.rows;
}


/**
 * Find a Mentor assignment and lock it for a transaction.
 */
async function findAssignmentByIdForUpdate(
    client,
    assignmentId
) {
    const result =
        await client.query(
            `
                SELECT
                    assignment_id,
                    project_id,
                    mentor_user_id,
                    status,
                    requested_at,
                    reviewed_at,
                    ended_at

                FROM mentor_assignments

                WHERE assignment_id =
                    $1

                FOR UPDATE;
            `,
            [
                assignmentId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Check whether a user is the current active Lead
 * of the supplied project.
 */
async function findActiveLeadMembership(
    client,
    projectId,
    userId
) {
    const result =
        await client.query(
            `
                SELECT
                    membership_id,
                    project_id,
                    user_id,
                    member_role,
                    active

                FROM project_memberships

                WHERE
                    project_id =
                        $1

                    AND user_id =
                        $2

                    AND member_role =
                        'LEAD'

                    AND active =
                        TRUE

                LIMIT 1;
            `,
            [
                projectId,
                userId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Confirm that a Mentor account is still ACTIVE
 * and still has the approved MENTOR system role.
 */
async function findApprovedMentor(
    client,
    mentorUserId
) {
    const result =
        await client.query(
            `
                SELECT
                    user_id,
                    email,
                    system_role,
                    status

                FROM users

                WHERE
                    user_id =
                        $1

                    AND system_role =
                        'MENTOR'

                    AND status =
                        'ACTIVE';
            `,
            [
                mentorUserId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Activate a pending Mentor assignment.
 */
async function approveAssignment(
    client,
    assignmentId
) {
    const result =
        await client.query(
            `
                UPDATE mentor_assignments

                SET
                    status =
                        'ACTIVE',

                    reviewed_at =
                        CURRENT_TIMESTAMP,

                    ended_at =
                        NULL

                WHERE
                    assignment_id =
                        $1

                    AND status =
                        'PENDING'

                RETURNING
                    assignment_id
                        AS "assignmentId",

                    project_id
                        AS "projectId",

                    mentor_user_id
                        AS "mentorUserId",

                    status,

                    requested_at
                        AS "requestedAt",

                    reviewed_at
                        AS "reviewedAt",

                    ended_at
                        AS "endedAt";
            `,
            [
                assignmentId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * End an ACTIVE Mentor assignment.
 */
async function endAssignment(
    client,
    assignmentId
) {
    const result =
        await client.query(
            `
                UPDATE mentor_assignments

                SET
                    status =
                        'ENDED',

                    ended_at =
                        CURRENT_TIMESTAMP

                WHERE
                    assignment_id =
                        $1

                    AND status =
                        'ACTIVE'

                RETURNING
                    assignment_id
                        AS "assignmentId",

                    project_id
                        AS "projectId",

                    mentor_user_id
                        AS "mentorUserId",

                    status,

                    requested_at
                        AS "requestedAt",

                    reviewed_at
                        AS "reviewedAt",

                    ended_at
                        AS "endedAt";
            `,
            [
                assignmentId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Find the Mentor's ACTIVE assignment for a project.
 */
async function findActiveAssignment(
    projectId,
    mentorUserId
) {
    const result =
        await pool.query(
            `
                SELECT
                    assignment_id,
                    project_id,
                    mentor_user_id,
                    status,
                    requested_at,
                    reviewed_at,
                    ended_at

                FROM mentor_assignments

                WHERE
                    project_id =
                        $1

                    AND mentor_user_id =
                        $2

                    AND status =
                        'ACTIVE'

                LIMIT 1;
            `,
            [
                projectId,
                mentorUserId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Check whether a user is an ACTIVE project member.
 *
 * This is used when project team members view Mentor guidance.
 */
async function findActiveProjectMembership(
    projectId,
    userId
) {
    const result =
        await pool.query(
            `
                SELECT
                    membership_id,
                    project_id,
                    user_id,
                    member_role,
                    active

                FROM project_memberships

                WHERE
                    project_id =
                        $1

                    AND user_id =
                        $2

                    AND active =
                        TRUE

                LIMIT 1;
            `,
            [
                projectId,
                userId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Store guidance against an ACTIVE MentorAssignment.
 */
async function createGuidance({
    assignmentId,
    guidance
}) {
    const result =
        await pool.query(
            `
                INSERT INTO mentor_guidance (
                    assignment_id,
                    guidance
                )
                VALUES (
                    $1,
                    $2
                )
                RETURNING
                    guidance_id
                        AS "guidanceId",

                    assignment_id
                        AS "assignmentId",

                    guidance,

                    created_at
                        AS "createdAt";
            `,
            [
                assignmentId,
                guidance
            ]
        );


    return result.rows[0];
}


/**
 * Find one guidance entry.
 *
 * The assignment data is included so the service can verify
 * ownership and that the Mentor relationship is still ACTIVE.
 */
async function findGuidanceById(
    guidanceId
) {
    const result =
        await pool.query(
            `
                SELECT
                    g.guidance_id
                        AS "guidanceId",

                    g.assignment_id
                        AS "assignmentId",

                    g.guidance,

                    g.created_at
                        AS "createdAt",

                    ma.project_id
                        AS "projectId",

                    ma.mentor_user_id
                        AS "mentorUserId",

                    ma.status
                        AS "assignmentStatus"

                FROM mentor_guidance g

                JOIN mentor_assignments ma
                    ON ma.assignment_id =
                        g.assignment_id

                WHERE
                    g.guidance_id =
                        $1;
            `,
            [
                guidanceId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Update an existing guidance entry.
 */
async function updateGuidance(
    guidanceId,
    guidance
) {
    const result =
        await pool.query(
            `
                UPDATE mentor_guidance

                SET
                    guidance =
                        $2

                WHERE
                    guidance_id =
                        $1

                RETURNING
                    guidance_id
                        AS "guidanceId",

                    assignment_id
                        AS "assignmentId",

                    guidance,

                    created_at
                        AS "createdAt";
            `,
            [
                guidanceId,
                guidance
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Return all Mentor guidance for a project, newest first.
 *
 * The project relationship is now obtained through
 * MentorAssignment rather than being duplicated directly
 * on mentor_guidance.
 *
 * The MentorAssignment status is included so the frontend can
 * expose edit controls only while the owning Mentor assignment
 * remains ACTIVE.
 */
async function getGuidanceForProject(
    projectId
) {
    const result =
        await pool.query(
            `
                SELECT
                    g.guidance_id
                        AS "guidanceId",

                    g.assignment_id
                        AS "assignmentId",

                    g.guidance,

                    g.created_at
                        AS "createdAt",

                    ma.project_id
                        AS "projectId",

                    ma.mentor_user_id
                        AS "mentorUserId",

                    ma.status
                        AS "assignmentStatus",

                    COALESCE(
                        p.display_name,
                        u.email
                    ) AS "mentorName"

                FROM mentor_guidance g

                JOIN mentor_assignments ma
                    ON ma.assignment_id =
                        g.assignment_id

                JOIN users u
                    ON u.user_id =
                        ma.mentor_user_id

                LEFT JOIN profiles p
                    ON p.user_id =
                        u.user_id

                WHERE
                    ma.project_id =
                        $1

                ORDER BY
                    g.created_at DESC;
            `,
            [
                projectId
            ]
        );


    return result.rows;
}


module.exports = {
    findProjectById,

    getEligibleProjectsForMentor,

    findCurrentAssignment,
    createMentorAssignment,
    getAssignmentsForProject,
    findAssignmentByIdForUpdate,
    findActiveLeadMembership,
    findApprovedMentor,
    approveAssignment,
    endAssignment,
    findActiveAssignment,

    findActiveProjectMembership,

    createGuidance,
    findGuidanceById,
    updateGuidance,
    getGuidanceForProject
};