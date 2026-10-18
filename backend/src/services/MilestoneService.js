/**
 * MilestoneService
 * Application service for project milestone management (PFG-45).
 *
 * Coordinates milestone domain logic and persistence.
 */

const {
    Milestone
} = require(
    "../models/Milestone"
);


/**
 * Provides application-level operations for project milestones.
 */
class MilestoneService {

    /**
     * Creates a milestone service using the supplied repository.
     *
     * @param {Object} repository - Milestone data-access repository.
     */
    constructor(
        repository
    ) {
        this.repository =
            repository;
    }


    /**
     * Creates a new milestone.
     *
     * @param {Object} data - Milestone data.
     * @returns {Promise<Object>} Created milestone.
     */
    async CreateMilestone(
        data
    ) {
        const milestone =
            new Milestone(
                data
            );


        return this
            .repository
            .create(
                milestone
            );
    }


    /**
     * Retrieves all milestones belonging to a project.
     *
     * @param {string} projectId - Project identifier.
     * @returns {Promise<Object[]>} Project milestones.
     */
    async GetMilestonesByProject(
        projectId
    ) {
        return this
            .repository
            .findByProject(
                projectId
            );
    }


    /**
     * Retrieves a milestone by its identifier.
     *
     * @param {string} milestoneId - Milestone identifier.
     * @returns {Promise<Object|null>} Matching milestone or null.
     */
    async GetMilestone(
        milestoneId
    ) {
        return this
            .repository
            .findById(
                milestoneId
            );
    }


    /**
     * Updates the due date of an existing milestone.
     *
     * The milestone domain object is recreated from the
     * persisted data so due-date validation remains inside
     * the domain layer.
     *
     * @param {string} milestoneId - Milestone identifier.
     * @param {string|null} newDueDate - New due date.
     * @returns {Promise<Object|null|boolean>}
     * Updated milestone, null if not found, or false if rejected.
     */
    async UpdateDueDate(
        milestoneId,
        newDueDate
    ) {
        const milestoneData =
            await this
                .repository
                .findById(
                    milestoneId
                );


        if (
            !milestoneData
        ) {
            return null;
        }


        const milestone =
            new Milestone({
                milestoneId:
                    milestoneData
                        .milestone_id,

                projectId:
                    milestoneData
                        .project_id,

                title:
                    milestoneData
                        .title,

                description:
                    milestoneData
                        .description,

                dueDate:
                    milestoneData
                        .due_date,

                status:
                    milestoneData
                        .status
            });


        if (
            !milestone.UpdateDueDate(
                newDueDate
            )
        ) {
            return false;
        }


        return this
            .repository
            .update(
                milestone
            );
    }


    /**
     * Marks an existing milestone as complete.
     *
     * The milestone must belong to the project that was
     * authorised by the route before the state transition
     * may be applied.
     *
     * @param {string} milestoneId - Milestone identifier.
     * @param {string} projectId - Authorised project identifier.
     * @returns {Promise<Object|null|boolean>}
     * Updated milestone, null if not found or wrong project,
     * or false if rejected.
     */
    async MarkMilestoneComplete(
        milestoneId,
        projectId
    ) {
        const milestoneData =
            await this
                .repository
                .findById(
                    milestoneId
                );


        if (
            !milestoneData
        ) {
            return null;
        }


        if (
            milestoneData
                .project_id !==
            projectId
        ) {
            return null;
        }


        const milestone =
            new Milestone({
                milestoneId:
                    milestoneData
                        .milestone_id,

                projectId:
                    milestoneData
                        .project_id,

                title:
                    milestoneData
                        .title,

                description:
                    milestoneData
                        .description,

                dueDate:
                    milestoneData
                        .due_date,

                status:
                    milestoneData
                        .status
            });


        if (
            !milestone.MarkComplete()
        ) {
            return false;
        }


        return this
            .repository
            .update(
                milestone
            );
    }


    /**
     * Reopens an existing completed milestone.
     *
     * The milestone must belong to the project that was
     * authorised by the route before the state transition
     * may be applied.
     *
     * The domain model determines whether the transition
     * itself is valid.
     *
     * COMPLETE -> OPEN is valid.
     * OPEN -> OPEN is rejected.
     *
     * @param {string} milestoneId - Milestone identifier.
     * @param {string} projectId - Authorised project identifier.
     * @returns {Promise<Object|null|boolean>}
     * Updated milestone, null if not found or wrong project,
     * or false if rejected.
     */
    async ReopenMilestone(
        milestoneId,
        projectId
    ) {
        const milestoneData =
            await this
                .repository
                .findById(
                    milestoneId
                );


        if (
            !milestoneData
        ) {
            return null;
        }


        if (
            milestoneData
                .project_id !==
            projectId
        ) {
            return null;
        }


        const milestone =
            new Milestone({
                milestoneId:
                    milestoneData
                        .milestone_id,

                projectId:
                    milestoneData
                        .project_id,

                title:
                    milestoneData
                        .title,

                description:
                    milestoneData
                        .description,

                dueDate:
                    milestoneData
                        .due_date,

                status:
                    milestoneData
                        .status
            });


        if (
            !milestone.Reopen()
        ) {
            return false;
        }


        return this
            .repository
            .update(
                milestone
            );
    }

}


module.exports =
    MilestoneService;