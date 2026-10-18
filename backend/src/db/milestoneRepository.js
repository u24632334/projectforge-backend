/**
 * MilestoneRepository
 * Data-access layer for project milestones (PFG-45).
 *
 * Handles PostgreSQL operations for milestones.
 * Business rules remain in the Milestone domain class.
 *
 * PostgreSQL DATE values are mapped back to YYYY-MM-DD strings
 * so calendar dates do not shift because of timezone conversion.
 */

/**
 * Provides database operations for project milestones.
 */
class MilestoneRepository {
    /**
     * Creates a milestone repository using the supplied database pool.
     *
     * @param {Object} pool - PostgreSQL connection pool.
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Converts a PostgreSQL DATE value into a date-only string.
     *
     * The PostgreSQL driver may return DATE values as JavaScript Date
     * objects. Using local date components avoids converting midnight
     * to UTC and accidentally moving the date to the previous day.
     *
     * @param {Date|string|null} value - Database date value.
     * @returns {string|null} Date in YYYY-MM-DD format.
     */
    FormatDueDate(value) {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'string') {
            return value;
        }

        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }

    /**
     * Maps a database milestone row into the format used by the application.
     *
     * @param {Object} row - PostgreSQL milestone row.
     * @returns {Object} Mapped milestone row.
     */
    MapRow(row) {
        if (!row) {
            return null;
        }

        return {
            ...row,
            due_date: this.FormatDueDate(row.due_date)
        };
    }

    /**
     * Inserts a new milestone into the database.
     *
     * @param {Object} milestone - Milestone domain object.
     * @returns {Promise<Object>} Created milestone.
     */
    async create(milestone) {
        const { rows } = await this.pool.query(
            `INSERT INTO milestones
                (milestone_id, project_id, title, description, due_date, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                milestone.milestoneId,
                milestone.projectId,
                milestone.title,
                milestone.description,
                milestone.dueDate,
                milestone.status
            ]
        );

        return this.MapRow(rows[0]);
    }

    /**
     * Retrieves all milestones belonging to a project.
     *
     * Results are ordered by due date, with milestones without
     * due dates placed at the end.
     *
     * @param {string} projectId - Project identifier.
     * @returns {Promise<Object[]>} Project milestones.
     */
    async findByProject(projectId) {
        const { rows } = await this.pool.query(
            `SELECT *
             FROM milestones
             WHERE project_id = $1
             ORDER BY due_date ASC NULLS LAST, milestone_id ASC`,
            [projectId]
        );

        return rows.map(row => this.MapRow(row));
    }

    /**
     * Retrieves a milestone by its identifier.
     *
     * @param {string} milestoneId - Milestone identifier.
     * @returns {Promise<Object|null>} Matching milestone or null.
     */
    async findById(milestoneId) {
        const { rows } = await this.pool.query(
            `SELECT *
             FROM milestones
             WHERE milestone_id = $1`,
            [milestoneId]
        );

        return this.MapRow(rows[0]);
    }

    /**
     * Updates an existing milestone in the database.
     *
     * @param {Object} milestone - Updated milestone domain object.
     * @returns {Promise<Object|null>} Updated milestone or null.
     */
    async update(milestone) {
        const { rows } = await this.pool.query(
            `UPDATE milestones
             SET title = $1,
                 description = $2,
                 due_date = $3,
                 status = $4
             WHERE milestone_id = $5
             RETURNING *`,
            [
                milestone.title,
                milestone.description,
                milestone.dueDate,
                milestone.status,
                milestone.milestoneId
            ]
        );

        return this.MapRow(rows[0]);
    }
}

module.exports = MilestoneRepository;