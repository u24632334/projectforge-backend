/**
 * Team Radio Routes
 *
 * REST endpoints for project assistance
 * requests (PFG-54).
 */

const express =
    require("express");


const router =
    express.Router();


const authGuard =
    require(
        "../middleware/authGuard"
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


const teamRadioController =
    require(
        "../controllers/teamRadioController"
    );


const findMembership =
    CreateMembershipLookup(
        pool
    );


const requireProjectMembership =
    BuildRequireProjectMembership(
        findMembership
    );


/**
 * Get all assistance requests belonging
 * to a project.
 */
router.get(
    "/projects/:projectId/assistance-requests",

    authGuard,

    requireProjectMembership,

    teamRadioController
        .getAssistanceRequests
);


/**
 * Create a new assistance request.
 */
router.post(
    "/projects/:projectId/assistance-requests",

    authGuard,

    requireProjectMembership,

    teamRadioController
        .createAssistanceRequest
);


/**
 * Resolve an OPEN assistance request.
 *
 * OPEN -> RESOLVED
 */
router.patch(
    "/projects/:projectId/assistance-requests/:requestId/resolve",

    authGuard,

    requireProjectMembership,

    teamRadioController
        .resolveAssistanceRequest
);


/**
 * Reopen a RESOLVED assistance request.
 *
 * RESOLVED -> OPEN
 */
router.patch(
    "/projects/:projectId/assistance-requests/:requestId/reopen",

    authGuard,

    requireProjectMembership,

    teamRadioController
        .reopenAssistanceRequest
);


module.exports =
    router;