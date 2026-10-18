const {
    AuditLog,
    AUDIT_TARGET_TYPE
} = require(
    "../models/AuditLog"
);


describe(
    "AuditLog",
    () => {

        test(
            "Record creates an audit record for a valid administrator action and target",
            () => {

                const record =
                    AuditLog.Record({
                        administrator: {
                            userId:
                                "admin-1",

                            role:
                                "ADMIN"
                        },

                        actionType:
                            "USER_SUSPENDED",

                        targetType:
                            AUDIT_TARGET_TYPE.USER,

                        targetId:
                            "user-1",

                        details: {
                            reason:
                                "Policy violation"
                        }
                    });


                expect(
                    record
                ).toBeInstanceOf(
                    AuditLog
                );


                expect(
                    record
                ).toEqual(
                    expect.objectContaining({
                        adminUserId:
                            "admin-1",

                        actionType:
                            "USER_SUSPENDED",

                        targetType:
                            "USER",

                        targetId:
                            "user-1",

                        details: {
                            reason:
                                "Policy violation"
                        }
                    })
                );
            }
        );


        test(
            "Record rejects a blank action",
            () => {

                const record =
                    AuditLog.Record({
                        administrator: {
                            userId:
                                "admin-1",

                            role:
                                "ADMIN"
                        },

                        actionType:
                            "   ",

                        targetType:
                            AUDIT_TARGET_TYPE.USER,

                        targetId:
                            "user-1"
                    });


                expect(
                    record
                ).toBeNull();
            }
        );

    }
);