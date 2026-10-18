/**
 * Project Member Controller
 * Provides active project-member data required by
 * authenticated workspace features such as task assignment.
 */

const db = require("../config/db");

const pool = db.pool || db;


/**
 * GET /api/projects/:id/members
 *
 * Returns active members of a project.
 *
 * Access to this controller is protected by the route's
 * authentication and project-membership middleware.
 */
async function getProjectMembers(req, res, next) {
    try {
        const projectId =
            req.params.id;

        const result =
            await pool.query(
                `
                    SELECT
                        pm.membership_id
                            AS "membershipId",

                        pm.user_id
                            AS "userId",

                        p.display_name
                            AS "displayName",

                        pm.member_role
                            AS "memberRole",

                        pp.title
                            AS "positionTitle"

                    FROM project_memberships pm

                    JOIN profiles p
                        ON p.user_id =
                           pm.user_id

                    LEFT JOIN project_positions pp
                        ON pp.position_id =
                           pm.position_id

                    WHERE
                        pm.project_id = $1
                        AND pm.active = TRUE

                    ORDER BY
                        CASE
                            WHEN pm.member_role = 'LEAD'
                            THEN 0
                            ELSE 1
                        END,
                        p.display_name ASC;
                `,
                [projectId]
            );

        return res.status(200).json({
            success: true,
            members: result.rows
        });
    } catch (error) {
        return next(error);
    }
}


module.exports = {
    getProjectMembers
};