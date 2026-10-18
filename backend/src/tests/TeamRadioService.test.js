const TeamRadioService =
    require("../services/TeamRadioService");


describe(
    "TeamRadioService",
    () => {

        test(
            "creates an assistance request",
            async () => {
                const repository = {
                    create:
                        jest.fn().mockResolvedValue({
                            radio_id:
                                "radio-1",

                            author_membership_id:
                                "membership-1",

                            category:
                                "TECHNICAL",

                            message:
                                "Need help with deployment.",

                            status:
                                "OPEN",

                            project_id:
                                "project-1"
                        }),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn(),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                const result =
                    await service.CreateRequest({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-1",

                        category:
                            "TECHNICAL",

                        message:
                            "Need help with deployment."
                    });


                expect(
                    result.radio_id
                ).toBe(
                    "radio-1"
                );

                expect(
                    result.category
                ).toBe(
                    "TECHNICAL"
                );

                expect(
                    result.status
                ).toBe(
                    "OPEN"
                );

                expect(
                    repository.create
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "returns null when repository cannot create the request",
            async () => {
                const repository = {
                    create:
                        jest.fn()
                            .mockResolvedValue(
                                null
                            ),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn(),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                const result =
                    await service.CreateRequest({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-1",

                        category:
                            "DEPENDENCY",

                        message:
                            "Waiting for another team."
                    });


                expect(
                    result
                ).toBeNull();
            }
        );


        test(
            "rejects invalid assistance request data",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn(),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                await expect(
                    service.CreateRequest({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-1",

                        category:
                            "INVALID",

                        message:
                            "Need help."
                    })
                ).rejects.toThrow(
                    "Invalid assistance request category."
                );


                expect(
                    repository.create
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "retrieves assistance requests for a project",
            async () => {
                const requests = [
                    {
                        radio_id:
                            "radio-1",

                        author_membership_id:
                            "membership-1",

                        author_display_name:
                            "Alex Student",

                        category:
                            "TECHNICAL",

                        message:
                            "Need help.",

                        status:
                            "OPEN",

                        project_id:
                            "project-1"
                    }
                ];


                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn()
                            .mockResolvedValue(
                                requests
                            ),

                    transitionStatus:
                        jest.fn(),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                const result =
                    await service
                        .GetRequestsByProject(
                            "project-1"
                        );


                expect(
                    repository.findByProject
                ).toHaveBeenCalledWith(
                    "project-1"
                );


                expect(
                    result
                ).toEqual(
                    requests
                );
            }
        );


        test(
            "returns an empty list when the project has no assistance requests",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn()
                            .mockResolvedValue(
                                []
                            ),

                    transitionStatus:
                        jest.fn(),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                const result =
                    await service
                        .GetRequestsByProject(
                            "project-1"
                        );


                expect(
                    result
                ).toEqual(
                    []
                );
            }
        );


        test(
            "resolves an OPEN assistance request",
            async () => {
                const resolvedRequest = {
                    radio_id:
                        "radio-1",

                    author_membership_id:
                        "membership-1",

                    category:
                        "TECHNICAL",

                    message:
                        "Need help.",

                    status:
                        "RESOLVED",

                    project_id:
                        "project-1"
                };


                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn()
                            .mockResolvedValue(
                                resolvedRequest
                            ),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                const result =
                    await service
                        .ResolveRequest({
                            projectId:
                                "project-1",

                            requestId:
                                "radio-1"
                        });


                expect(
                    repository.transitionStatus
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestId:
                        "radio-1",

                    fromStatus:
                        "OPEN",

                    toStatus:
                        "RESOLVED"
                });


                expect(
                    repository.findById
                ).not.toHaveBeenCalled();


                expect(
                    result
                ).toEqual(
                    resolvedRequest
                );
            }
        );


        test(
            "rejects resolving an already RESOLVED request",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn()
                            .mockResolvedValue(
                                null
                            ),

                    findById:
                        jest.fn()
                            .mockResolvedValue({
                                radio_id:
                                    "radio-1",

                                status:
                                    "RESOLVED",

                                project_id:
                                    "project-1"
                            })
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                let caughtError;


                try {
                    await service
                        .ResolveRequest({
                            projectId:
                                "project-1",

                            requestId:
                                "radio-1"
                        });
                } catch (error) {
                    caughtError =
                        error;
                }


                expect(
                    caughtError
                ).toBeDefined();


                expect(
                    caughtError.message
                ).toBe(
                    "Assistance request is already resolved."
                );


                expect(
                    caughtError.statusCode
                ).toBe(
                    409
                );


                expect(
                    repository.findById
                ).toHaveBeenCalledWith(
                    "project-1",
                    "radio-1"
                );
            }
        );


        test(
            "returns 404 when resolving a request that does not exist in the project",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn()
                            .mockResolvedValue(
                                null
                            ),

                    findById:
                        jest.fn()
                            .mockResolvedValue(
                                null
                            )
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                let caughtError;


                try {
                    await service
                        .ResolveRequest({
                            projectId:
                                "project-1",

                            requestId:
                                "radio-missing"
                        });
                } catch (error) {
                    caughtError =
                        error;
                }


                expect(
                    caughtError
                ).toBeDefined();


                expect(
                    caughtError.message
                ).toBe(
                    "Assistance request not found."
                );


                expect(
                    caughtError.statusCode
                ).toBe(
                    404
                );
            }
        );


        test(
            "reopens a RESOLVED assistance request",
            async () => {
                const reopenedRequest = {
                    radio_id:
                        "radio-1",

                    author_membership_id:
                        "membership-1",

                    category:
                        "TECHNICAL",

                    message:
                        "Need help.",

                    status:
                        "OPEN",

                    project_id:
                        "project-1"
                };


                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn()
                            .mockResolvedValue(
                                reopenedRequest
                            ),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                const result =
                    await service
                        .ReopenRequest({
                            projectId:
                                "project-1",

                            requestId:
                                "radio-1"
                        });


                expect(
                    repository.transitionStatus
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestId:
                        "radio-1",

                    fromStatus:
                        "RESOLVED",

                    toStatus:
                        "OPEN"
                });


                expect(
                    repository.findById
                ).not.toHaveBeenCalled();


                expect(
                    result
                ).toEqual(
                    reopenedRequest
                );
            }
        );


        test(
            "rejects reopening an already OPEN request",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn()
                            .mockResolvedValue(
                                null
                            ),

                    findById:
                        jest.fn()
                            .mockResolvedValue({
                                radio_id:
                                    "radio-1",

                                status:
                                    "OPEN",

                                project_id:
                                    "project-1"
                            })
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                let caughtError;


                try {
                    await service
                        .ReopenRequest({
                            projectId:
                                "project-1",

                            requestId:
                                "radio-1"
                        });
                } catch (error) {
                    caughtError =
                        error;
                }


                expect(
                    caughtError
                ).toBeDefined();


                expect(
                    caughtError.message
                ).toBe(
                    "Assistance request is already open."
                );


                expect(
                    caughtError.statusCode
                ).toBe(
                    409
                );


                expect(
                    repository.findById
                ).toHaveBeenCalledWith(
                    "project-1",
                    "radio-1"
                );
            }
        );


        test(
            "returns 404 when reopening a request that does not exist in the project",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn()
                            .mockResolvedValue(
                                null
                            ),

                    findById:
                        jest.fn()
                            .mockResolvedValue(
                                null
                            )
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                let caughtError;


                try {
                    await service
                        .ReopenRequest({
                            projectId:
                                "project-1",

                            requestId:
                                "radio-missing"
                        });
                } catch (error) {
                    caughtError =
                        error;
                }


                expect(
                    caughtError
                ).toBeDefined();


                expect(
                    caughtError.message
                ).toBe(
                    "Assistance request not found."
                );


                expect(
                    caughtError.statusCode
                ).toBe(
                    404
                );
            }
        );


        test(
            "rejects resolving without a project ID before calling the repository",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn(),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                let caughtError;


                try {
                    await service
                        .ResolveRequest({
                            projectId:
                                "",

                            requestId:
                                "radio-1"
                        });
                } catch (error) {
                    caughtError =
                        error;
                }


                expect(
                    caughtError.message
                ).toBe(
                    "Project ID is required."
                );


                expect(
                    caughtError.statusCode
                ).toBe(
                    400
                );


                expect(
                    repository.transitionStatus
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects reopening without an assistance request ID before calling the repository",
            async () => {
                const repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    transitionStatus:
                        jest.fn(),

                    findById:
                        jest.fn()
                };


                const service =
                    new TeamRadioService(
                        repository
                    );


                let caughtError;


                try {
                    await service
                        .ReopenRequest({
                            projectId:
                                "project-1",

                            requestId:
                                ""
                        });
                } catch (error) {
                    caughtError =
                        error;
                }


                expect(
                    caughtError.message
                ).toBe(
                    "Assistance request ID is required."
                );


                expect(
                    caughtError.statusCode
                ).toBe(
                    400
                );


                expect(
                    repository.transitionStatus
                ).not.toHaveBeenCalled();
            }
        );

    }
);