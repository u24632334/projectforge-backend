/**
 * TaskRepository
 * Data-access layer for project workspace tasks (PFG-49).
 *
 * Handles PostgreSQL operations for tasks.
 * Business rules remain in the Task domain model.
 *
 * Project ownership is derived through the task's milestone.
 */

/**
 * Provides database operations for project workspace tasks.
 */
class TaskRepository {
    /**
     * Creates a task repository using the supplied database pool.
     *
     * @param {Object} pool - PostgreSQL connection pool.
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Converts PostgreSQL DATE values to YYYY-MM-DD strings.
     *
     * @param {Date|string|null} value - Database date value.
     * @returns {string|null} Date in YYYY-MM-DD format.
     */
    FormatDueDate(value) {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === "string") {
            return value;
        }

        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }

    /**
     * Maps a database row to the format expected by the domain model.
     *
     * @param {Object} row - PostgreSQL task row.
     * @returns {Object|null} Mapped task row or null.
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
     * Creates a task for a milestone belonging to the given project.
     *
     * If an assignee is provided, the membership must be an active
     * member of the same project.
     */
    async create(task) {
        const { rows } = await this.pool.query(
            `INSERT INTO tasks
                (task_id, milestone_id, assignee_membership_id,
                 title, description, status, due_date)
             SELECT
                COALESCE($1, gen_random_uuid()),
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
             FROM milestones m
             LEFT JOIN project_memberships pm
                ON pm.membership_id = $3
               AND pm.project_id = m.project_id
               AND pm.active = TRUE
             WHERE m.milestone_id = $2
               AND m.project_id = $8
               AND (
                   $3 IS NULL
                   OR pm.membership_id IS NOT NULL
               )
             RETURNING
                task_id,
                milestone_id,
                assignee_membership_id,
                title,
                description,
                status,
                due_date`,
            [
                task.taskId,
                task.milestoneId,
                task.assigneeMembershipId,
                task.title,
                task.description,
                task.status,
                task.dueDate,
                task.projectId
            ]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = this.MapRow(rows[0]);

        return {
            ...row,
            project_id: task.projectId
        };
    }

    /**
     * Finds all tasks belonging to a project.
     *
     * The project is determined through the milestone associated
     * with each task.
     */
    async findByProject(projectId) {
        const { rows } = await this.pool.query(
            `SELECT
                t.*,
                m.project_id
             FROM tasks t
             JOIN milestones m
               ON m.milestone_id = t.milestone_id
             WHERE m.project_id = $1
             ORDER BY t.due_date ASC NULLS LAST, t.task_id ASC`,
            [projectId]
        );

        return rows.map(row => this.MapRow(row));
    }

    /**
     * Finds a task by its ID.
     *
     * The project ID is included through the task's milestone
     * so that project ownership can be checked by the service.
     */
    async findById(taskId) {
        const { rows } = await this.pool.query(
            `SELECT
                t.*,
                m.project_id
             FROM tasks t
             JOIN milestones m
               ON m.milestone_id = t.milestone_id
             WHERE t.task_id = $1`,
            [taskId]
        );

        return this.MapRow(rows[0]);
    }

    /**
     * Updates a task belonging to the given project.
     *
     * If an assignee is provided, the membership must be an active
     * member of the same project.
     */
    async update(task) {
        const { rows } = await this.pool.query(
            `UPDATE tasks t
             SET assignee_membership_id = $1,
                 title = $2,
                 description = $3,
                 status = $4,
                 due_date = $5
             FROM milestones m
             LEFT JOIN project_memberships pm
                ON pm.membership_id = $1
               AND pm.project_id = m.project_id
               AND pm.active = TRUE
             WHERE t.task_id = $6
               AND t.milestone_id = m.milestone_id
               AND m.project_id = $7
               AND (
                   $1 IS NULL
                   OR pm.membership_id IS NOT NULL
               )
             RETURNING
                t.*,
                m.project_id`,
            [
                task.assigneeMembershipId,
                task.title,
                task.description,
                task.status,
                task.dueDate,
                task.taskId,
                task.projectId
            ]
        );

        return this.MapRow(rows[0]);
    }

    /**
     * Deletes a task belonging to the given project.
     *
     * The milestone relationship ensures that the task can only
     * be deleted when it belongs to the specified project.
     */
    async delete(taskId, projectId) {
        const { rows } = await this.pool.query(
            `DELETE FROM tasks t
             USING milestones m
             WHERE t.task_id = $1
               AND t.milestone_id = m.milestone_id
               AND m.project_id = $2
             RETURNING t.*`,
            [taskId, projectId]
        );

        return rows[0] || null;
    }
}

module.exports = TaskRepository;