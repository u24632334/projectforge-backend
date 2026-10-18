const AUDIT_TARGET_TYPE =
    Object.freeze({
        USER:
            "USER",

        PROJECT:
            "PROJECT",

        REPORT:
            "REPORT"
    });


class AuditLog {

    constructor({
        auditId = null,
        adminUserId,
        actionType,
        targetType,
        targetId,
        details = {}
    }) {
        this.auditId =
            auditId;

        this.adminUserId =
            adminUserId;

        this.actionType =
            actionType;

        this.targetType =
            targetType;

        this.targetId =
            targetId;

        this.details =
            details;
    }


    static Record({
        administrator,
        actionType,
        targetType,
        targetId,
        details = {}
    }) {
        if (
            !administrator ||
            typeof administrator !==
                "object"
        ) {
            return null;
        }


        const adminUserId =
            administrator.userId ||
            administrator.id;


        const adminRole =
            administrator.systemRole ||
            administrator.role;


        if (
            typeof adminUserId !==
                "string" ||
            !adminUserId.trim() ||
            adminRole !==
                "ADMIN"
        ) {
            return null;
        }


        if (
            typeof actionType !==
                "string" ||
            !actionType.trim()
        ) {
            return null;
        }


        if (
            !Object.values(
                AUDIT_TARGET_TYPE
            ).includes(
                targetType
            )
        ) {
            return null;
        }


        if (
            typeof targetId !==
                "string" ||
            !targetId.trim()
        ) {
            return null;
        }


        return new AuditLog({
            adminUserId:
                adminUserId.trim(),

            actionType:
                actionType.trim(),

            targetType,

            targetId:
                targetId.trim(),

            details:
                details &&
                typeof details ===
                    "object"
                    ? details
                    : {}
        });
    }

}


module.exports = {
    AuditLog,
    AUDIT_TARGET_TYPE
};