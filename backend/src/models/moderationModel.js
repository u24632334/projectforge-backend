/**
 * Database functions used by administrator moderation actions.
 *
 * These functions accept a PostgreSQL client rather than using
 * the global pool directly. This allows the service layer to run
 * moderation actions and audit-log creation inside the same
 * database transaction.
 */


/**
 * Find a user by ID.
 */
async function getUserById(
    client,
    userId
) {
    const query = `
        SELECT
            user_id,
            email,
            system_role,
            status
        FROM users
        WHERE user_id = $1;
    `;


    const result =
        await client.query(
            query,
            [
                userId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Suspend a user account.
 */
async function suspendUser(
    client,
    userId
) {
    const query = `
        UPDATE users
        SET status = 'SUSPENDED'
        WHERE user_id = $1
        RETURNING
            user_id,
            email,
            system_role,
            status;
    `;


    const result =
        await client.query(
            query,
            [
                userId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Find a project by ID.
 */
async function getProjectById(
    client,
    projectId
) {
    const query = `
        SELECT
            project_id,
            title,
            description,
            category,
            status
        FROM projects
        WHERE project_id = $1;
    `;


    const result =
        await client.query(
            query,
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
 * Disable public project content without permanently deleting it.
 *
 * ARCHIVED is used as the soft-removal state so that related
 * database records are preserved.
 */
async function archiveProject(
    client,
    projectId
) {
    const query = `
        UPDATE projects
        SET status = 'ARCHIVED'
        WHERE project_id = $1
        RETURNING
            project_id,
            title,
            description,
            category,
            status;
    `;


    const result =
        await client.query(
            query,
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
 * Return all pending Mentor account applications.
 *
 * The profile join gives the administrator a useful display name
 * without exposing private profile information.
 */
async function getPendingMentorApplications(
    client
) {
    const query = `
        SELECT
            ma.application_id,
            ma.user_id,
            ma.status,
            ma.requested_at,
            u.email,
            u.system_role,
            u.status
                AS account_status,
            p.display_name
        FROM mentor_applications ma
        JOIN users u
            ON u.user_id =
                ma.user_id
        LEFT JOIN profiles p
            ON p.user_id =
                u.user_id
        WHERE ma.status =
            'PENDING'
        ORDER BY
            ma.requested_at ASC;
    `;


    const result =
        await client.query(
            query
        );


    return result.rows;
}


/**
 * Find one Mentor application and lock it for the duration
 * of the current transaction.
 *
 * The lock prevents two administrators from approving or
 * rejecting the same request simultaneously.
 */
async function getMentorApplicationByIdForUpdate(
    client,
    applicationId
) {
    const query = `
        SELECT
            ma.application_id,
            ma.user_id,
            ma.status,
            ma.requested_at,
            ma.reviewed_at,
            ma.reviewed_by_admin_user_id,
            u.email,
            u.system_role,
            u.status
                AS account_status
        FROM mentor_applications ma
        JOIN users u
            ON u.user_id =
                ma.user_id
        WHERE ma.application_id =
            $1
        FOR UPDATE OF ma;
    `;


    const result =
        await client.query(
            query,
            [
                applicationId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Grant the approved Mentor system role.
 *
 * Only STUDENT accounts are upgraded through the Mentor
 * application workflow. This prevents an administrator account
 * from accidentally being changed into a Mentor account.
 */
async function grantMentorRole(
    client,
    userId
) {
    const query = `
        UPDATE users
        SET system_role =
            'MENTOR'
        WHERE
            user_id = $1
            AND system_role =
                'STUDENT'
            AND status =
                'ACTIVE'
        RETURNING
            user_id,
            email,
            system_role,
            status;
    `;


    const result =
        await client.query(
            query,
            [
                userId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Mark a Mentor account application as approved.
 */
async function approveMentorApplication(
    client,
    applicationId,
    adminUserId
) {
    const query = `
        UPDATE mentor_applications
        SET
            status =
                'APPROVED',
            reviewed_at =
                CURRENT_TIMESTAMP,
            reviewed_by_admin_user_id =
                $2
        WHERE
            application_id =
                $1
            AND status =
                'PENDING'
        RETURNING
            application_id,
            user_id,
            status,
            requested_at,
            reviewed_at,
            reviewed_by_admin_user_id;
    `;


    const result =
        await client.query(
            query,
            [
                applicationId,
                adminUserId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Mark a Mentor account application as rejected.
 */
async function rejectMentorApplication(
    client,
    applicationId,
    adminUserId
) {
    const query = `
        UPDATE mentor_applications
        SET
            status =
                'REJECTED',
            reviewed_at =
                CURRENT_TIMESTAMP,
            reviewed_by_admin_user_id =
                $2
        WHERE
            application_id =
                $1
            AND status =
                'PENDING'
        RETURNING
            application_id,
            user_id,
            status,
            requested_at,
            reviewed_at,
            reviewed_by_admin_user_id;
    `;


    const result =
        await client.query(
            query,
            [
                applicationId,
                adminUserId
            ]
        );


    return (
        result.rows[0] ||
        null
    );
}


/**
 * Create an immutable moderation audit entry.
 */
async function createAuditLog(
    client,
    {
        adminUserId,
        actionType,
        targetType,
        targetId,
        details = {}
    }
) {
    const query = `
        INSERT INTO audit_logs (
            admin_user_id,
            action_type,
            target_type,
            target_id,
            details
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
        )
        RETURNING *;
    `;


    const values = [
        adminUserId,
        actionType,
        targetType,
        targetId,
        details
    ];


    const result =
        await client.query(
            query,
            values
        );


    return result.rows[0];
}


module.exports = {
    getUserById,
    suspendUser,
    getProjectById,
    archiveProject,

    getPendingMentorApplications,
    getMentorApplicationByIdForUpdate,
    grantMentorRole,
    approveMentorApplication,
    rejectMentorApplication,

    createAuditLog
};