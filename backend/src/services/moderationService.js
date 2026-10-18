const {
    pool
} = require("../config/db");

const moderationModel =
    require("../models/moderationModel");


/**
 * Creates an Error object compatible with the
 * project's global error handler.
 */
function createError(
    message,
    statusCode
) {
    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return error;
}


/**
 * Suspend a user account and record the action
 * in the moderation audit log.
 */
async function suspendUser(
    adminUserId,
    userId,
    reason = null
) {
    if (!adminUserId) {
        throw createError(
            "Administrator user ID is required.",
            400
        );
    }


    if (!userId) {
        throw createError(
            "Target user ID is required.",
            400
        );
    }


    /*
     * Prevent an administrator from accidentally
     * suspending their own account.
     */
    if (
        adminUserId ===
        userId
    ) {
        throw createError(
            "Administrators cannot suspend their own account.",
            400
        );
    }


    const client =
        await pool.connect();


    try {
        await client.query(
            "BEGIN"
        );


        const user =
            await moderationModel
                .getUserById(
                    client,
                    userId
                );


        if (!user) {
            throw createError(
                "User not found.",
                404
            );
        }


        if (
            user.status ===
            "SUSPENDED"
        ) {
            throw createError(
                "User is already suspended.",
                409
            );
        }


        const suspendedUser =
            await moderationModel
                .suspendUser(
                    client,
                    userId
                );


        const auditLog =
            await moderationModel
                .createAuditLog(
                    client,
                    {
                        adminUserId,

                        actionType:
                            "USER_SUSPENDED",

                        targetType:
                            "USER",

                        targetId:
                            userId,

                        details: {
                            previousStatus:
                                user.status,

                            reason:
                                reason ||
                                null
                        }
                    }
                );


        await client.query(
            "COMMIT"
        );


        return {
            user:
                suspendedUser,

            auditLog
        };
    }
    catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    }
    finally {
        client.release();
    }
}


/**
 * Remove public project content by archiving the project,
 * then record the moderation action in the audit log.
 *
 * The project is not physically deleted because related
 * tasks, memberships, applications and other records
 * should remain intact.
 */
async function removeProjectContent(
    adminUserId,
    projectId,
    reason = null
) {
    if (!adminUserId) {
        throw createError(
            "Administrator user ID is required.",
            400
        );
    }


    if (!projectId) {
        throw createError(
            "Project ID is required.",
            400
        );
    }


    const client =
        await pool.connect();


    try {
        await client.query(
            "BEGIN"
        );


        const project =
            await moderationModel
                .getProjectById(
                    client,
                    projectId
                );


        if (!project) {
            throw createError(
                "Project not found.",
                404
            );
        }


        if (
            project.status ===
            "ARCHIVED"
        ) {
            throw createError(
                "Project content is already removed.",
                409
            );
        }


        const archivedProject =
            await moderationModel
                .archiveProject(
                    client,
                    projectId
                );


        const auditLog =
            await moderationModel
                .createAuditLog(
                    client,
                    {
                        adminUserId,

                        actionType:
                            "CONTENT_REMOVED",

                        targetType:
                            "PROJECT",

                        targetId:
                            projectId,

                        details: {
                            previousStatus:
                                project.status,

                            reason:
                                reason ||
                                null
                        }
                    }
                );


        await client.query(
            "COMMIT"
        );


        return {
            project:
                archivedProject,

            auditLog
        };
    }
    catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    }
    finally {
        client.release();
    }
}


/**
 * Return all pending Mentor-account applications
 * for the administrator dashboard.
 */
async function getPendingMentorApplications() {
    const client =
        await pool.connect();


    try {
        return await moderationModel
            .getPendingMentorApplications(
                client
            );
    }
    finally {
        client.release();
    }
}


/**
 * Approve a pending Mentor-account application.
 *
 * Approval performs three operations in one transaction:
 *
 * 1. Confirm the application is still pending.
 * 2. Upgrade the ACTIVE STUDENT account to MENTOR.
 * 3. Record the administrator action in the audit log.
 */
