/**
 * Task Routes
 * REST endpoints for project workspace tasks (PFG-50).
 */

const express = require("express");

const router = express.Router();

const authGuard = require("../middleware/authGuard");
const {
    BuildRequireProjectMembership,
    CreateMembershipLookup
} = require("../middleware/requireProjectMembership");

const { pool } = require("../config/db");
const taskController = require("../controllers/taskController");

const findMembership = CreateMembershipLookup(pool);

const requireProjectMembership =
    BuildRequireProjectMembership(findMembership);

/*
 * Create a task.
 * Any authenticated member of the project may create tasks.
 */
router.post(
    "/projects/:projectId/tasks",
    authGuard,
    requireProjectMembership,
    taskController.createTask
);

/*
 * Get all tasks belonging to a project.
 */
router.get(
    "/projects/:projectId/tasks",
    authGuard,
    requireProjectMembership,
    taskController.getTasksByProject
);

/*
 * Get one task belonging to a project.
 */
router.get(
    "/projects/:projectId/tasks/:taskId",
    authGuard,
    requireProjectMembership,
    taskController.getTask
);

/*
 * Update a task.
 * The service additionally verifies that the task belongs
 * to the project in the route.
 */
router.patch(
    "/projects/:projectId/tasks/:taskId",
    authGuard,
    requireProjectMembership,
    taskController.updateTask
);

/*
 * Delete a task.
 */
router.delete(
    "/projects/:projectId/tasks/:taskId",
    authGuard,
    requireProjectMembership,
    taskController.deleteTask
);

module.exports = router;