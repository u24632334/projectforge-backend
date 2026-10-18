/**
 * ProjectForge - Application Management Routes
 *
 * Routes:
 * - POST  /api/applications
 * - GET   /api/applications
 * - PATCH /api/applications/:id/status
 */

const express = require('express');

const applicationController =
    require('../controllers/applicationController');

const authGuard =
    require('../middleware/authGuard');

const router = express.Router();


/**
 * POST /api/applications
 *
 * Submit an application for an open project position.
 *
 * Authentication is required because the applicant is
 * identified from req.user.id rather than client-supplied
 * email/user information.
 */
router.post(
    '/',
    authGuard,
    applicationController.submitApplication
);


/**
 * GET /api/applications
 *
 * Retrieve applications that the authenticated user is
 * authorised to review.
 *
 * The controller restricts the returned records to projects
 * where the caller holds an active LEAD membership.
 */
router.get(
    '/',
    authGuard,
    applicationController.getApplications
);


/**
 * PATCH /api/applications/:id/status
 *
 * Accept or reject a pending application.
 *
 * Authentication is required and the controller verifies
 * that the caller is the active Project Lead for the
 * application's actual project before making any changes.
 */
router.patch(
    '/:id/status',
    authGuard,
    applicationController.updateApplicationStatus
);


module.exports = router;