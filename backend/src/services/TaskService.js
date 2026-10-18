/**
 * Task Service
 * Coordinates task business logic and persistence operations (PFG-50).
 */

const { Task } = require("../models/Task");

/**
 * Provides application-level operations for project workspace tasks.
 */
class TaskService {
    /**
     * Creates a task service using the supplied repository.
     *
     * @param {Object} taskRepository - Task data-access repository.
     */
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }

    /**
     * Creates a new task after validating its domain rules.
     */
    async CreateTask(data) {
        const task = new Task(data);
        const createdTask = await this.taskRepository.create(task);

        if (!createdTask) {
            return null;
        }

        return createdTask;
    }

    /**
     * Retrieves all tasks belonging to a project.
     */
    async GetTasksByProject(projectId) {
        return this.taskRepository.findByProject(projectId);
    }

    /**
     * Retrieves a single task by its identifier.
     */
    async GetTask(taskId) {
        return this.taskRepository.findById(taskId);
    }

    /**
     * Applies the requested task changes while enforcing domain rules.
     *
     * Keeping field-update handling separate from UpdateTask keeps
     * the main update workflow simpler while preserving the same
     * validation behaviour.
     */
    ApplyFieldUpdates(task, data) {
        if (data.assigneeMembership !== undefined) {
            if (data.assigneeMembership === null) {
                task.Unassign();
            } else if (!task.AssignTo(data.assigneeMembership)) {
                return false;
            }
        }

        if (data.status !== undefined) {
            if (!task.UpdateStatus(data.status)) {
                return false;
            }
        }

        if (
            data.title !==
            undefined
        ) {
            if (
                !task.UpdateTitle(
                    data.title
                )
            ) {
                return false;
            }
        }

        if (
            data.description !==
            undefined
        ) {
            if (
                !task.UpdateDescription(
                    data.description
                )
            ) {
                return false;
            }
        }

        if (data.dueDate !== undefined) {
            if (!task.UpdateDueDate(data.dueDate)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Updates a task after verifying that it belongs to the requested project.
     */
    async UpdateTask(data, projectId) {
        const existingRow = await this.taskRepository.findById(data.taskId);

        if (!existingRow) {
            return null;
        }

        if (existingRow.project_id !== projectId) {
            return null;
        }

        const task = new Task({
            taskId: existingRow.task_id,
            projectId: existingRow.project_id,
            milestoneId: existingRow.milestone_id,
            assigneeMembershipId: existingRow.assignee_membership_id,
            title: existingRow.title,
            description: existingRow.description,
            status: existingRow.status,
            dueDate: existingRow.due_date
        });

        if (!this.ApplyFieldUpdates(task, data)) {
            return false;
        }

        return this.taskRepository.update(task);
    }

    /**
     * Deletes a task belonging to the requested project.
     */
    async DeleteTask(taskId, projectId) {
        return this.taskRepository.delete(taskId, projectId);
    }
}

module.exports = TaskService;