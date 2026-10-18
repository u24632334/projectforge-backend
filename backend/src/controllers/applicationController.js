/**
 * ProjectForge - Application Management Controller
 *
 * Handles:
 * - Authenticated application submission
 * - Duplicate application prevention
 * - Project Lead application review
 * - Accepting/rejecting applications
 * - Converting accepted applicants into project members
 */

const db = require('../config/db');

const pool = db.pool || db;

const MAX_APPLICATION_MESSAGE_LENGTH =
    1000;


/**
 * Submit an application.
 *
 * POST /api/applications
 *
 * The applicant is always taken from the authenticated
 * JWT user. The client may not choose an applicant identity.
 */
exports.submitApplication = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        const {
            positionId,
            message
        } = req.body;

        if (
            !positionId ||
            typeof message !==
                'string' ||
            !message.trim()
        ) {
            return res.status(400).json({
                error:
                    'Position ID and a cover message are required.'
            });
        }

        if (
            message.length >
            MAX_APPLICATION_MESSAGE_LENGTH
        ) {
            return res.status(400).json({
                error:
                    `Maximum characters exceeded. Application message may not exceed ${MAX_APPLICATION_MESSAGE_LENGTH} characters.`
            });
        }

        /*
         * Confirm that the requested position exists and
         * is still open.
         */
        const positionResult = await pool.query(
            `
                SELECT
                    position_id,
                    project_id,
                    status
                FROM project_positions
                WHERE position_id = $1
            `,
            [positionId]
        );

        if (positionResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Project position not found.'
            });
        }

        const position =
            positionResult.rows[0];

        if (position.status !== 'OPEN') {
            return res.status(409).json({
                error:
                    'This project position is no longer open.'
            });
        }

        /*
         * A user who is already an active member of the
         * project should not apply for another advertised
         * position in that same project.
         */
        const membershipResult =
            await pool.query(
                `
                    SELECT membership_id
                    FROM project_memberships
                    WHERE
                        project_id = $1
                        AND user_id = $2
                        AND active = TRUE
                `,
                [
                    position.project_id,
                    req.user.id
                ]
            );

        if (membershipResult.rows.length > 0) {
            return res.status(409).json({
                error:
                    'You are already a member of this project.'
            });
        }

        /*
         * Prevent duplicate pending applications.
         */
        const duplicateResult =
            await pool.query(
                `
                    SELECT application_id
                    FROM project_applications
                    WHERE
                        position_id = $1
                        AND applicant_user_id = $2
                        AND status = 'PENDING'
                `,
                [
                    positionId,
                    req.user.id
                ]
            );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                error:
                    'You have already submitted a pending application for this position.'
            });
        }

        /*
         * Create the pending application using the
         * authenticated user's ID.
         */
        const insertResult =
            await pool.query(
                `
                    INSERT INTO project_applications (
                        position_id,
                        applicant_user_id,
                        message,
                        status
                    )
                    VALUES ($1, $2, $3, 'PENDING')
                    RETURNING
                        application_id
                            AS "applicationId",
                        position_id
                            AS "positionId",
                        applicant_user_id
                            AS "applicantUserId",
                        message,
                        status,
                        submitted_at
                            AS "submittedAt"
                `,
                [
                    positionId,
                    req.user.id,
                    message.trim()
                ]
            );

        return res.status(201).json({
            message:
                'Application submitted successfully',
            application:
                insertResult.rows[0]
        });
    } catch (error) {
        /*
         * The database also has a unique partial index for
         * duplicate pending applications. This protects
         * against two requests arriving at the same time.
         */
        if (error.code === '23505') {
            return res.status(409).json({
                error:
                    'You already have a pending application for this position.'
            });
        }

        console.error(
            'Error submitting application:',
            error
        );

        return res.status(500).json({
            error:
                'Failed to submit application'
        });
    }
};


/**
 * Retrieve applications that the authenticated Project
 * Lead is authorised to review.
 *
 * GET /api/applications
 *
 * A Lead sees applications only for projects where they
 * currently hold an active LEAD membership.
 */
exports.getApplications = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        const sqlQuery = `
            SELECT
                pa.application_id
                    AS "applicationId",
                pa.position_id
                    AS "positionId",
                pos.title
                    AS "positionTitle",

                p.project_id
                    AS "projectId",
                p.title
                    AS "projectTitle",
                p.category
                    AS "projectCategory",

                pa.applicant_user_id
                    AS "applicantUserId",

                COALESCE(
                    prof.display_name,
                    u.email
                ) AS "applicantName",

                u.email
                    AS "applicantEmail",

                pa.message,
                pa.status,

                pa.submitted_at
                    AS "submittedAt"

            FROM project_applications pa

            JOIN project_positions pos
                ON pa.position_id =
                   pos.position_id

            JOIN projects p
                ON pos.project_id =
                   p.project_id

            JOIN users u
                ON pa.applicant_user_id =
                   u.user_id

            LEFT JOIN profiles prof
                ON u.user_id =
                   prof.user_id

            JOIN project_memberships lead_membership
                ON lead_membership.project_id =
                   p.project_id
                AND lead_membership.user_id = $1
                AND lead_membership.member_role = 'LEAD'
                AND lead_membership.active = TRUE

            ORDER BY pa.submitted_at DESC;
        `;

        const result =
            await pool.query(
                sqlQuery,
                [req.user.id]
            );

        return res.status(200).json({
            applications: result.rows
        });
    } catch (error) {
        console.error(
            'Error fetching applications:',
            error
        );

        return res.status(500).json({
            error:
                'Failed to retrieve applications'
        });
    }
};


