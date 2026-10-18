/**
 * TeamRadioRequest
 * Domain model for project assistance requests (PFG-54).
 *
 * An assistance request is created by a project member and
 * records the type of assistance required.
 */


/**
 * Defines the valid states for a Team Radio request.
 */
const RADIO_STATUS = {
    OPEN:
        "OPEN",

    RESOLVED:
        "RESOLVED"
};


/**
 * Defines the valid categories for assistance requests.
 */
const RADIO_CATEGORY = {
    TECHNICAL:
        "TECHNICAL",

    DEPENDENCY:
        "DEPENDENCY",

    RESOURCE:
        "RESOURCE",

    COMMUNICATION:
        "COMMUNICATION",

    OTHER:
        "OTHER"
};


const MAX_TEAM_RADIO_MESSAGE_LENGTH =
    1000;


/**
 * Represents a project assistance request and validates
 * its required domain properties.
 */
class TeamRadioRequest {

    /**
     * Creates a Team Radio assistance request.
     *
     * @param {Object} data - Request data.
     * @param {string|null} [data.requestId=null] - Existing request ID.
     * @param {string} data.projectId - Project the request belongs to.
     * @param {string} data.membershipId - Membership of the requesting project member.
     * @param {string} data.category - Assistance request category.
     * @param {string} data.message - Description of the assistance required.
     * @param {string} [data.status=OPEN] - Request status.
     */
    constructor({
        requestId = null,
        projectId,
        membershipId,
        category,
        message,
        status =
            RADIO_STATUS.OPEN
    }) {

        if (
            typeof projectId !==
                "string" ||
            !projectId.trim()
        ) {
            throw new Error(
                "Project ID is required."
            );
        }


        if (
            typeof membershipId !==
                "string" ||
            !membershipId.trim()
        ) {
            throw new Error(
                "Membership ID is required."
            );
        }


        if (
            !Object.values(
                RADIO_CATEGORY
            ).includes(
                category
            )
        ) {
            throw new Error(
                "Invalid assistance request category."
            );
        }


        if (
            typeof message !==
                "string" ||
            !message.trim()
        ) {
            throw new Error(
                "Assistance request message is required."
            );
        }


        if (
            message.length >
            MAX_TEAM_RADIO_MESSAGE_LENGTH
        ) {
            throw new Error(
                `Maximum characters exceeded. Assistance request message may not exceed ${MAX_TEAM_RADIO_MESSAGE_LENGTH} characters.`
            );
        }


        if (
            !Object.values(
                RADIO_STATUS
            ).includes(
                status
            )
        ) {
            throw new Error(
                "Invalid radio request status."
            );
        }


        this.requestId =
            requestId;

        this.projectId =
            projectId;

        this.membershipId =
            membershipId;

        this.category =
            category;

        this.message =
            message.trim();

        this.status =
            status;
    }
}


module.exports = {
    TeamRadioRequest,
    RADIO_STATUS,
    RADIO_CATEGORY,
    MAX_TEAM_RADIO_MESSAGE_LENGTH
};