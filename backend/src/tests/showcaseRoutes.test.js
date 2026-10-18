jest.mock(
    "../middleware/authGuard",
    () => (
        req,
        res,
        next
    ) => {
        const authorization =
            req.headers
                .authorization;


        if (
            !authorization
        ) {
            return res
                .status(401)
                .json({
                    error:
                        "Authentication required."
                });
        }


        req.user = {
            id:
                authorization ===
                "Bearer admin-token"
                    ? "admin-1"
                    : "user-1",

            role:
                authorization ===
                "Bearer admin-token"
                    ? "ADMIN"
                    : "STUDENT"
        };


        return next();
    }
);


jest.mock(
    "../middleware/requireAdmin",
    () => (
        req,
        res,
        next
    ) => {
        if (
            req.user?.role !==
            "ADMIN"
        ) {
            return res
                .status(403)
                .json({
                    error:
                        "Administrator access required."
                });
        }


        return next();
    }
);


jest.mock(
    "../services/showcaseService",
    () => ({
        createShowcaseSubmission:
            jest.fn(),

        getShowcaseSubmissionStatus:
            jest.fn(),

        getPendingShowcaseSubmissions:
            jest.fn(),

        approveShowcaseSubmission:
            jest.fn(),

        getPublicShowcase:
            jest.fn()
    })
);


const request =
    require(
        "supertest"
    );

const app =
    require(
        "../app"
    );

const showcaseService =
    require(
        "../services/showcaseService"
    );


describe(
    "POST /api/showcase",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "returns 401 when no authenticated user is present",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .post(
                            "/api/showcase"
                        )
                        .send({
                            projectId:
                                "project-1"
                        });


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    showcaseService
                        .createShowcaseSubmission
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "creates a pending showcase submission for an authenticated Project Lead",
            async () => {
                showcaseService
                    .createShowcaseSubmission
                    .mockResolvedValue({
                        showcase_id:
                            "showcase-1",

                        project_id:
                            "project-1",

                        status:
                            "PENDING"
                    });


                const response =
                    await request(
                        app
                    )
                        .post(
                            "/api/showcase"
                        )
                        .set(
                            "Authorization",
                            "Bearer student-token"
                        )
                        .send({
                            projectId:
                                "project-1"
                        });


                expect(
                    response.status
                ).toBe(
                    201
                );


                expect(
                    response.body
                        .message
                ).toBe(
                    "Project submitted for showcase approval successfully."
                );


                expect(
                    response.body
                        .submission
                        .status
                ).toBe(
                    "PENDING"
                );
            }
        );


        test(
            "passes showcase validation errors to the error handler",
            async () => {
                const error =
                    new Error(
                        "Only completed projects can be submitted to the showcase."
                    );

                error.statusCode =
                    409;


                showcaseService
                    .createShowcaseSubmission
                    .mockRejectedValue(
                        error
                    );


                const response =
                    await request(
                        app
                    )
                        .post(
                            "/api/showcase"
                        )
                        .set(
                            "Authorization",
                            "Bearer student-token"
                        )
                        .send({
                            projectId:
                                "active-project"
                        });


                expect(
                    response.status
                ).toBe(
                    409
                );
            }
        );
    }
);


describe(
    "GET /api/showcase",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "remains accessible without authentication",
            async () => {
                showcaseService
                    .getPublicShowcase
                    .mockResolvedValue([
                        {
                            project_id:
                                "project-1",

                            title:
                                "Approved Project"
                        }
                    ]);


                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/showcase"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body
                        .projects
                ).toHaveLength(
                    1
                );
            }
        );


        test(
            "returns an empty list when there are no approved projects",
            async () => {
                showcaseService
                    .getPublicShowcase
                    .mockResolvedValue(
                        []
                    );


                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/showcase"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body
                        .projects
                ).toEqual(
                    []
                );
            }
        );
    }
);


describe(
    "GET /api/showcase/submission/:projectId",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "rejects unauthenticated access",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/showcase/submission/project-1"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );
            }
        );


        test(
            "returns the authenticated Project Lead's submission status",
            async () => {
                showcaseService
                    .getShowcaseSubmissionStatus
                    .mockResolvedValue({
                        showcase_id:
                            "showcase-1",

                        project_id:
                            "project-1",

                        status:
                            "PENDING"
                    });


                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/showcase/submission/project-1"
                        )
                        .set(
                            "Authorization",
                            "Bearer student-token"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body
                        .submission
                        .status
                ).toBe(
                    "PENDING"
                );


                expect(
                    showcaseService
                        .getShowcaseSubmissionStatus
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    userId:
                        "user-1"
                });
            }
        );
    }
);


describe(
    "GET /api/showcase/admin/pending",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "rejects unauthenticated access",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/showcase/admin/pending"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );
            }
        );


        test(
            "rejects non-admin users",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/showcase/admin/pending"
                        )
                        .set(
                            "Authorization",
                            "Bearer student-token"
                        );


                expect(
                    response.status
                ).toBe(
                    403
                );


                expect(
                    showcaseService
                        .getPendingShowcaseSubmissions
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "allows an administrator to load pending submissions",
            async () => {
                showcaseService
                    .getPendingShowcaseSubmissions
                    .mockResolvedValue([
                        {
                            showcase_id:
                                "showcase-1",

                            title:
                                "Pending Project",

                            status:
                                "PENDING"
                        }
                    ]);


                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/showcase/admin/pending"
                        )
                        .set(
                            "Authorization",
                            "Bearer admin-token"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body
                        .submissions
                ).toHaveLength(
                    1
                );
            }
        );
    }
);


describe(
    "PATCH /api/showcase/admin/:showcaseId/approve",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "rejects unauthenticated access",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .patch(
                            "/api/showcase/admin/showcase-1/approve"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );
            }
        );


        test(
            "rejects non-admin users",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .patch(
                            "/api/showcase/admin/showcase-1/approve"
                        )
                        .set(
                            "Authorization",
                            "Bearer student-token"
                        );


                expect(
                    response.status
                ).toBe(
                    403
                );


                expect(
                    showcaseService
                        .approveShowcaseSubmission
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "allows an administrator to approve a pending submission",
            async () => {
                showcaseService
                    .approveShowcaseSubmission
                    .mockResolvedValue({
                        showcase_id:
                            "showcase-1",

                        project_id:
                            "project-1",

                        status:
                            "APPROVED",

                        approved_by_admin_user_id:
                            "admin-1"
                    });


                const response =
                    await request(
                        app
                    )
                        .patch(
                            "/api/showcase/admin/showcase-1/approve"
                        )
                        .set(
                            "Authorization",
                            "Bearer admin-token"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body
                        .submission
                        .status
                ).toBe(
                    "APPROVED"
                );


                expect(
                    showcaseService
                        .approveShowcaseSubmission
                ).toHaveBeenCalledWith({
                    showcaseId:
                        "showcase-1",

                    adminUserId:
                        "admin-1"
                });
            }
        );
    }
);