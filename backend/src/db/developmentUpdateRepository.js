/**
 * DevelopmentUpdateRepository
 * Data-access layer for project development updates.
 *
 * Handles PostgreSQL operations for development updates.
 * Project ownership is derived through the author's membership.
 */

/**
 * Provides database operations for project development updates.
 */
class DevelopmentUpdateRepository {
    /**
     * Creates a development update repository using the supplied database pool.
     *
     * @param {Object} pool - PostgreSQL connection pool.
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Creates a development update.
     *
     * The author's membership determines which project the update
     * belongs to.
     *
     * @param {Object} update - Development update domain object.
     * @returns {Promise<Object>} Created development update.
     */
    async create(update) {
        const { rows } = await this.pool.query(
            `INSERT INTO development_updates
                (update_id, author_membership_id, content)
             VALUES (
                COALESCE($1, gen_random_uuid()),
                $2,
                $3
             )
             RETURNING *`,
            [
                update.updateId,
                update.membershipId,
                update.content
            ]
        );

        return rows[0];
    }

    /**
     * Finds all development updates belonging to a project.
     *
     * Includes the author's user ID and display name so the
     * frontend can display authors correctly and determine
     * whether the authenticated user owns an update.
     *
     * @param {string} projectId - Project identifier.
     * @returns {Promise<Object[]>} Project development updates.
     */
    async findByProject(projectId) {
        const { rows } = await this.pool.query(
            `SELECT
                du.*,
                pm.project_id,
                pm.user_id AS author_user_id,
                p.display_name AS author_display_name
             FROM development_updates du
             JOIN project_memberships pm
               ON pm.membership_id =
                  du.author_membership_id
             JOIN profiles p
               ON p.user_id =
                  pm.user_id
             WHERE pm.project_id = $1
               AND pm.active = TRUE
             ORDER BY
                du.created_at DESC,
                du.update_id DESC`,
            [
                projectId
            ]
        );

        return rows;
    }

    /**
     * Finds a development update by its identifier.
     *
     * @param {string} updateId - Development update identifier.
     * @returns {Promise<Object|null>} Matching update or null.
     */
    async findById(updateId) {
        const { rows } = await this.pool.query(
            `SELECT
                du.*,
                pm.project_id,
                pm.user_id AS author_user_id,
                p.display_name AS author_display_name
             FROM development_updates du
             JOIN project_memberships pm
               ON pm.membership_id =
                  du.author_membership_id
             JOIN profiles p
               ON p.user_id =
                  pm.user_id
             WHERE du.update_id = $1`,
            [
                updateId
            ]
        );

        return rows[0] || null;
    }

    /**
     * Updates the content of an existing development update.
     *
     * @param {Object} update - Updated development update.
     * @returns {Promise<Object|null>} Updated update or null.
     */
    async update(update) {
        const { rows } = await this.pool.query(
            `UPDATE development_updates
             SET content = $1
             WHERE update_id = $2
             RETURNING *`,
            [
                update.content,
                update.updateId
            ]
        );

        return rows[0] || null;
    }
}

module.exports = DevelopmentUpdateRepository;