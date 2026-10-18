const {
    ShowcaseEntry,
    SHOWCASE_STATUS,
    PROJECT_STATUS
} = require(
    "../models/ShowcaseEntry"
);


describe(
    "ShowcaseEntry",
    () => {

        test(
            "Submit changes a draft entry for a completed project to pending",
            () => {

                const entry =
                    new ShowcaseEntry({
                        showcaseId:
                            "showcase-1",

                        projectId:
                            "project-1"
                    });


                const result =
                    entry.Submit(
                        PROJECT_STATUS.COMPLETED
                    );


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    entry.status
                ).toBe(
                    SHOWCASE_STATUS.PENDING
                );
            }
        );


        test(
            "Submit rejects a project that is not completed",
            () => {

                const entry =
                    new ShowcaseEntry({
                        showcaseId:
                            "showcase-1",

                        projectId:
                            "project-1"
                    });


                const result =
                    entry.Submit(
                        PROJECT_STATUS.ACTIVE
                    );


                expect(
                    result
                ).toBe(
                    false
                );


                expect(
                    entry.status
                ).toBe(
                    SHOWCASE_STATUS.DRAFT
                );
            }
        );


        test(
            "Approve changes a pending entry to approved for a valid administrator",
            () => {

                const entry =
                    new ShowcaseEntry({
                        projectId:
                            "project-1",

                        status:
                            SHOWCASE_STATUS.PENDING
                    });


                const result =
                    entry.Approve({
                        userId:
                            "admin-1",

                        role:
                            "ADMIN"
                    });


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    entry.status
                ).toBe(
                    SHOWCASE_STATUS.APPROVED
                );


                expect(
                    entry.approvedByAdminUserId
                ).toBe(
                    "admin-1"
                );
            }
        );


        test(
            "Approve rejects an entry that is not pending",
            () => {

                const entry =
                    new ShowcaseEntry({
                        projectId:
                            "project-1",

                        status:
                            SHOWCASE_STATUS.APPROVED
                    });


                const result =
                    entry.Approve({
                        userId:
                            "admin-1",

                        role:
                            "ADMIN"
                    });


                expect(
                    result
                ).toBe(
                    false
                );


                expect(
                    entry.status
                ).toBe(
                    SHOWCASE_STATUS.APPROVED
                );
            }
        );


        test(
            "Publish changes an approved entry to published",
            () => {

                const entry =
                    new ShowcaseEntry({
                        projectId:
                            "project-1",

                        status:
                            SHOWCASE_STATUS.APPROVED
                    });


                const result =
                    entry.Publish();


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    entry.status
                ).toBe(
                    SHOWCASE_STATUS.PUBLISHED
                );
            }
        );


        test(
            "Publish rejects a pending entry",
            () => {

                const entry =
                    new ShowcaseEntry({
                        projectId:
                            "project-1",

                        status:
                            SHOWCASE_STATUS.PENDING
                    });


                const result =
                    entry.Publish();


                expect(
                    result
                ).toBe(
                    false
                );


                expect(
                    entry.status
                ).toBe(
                    SHOWCASE_STATUS.PENDING
                );
            }
        );


        test(
            "Unpublish changes a published entry back to approved",
            () => {

                const entry =
                    new ShowcaseEntry({
                        projectId:
                            "project-1",

                        status:
                            SHOWCASE_STATUS.PUBLISHED
                    });


                const result =
                    entry.Unpublish();


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    entry.status
                ).toBe(
                    SHOWCASE_STATUS.APPROVED
                );
            }
        );

    }
);