/**
 * Team Radio Repository
 *
 * Database operations for project assistance
 * requests (PFG-54).
 */
class TeamRadioRepository {

    constructor(
        pool
    ) {
        this.pool =
            pool;
    }


    /**
     * Creates an assistance request for an active member
     * of the requested project.
     */
    async create(
        request
    ) {
        const {
            rows
        } =
            await this.pool.query(
                `
                    INSERT INTO team_radio_requests (
                        author_membership_id,
                        category,
                        message,
                        status
                    )

                    SELECT
                        pm.membership_id,
                        $2,
                        $3,
                        $4

                    FROM project_memberships pm

                    WHERE
                        pm.membership_id = $1
                        AND pm.project_id = $5
                        AND pm.active = TRUE

                    RETURNING
                        radio_id,
                        author_membership_id,
                        category,
                        message,
                        status,
                        created_at
                `,
                [
                    request
                        .membershipId,

                    request
                        .category,

                    request
                        .message,

                    request
                        .status,

                    request
                        .projectId
                ]
            );


        if (
            rows.length ===
            0
        ) {
            return null;
        }


        return {
            ...rows[0],

            project_id:
                request.projectId
        };
    }


    /**
     * Returns all assistance requests belonging
     * to a project.
     *
     * Project ownership is determined through the
     * author's active project membership.
     *
     * The author's profile display name is included
     * so the frontend does not need to display
     * membership IDs.
     */
    async findByProject(
        projectId
    ) {
        const {
            rows
        } =
            await this.pool.query(
                `
                    SELECT
                        tr.radio_id,
                        tr.author_membership_id,
                        tr.category,
                        tr.message,
                        tr.status,
                        tr.created_at,
                        pm.project_id,
                        p.display_name
                            AS author_display_name

                    FROM team_radio_requests tr

                    JOIN project_memberships pm
                        ON pm.membership_id =
                           tr.author_membership_id

                    JOIN profiles p
                        ON p.user_id =
                           pm.user_id

                    WHERE
                        pm.project_id = $1
                        AND pm.active = TRUE

                    ORDER BY
                        tr.created_at DESC,
                        tr.radio_id DESC
                `,
                [
                    projectId
                ]
            );


        return rows;
    }


    /**
     * Finds one Team Radio request belonging to
     * the specified project.
     *
     * This is used after a failed conditional status
     * transition to distinguish:
     *
     * - request not found; from
     * - request already being in the target state.
     */
    async findById(
        projectId,
        requestId
    ) {
        const {
            rows
        } =
            await this.pool.query(
                `
                    SELECT
                        tr.radio_id,
                        tr.author_membership_id,
                        tr.category,
                        tr.message,
                        tr.status,
                        tr.created_at,
                        pm.project_id

                    FROM team_radio_requests tr

                    JOIN project_memberships pm
                        ON pm.membership_id =
                           tr.author_membership_id

                    WHERE
                        tr.radio_id = $2
                        AND pm.project_id = $1
                        AND pm.active = TRUE

                    LIMIT 1
                `,
                [
                    projectId,
                    requestId
                ]
            );


        return (
            rows[0] ||
            null
        );
    }


    /**
     * Performs a conditional Team Radio status
     * transition.
     *
     * The UPDATE succeeds only if:
     *
     * - the request belongs to the supplied project;
     * - the author's project membership is active; and
     * - the request is still in the expected source state.
     *
     * This means two concurrent attempts to perform
     * the same transition cannot both succeed.
     *
     * Example:
     *
     * OPEN -> RESOLVED
     *
     * or:
     *
     * RESOLVED -> OPEN
     */
    async transitionStatus({
        projectId,
        requestId,
        fromStatus,
        toStatus
    }) {
        const {
            rows
        } =
            await this.pool.query(
                `
                    UPDATE team_radio_requests tr

                    SET
                        status = $4

                    FROM project_memberships pm

                    WHERE
                        tr.radio_id = $2
                        AND tr.author_membership_id =
                            pm.membership_id
                        AND pm.project_id = $1
                        AND pm.active = TRUE
                        AND tr.status = $3

                    RETURNING
                        tr.radio_id,
                        tr.author_membership_id,
                        tr.category,
                        tr.message,
                        tr.status,
                        tr.created_at,
                        pm.project_id
                `,
                [
                    projectId,
                    requestId,
                    fromStatus,
                    toStatus
                ]
            );


        return (
            rows[0] ||
            null
        );
    }

}


module.exports =
    TeamRadioRepository;