const MEMBER_ROLE = Object.freeze({
    LEAD:
        "LEAD",

    MEMBER:
        "MEMBER"
});


class ProjectMembership {

    constructor({
        membershipId = null,
        projectId,
        userId,
        positionId = null,
        memberRole =
            MEMBER_ROLE.MEMBER,
        active = true
    }) {

        if (
            typeof projectId !==
                "string" ||
            !projectId.trim()
        ) {
            throw new Error(
                "Project membership requires a project identifier."
            );
        }


        if (
            typeof userId !==
                "string" ||
            !userId.trim()
        ) {
            throw new Error(
                "Project membership requires a user identifier."
            );
        }


        if (
            !Object.values(
                MEMBER_ROLE
            ).includes(
                memberRole
            )
        ) {
            throw new Error(
                "Invalid project membership role."
            );
        }


        if (
            typeof active !==
            "boolean"
        ) {
            throw new Error(
                "Membership active state must be true or false."
            );
        }


        this.membershipId =
            membershipId;

        this.projectId =
            projectId.trim();

        this.userId =
            userId.trim();

        this.positionId =
            positionId;

        this.memberRole =
            memberRole;

        this.active =
            active;
    }


    /**
     * Assigns a project position to the membership.
     *
     * The position must belong to the same project
     * as the membership.
     */
    AssignPosition(
        position
    ) {
        if (
            !position ||
            typeof position !==
                "object"
        ) {
            return false;
        }


        const positionProjectId =
            position.projectId ||
            position.project_id;


        const positionId =
            position.positionId ||
            position.position_id;


        if (
            typeof positionProjectId !==
                "string" ||
            positionProjectId !==
                this.projectId
        ) {
            return false;
        }


        if (
            typeof positionId !==
                "string" ||
            !positionId.trim()
        ) {
            return false;
        }


        this.positionId =
            positionId.trim();


        return true;
    }


    /**
     * Changes the membership role.
     */
    ChangeMemberRole(
        newRole
    ) {
        if (
            !Object.values(
                MEMBER_ROLE
            ).includes(
                newRole
            )
        ) {
            return false;
        }


        if (
            this.memberRole ===
            newRole
        ) {
            return false;
        }


        this.memberRole =
            newRole;


        return true;
    }


    /**
     * Returns true when this membership represents
     * the Project Lead.
     */
    IsLead() {
        return (
            this.memberRole ===
            MEMBER_ROLE.LEAD
        );
    }


    /**
     * Deactivates an active project membership.
     */
    Deactivate() {
        if (
            !this.active
        ) {
            return false;
        }


        this.active =
            false;


        return true;
    }

}


module.exports = {
    ProjectMembership,
    MEMBER_ROLE
};