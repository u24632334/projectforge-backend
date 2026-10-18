/**
 * Development Update Controller
 * Handles HTTP requests for project development updates.
 */

const DevelopmentUpdateService = require("../services/DevelopmentUpdateService");
const DevelopmentUpdateRepository = require("../db/developmentUpdateRepository");
const { pool } = require("../config/db");

const developmentUpdateService = new DevelopmentUpdateService(
    new DevelopmentUpdateRepository(pool)
);

/**
 * Creates a development update for a project.
 */
async function createDevelopmentUpdate(req, res, next) {
    try {
        const update = await developmentUpdateService.CreateDevelopmentUpdate({
            projectId: req.params.projectId,
            membershipId: req.membership.membershipId,
            content: req.body.content
        });

        if (!update) {
            return res.status(400).json({
                success: false,
                message: "Development update could not be created."
            });
        }

        return res.status(201).json({
            success: true,
            update
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * Retrieves all development updates belonging to a project.
 */
async function getDevelopmentUpdatesByProject(req, res, next) {
    try {
        const updates =
            await developmentUpdateService.GetDevelopmentUpdatesByProject(
                req.params.projectId
            );

        return res.status(200).json({
            success: true,
            updates
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * Retrieves a single development update.
 */
async function getDevelopmentUpdate(req, res, next) {
    try {
        const update =
            await developmentUpdateService.GetDevelopmentUpdate(
                req.params.updateId
            );

        if (!update) {
            return res.status(404).json({
                success: false,
                message: "Development update not found."
            });
        }

        if (update.project_id !== req.params.projectId) {
            return res.status(404).json({
                success: false,
                message: "Development update not found."
            });
        }

        return res.status(200).json({
            success: true,
            update
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * Updates a development update.
 *
 * The service verifies that the requesting membership
 * is the author of the update.
 */
async function updateDevelopmentUpdate(req, res, next) {
    try {
        const update =
            await developmentUpdateService.UpdateDevelopmentUpdate(
                req.params.updateId,
                req.membership.membershipId,
                req.body.content
            );

        if (update === null) {
            return res.status(404).json({
                success: false,
                message: "Development update not found."
            });
        }

        if (update === false) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorised to edit this development update."
            });
        }

        return res.status(200).json({
            success: true,
            update
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createDevelopmentUpdate,
    getDevelopmentUpdatesByProject,
    getDevelopmentUpdate,
    updateDevelopmentUpdate
};