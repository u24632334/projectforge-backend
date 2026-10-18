/**
 * DevelopmentUpdateService
 * Application service for project development updates.
 *
 * Coordinates development update domain logic and persistence.
 */

const { DevelopmentUpdate } = require("../models/DevelopmentUpdate");

/**
 * Provides application-level operations for development updates.
 */
class DevelopmentUpdateService {
    /**
     * Creates a development update service using the supplied repository.
     *
     * @param {Object} repository - Development update repository.
     */
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Creates a new development update.
     *
     * @param {Object} data - Development update data.
     * @returns {Promise<Object>} Created development update.
     */
    async CreateDevelopmentUpdate(data) {
        const update = new DevelopmentUpdate(data);

        return this.repository.create(update);
    }

    /**
     * Retrieves all development updates belonging to a project.
     *
     * @param {string} projectId - Project identifier.
     * @returns {Promise<Object[]>} Project development updates.
     */
    async GetDevelopmentUpdatesByProject(projectId) {
        return this.repository.findByProject(projectId);
    }

    /**
     * Retrieves a development update by its identifier.
     *
     * @param {string} updateId - Development update identifier.
     * @returns {Promise<Object|null>} Matching update or null.
     */
    async GetDevelopmentUpdate(updateId) {
        return this.repository.findById(updateId);
    }

    /**
     * Updates a development update after verifying that the
     * requesting membership is its author.
     *
     * @param {string} updateId - Development update identifier.
     * @param {string} membershipId - Membership attempting the edit.
     * @param {string} newContent - Replacement content.
     * @returns {Promise<Object|null|boolean>}
     * Updated update, null if not found, or false if rejected.
     */
    async UpdateDevelopmentUpdate(updateId, membershipId, newContent) {
        const existingRow = await this.repository.findById(updateId);

        if (!existingRow) {
            return null;
        }

        const update = new DevelopmentUpdate({
            updateId: existingRow.update_id,
            projectId: existingRow.project_id,
            membershipId: existingRow.author_membership_id,
            content: existingRow.content,
            createdAt: existingRow.created_at
        });

        if (!update.CanBeEditedBy(membershipId)) {
            return false;
        }

        if (!update.UpdateContent(newContent)) {
            return false;
        }

        return this.repository.update(update);
    }
}

module.exports = DevelopmentUpdateService;