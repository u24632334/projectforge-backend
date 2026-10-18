/**
 * Milestone
 * Domain entity for project milestone management (PFG-45).
 *
 * A milestone can be OPEN or COMPLETE.
 * The class owns the rules for valid state transitions and due-date updates.
 */

const { randomUUID } = require('crypto');

const MILESTONE_STATUS = {
    OPEN: 'OPEN',
    COMPLETE: 'COMPLETE'
};

const MAX_MILESTONE_TITLE_LENGTH =
    120;

const MAX_MILESTONE_DESCRIPTION_LENGTH =
    1000;

class Milestone {
    /**
     * Creates a milestone domain object.
     *
     * @param {Object} data
     * @param {string} [data.milestoneId] - Existing milestone ID.
     * @param {string} data.projectId - Project the milestone belongs to.
     * @param {string} data.title - Milestone title.
     * @param {string} data.description - Milestone description.
     * @param {string|null} [data.dueDate=null] - Due date in YYYY-MM-DD format.
     * @param {string} [data.status='OPEN'] - Milestone status.
     */
    constructor({
        milestoneId = randomUUID(),
        projectId,
        title,
        description,
        dueDate = null,
        status = MILESTONE_STATUS.OPEN
    }) {
        if (
            typeof title ===
                "string" &&
            title.length >
                MAX_MILESTONE_TITLE_LENGTH
        ) {
            throw new Error(
                `Maximum characters exceeded. Milestone title may not exceed ${MAX_MILESTONE_TITLE_LENGTH} characters.`
            );
        }

        if (
            typeof description ===
                "string" &&
            description.length >
                MAX_MILESTONE_DESCRIPTION_LENGTH
        ) {
            throw new Error(
                `Maximum characters exceeded. Milestone description may not exceed ${MAX_MILESTONE_DESCRIPTION_LENGTH} characters.`
            );
        }

        this.milestoneId = milestoneId;
        this.projectId = projectId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.status = status;
    }

    /**
     * Updates the milestone due date.
     *
     * @param {string|null} newDueDate - New due date in YYYY-MM-DD format.
     * @returns {boolean} True when the due date was updated.
     */
    UpdateDueDate(newDueDate) {
        if (newDueDate !== null && !this.IsValidDate(newDueDate)) {
            return false;
        }

        this.dueDate = newDueDate;
        return true;
    }

    /**
     * Marks an open milestone as complete.
     *
     * @returns {boolean} True if the milestone was completed.
     */
    MarkComplete() {
        if (this.status !== MILESTONE_STATUS.OPEN) {
            return false;
        }

        this.status = MILESTONE_STATUS.COMPLETE;
        return true;
    }

    /**
     * Reopens a completed milestone.
     *
     * @returns {boolean} True if the milestone was reopened.
     */
    Reopen() {
        if (this.status !== MILESTONE_STATUS.COMPLETE) {
            return false;
        }

        this.status = MILESTONE_STATUS.OPEN;
        return true;
    }

    /**
     * Checks whether a value is a valid YYYY-MM-DD date.
     *
     * @param {string} dateString
     * @returns {boolean}
     */
    IsValidDate(dateString) {
        if (typeof dateString !== 'string') {
            return false;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return false;
        }

        const date = new Date(`${dateString}T00:00:00Z`);

        return !Number.isNaN(date.getTime()) &&
            date.toISOString().startsWith(dateString);
    }
}

module.exports = {
    Milestone,
    MILESTONE_STATUS,
    MAX_MILESTONE_TITLE_LENGTH,
    MAX_MILESTONE_DESCRIPTION_LENGTH
};