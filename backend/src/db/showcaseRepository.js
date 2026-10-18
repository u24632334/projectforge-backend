const {
    pool
} = require("../config/db");


async function getProjectById(
    projectId
) {
    const result =
        await pool.query(
            `
                SELECT
                    project_id,
                    title,
                    description,
                    category,
                    status,
                    repository_url
                FROM projects
                WHERE project_id = $1
            `,
            [
                projectId
            ]
        );

    return result.rows[0] ||
        null;
}


async function getActiveProjectLead(
    projectId,
    userId
) {
    const result =
        await pool.query(
            `
                SELECT
                    membership_id,
                    project_id,
                    user_id,
                    member_role,
                    active
                FROM project_memberships
                WHERE project_id = $1
                  AND user_id = $2
                  AND member_role = 'LEAD'
                  AND active = TRUE
            `,
            [
                projectId,
                userId
            ]
        );

    return result.rows[0] ||
        null;
}


async function getSubmissionByProjectId(
    projectId
) {
    const result =
        await pool.query(
            `
                SELECT
                    showcase_id,
                    project_id,
                    submitted_by_user_id,
                    status,
                    approved_by_admin_user_id,
                    approved_at,
                    created_at
                FROM showcase_submissions
                WHERE project_id = $1
            `,
            [
                projectId
            ]
        );

    return result.rows[0] ||
        null;
}


async function getSubmissionById(
    showcaseId
) {
    const result =
        await pool.query(
            `
                SELECT
                    ss.showcase_id,
                    ss.project_id,
                    ss.submitted_by_user_id,
                    ss.status,
                    ss.approved_by_admin_user_id,
                    ss.approved_at,
                    ss.created_at,
                    p.status AS project_status,
                    p.title,
                    p.description,
                    p.category,
                    p.repository_url
                FROM showcase_submissions ss
                JOIN projects p
                    ON p.project_id =
                        ss.project_id
                WHERE ss.showcase_id = $1
            `,
            [
                showcaseId
            ]
        );

    return result.rows[0] ||
        null;
}


async function createSubmission({
    projectId,
    submittedByUserId
}) {
    const result =
        await pool.query(
            `
                INSERT INTO showcase_submissions (
                    project_id,
                    submitted_by_user_id,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    'PENDING'
                )
                RETURNING
                    showcase_id,
                    project_id,
                    submitted_by_user_id,
                    status,
                    approved_by_admin_user_id,
                    approved_at,
                    created_at
            `,
            [
                projectId,
                submittedByUserId
            ]
        );

    return result.rows[0];
}


async function getPendingSubmissions() {
    const result =
        await pool.query(
            `
                SELECT
                    ss.showcase_id,
                    ss.project_id,
                    ss.submitted_by_user_id,
                    ss.status,
                    ss.created_at,
                    p.title,
                    p.description,
                    p.category,
                    p.repository_url,

                    COALESCE(
                        pr.display_name,
                        u.email
                    ) AS submitted_by,

                    COALESCE(
                        (
                            SELECT
                                JSON_AGG(
                                    JSON_BUILD_OBJECT(
                                        'imageId',
                                        pi.image_id,

                                        'imageUrl',
                                        '/api/project-images/files/' ||
                                            pi.file_name,

                                        'originalName',
                                        pi.original_name,

                                        'displayOrder',
                                        pi.display_order
                                    )
                                    ORDER BY
                                        pi.display_order ASC,
                                        pi.created_at ASC
                                )
                            FROM project_images pi
                            WHERE
                                pi.project_id =
                                    p.project_id
                        ),
                        '[]'::JSON
                    ) AS images

                FROM showcase_submissions ss

                JOIN projects p
                    ON p.project_id =
                        ss.project_id

                JOIN users u
                    ON u.user_id =
                        ss.submitted_by_user_id

                LEFT JOIN profiles pr
                    ON pr.user_id =
                        u.user_id

                WHERE
                    ss.status = 'PENDING'
                    AND p.status = 'COMPLETED'

                ORDER BY
                    ss.created_at ASC
            `
        );

    return result.rows;
}


async function approveSubmission(
    showcaseId,
    adminUserId
) {
    const result =
        await pool.query(
            `
                UPDATE showcase_submissions
                SET
                    status = 'APPROVED',
                    approved_by_admin_user_id =
                        $2,
                    approved_at =
                        CURRENT_TIMESTAMP
                WHERE
                    showcase_id = $1
                    AND status =
                        'PENDING'
                RETURNING
                    showcase_id,
                    project_id,
                    submitted_by_user_id,
                    status,
                    approved_by_admin_user_id,
                    approved_at,
                    created_at
            `,
            [
                showcaseId,
                adminUserId
            ]
        );

    return result.rows[0] ||
        null;
}


async function getPublicShowcase() {
    const result =
        await pool.query(
            `
                SELECT
                    ss.showcase_id,
                    p.project_id,
                    p.title,
                    p.description,
                    p.category,
                    p.repository_url,
                    ss.approved_at
                        AS showcased_at,

                    COALESCE(
                        (
                            SELECT
                                JSON_AGG(
                                    JSON_BUILD_OBJECT(
                                        'imageId',
                                        pi.image_id,

                                        'imageUrl',
                                        '/api/project-images/files/' ||
                                            pi.file_name,

                                        'originalName',
                                        pi.original_name,

                                        'displayOrder',
                                        pi.display_order
                                    )
                                    ORDER BY
                                        pi.display_order ASC,
                                        pi.created_at ASC
                                )
                            FROM project_images pi
                            WHERE
                                pi.project_id =
                                    p.project_id
                        ),
                        '[]'::JSON
                    ) AS images,

                    COALESCE(
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'userId',
                                pm.user_id,

                                'name',
                                COALESCE(
                                    pr.display_name,
                                    u.email
                                )
                            )
                            ORDER BY
                                COALESCE(
                                    pr.display_name,
                                    u.email
                                )
                        )
                        FILTER (
                            WHERE
                                pm.user_id
                                IS NOT NULL
                        ),
                        '[]'::JSON
                    ) AS participants

                FROM showcase_submissions ss

                JOIN projects p
                    ON p.project_id =
                        ss.project_id

                LEFT JOIN project_memberships pm
                    ON pm.project_id =
                        p.project_id
                    AND pm.active =
                        TRUE

                LEFT JOIN users u
                    ON u.user_id =
                        pm.user_id

                LEFT JOIN profiles pr
                    ON pr.user_id =
                        u.user_id

                WHERE
                    p.status =
                        'COMPLETED'
                    AND ss.status =
                        'APPROVED'

                GROUP BY
                    ss.showcase_id,
                    p.project_id,
                    p.title,
                    p.description,
                    p.category,
                    p.repository_url,
                    ss.approved_at

                ORDER BY
                    ss.approved_at DESC
            `
        );

    return result.rows;
}


module.exports = {
    getProjectById,
    getActiveProjectLead,
    getSubmissionByProjectId,
    getSubmissionById,
    createSubmission,
    getPendingSubmissions,
    approveSubmission,
    getPublicShowcase
};