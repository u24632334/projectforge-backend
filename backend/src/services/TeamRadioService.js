/**
 * Team Radio Service
 *
 * Business logic for project assistance requests (PFG-54).
 */

const {
    TeamRadioRequest,
    RADIO_STATUS
} = require(
    "../models/TeamRadioRequest"
);


/**
 * Creates an application error that can be handled
 * by the global Express error middleware.
 */
function createError(
    message,
    statusCode
) {
    const error =
        new Error(
            message
        );

    error.statusCode =
        statusCode;

    return error;
}


/**
 * Ensures a required identifier is present.
 *
 * The project currently uses simple IDs in several unit
 * tests, so this intentionally checks presence rather
 * than enforcing UUID format here.
 */
function requireIdentifier(
    value,
    message
) {
    if (
        typeof value !==
            "string" ||
        value.trim() ===
            ""
    ) {
        throw createError(
            message,
            400
        );
    }

    return value.trim();
}


class TeamRadioService {

    constructor(
        teamRadioRepository
    ) {
        this.teamRadioRepository =
            teamRadioRepository;
    }


    /**
     * Creates a new assistance request.
     */
    async CreateRequest(
        data
    ) {
        const request =
            new TeamRadioRequest(
                data
            );


        const createdRequest =
            await this
                .teamRadioRepository
                .create(
                    request
                );


        if (
            !createdRequest
        ) {
            return null;
        }


        return createdRequest;
    }


    /**
     * Retrieves all assistance requests
     * belonging to a project.
     */
    async GetRequestsByProject(
        projectId
    ) {
        return this
            .teamRadioRepository
            .findByProject(
                projectId
            );
    }


    /**
     * Resolves an OPEN Team Radio request.
     *
     * OPEN -> RESOLVED
     *
     * The repository transition is conditional on the
     * request still being OPEN. This prevents two
     * simultaneous resolve requests from both succeeding.
     */
    async ResolveRequest({
        projectId,
        requestId
    }) {
        const cleanProjectId =
            requireIdentifier(
                projectId,
                "Project ID is required."
            );


        const cleanRequestId =
            requireIdentifier(
                requestId,
                "Assistance request ID is required."
            );


        const updatedRequest =
            await this
                .teamRadioRepository
                .transitionStatus({
                    projectId:
                        cleanProjectId,

                    requestId:
                        cleanRequestId,

                    fromStatus:
                        RADIO_STATUS
                            .OPEN,

                    toStatus:
                        RADIO_STATUS
                            .RESOLVED
                });


        if (
            updatedRequest
        ) {
            return updatedRequest;
        }


        /*
         * A failed conditional UPDATE can mean either:
         *
         * - the request does not exist / belongs to
         *   another project; or
         * - its status has already changed.
         *
         * Read it only after the failed transition so we
         * can return the correct application error.
         */
        const existingRequest =
            await this
                .teamRadioRepository
                .findById(
                    cleanProjectId,
                    cleanRequestId
                );


        if (
            !existingRequest
        ) {
            throw createError(
                "Assistance request not found.",
                404
            );
        }


        const currentStatus =
            String(
                existingRequest
                    .status ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            currentStatus ===
            RADIO_STATUS.RESOLVED
        ) {
            throw createError(
                "Assistance request is already resolved.",
                409
            );
        }


        throw createError(
            "Assistance request cannot be resolved from its current status.",
            409
        );
    }


    /**
     * Reopens a RESOLVED Team Radio request.
     *
     * RESOLVED -> OPEN
     *
     * The repository transition is conditional on the
     * request still being RESOLVED so repeated or
     * concurrent reopen operations cannot both succeed.
     */
    async ReopenRequest({
        projectId,
        requestId
    }) {
        const cleanProjectId =
            requireIdentifier(
                projectId,
                "Project ID is required."
            );


        const cleanRequestId =
            requireIdentifier(
                requestId,
                "Assistance request ID is required."
            );


        const updatedRequest =
            await this
                .teamRadioRepository
                .transitionStatus({
                    projectId:
                        cleanProjectId,

                    requestId:
                        cleanRequestId,

                    fromStatus:
                        RADIO_STATUS
                            .RESOLVED,

                    toStatus:
                        RADIO_STATUS
                            .OPEN
                });


        if (
            updatedRequest
        ) {
            return updatedRequest;
        }


        const existingRequest =
            await this
                .teamRadioRepository
                .findById(
                    cleanProjectId,
                    cleanRequestId
                );


        if (
            !existingRequest
        ) {
            throw createError(
                "Assistance request not found.",
                404
            );
        }


        const currentStatus =
            String(
                existingRequest
                    .status ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            currentStatus ===
            RADIO_STATUS.OPEN
        ) {
            throw createError(
                "Assistance request is already open.",
                409
            );
        }


        throw createError(
            "Assistance request cannot be reopened from its current status.",
            409
        );
    }

}


module.exports =
    TeamRadioService;