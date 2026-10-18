/**
 * MilestoneController
 *
 * Handles REST requests for retrieving, creating,
 * completing and reopening project milestones.
 */

const MilestoneService =
    require(
        "../services/MilestoneService"
    );

const {
    pool
} = require(
    "../config/db"
);


const MilestoneRepository =
    require(
        "../db/milestoneRepository"
    );


const milestoneService =
    new MilestoneService(
        new MilestoneRepository(
            pool
        )
    );


/**
 * GET /api/projects/:projectId/milestones
 *
 * Retrieves all milestones belonging to a project.
 *
 * The route middleware confirms that the authenticated
 * user is an active member of the requested project
 * before this controller is reached.
 */
async function getMilestones(
    req,
    res,
    next
) {
    try {
        const milestones =
            await milestoneService
                .GetMilestonesByProject(
                    req.params
                        .projectId
                );


        return res
            .status(200)
            .json({
                success:
                    true,

                milestones
            });
    } catch (
        error
    ) {
        return next(
            error
        );
    }
}


/**
 * POST /api/projects/:projectId/milestones
 *
 * Creates a new milestone for the authorised project.
 */
async function createMilestone(
    req,
    res,
    next
) {
    try {
        const body =
            req.body ||
            {};


        const milestone =
            await milestoneService
                .CreateMilestone({
                    projectId:
                        req.params
                            .projectId,

                    title:
                        body.title,

                    description:
                        body.description,

                    dueDate:
                        body.dueDate
                });


        return res
            .status(201)
            .json({
                success:
                    true,

                milestone
            });
    } catch (
        error
    ) {
        return next(
            error
        );
    }
}


/**
 * PATCH
 * /api/projects/:projectId/milestones/:milestoneId/close
 *
 * Marks an OPEN milestone as COMPLETE.
 *
 * The service also verifies that the milestone belongs
 * to the project authorised by the route.
 */
async function closeMilestone(
    req,
    res,
    next
) {
    try {
        const milestone =
            await milestoneService
                .MarkMilestoneComplete(
                    req.params
                        .milestoneId,

                    req.params
                        .projectId
                );


        if (
            milestone ===
            null
        ) {
            return res
                .status(404)
                .json({
                    success:
                        false,

                    message:
                        "Milestone not found"
                });
        }


        if (
            milestone ===
            false
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Milestone cannot be closed"
                });
        }


        return res
            .status(200)
            .json({
                success:
                    true,

                milestone
            });
    } catch (
        error
    ) {
        return next(
            error
        );
    }
}


/**
 * PATCH
 * /api/projects/:projectId/milestones/:milestoneId/reopen
 *
 * Reopens a COMPLETE milestone.
 *
 * COMPLETE -> OPEN
 *
 * Reopening an already OPEN milestone is rejected by the
 * Milestone domain model.
 *
 * The service also verifies that the milestone belongs
 * to the project authorised by the route.
 */
async function reopenMilestone(
    req,
    res,
    next
) {
    try {
        const milestone =
            await milestoneService
                .ReopenMilestone(
                    req.params
                        .milestoneId,

                    req.params
                        .projectId
                );


        if (
            milestone ===
            null
        ) {
            return res
                .status(404)
                .json({
                    success:
                        false,

                    message:
                        "Milestone not found"
                });
        }


        if (
            milestone ===
            false
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Milestone cannot be reopened"
                });
        }


        return res
            .status(200)
            .json({
                success:
                    true,

                milestone
            });
    } catch (
        error
    ) {
        return next(
            error
        );
    }
}


module.exports = {
    getMilestones,
    createMilestone,
    closeMilestone,
    reopenMilestone
};