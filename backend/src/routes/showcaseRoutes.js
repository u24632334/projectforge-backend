const express =
    require(
        "express"
    );

const showcaseController =
    require(
        "../controllers/showcaseController"
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
 * GET /api/showcase
 *
 * Public approved showcase.
 */
router.get(
    "/showcase",
    showcaseController
        .getPublicShowcase
);


/**
 * POST /api/showcase
 *
 * Project Lead submits a completed project
 * for administrator approval.
 */
router.post(
    "/showcase",
    authGuard,
    showcaseController
        .createShowcaseSubmission
);


/**
 * GET /api/showcase/submission/:projectId
 *
 * Allows the authenticated Project Lead to
 * check their submission status.
 */
router.get(
    "/showcase/submission/:projectId",
    authGuard,
    showcaseController
        .getShowcaseSubmissionStatus
);


/**
 * GET /api/showcase/admin/pending
 *
 * Administrator-only list of submissions
 * awaiting approval.
 */
router.get(
    "/showcase/admin/pending",
    authGuard,
    requireAdmin,
    showcaseController
        .getPendingShowcaseSubmissions
);


/**
 * PATCH /api/showcase/admin/:showcaseId/approve
 *
 * Administrator approves a pending showcase
 * submission for public display.
 */
router.patch(
    "/showcase/admin/:showcaseId/approve",
    authGuard,
    requireAdmin,
    showcaseController
        .approveShowcaseSubmission
);


module.exports =
    router;