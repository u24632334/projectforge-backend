/**
 * requireProjectMembership
 * Authorisation middleware for the project workspace (PFG-46).
 *
 * Confirms that the authenticated user holds an active membership of the
 * project named in the route before any workspace data is served.
 *
 * authGuard must run first so that req.user carries the decoded JWT.
 * On success the membership is attached to req.membership, so handlers
 * further down the chain do not have to look it up a second time.
 *
 * The membership lookup is injected rather than imported, so the
 * middleware can be unit-tested without a database:
 *
 *   const { pool } = require('../config/db');
 *   const {
 *       BuildRequireProjectMembership,
 *       CreateMembershipLookup
 *   } = require('../middleware/requireProjectMembership');
 *
 *   const requireMember = BuildRequireProjectMembership(
 *       CreateMembershipLookup(pool)
 *   );
 */

const MEMBER_ROLE = {
    LEAD: 'LEAD',
    MEMBER: 'MEMBER'
};

/**
 * Builds a lookup function backed by a pg pool.
 *
 * Only active memberships are returned, so a member who has left the
 * project is treated exactly like somebody who never joined it.
 *
 * @param {Object} pool - A pg Pool, or any object exposing query().
 * @returns {function(string, string): Promise<Object|null>}
 */
function CreateMembershipLookup(pool) {
    return async function FindActiveMembership(projectId, userId) {
        const { rows } = await pool.query(
            `SELECT membership_id, project_id, user_id, member_role, active
             FROM project_memberships
             WHERE project_id = $1 AND user_id = $2 AND active = TRUE`,
            [projectId, userId]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        return {
            membershipId: row.membership_id,
            projectId: row.project_id,
            userId: row.user_id,
            memberRole: row.member_role,
            active: row.active
        };
    };
}

/**
 * Builds the membership authorisation middleware.
 *
 * @param {function(string, string): Promise<Object|null>} findMembership
 *        Resolves to the caller's active membership, or null.
 * @param {Object} [options]
 * @param {boolean} [options.requireLead=false] - Restrict to the Project Lead.
 * @returns {function} Express middleware.
 */
function BuildRequireProjectMembership(findMembership, options = {}) {
    const requireLead = options.requireLead === true;

    return async function requireProjectMembership(req, res, next) {
        // Normally already caught by authGuard, but checked here so the
        // middleware is safe to mount on its own.
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        const projectId = req.params.id || req.params.projectId;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: 'Project identifier is required.'
            });
        }

        try {
            const membership = await findMembership(projectId, req.user.id);

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'You are not a member of this project.'
                });
            }

            if (requireLead && membership.memberRole !== MEMBER_ROLE.LEAD) {
                return res.status(403).json({
                    success: false,
                    error: 'Project Lead access required.'
                });
            }

            req.membership = membership;
            return next();
        } catch (err) {
            return next(err);
        }
    };
}

module.exports = {
    BuildRequireProjectMembership,
    CreateMembershipLookup,
    MEMBER_ROLE
};