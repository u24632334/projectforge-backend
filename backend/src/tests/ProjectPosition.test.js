const {
    ProjectPosition,
    POSITION_STATUS,
    PROJECT_STATUS
} = require(
    "../models/ProjectPosition"
);


describe(
    "ProjectPosition",
    () => {

        test(
            "Close changes an open position to closed",
            () => {

                const position =
                    new ProjectPosition({
                        positionId:
                            "position-1",

                        projectId:
                            "project-1",

                        title:
                            "Backend Developer",

                        description:
                            "Backend development role.",

                        status:
                            POSITION_STATUS.OPEN
                    });


                const result =
                    position.Close();


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    position.status
                ).toBe(
                    POSITION_STATUS.CLOSED
                );
            }
        );


        test(
            "Close rejects an already closed position",
            () => {

                const position =
                    new ProjectPosition({
                        projectId:
                            "project-1",

                        title:
                            "Backend Developer",

                        status:
                            POSITION_STATUS.CLOSED
                    });


                const result =
                    position.Close();


                expect(
                    result
                ).toBe(
                    false
                );


                expect(
                    position.status
                ).toBe(
                    POSITION_STATUS.CLOSED
                );
            }
        );


        test(
            "Reopen changes a closed position on an active project to open",
            () => {

                const position =
                    new ProjectPosition({
                        positionId:
                            "position-1",

                        projectId:
                            "project-1",

                        title:
                            "Backend Developer",

                        status:
                            POSITION_STATUS.CLOSED
                    });


                const result =
                    position.Reopen(
                        PROJECT_STATUS.ACTIVE
                    );


                expect(
                    result
                ).toBe(
                    true
                );


                expect(
                    position.status
                ).toBe(
                    POSITION_STATUS.OPEN
                );
            }
        );


        test(
            "Reopen rejects an open position",
            () => {

                const position =
                    new ProjectPosition({
                        projectId:
                            "project-1",

                        title:
                            "Backend Developer",

                        status:
                            POSITION_STATUS.OPEN
                    });


                const result =
                    position.Reopen(
                        PROJECT_STATUS.ACTIVE
                    );


                expect(
                    result
                ).toBe(
                    false
                );


                expect(
                    position.status
                ).toBe(
                    POSITION_STATUS.OPEN
                );
            }
        );


        test(
            "Reopen rejects a closed position when the project is not active",
            () => {

                const position =
                    new ProjectPosition({
                        projectId:
                            "project-1",

                        title:
                            "Backend Developer",

                        status:
                            POSITION_STATUS.CLOSED
                    });


                const result =
                    position.Reopen(
                        PROJECT_STATUS.COMPLETED
                    );


                expect(
                    result
                ).toBe(
                    false
                );


                expect(
                    position.status
                ).toBe(
                    POSITION_STATUS.CLOSED
                );
            }
        );


        test(
            "IsAvailable returns true for an open position",
            () => {

                const position =
                    new ProjectPosition({
                        projectId:
                            "project-1",

                        title:
                            "Backend Developer",

                        status:
                            POSITION_STATUS.OPEN
                    });


                expect(
                    position.IsAvailable()
                ).toBe(
                    true
                );
            }
        );


        test(
            "IsAvailable returns false for a closed position",
            () => {

                const position =
                    new ProjectPosition({
                        projectId:
                            "project-1",

                        title:
                            "Backend Developer",

                        status:
                            POSITION_STATUS.CLOSED
                    });


                expect(
                    position.IsAvailable()
                ).toBe(
                    false
                );
            }
        );

    }
);