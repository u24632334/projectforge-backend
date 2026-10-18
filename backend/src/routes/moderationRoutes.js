const express =
    require("express");

const moderationController =
    require(
        "../controllers/moderationController"
    );

const authGuard =
    require(
        "../middleware/authGuard"
    );

const requireAdmin =
    require(
        "../middleware/requireAdmin"
    );


const router =
    express.Router();


/**
 * GET /api/admin/mentor-applications
 *
 * Returns pending Mentor-account applications.
 *
 * Only authenticated administrators may use this route.
 */
router.get(
    "/admin/mentor-applications",
    authGuard,
    requireAdmin,
    moderationController
        .getPendingMentorApplications
);


/**
 * PATCH /api/admin/mentor-applications/:id/approve
 *
 * Approves a pending Mentor application and grants
 * the applicant the MENTOR system role.
 *
 * Only authenticated administrators may use this route.
 */
router.patch(
    "/admin/mentor-applications/:id/approve",
    authGuard,
    requireAdmin,
    moderationController
        .approveMentorApplication
);


/**
 * PATCH /api/admin/mentor-applications/:id/reject
 *
 * Rejects a pending Mentor application.
 *
 * The applicant remains an active Student account.
 *
 * Only authenticated administrators may use this route.
 */
router.patch(
    "/admin/mentor-applications/:id/reject",
    authGuard,
    requireAdmin,
    moderationController
        .rejectMentorApplication
);


/**
 * PATCH /api/admin/users/:id/suspend
 *
 * Suspend a user account.
 *
 * Only authenticated administrators may use this route.
 */
router.patch(
    "/admin/users/:id/suspend",
    authGuard,
    requireAdmin,
    moderationController
        .suspendUser
);


/**
 * PATCH /api/admin/projects/:id/remove
 *
 * Remove public project content by archiving it.
 *
 * Only authenticated administrators may use this route.
 */
router.patch(
    "/admin/projects/:id/remove",
    authGuard,
    requireAdmin,
    moderationController
        .removeProjectContent
);


module.exports =
    router;