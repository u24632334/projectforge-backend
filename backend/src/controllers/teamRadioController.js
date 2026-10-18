/**
 * Team Radio Controller
 *
 * Handles HTTP requests for project assistance
 * requests (PFG-54).
 */

const TeamRadioService =
    require("../services/TeamRadioService");

const TeamRadioRepository =
    require("../db/teamRadioRepository");

const { pool } =
    require("../config/db");


const teamRadioService =
    new TeamRadioService(
        new TeamRadioRepository(
            pool
        )
    );


/**
 * GET /api/projects/:projectId/assistance-requests
 *
 * Returns assistance requests belonging to
 * the requested project.
 */
async function getAssistanceRequests(
    req,
    res,
    next
) {
    try {
        const requests =
            await teamRadioService
                .GetRequestsByProject(
                    req.params.projectId
                );


        return res
            .status(200)
            .json({
                success: true,
                requests
            });
    } catch (error) {
        return next(
            error
        );
    }
}


/**
 * POST /api/projects/:projectId/assistance-requests
 *
 * Creates a new assistance request for the
 * authenticated project member.
 */
async function createAssistanceRequest(
    req,
    res,
    next
) {
    try {
        const body =
            req.body ||
            {};


        const request =
            await teamRadioService
                .CreateRequest({
                    projectId:
                        req.params
                            .projectId,

                    membershipId:
                        req.membership
                            .membershipId,

                    category:
                        body.category,

                    message:
                        body.message,

                    status:
                        "OPEN"
                });


        if (!request) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Assistance request could not be created."
                });
        }


        return res
            .status(201)
            .json({
                success: true,
                request
            });
    } catch (error) {
        return next(
            error
        );
    }
}


/**
 * PATCH
 * /api/projects/:projectId/assistance-requests/:requestId/resolve
 *
 * Changes an OPEN Team Radio request to RESOLVED.
 *
 * Authentication and active project-membership
 * authorisation are enforced by the route middleware.
 *
 * The service is responsible for rejecting:
 * - missing requests;
 * - requests belonging to another project; and
 * - requests that are already RESOLVED.
 */
async function resolveAssistanceRequest(
    req,
    res,
    next
) {
    try {
        const request =
            await teamRadioService
                .ResolveRequest({
                    projectId:
                        req.params
                            .projectId,

                    requestId:
                        req.params
                            .requestId
                });


        return res
            .status(200)
            .json({
                success: true,
                request
            });
    } catch (error) {
        return next(
            error
        );
    }
}


/**
 * PATCH
 * /api/projects/:projectId/assistance-requests/:requestId/reopen
 *
 * Changes a RESOLVED Team Radio request back to OPEN.
 *
 * Authentication and active project-membership
 * authorisation are enforced by the route middleware.
 *
 * The service is responsible for rejecting:
 * - missing requests;
 * - requests belonging to another project; and
 * - requests that are already OPEN.
 */
async function reopenAssistanceRequest(
    req,
    res,
    next
) {
    try {
        const request =
            await teamRadioService
                .ReopenRequest({
                    projectId:
                        req.params
                            .projectId,

                    requestId:
                        req.params
                            .requestId
                });


        return res
            .status(200)
            .json({
                success: true,
                request
            });
    } catch (error) {
        return next(
            error
        );
    }
}


module.exports = {
    getAssistanceRequests,
    createAssistanceRequest,
    resolveAssistanceRequest,
    reopenAssistanceRequest
};