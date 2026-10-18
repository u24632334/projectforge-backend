/**
 * Task Controller
 * Handles HTTP requests for project workspace tasks (PFG-50).
 */

const TaskService = require("../services/TaskService");
const TaskRepository = require("../db/taskRepository");
const { pool } = require("../config/db");

const taskService = new TaskService(new TaskRepository(pool));

/**
 * Creates a new task using the project and task data supplied
 * in the HTTP request.
 */
async function createTask(req, res, next) {
    try {
        const task = await taskService.CreateTask({
            taskId: req.body.taskId,
            projectId: req.params.projectId,
            milestoneId: req.body.milestoneId,
            assigneeMembershipId: req.body.assigneeMembershipId ?? null,
            title: req.body.title,
            description: req.body.description,
            status: req.body.status ?? "TODO",
            dueDate: req.body.dueDate ?? null
        });

        if (!task) {
            return res.status(400).json({
                success: false,
                message: "Task could not be created."
            });
        }

        return res.status(201).json({
            success: true,
            task
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * Retrieves all tasks belonging to the requested project.
 */
async function getTasksByProject(req, res, next) {
    try {
        const tasks = await taskService.GetTasksByProject(req.params.projectId);

        return res.status(200).json({
            success: true,
            tasks
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * Retrieves a single task and verifies that it belongs to
 * the project specified in the request.
 */
async function getTask(req, res, next) {
    try {
        const task = await taskService.GetTask(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        if (task.project_id !== req.params.projectId) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        return res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * Updates the supplied fields of an existing project task.
 *
 * The service layer applies the task's domain rules before
 * persisting the requested changes.
 */
async function updateTask(req, res, next) {
    try {
        const task = await taskService.UpdateTask(
            {
                taskId: req.params.taskId,
                assigneeMembership:
                    req.body.assigneeMembership === undefined
                        ? undefined
                        : req.body.assigneeMembership,
                status: req.body.status,
                title: req.body.title,
                description: req.body.description,
                dueDate: req.body.dueDate
            },
            req.params.projectId
        );

        if (task === null) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        if (task === false) {
            return res.status(400).json({
                success: false,
                message: "Task update rejected."
            });
        }

        return res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * Deletes a task belonging to the requested project.
 */
async function deleteTask(req, res, next) {
    try {
        const task = await taskService.DeleteTask(
            req.params.taskId,
            req.params.projectId
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully."
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createTask,
    getTasksByProject,
    getTask,
    updateTask,
    deleteTask
};