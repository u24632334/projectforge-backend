const reportService = require("../services/reportService");


/**
 * POST /api/reports
 *
 * Creates a new report.
 * The reporter is taken from the authenticated JWT user.
 */
async function createReport(req, res, next) {
    try {
        const reporterUserId = req.user.id;

        const {
            reportedUserId,
            reportedProjectId,
            reason
        } = req.body;

        const report = await reportService.createReport({
            reporterUserId,
            reportedUserId,
            reportedProjectId,
            reason
        });

        return res.status(201).json({
            message: "Report submitted successfully.",
            report
        });
    }
    catch (error) {
        next(error);
    }
}


/**
 * GET /api/admin/reports
 *
 * Returns all pending reports.
 */
async function getPendingReports(req, res, next) {
    try {
        const reports =
            await reportService.getPendingReports();

        return res.status(200).json({
            reports
        });
    }
    catch (error) {
        next(error);
    }
}


/**
 * GET /api/admin/reports/:reportId
 *
 * Returns one report.
 */
async function getReportById(req, res, next) {
    try {
        const { reportId } = req.params;

        const report =
            await reportService.getReportById(reportId);

        return res.status(200).json({
            report
        });
    }
    catch (error) {
        next(error);
    }
}


/**
 * PATCH /api/admin/reports/:reportId/dismiss
 *
 * Dismisses a pending report.
 * The reviewing administrator is taken from the authenticated JWT user.
 */
async function dismissReport(req, res, next) {
    try {
        const { reportId } = req.params;

        const reviewedByUserId = req.user.id;

        const report =
            await reportService.dismissReport(
                reportId,
                reviewedByUserId
            );

        return res.status(200).json({
            message: "Report dismissed successfully.",
            report
        });
    }
    catch (error) {
        next(error);
    }
}


module.exports = {
    createReport,
    getPendingReports,
    getReportById,
    dismissReport
};