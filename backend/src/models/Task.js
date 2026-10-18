/**
 * Task
 * Domain model for project workspace tasks (PFG-50).
 *
 * A task belongs to a milestone and may be assigned to one
 * ProjectMembership belonging to the same project.
 */

const TASK_STATUS = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    BLOCKED: "BLOCKED",
    DONE: "DONE"
};

const MAX_TASK_TITLE_LENGTH =
    120;

const MAX_TASK_DESCRIPTION_LENGTH =
    1000;

/**
 * Represents a project workspace task and its domain rules.
 */
class Task {
    /**
     * Creates a task domain object and validates its required fields.
     *
     * @param {Object} data - Task data.
     * @param {string|null} [data.taskId=null] - Existing task ID.
     * @param {string} data.projectId - Project the task belongs to.
     * @param {string} data.milestoneId - Milestone the task belongs to.
     * @param {string|null} [data.assigneeMembershipId=null] - Assigned project membership.
     * @param {string} data.title - Task title.
     * @param {string} data.description - Task description.
     * @param {string} [data.status=TODO] - Task status.
     * @param {string|null} [data.dueDate=null] - Task due date.
     */
    constructor({
        taskId = null,
        projectId,
        milestoneId,
        assigneeMembershipId = null,
        title,
        description,
        status = TASK_STATUS.TODO,
        dueDate = null
    }) {
        if (!projectId) {
            throw new Error("Project ID is required.");
        }

        if (!milestoneId) {
            throw new Error("Milestone ID is required.");
        }

        if (
            !title ||
            title.trim() === ""
        ) {
            throw new Error(
                "Task title is required."
            );
        }

        if (
            typeof title === "string" &&
            title.length >
                MAX_TASK_TITLE_LENGTH
        ) {
            throw new Error(
                `Maximum characters exceeded. Task title may not exceed ${MAX_TASK_TITLE_LENGTH} characters.`
            );
        }

        if (
            description === undefined ||
            description === null
        ) {
            throw new Error(
                "Task description is required."
            );
        }

        if (
            typeof description === "string" &&
            description.length >
                MAX_TASK_DESCRIPTION_LENGTH
        ) {
            throw new Error(
                `Maximum characters exceeded. Task description may not exceed ${MAX_TASK_DESCRIPTION_LENGTH} characters.`
            );
        }

        if (!Object.values(TASK_STATUS).includes(status)) {
            throw new Error("Invalid task status.");
        }

        this.taskId = taskId;
        this.projectId = projectId;
        this.milestoneId = milestoneId;
        this.assigneeMembershipId = assigneeMembershipId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.dueDate = dueDate;
    }

    /**
     * Updates a task title while enforcing
     * the configured character limit.
     */
    UpdateTitle(
        newTitle
    ) {
        if (
            typeof newTitle !==
                "string" ||
            !newTitle.trim() ||
            newTitle.length >
                MAX_TASK_TITLE_LENGTH
        ) {
            return false;
        }

        this.title =
            newTitle;

        return true;
    }


    /**
     * Updates a task description while enforcing
     * the configured character limit.
     */
    UpdateDescription(
        newDescription
    ) {
        if (
            typeof newDescription !==
                "string" ||
            newDescription.length >
                MAX_TASK_DESCRIPTION_LENGTH
        ) {
            return false;
        }

        this.description =
            newDescription;

        return true;
    }


    /**
     * Assigns the task to a project membership.
     *
     * The membership must belong to the same project as the task.
     */
    AssignTo(membership) {
        if (!membership) {
            return false;
        }

        if (membership.projectId !== this.projectId) {
            return false;
        }

        if (!membership.membershipId) {
            return false;
        }

        this.assigneeMembershipId = membership.membershipId;
        return true;
    }

    /**
     * Removes the current task assignment.
     */
    Unassign() {
        this.assigneeMembershipId = null;
        return true;
    }

    /**
     * Updates the task status.
     *
     * The transition table defines which status changes are permitted,
     * preventing invalid transitions such as moving directly from TODO
     * to DONE.
     */
    UpdateStatus(newStatus) {
        const validTransitions = {
            [TASK_STATUS.TODO]: [
                TASK_STATUS.IN_PROGRESS
            ],
            [TASK_STATUS.IN_PROGRESS]: [
                TASK_STATUS.BLOCKED,
                TASK_STATUS.DONE
            ],
            [TASK_STATUS.BLOCKED]: [
                TASK_STATUS.IN_PROGRESS
            ],
            [TASK_STATUS.DONE]: []
        };

        if (!validTransitions[this.status].includes(newStatus)) {
            return false;
        }

        this.status = newStatus;
        return true;
    }

    /**
     * Updates the task due date.
     *
     * The date must be today or in the future.
     */
    UpdateDueDate(newDueDate) {
        if (!newDueDate) {
            return false;
        }

        const dueDate = new Date(newDueDate);
        const today = new Date();

        if (Number.isNaN(dueDate.getTime())) {
            return false;
        }

        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
            return false;
        }

        this.dueDate = newDueDate;
        return true;
    }
}

module.exports = {
    Task,
    TASK_STATUS,
    MAX_TASK_TITLE_LENGTH,
    MAX_TASK_DESCRIPTION_LENGTH
};