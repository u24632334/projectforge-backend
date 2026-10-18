const SHOWCASE_STATUS = Object.freeze({
    DRAFT:
        "DRAFT",

    PENDING:
        "PENDING",

    APPROVED:
        "APPROVED",

    PUBLISHED:
        "PUBLISHED"
});


const PROJECT_STATUS = Object.freeze({
    DRAFT:
        "DRAFT",

    ACTIVE:
        "ACTIVE",

    COMPLETED:
        "COMPLETED",

    ARCHIVED:
        "ARCHIVED"
});


class ShowcaseEntry {

    constructor({
        showcaseId = null,
        projectId,
        status =
            SHOWCASE_STATUS.DRAFT,
        approvedByAdminUserId = null
    }) {

        if (
            typeof projectId !==
                "string" ||
            !projectId.trim()
        ) {
            throw new Error(
                "Showcase entry requires a project identifier."
            );
        }


        if (
            !Object.values(
                SHOWCASE_STATUS
            ).includes(
                status
            )
        ) {
            throw new Error(
                "Invalid showcase status."
            );
        }


        this.showcaseId =
            showcaseId;

        this.projectId =
            projectId.trim();

        this.status =
            status;

        this.approvedByAdminUserId =
            approvedByAdminUserId;
    }


    /**
     * DRAFT -> PENDING
     *
     * Only a completed project may be submitted
     * for showcase review.
     */
    Submit(
        projectStatus
    ) {
        if (
            this.status !==
            SHOWCASE_STATUS.DRAFT
        ) {
            return false;
        }


        if (
            projectStatus !==
            PROJECT_STATUS.COMPLETED
        ) {
            return false;
        }


        this.status =
            SHOWCASE_STATUS.PENDING;


        return true;
    }


    /**
     * PENDING -> APPROVED
     *
     * Approval requires a valid administrator.
     */
    Approve(
        administrator
    ) {
        if (
            this.status !==
            SHOWCASE_STATUS.PENDING
        ) {
            return false;
        }


        if (
            !administrator ||
            typeof administrator !==
                "object"
        ) {
            return false;
        }


        const administratorId =
            administrator.userId ||
            administrator.id;


        const administratorRole =
            administrator.systemRole ||
            administrator.role;


        if (
            typeof administratorId !==
                "string" ||
            !administratorId.trim() ||
            administratorRole !==
                "ADMIN"
        ) {
            return false;
        }


        this.status =
            SHOWCASE_STATUS.APPROVED;

        this.approvedByAdminUserId =
            administratorId.trim();


        return true;
    }


    /**
     * APPROVED -> PUBLISHED
     */
    Publish() {
        if (
            this.status !==
            SHOWCASE_STATUS.APPROVED
        ) {
            return false;
        }


        this.status =
            SHOWCASE_STATUS.PUBLISHED;


        return true;
    }


    /**
     * PUBLISHED -> APPROVED
     */
    Unpublish() {
        if (
            this.status !==
            SHOWCASE_STATUS.PUBLISHED
        ) {
            return false;
        }


        this.status =
            SHOWCASE_STATUS.APPROVED;


        return true;
    }

}


module.exports = {
    ShowcaseEntry,
    SHOWCASE_STATUS,
    PROJECT_STATUS
};