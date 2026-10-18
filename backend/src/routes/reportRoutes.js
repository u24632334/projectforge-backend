const express = require("express");

const reportController =
    require("../controllers/reportController");

const authGuard =
    require("../middleware/authGuard");

const requireAdmin =
    require("../middleware/requireAdmin");

const router = express.Router();


/**
 * Submit a new report.
 *
 * Any authenticated user may submit a report.
 */
router.post(
    "/reports",
    authGuard,
    reportController.createReport
);


/**
 * Administrator moderation routes.
 *
 * User must:
 * 1. Have a valid JWT
 * 2. Have the ADMIN system role
 */
router.get(
    "/admin/reports",
    authGuard,
    requireAdmin,
    reportController.getPendingReports
);


router.get(
    "/admin/reports/:reportId",
    authGuard,
    requireAdmin,
    reportController.getReportById
);


router.patch(
    "/admin/reports/:reportId/dismiss",
    authGuard,
    requireAdmin,
    reportController.dismissReport
);


module.exports = router;