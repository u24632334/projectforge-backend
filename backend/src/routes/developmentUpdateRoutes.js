/**
 * Development Update Routes
 * REST endpoints for project development updates.
 */

const express = require("express");

const router = express.Router();

const authGuard = require("../middleware/authGuard");

const {
    BuildRequireProjectMembership,
    CreateMembershipLookup
} = require("../middleware/requireProjectMembership");

const { pool } = require("../config/db");
const developmentUpdateController =
    require("../controllers/DevelopmentUpdateController");

const findMembership = CreateMembershipLookup(pool);

const requireProjectMembership =
    BuildRequireProjectMembership(findMembership);

/*
 * Create a development update.
 * Any authenticated member of the project may create updates.
 */
router.post(
    "/projects/:projectId/development-updates",
    authGuard,
    requireProjectMembership,
    developmentUpdateController.createDevelopmentUpdate
);

/*
 * Get all development updates belonging to a project.
 */
router.get(
    "/projects/:projectId/development-updates",
    authGuard,
    requireProjectMembership,
    developmentUpdateController.getDevelopmentUpdatesByProject
);

/*
 * Get one development update belonging to a project.
 */
router.get(
    "/projects/:projectId/development-updates/:updateId",
    authGuard,
    requireProjectMembership,
    developmentUpdateController.getDevelopmentUpdate
);

/*
 * Update a development update.
 * The service verifies that the requesting member is the author.
 */
router.patch(
    "/projects/:projectId/development-updates/:updateId",
    authGuard,
    requireProjectMembership,
    developmentUpdateController.updateDevelopmentUpdate
);

module.exports = router;