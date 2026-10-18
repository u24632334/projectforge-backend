/**
 * DevelopmentUpdate
 * Domain model for project development updates .
 *
 * A development update is a short progress note written by a project
 * member. It belongs to the project through the author's membership,
 * and only its author may change its content.
 */

/**
 * Represents a project development update and its domain rules.
 */
const MAX_DEVELOPMENT_UPDATE_LENGTH =
    1000;


class DevelopmentUpdate {
    /**
     * Creates a development update and validates its required fields.
     *
     * @param {Object} data - Development update data.
     * @param {string|null} [data.updateId=null] - Existing update ID.
     * @param {string} data.projectId - Project the update belongs to.
     * @param {string} data.membershipId - Membership of the author.
     * @param {string} data.content - Text of the update.
     * @param {string|null} [data.createdAt=null] - Creation timestamp.
     * @param {string|null} [data.updatedAt=null] - Last edit timestamp.
     */
    constructor({
        updateId = null,
        projectId,
        membershipId,
        content,
        createdAt = null,
        updatedAt = null
    }) {
        if (!projectId) {
            throw new Error("Project ID is required.");
        }

        if (!membershipId) {
            throw new Error("Membership ID is required.");
        }

        if (!content || content.trim() === "") {
            throw new Error("Update content is required.");
        }

        if (
            content.length >
            MAX_DEVELOPMENT_UPDATE_LENGTH
        ) {
            throw new Error(
                `Maximum characters exceeded. Development update may not exceed ${MAX_DEVELOPMENT_UPDATE_LENGTH} characters.`
            );
        }

        this.updateId = updateId;
        this.projectId = projectId;
        this.membershipId = membershipId;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Determines whether the supplied membership may edit this update.
     *
     * Only the author may edit their own update. The Project Lead is
     * deliberately not granted an override, because an update is the
     * author's own account of their work.
     *
     * @param {string} membershipId - Membership attempting the edit.
     * @returns {boolean} True when the membership is the author.
     */
    CanBeEditedBy(membershipId) {
        if (!membershipId) {
            return false;
        }

        return membershipId === this.membershipId;
    }

    /**
     * Replaces the content of the update.
     *
     * The same content rules applied at construction are applied here,
     * so an update can never be edited into a state it could not have
     * been created in.
     *
     * @param {string} newContent - Replacement text.
     * @returns {boolean} True when the content was changed.
     */
    UpdateContent(newContent) {
        if (!newContent || newContent.trim() === "") {
            return false;
        }

        if (
            newContent.length >
            MAX_DEVELOPMENT_UPDATE_LENGTH
        ) {
            return false;
        }

        this.content = newContent;
        return true;
    }
}

module.exports = {
    DevelopmentUpdate,
    MAX_DEVELOPMENT_UPDATE_LENGTH
};