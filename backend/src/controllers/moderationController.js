const moderationService =
    require(
        "../services/moderationService"
    );


/**
 * PATCH /api/admin/users/:id/suspend
 *
 * Suspends a user account.
 * The administrator identity comes from the JWT.
 */
async function suspendUser(
    req,
    res,
    next
) {
    try {
        const adminUserId =
            req.user.id;

        const userId =
            req.params.id;

        const {
            reason
        } =
            req.body || {};


        const result =
            await moderationService
                .suspendUser(
                    adminUserId,
                    userId,
                    reason
                );


        return res
            .status(200)
            .json({
                message:
                    "User suspended successfully.",

                user:
                    result.user,

                auditLog:
                    result.auditLog
            });
    }
    catch (error) {
        next(error);
    }
}


/**
 * PATCH /api/admin/projects/:id/remove
 *
 * Removes public project content by archiving it.
 * The administrator identity comes from the JWT.
 */
async function removeProjectContent(
    req,
    res,
    next
) {
    try {
        const adminUserId =
            req.user.id;

        const projectId =
            req.params.id;

        const {
            reason
        } =
            req.body || {};


        const result =
            await moderationService
                .removeProjectContent(
                    adminUserId,
                    projectId,
                    reason
                );


        return res
            .status(200)
            .json({
                message:
                    "Project content removed successfully.",

                project:
                    result.project,

                auditLog:
                    result.auditLog
            });
    }
    catch (error) {
        next(error);
    }
}


/**
 * GET /api/admin/mentor-applications
 *
 * Returns all pending Mentor-account applications.
 *
 * Access is restricted to administrators by the route.
 */
async function getPendingMentorApplications(
    req,
    res,
    next
) {
    try {
        const applications =
            await moderationService
                .getPendingMentorApplications();


        return res
            .status(200)
            .json({
                applications
            });
    }
    catch (error) {
        next(error);
    }
}


/**
 * PATCH /api/admin/mentor-applications/:id/approve
 *
 * Grants approved Mentor privileges to the applicant
 * and records the administrator decision.
 */
async function approveMentorApplication(
    req,
    res,
    next
) {
    try {
        const adminUserId =
            req.user.id;

        const applicationId =
            req.params.id;


        const result =
            await moderationService
                .approveMentorApplication(
                    adminUserId,
                    applicationId
                );


        return res
            .status(200)
            .json({
                message:
                    "Mentor application approved successfully.",

                application:
                    result.application,

                user:
                    result.user,

                auditLog:
                    result.auditLog
            });
    }
    catch (error) {
        next(error);
    }
}


/**
 * PATCH /api/admin/mentor-applications/:id/reject
 *
 * Rejects the Mentor request while leaving the user's
 * Student account active.
 */
async function rejectMentorApplication(
    req,
    res,
    next
) {
    try {
        const adminUserId =
            req.user.id;

        const applicationId =
            req.params.id;


        const result =
            await moderationService
                .rejectMentorApplication(
                    adminUserId,
                    applicationId
                );


        return res
            .status(200)
            .json({
                message:
                    "Mentor application rejected successfully.",

                application:
                    result.application,

                auditLog:
                    result.auditLog
            });
    }
    catch (error) {
        next(error);
    }
}


module.exports = {
    suspendUser,
    removeProjectContent,
    getPendingMentorApplications,
    approveMentorApplication,
    rejectMentorApplication
};