/**
 * Accept or reject an application.
 *
 * PATCH /api/applications/:id/status
 *
 * Only an active Project Lead for the application's
 * project may process it.
 *
 * ACCEPTED:
 * - application becomes ACCEPTED
 * - applicant becomes MEMBER
 * - position becomes CLOSED
 * - other pending applications for that position
 *   become REJECTED
 *
 * REJECTED:
 * - application becomes REJECTED
 */
exports.updateApplicationStatus = async (
    req,
    res
) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required.'
        });
    }

    const { id } = req.params;

    const formattedStatus =
        req.body.status
            ? req.body.status.toUpperCase()
            : '';

    if (
        ![
            'ACCEPTED',
            'REJECTED'
        ].includes(formattedStatus)
    ) {
        return res.status(400).json({
            error:
                'Valid status (ACCEPTED or REJECTED) is required.'
        });
    }

    let client;

    try {
        client = await pool.connect();

        await client.query('BEGIN');

        /*
         * Load the application together with the position
         * and owning project.
         */
        const applicationResult =
            await client.query(
                `
                    SELECT
                        pa.application_id,
                        pa.position_id,
                        pa.applicant_user_id,
                        pa.message,
                        pa.status,
                        pa.submitted_at,

                        pos.project_id,
                        pos.status
                            AS position_status

                    FROM project_applications pa

                    JOIN project_positions pos
                        ON pa.position_id =
                           pos.position_id

                    WHERE pa.application_id = $1

                    FOR UPDATE OF pa, pos
                `,
                [id]
            );

        if (
            applicationResult.rows.length === 0
        ) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error:
                    'Application not found'
            });
        }

        const application =
            applicationResult.rows[0];

        /*
         * Confirm that the caller is the active Project
         * Lead for the project that owns this application.
         */
        const leadResult =
            await client.query(
                `
                    SELECT membership_id
                    FROM project_memberships
                    WHERE
                        project_id = $1
                        AND user_id = $2
                        AND member_role = 'LEAD'
                        AND active = TRUE
                `,
                [
                    application.project_id,
                    req.user.id
                ]
            );

        if (leadResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(403).json({
                success: false,
                error:
                    'Project Lead access required.'
            });
        }

        /*
         * Applications may only be processed once.
         */
        if (application.status !== 'PENDING') {
            await client.query('ROLLBACK');

            return res.status(409).json({
                error:
                    'This application has already been processed.'
            });
        }

        /*
         * Rejecting does not create membership.
         */
        if (formattedStatus === 'REJECTED') {
            const rejectedResult =
                await client.query(
                    `
                        UPDATE project_applications
                        SET status = 'REJECTED'
                        WHERE application_id = $1
                        RETURNING
                            application_id
                                AS "applicationId",
                            position_id
                                AS "positionId",
                            applicant_user_id
                                AS "applicantUserId",
                            message,
                            status,
                            submitted_at
                                AS "submittedAt"
                    `,
                    [id]
                );

            await client.query('COMMIT');

            return res.status(200).json({
                message:
                    'Application status updated to REJECTED',
                application:
                    rejectedResult.rows[0]
            });
        }

        /*
         * From this point onward the requested status is
         * ACCEPTED.
         */
        if (
            application.position_status !==
            'OPEN'
        ) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                error:
                    'This project position is no longer open.'
            });
        }

        /*
         * Avoid creating a second active membership for
         * somebody who is already in the project.
         */
        const existingMembership =
            await client.query(
                `
                    SELECT membership_id
                    FROM project_memberships
                    WHERE
                        project_id = $1
                        AND user_id = $2
                        AND active = TRUE
                `,
                [
                    application.project_id,
                    application.applicant_user_id
                ]
            );

        if (
            existingMembership.rows.length > 0
        ) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                error:
                    'Applicant is already an active member of this project.'
            });
        }

        /*
         * Create the real project membership.
         *
         * position_id links the accepted member to the
         * advertised role they filled.
         */
        await client.query(
            `
                INSERT INTO project_memberships (
                    project_id,
                    user_id,
                    position_id,
                    member_role,
                    active
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'MEMBER',
                    TRUE
                )
            `,
            [
                application.project_id,
                application.applicant_user_id,
                application.position_id
            ]
        );

        /*
         * Mark the selected application as accepted.
         */
        const acceptedResult =
            await client.query(
                `
                    UPDATE project_applications
                    SET status = 'ACCEPTED'
                    WHERE application_id = $1
                    RETURNING
                        application_id
                            AS "applicationId",
                        position_id
                            AS "positionId",
                        applicant_user_id
                            AS "applicantUserId",
                        message,
                        status,
                        submitted_at
                            AS "submittedAt"
                `,
                [id]
            );

        /*
         * The advertised role has now been filled.
         */
        await client.query(
            `
                UPDATE project_positions
                SET status = 'CLOSED'
                WHERE position_id = $1
            `,
            [application.position_id]
        );

        /*
         * Any other pending applicants for the same role
         * can no longer be accepted.
         */
        await client.query(
            `
                UPDATE project_applications
                SET status = 'REJECTED'
                WHERE
                    position_id = $1
                    AND application_id <> $2
                    AND status = 'PENDING'
            `,
            [
                application.position_id,
                id
            ]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            message:
                'Application status updated to ACCEPTED',
            application:
                acceptedResult.rows[0]
        });
    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error(
                    'Error rolling back application update:',
                    rollbackError
                );
            }
        }

        /*
         * Covers race conditions around the unique active
         * membership and unique filled-position constraints.
         */
        if (error.code === '23505') {
            return res.status(409).json({
                error:
                    'Applicant is already a member or this position has already been filled.'
            });
        }

        console.error(
            'Error updating application status:',
            error
        );

        return res.status(500).json({
            error:
                'Failed to update application status'
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};