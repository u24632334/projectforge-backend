const TeamRadioRepository =
    require("../db/teamRadioRepository");


describe(
    "TeamRadioRepository",
    () => {

        test(
            "creates an assistance request for an active project membership",
            async () => {
                const query =
                    jest.fn().mockResolvedValue({
                        rows: [
                            {
                                radio_id:
                                    "radio-1",

                                author_membership_id:
                                    "membership-1",

                                category:
                                    "TECHNICAL",

                                message:
                                    "Need help with the deployment.",

                                status:
                                    "OPEN",

                                created_at:
                                    "2026-09-13T10:00:00.000Z"
                            }
                        ]
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository.create({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-1",

                        category:
                            "TECHNICAL",

                        message:
                            "Need help with the deployment.",

                        status:
                            "OPEN"
                    });


                expect(
                    result
                ).toEqual({
                    radio_id:
                        "radio-1",

                    author_membership_id:
                        "membership-1",

                    category:
                        "TECHNICAL",

                    message:
                        "Need help with the deployment.",

                    status:
                        "OPEN",

                    created_at:
                        "2026-09-13T10:00:00.000Z",

                    project_id:
                        "project-1"
                });


                expect(
                    query
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    query.mock.calls[0][1]
                ).toEqual([
                    "membership-1",
                    "TECHNICAL",
                    "Need help with the deployment.",
                    "OPEN",
                    "project-1"
                ]);
            }
        );


        test(
            "returns null when membership is not valid for the project",
            async () => {
                const query =
                    jest.fn().mockResolvedValue({
                        rows: []
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository.create({
                        projectId:
                            "project-1",

                        membershipId:
                            "membership-2",

                        category:
                            "DEPENDENCY",

                        message:
                            "Waiting for another team.",

                        status:
                            "OPEN"
                    });


                expect(
                    result
                ).toBeNull();
            }
        );


        test(
            "returns assistance requests for a project with author display names",
            async () => {
                const requests = [
                    {
                        radio_id:
                            "radio-2",

                        author_membership_id:
                            "membership-2",

                        category:
                            "DEPENDENCY",

                        message:
                            "Waiting for API credentials.",

                        status:
                            "OPEN",

                        created_at:
                            "2026-10-08T08:00:00.000Z",

                        project_id:
                            "project-1",

                        author_display_name:
                            "Sam Student"
                    },

                    {
                        radio_id:
                            "radio-1",

                        author_membership_id:
                            "membership-1",

                        category:
                            "TECHNICAL",

                        message:
                            "Need help with deployment.",

                        status:
                            "RESOLVED",

                        created_at:
                            "2026-10-07T08:00:00.000Z",

                        project_id:
                            "project-1",

                        author_display_name:
                            "Alex Student"
                    }
                ];


                const query =
                    jest.fn().mockResolvedValue({
                        rows:
                            requests
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository
                        .findByProject(
                            "project-1"
                        );


                expect(
                    result
                ).toEqual(
                    requests
                );


                expect(
                    query
                ).toHaveBeenCalledWith(
                    expect.stringContaining(
                        "FROM team_radio_requests tr"
                    ),
                    [
                        "project-1"
                    ]
                );


                expect(
                    query.mock.calls[0][0]
                ).toMatch(
                    /p\.display_name\s+AS author_display_name/i
                );


                expect(
                    query.mock.calls[0][0]
                ).toMatch(
                    /pm\.project_id\s*=\s*\$1/i
                );
            }
        );


        test(
            "returns an empty list when a project has no assistance requests",
            async () => {
                const query =
                    jest.fn().mockResolvedValue({
                        rows: []
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository
                        .findByProject(
                            "project-1"
                        );


                expect(
                    result
                ).toEqual([]);
            }
        );


        test(
            "findById returns a request only from the specified project",
            async () => {
                const request = {
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


                const query =
                    jest.fn().mockResolvedValue({
                        rows: [
                            request
                        ]
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository
                        .findById(
                            "project-1",
                            "radio-1"
                        );


                expect(
                    result
                ).toEqual(
                    request
                );


                expect(
                    query
                ).toHaveBeenCalledWith(
                    expect.any(String),
                    [
                        "project-1",
                        "radio-1"
                    ]
                );


                const sql =
                    query.mock.calls[0][0];


                expect(
                    sql
                ).toMatch(
                    /tr\.radio_id\s*=\s*\$2/i
                );


                expect(
                    sql
                ).toMatch(
                    /pm\.project_id\s*=\s*\$1/i
                );


                expect(
                    sql
                ).toMatch(
                    /pm\.active\s*=\s*TRUE/i
                );
            }
        );


        test(
            "findById returns null when the request is not in the project",
            async () => {
                const query =
                    jest.fn().mockResolvedValue({
                        rows: []
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository
                        .findById(
                            "project-1",
                            "radio-missing"
                        );


                expect(
                    result
                ).toBeNull();
            }
        );


        test(
            "transitionStatus resolves an OPEN request using a conditional update",
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


                const query =
                    jest.fn().mockResolvedValue({
                        rows: [
                            resolvedRequest
                        ]
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository
                        .transitionStatus({
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
                    result
                ).toEqual(
                    resolvedRequest
                );


                expect(
                    query
                ).toHaveBeenCalledWith(
                    expect.any(String),
                    [
                        "project-1",
                        "radio-1",
                        "OPEN",
                        "RESOLVED"
                    ]
                );


                const sql =
                    query.mock.calls[0][0];


                expect(
                    sql
                ).toMatch(
                    /SET\s+status\s*=\s*\$4/i
                );


                expect(
                    sql
                ).toMatch(
                    /tr\.radio_id\s*=\s*\$2/i
                );


                expect(
                    sql
                ).toMatch(
                    /pm\.project_id\s*=\s*\$1/i
                );


                expect(
                    sql
                ).toMatch(
                    /tr\.status\s*=\s*\$3/i
                );


                expect(
                    sql
                ).toMatch(
                    /pm\.active\s*=\s*TRUE/i
                );
            }
        );


        test(
            "transitionStatus reopens a RESOLVED request using the expected states",
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


                const query =
                    jest.fn().mockResolvedValue({
                        rows: [
                            reopenedRequest
                        ]
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository
                        .transitionStatus({
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
                    result
                ).toEqual(
                    reopenedRequest
                );


                expect(
                    query.mock.calls[0][1]
                ).toEqual([
                    "project-1",
                    "radio-1",
                    "RESOLVED",
                    "OPEN"
                ]);
            }
        );


        test(
            "transitionStatus returns null when the expected source status no longer matches",
            async () => {
                const query =
                    jest.fn().mockResolvedValue({
                        rows: []
                    });


                const repository =
                    new TeamRadioRepository({
                        query
                    });


                const result =
                    await repository
                        .transitionStatus({
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
                    result
                ).toBeNull();


                expect(
                    query
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );

    }
);