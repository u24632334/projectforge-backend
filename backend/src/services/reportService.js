const reportModel = require("../models/reportModel");

// The stored reason also contains the selected report category
// added by the frontend before the 1000-character free-text details.
const MAX_REPORT_REASON_LENGTH =
    1200;


/**
 * Creates an Error object that works with the
 * project's global error handler.
 */
function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}


/**
 * Validates and creates a new report.
 */
async function createReport({
    reporterUserId,
    reportedUserId = null,
    reportedProjectId = null,
    reason
}) {
    // The reporter must be known.
    // Later this will come from the logged-in JWT user.
    if (!reporterUserId) {
        throw createError(
            "Reporter user ID is required.",
            400
        );
    }


    // Reason must contain actual text.
    if (
        typeof reason !== "string"
        || reason.trim() === ""
    ) {
        throw createError(
            "A report reason is required.",
            400
        );
    }


    if (
        reason.length >
        MAX_REPORT_REASON_LENGTH
    ) {
        throw createError(
            "Maximum characters exceeded. Report details may not exceed 1000 characters.",
            400
        );
    }


    // A report must target exactly one thing.
    const hasUserTarget = Boolean(reportedUserId);
    const hasProjectTarget = Boolean(reportedProjectId);

    if (hasUserTarget === hasProjectTarget) {
        throw createError(
            "A report must target either one user or one project.",
            400
        );
    }


    return reportModel.createReport({
        reporterUserId,
        reportedUserId,
        reportedProjectId,
        reason: reason.trim()
    });
}


/**
 * Returns all reports that are still pending.
 */
async function getPendingReports() {
    return reportModel.getPendingReports();
}


/**
 * Returns one report.
 */
async function getReportById(reportId) {
    if (!reportId) {
        throw createError(
            "Report ID is required.",
            400
        );
    }

    const report = await reportModel.getReportById(reportId);

    if (!report) {
        throw createError(
            "Report not found.",
            404
        );
    }

    return report;
}


/**
 * Dismisses a pending report.
 */
async function dismissReport(
    reportId,
    reviewedByUserId
) {
    if (!reportId) {
        throw createError(
            "Report ID is required.",
            400
        );
    }

    if (!reviewedByUserId) {
        throw createError(
            "Reviewer user ID is required.",
            400
        );
    }


    // First check that the report actually exists.
    const existingReport =
        await reportModel.getReportById(reportId);

    if (!existingReport) {
        throw createError(
            "Report not found.",
            404
        );
    }


    // Only pending reports should be dismissed.
    if (existingReport.status !== "PENDING") {
        throw createError(
            "Only pending reports can be dismissed.",
            409
        );
    }


    return reportModel.dismissReport(
        reportId,
        reviewedByUserId
    );
}


module.exports = {
    createReport,
    getPendingReports,
    getReportById,
    dismissReport
};