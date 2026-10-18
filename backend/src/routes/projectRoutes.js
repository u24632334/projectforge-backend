/**
 * ProjectForge - Project Management & Discovery API Router
 *
 * Routes:
 * - GET /api/projects
 * - GET /api/projects/mine
 * - POST /api/projects
 * - GET /api/projects/:id/images
 * - POST /api/projects/:id/images
 * - DELETE /api/projects/:id/images/:imageId
 * - PATCH /api/projects/:id
 * - PATCH /api/projects/:id/complete
 * - GET /api/projects/:id
 * - GET /api/projects/:id/members
 */

const express =
    require("express");

const projectController =
    require(
        "../controllers/projectController"
    );

const projectMemberController =
    require(
        "../controllers/projectMemberController"
    );

const projectImageController =
    require(
        "../controllers/projectImageController"
    );

const authGuard =
    require(
        "../middleware/authGuard"
    );

const {
    projectImageUpload
} =
    require(
        "../middleware/projectImageUpload"
    );

const {
    BuildRequireProjectMembership,
    CreateMembershipLookup
} = require(
    "../middleware/requireProjectMembership"
);

const {
    pool
} = require(
    "../config/db"
);

const router =
    express.Router();

const findMembership =
    CreateMembershipLookup(
        pool
    );

const requireProjectMembership =
    BuildRequireProjectMembership(
        findMembership
    );

const requireProjectLead =
    BuildRequireProjectMembership(
        findMembership,
        {
            requireLead: true
        }
    );


/**
 * GET /api/projects
 *
 * Public project discovery endpoint.
 *
 * Supports optional:
 * - search
 * - category
 * - maxHours
 * - skill
 */
router.get(
    "/",
    projectController
        .getProjects
);


/**
 * GET /api/projects/mine
 *
 * Returns active projects where the authenticated user
 * has an active project membership.
 *
 * This must be declared before /:id so that "mine" is
 * not interpreted as a project identifier.
 */
router.get(
    "/mine",
    authGuard,
    projectController
        .getMyProjects
);


/**
 * POST /api/projects
 *
 * Create a new project.
 *
 * Authentication is required because the authenticated
 * user becomes the LEAD membership for the new project.
 */
router.post(
    "/",
    authGuard,
    projectController
        .createProject
);


/**
 * GET /api/projects/:id/members
 *
 * Returns active project members for authenticated
 * workspace functionality such as task assignment.
 */
router.get(
    "/:id/members",
    authGuard,
    requireProjectMembership,
    projectMemberController
        .getProjectMembers
);


/**
 * GET /api/projects/:id/images
 *
 * Returns the project's current Showcase image set.
 * Any active project member may view these images.
 */
router.get(
    "/:id/images",
    authGuard,
    requireProjectMembership,
    projectImageController
        .getProjectImages
);


/**
 * POST /api/projects/:id/images
 *
 * Allows an active project member to upload images.
 *
 * Up to five images may exist for a project.
 * Images become locked after Showcase submission.
 */
router.post(
    "/:id/images",
    authGuard,
    requireProjectMembership,
    projectImageUpload,
    projectImageController
        .uploadProjectImages
);


/**
 * DELETE /api/projects/:id/images/:imageId
 *
 * Allows an active project member to remove an image
 * before the project has been submitted for Showcase review.
 */
router.delete(
    "/:id/images/:imageId",
    authGuard,
    requireProjectMembership,
    projectImageController
        .deleteProjectImage
);


/**
 * PATCH /api/projects/:id
 *
 * Allows the active Project Lead to edit the
 * ACTIVE project listing.
 */
router.patch(
    "/:id",
    authGuard,
    requireProjectLead,
    projectController
        .updateProject
);


/**
 * PATCH /api/projects/:id/complete
 *
 * PF-SHOW-06:
 * Allows only the active Project Lead to mark an
 * ACTIVE project as COMPLETED.
 */
router.patch(
    "/:id/complete",
    authGuard,
    requireProjectLead,
    projectController
        .completeProject
);


/**
 * GET /api/projects/:id
 *
 * Public detailed project view.
 */
router.get(
    "/:id",
    projectController
        .getProjectById
);


module.exports =
    router;