const { pool } = require("../config/db");


const REPORT_DETAILS_FROM = `
    FROM reports r

    LEFT JOIN users reporter
        ON reporter.user_id =
            r.reporter_user_id

    LEFT JOIN profiles reporter_profile
        ON reporter_profile.user_id =
            r.reporter_user_id

    LEFT JOIN users reported_user
        ON reported_user.user_id =
            r.reported_user_id

    LEFT JOIN profiles reported_user_profile
        ON reported_user_profile.user_id =
            r.reported_user_id

    LEFT JOIN projects reported_project
        ON reported_project.project_id =
            r.reported_project_id
`;


const REPORT_DETAILS_SELECT = `
    SELECT
        r.*,

        COALESCE(
            reporter_profile.display_name,
            reporter.email
        ) AS reporter_name,

        reporter.email AS reporter_email,

        COALESCE(
            reported_user_profile.display_name,
            reported_user.email
        ) AS reported_user_name,

        reported_user.email AS reported_user_email,

        reported_project.title
            AS reported_project_title
`;


/**
 * Creates a new report in the database.
 *
 * A report can target either a user or a project.
 */
async function createReport({
    reporterUserId,
    reportedUserId = null,
    reportedProjectId = null,
    reason
}) {
    const query = `
        INSERT INTO reports (
            reporter_user_id,
            reported_user_id,
            reported_project_id,
            reason
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [
        reporterUserId,
        reportedUserId,
        reportedProjectId,
        reason
    ];

    const result =
        await pool.query(
            query,
            values
        );

    return result.rows[0];
}


/**
 * Returns all reports still waiting for
 * administrator review.
 *
 * Human-readable reporter and target details
 * are included for the administration interface.
 */
async function getPendingReports() {
    const query = `
        ${REPORT_DETAILS_SELECT}

        ${REPORT_DETAILS_FROM}

        WHERE r.status = 'PENDING'

        ORDER BY
            r.created_at ASC;
    `;

    const result =
        await pool.query(
            query
        );

    return result.rows;
}


/**
 * Returns one report using its unique report ID.
 *
 * The same human-readable moderation details used
 * by the pending-report list are included here.
 */
async function getReportById(
    reportId
) {
    const query = `
        ${REPORT_DETAILS_SELECT}

        ${REPORT_DETAILS_FROM}

        WHERE r.report_id = $1;
    `;

    const result =
        await pool.query(
            query,
            [reportId]
        );

    return (
        result.rows[0] ||
        null
    );
}


/**
 * Marks a pending report as dismissed.
 *
 * The administrator who reviewed the report is recorded,
 * together with the time at which it was reviewed.
 */
async function dismissReport(
    reportId,
    reviewedByUserId
) {
    const query = `
        UPDATE reports

        SET
            status = 'DISMISSED',
            reviewed_by_user_id = $2,
            reviewed_at = CURRENT_TIMESTAMP

        WHERE report_id = $1
          AND status = 'PENDING'

        RETURNING *;
    `;

    const result =
        await pool.query(
            query,
            [
                reportId,
                reviewedByUserId
            ]
        );

    return (
        result.rows[0] ||
        null
    );
}


module.exports = {
    createReport,
    getPendingReports,
    getReportById,
    dismissReport
};
