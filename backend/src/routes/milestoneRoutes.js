const express =
    require("express");

const milestoneController =
    require(
        "../controllers/milestoneController"
    );

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


const router =
    express.Router();


const findMembership =
    CreateMembershipLookup(
        pool
    );


const requireProjectMember =
    BuildRequireProjectMembership(
        findMembership
    );


const requireProjectLead =
    BuildRequireProjectMembership(
        findMembership,
        {
            requireLead:
                true
        }
    );


/**
 * Retrieves milestones for a project.
 *
 * Any authenticated active project member
 * may view them.
 */
router.get(
    "/projects/:projectId/milestones",

    authGuard,

    requireProjectMember,

    milestoneController
        .getMilestones
);


/**
 * Creates a milestone for a project.
 *
 * Only authenticated Project Leads may
 * create milestones.
 */
router.post(
    "/projects/:projectId/milestones",

    authGuard,

    requireProjectLead,

    milestoneController
        .createMilestone
);


/**
 * Marks an OPEN milestone as COMPLETE.
 *
 * Only authenticated Project Leads may
 * complete milestones.
 */
router.patch(
    "/projects/:projectId/milestones/:milestoneId/close",

    authGuard,

    requireProjectLead,

    milestoneController
        .closeMilestone
);


/**
 * Reopens a COMPLETE milestone.
 *
 * COMPLETE -> OPEN
 *
 * Only authenticated Project Leads may
 * reopen milestones.
 */
router.patch(
    "/projects/:projectId/milestones/:milestoneId/reopen",

    authGuard,

    requireProjectLead,

    milestoneController
        .reopenMilestone
);


module.exports =
    router;