async function approveMentorApplication(
    adminUserId,
    applicationId
) {
    if (!adminUserId) {
        throw createError(
            "Administrator user ID is required.",
            400
        );
    }


    if (!applicationId) {
        throw createError(
            "Mentor application ID is required.",
            400
        );
    }


    const client =
        await pool.connect();


    try {
        await client.query(
            "BEGIN"
        );


        /*
         * FOR UPDATE prevents two administrators from
         * reviewing the same request at the same time.
         */
        const application =
            await moderationModel
                .getMentorApplicationByIdForUpdate(
                    client,
                    applicationId
                );


        if (!application) {
            throw createError(
                "Mentor application not found.",
                404
            );
        }


        if (
            application.status !==
            "PENDING"
        ) {
            throw createError(
                "This Mentor application has already been reviewed.",
                409
            );
        }


        if (
            application.account_status !==
            "ACTIVE"
        ) {
            throw createError(
                "Only active user accounts can be approved for Mentor access.",
                409
            );
        }


        if (
            application.system_role !==
            "STUDENT"
        ) {
            throw createError(
                application.system_role ===
                    "MENTOR"
                    ? "This user already has Mentor access."
                    : "Only Student accounts can be approved through the Mentor application workflow.",
                409
            );
        }


        const approvedUser =
            await moderationModel
                .grantMentorRole(
                    client,
                    application.user_id
                );


        if (!approvedUser) {
            throw createError(
                "Mentor access could not be granted because the account is no longer eligible.",
                409
            );
        }


        const approvedApplication =
            await moderationModel
                .approveMentorApplication(
                    client,
                    applicationId,
                    adminUserId
                );


        if (!approvedApplication) {
            throw createError(
                "This Mentor application has already been reviewed.",
                409
            );
        }


        const auditLog =
            await moderationModel
                .createAuditLog(
                    client,
                    {
                        adminUserId,

                        actionType:
                            "MENTOR_APPROVED",

                        targetType:
                            "USER",

                        targetId:
                            application.user_id,

                        details: {
                            applicationId:
                                application.application_id,

                            previousRole:
                                application.system_role,

                            newRole:
                                "MENTOR"
                        }
                    }
                );


        await client.query(
            "COMMIT"
        );


        return {
            application:
                approvedApplication,

            user:
                approvedUser,

            auditLog
        };
    }
    catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    }
    finally {
        client.release();
    }
}


/**
 * Reject a pending Mentor-account application.
 *
 * Rejection leaves the user as a Student and records
 * the administrator decision in the audit log.
 */
async function rejectMentorApplication(
    adminUserId,
    applicationId
) {
    if (!adminUserId) {
        throw createError(
            "Administrator user ID is required.",
            400
        );
    }


    if (!applicationId) {
        throw createError(
            "Mentor application ID is required.",
            400
        );
    }


    const client =
        await pool.connect();


    try {
        await client.query(
            "BEGIN"
        );


        const application =
            await moderationModel
                .getMentorApplicationByIdForUpdate(
                    client,
                    applicationId
                );


        if (!application) {
            throw createError(
                "Mentor application not found.",
                404
            );
        }


        if (
            application.status !==
            "PENDING"
        ) {
            throw createError(
                "This Mentor application has already been reviewed.",
                409
            );
        }


        /*
         * A pending request should normally belong to
         * a Student. If the user already became a Mentor
         * through another action, do not silently reject
         * an inconsistent request.
         */
        if (
            application.system_role ===
            "MENTOR"
        ) {
            throw createError(
                "This user already has Mentor access.",
                409
            );
        }


        if (
            application.system_role !==
            "STUDENT"
        ) {
            throw createError(
                "This account is not eligible for the Mentor application workflow.",
                409
            );
        }


        const rejectedApplication =
            await moderationModel
                .rejectMentorApplication(
                    client,
                    applicationId,
                    adminUserId
                );


        if (!rejectedApplication) {
            throw createError(
                "This Mentor application has already been reviewed.",
                409
            );
        }


        const auditLog =
            await moderationModel
                .createAuditLog(
                    client,
                    {
                        adminUserId,

                        actionType:
                            "MENTOR_REJECTED",

                        targetType:
                            "USER",

                        targetId:
                            application.user_id,

                        details: {
                            applicationId:
                                application.application_id,

                            roleRetained:
                                application.system_role
                        }
                    }
                );


        await client.query(
            "COMMIT"
        );


        return {
            application:
                rejectedApplication,

            auditLog
        };
    }
    catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    }
    finally {
        client.release();
    }
}


module.exports = {
    suspendUser,
    removeProjectContent,
    getPendingMentorApplications,
    approveMentorApplication,
    rejectMentorApplication
};