const {
    ProjectMembership,
    MEMBER_ROLE
} = require(
    "../models/ProjectMembership"
);


describe(
    "ProjectMembership",
    () => {

        test(
            "AssignPosition assigns a position belonging to the same project",
            () => {

                const membership =
                    new ProjectMembership({
                        membershipId:
                            "membership-1",

                        projectId:
                            "project-1",

                        userId:
                            "user-1"
                    });


                const result =
                    membership
                        .AssignPosition({
                            positionId:
                                "position-1",

                            projectId:
                                "project-1"
                        });


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    membership
                        .positionId
                ).toBe(
                    "position-1"
                );
            }
        );


        test(
            "AssignPosition rejects a position belonging to another project",
            () => {

                const membership =
                    new ProjectMembership({
                        membershipId:
                            "membership-1",

                        projectId:
                            "project-1",

                        userId:
                            "user-1"
                    });


                const result =
                    membership
                        .AssignPosition({
                            positionId:
                                "position-2",

                            projectId:
                                "project-2"
                        });


                expect(
                    result
                ).toBe(
                    false
                );


                expect(
                    membership
                        .positionId
                ).toBeNull();
            }
        );


        test(
            "ChangeMemberRole changes Member to Lead",
            () => {

                const membership =
                    new ProjectMembership({
                        projectId:
                            "project-1",

                        userId:
                            "user-1",

                        memberRole:
                            MEMBER_ROLE.MEMBER
                    });


                const result =
                    membership
                        .ChangeMemberRole(
                            MEMBER_ROLE.LEAD
                        );


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    membership
                        .memberRole
                ).toBe(
                    MEMBER_ROLE.LEAD
                );
            }
        );


        test(
            "ChangeMemberRole changes Lead to Member",
            () => {

                const membership =
                    new ProjectMembership({
                        projectId:
                            "project-1",

                        userId:
                            "user-1",

                        memberRole:
                            MEMBER_ROLE.LEAD
                    });


                const result =
                    membership
                        .ChangeMemberRole(
                            MEMBER_ROLE.MEMBER
                        );


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    membership
                        .memberRole
                ).toBe(
                    MEMBER_ROLE.MEMBER
                );
            }
        );


        test(
            "IsLead returns true for a Lead membership",
            () => {

                const membership =
                    new ProjectMembership({
                        projectId:
                            "project-1",

                        userId:
                            "user-1",

                        memberRole:
                            MEMBER_ROLE.LEAD
                    });


                expect(
                    membership.IsLead()
                ).toBe(
                    true
                );
            }
        );


        test(
            "IsLead returns false for a Member membership",
            () => {

                const membership =
                    new ProjectMembership({
                        projectId:
                            "project-1",

                        userId:
                            "user-1",

                        memberRole:
                            MEMBER_ROLE.MEMBER
                    });


                expect(
                    membership.IsLead()
                ).toBe(
                    false
                );
            }
        );


        test(
            "Deactivate changes an active membership to inactive",
            () => {

                const membership =
                    new ProjectMembership({
                        projectId:
                            "project-1",

                        userId:
                            "user-1",

                        active:
                            true
                    });


                const result =
                    membership
                        .Deactivate();


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    membership.active
                ).toBe(
                    false
                );
            }
        );

    }
);