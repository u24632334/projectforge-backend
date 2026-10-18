const POSITION_STATUS = Object.freeze({
    OPEN:
        "OPEN",

    CLOSED:
        "CLOSED"
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


class ProjectPosition {

    constructor({
        positionId = null,
        projectId,
        title,
        description = "",
        status =
            POSITION_STATUS.OPEN
    }) {

        if (
            typeof projectId !==
                "string" ||
            !projectId.trim()
        ) {
            throw new Error(
                "Project position requires a project identifier."
            );
        }


        if (
            typeof title !==
                "string" ||
            !title.trim()
        ) {
            throw new Error(
                "Project position requires a title."
            );
        }


        if (
            typeof description !==
            "string"
        ) {
            throw new Error(
                "Project position description must be text."
            );
        }


        if (
            !Object.values(
                POSITION_STATUS
            ).includes(
                status
            )
        ) {
            throw new Error(
                "Invalid project position status."
            );
        }


        this.positionId =
            positionId;

        this.projectId =
            projectId.trim();

        this.title =
            title.trim();

        this.description =
            description.trim();

        this.status =
            status;
    }


    /**
     * OPEN -> CLOSED
     *
     * Returns false when the position is already closed.
     */
    Close() {
        if (
            this.status !==
            POSITION_STATUS.OPEN
        ) {
            return false;
        }


        this.status =
            POSITION_STATUS.CLOSED;


        return true;
    }


    /**
     * CLOSED -> OPEN
     *
     * A position may only be reopened while its owning
     * project is ACTIVE.
     */
    Reopen(
        projectStatus
    ) {
        if (
            this.status !==
            POSITION_STATUS.CLOSED
        ) {
            return false;
        }


        if (
            projectStatus !==
            PROJECT_STATUS.ACTIVE
        ) {
            return false;
        }


        this.status =
            POSITION_STATUS.OPEN;


        return true;
    }


    /**
     * Returns true only while the position is OPEN.
     */
    IsAvailable() {
        return (
            this.status ===
            POSITION_STATUS.OPEN
        );
    }

}


module.exports = {
    ProjectPosition,
    POSITION_STATUS,
    PROJECT_STATUS
};