const {
    TeamRadioRequest,
    RADIO_STATUS,
    MAX_TEAM_RADIO_MESSAGE_LENGTH
} =
    require(
        "../models/TeamRadioRequest"
    );


describe(
    "TeamRadioRequest",
    () => {

        test(
            "creates a valid assistance request",
            () => {

                const request =
                    new TeamRadioRequest({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-1",

                        category:
                            "TECHNICAL",

                        message:
                            "I need assistance with the deployment."
                    });


                expect(
                    request.projectId
                ).toBe(
                    "project-1"
                );


                expect(
                    request.membershipId
                ).toBe(
                    "membership-1"
                );


                expect(
                    request.message
                ).toBe(
                    "I need assistance with the deployment."
                );


                expect(
                    request.status
                ).toBe(
                    RADIO_STATUS.OPEN
                );
            }
        );


        test(
            "defaults status to OPEN",
            () => {

                const request =
                    new TeamRadioRequest({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-1",

                        category:
                            "TECHNICAL",

                        message:
                            "Blocked on an issue."
                    });


                expect(
                    request.status
                ).toBe(
                    "OPEN"
                );
            }
        );


        test(
            "rejects missing project ID",
            () => {

                expect(
                    () => {
                        new TeamRadioRequest({
                            membershipId:
                                "membership-1",

                            category:
                                "TECHNICAL",

                            message:
                                "Need help."
                        });
                    }
                ).toThrow(
                    "Project ID is required."
                );
            }
        );


        test(
            "rejects missing membership ID",
            () => {

                expect(
                    () => {
                        new TeamRadioRequest({
                            projectId:
                                "project-1",

                            category:
                                "TECHNICAL",

                            message:
                                "Need help."
                        });
                    }
                ).toThrow(
                    "Membership ID is required."
                );
            }
        );


        test(
            "rejects empty message",
            () => {

                expect(
                    () => {
                        new TeamRadioRequest({
                            projectId:
                                "project-1",

                            membershipId:
                                "membership-1",

                            category:
                                "TECHNICAL",

                            message:
                                "   "
                        });
                    }
                ).toThrow(
                    "Assistance request message is required."
                );
            }
        );


        test(
            "rejects malformed non-string message without crashing",
            () => {

                expect(
                    () => {
                        new TeamRadioRequest({
                            projectId:
                                "project-1",

                            membershipId:
                                "membership-1",

                            category:
                                "TECHNICAL",

                            message: {
                                text:
                                    "Need help."
                            }
                        });
                    }
                ).toThrow(
                    "Assistance request message is required."
                );
            }
        );


        test(
            "accepts a message exactly at the 1000-character boundary",
            () => {

                const message =
                    "A".repeat(
                        MAX_TEAM_RADIO_MESSAGE_LENGTH
                    );


                const request =
                    new TeamRadioRequest({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-1",

                        category:
                            "TECHNICAL",

                        message
                    });


                expect(
                    request.message.length
                ).toBe(
                    1000
                );
            }
        );


        test(
            "rejects a message longer than 1000 characters",
            () => {

                const message =
                    "A".repeat(
                        MAX_TEAM_RADIO_MESSAGE_LENGTH +
                        1
                    );


                expect(
                    () => {
                        new TeamRadioRequest({
                            projectId:
                                "project-1",

                            membershipId:
                                "membership-1",

                            category:
                                "TECHNICAL",

                            message
                        });
                    }
                ).toThrow(
                    "Maximum characters exceeded. Assistance request message may not exceed 1000 characters."
                );
            }
        );


        test(
            "rejects invalid status",
            () => {

                expect(
                    () => {
                        new TeamRadioRequest({
                            projectId:
                                "project-1",

                            membershipId:
                                "membership-1",

                            message:
                                "Need help.",

                            category:
                                "TECHNICAL",

                            status:
                                "INVALID"
                        });
                    }
                ).toThrow(
                    "Invalid radio request status."
                );
            }
        );


        test(
            "rejects invalid category",
            () => {

                expect(
                    () => {
                        new TeamRadioRequest({
                            projectId:
                                "project-1",

                            membershipId:
                                "membership-1",

                            category:
                                "INVALID",

                            message:
                                "Need help."
                        });
                    }
                ).toThrow(
                    "Invalid assistance request category."
                );
            }
        );

    }
);