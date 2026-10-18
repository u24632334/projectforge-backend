const express =
    require("express");

const request =
    require("supertest");


jest.mock(
    "../controllers/projectController",
    () => ({
        getProjects:
            jest.fn(),

        getMyProjects:
            jest.fn(),

        createProject:
            jest.fn(),

        updateProject:
            jest.fn(),

        completeProject:
            jest.fn(),

        getProjectById:
            jest.fn()
    })
);


jest.mock(
    "../controllers/projectMemberController",
    () => ({
        getProjectMembers:
            jest.fn()
    })
);


jest.mock(
    "../middleware/authGuard",
    () => {
        return jest.fn(
            (
                req,
                res,
                next
            ) => {
                const authHeader =
                    req.headers
                        .authorization;


                if (
                    !authHeader ||
                    !authHeader
                        .startsWith(
                            "Bearer "
                        )
                ) {
                    return res
                        .status(401)
                        .json({
                            success:
                                false,

                            error:
                                "Access denied. No token provided."
                        });
                }


                req.user = {
                    id:
                        "user-1",

                    email:
                        "student@projectforge.local",

                    role:
                        "STUDENT"
                };


                return next();
            }
        );
    }
);


jest.mock(
    "../middleware/requireProjectMembership",
    () => ({
        CreateMembershipLookup:
            jest.fn(
                () =>
                    jest.fn()
            ),

        BuildRequireProjectMembership:
            jest.fn(
                (
                    _findMembership,
                    options = {}
                ) =>
                    (
                        req,
                        res,
                        next
                    ) => {
                        req.membership = {
                            membershipId:
                                "membership-1",

                            projectId:
                                req.params
                                    .id ||
                                req.params
                                    .projectId,

                            userId:
                                req.user.id,

                            memberRole:
                                options
                                    .requireLead
                                    ? "LEAD"
                                    : "MEMBER",

                            active:
                                true
                        };


                        return next();
                    }
            )
    })
);


const projectController =
    require(
        "../controllers/projectController"
    );


const projectMemberController =
    require(
        "../controllers/projectMemberController"
    );


const authGuard =
    require(
        "../middleware/authGuard"
    );


const projectRoutes =
    require(
        "../routes/projectRoutes"
    );


function buildApp() {
    const app =
        express();


    app.use(
        express.json()
    );


    app.use(
        "/api/projects",
        projectRoutes
    );


    return app;
}


describe(
    "Project routes",
    () => {
        let app;


        beforeEach(() => {
            jest.clearAllMocks();


            app =
                buildApp();


            projectController
                .getProjects
                .mockImplementation(
                    (
                        req,
                        res
                    ) =>
                        res
                            .status(200)
                            .json({
                                projects:
                                    []
                            })
                );


            projectController
                .getMyProjects
                .mockImplementation(
                    (
                        req,
                        res
                    ) =>
                        res
                            .status(200)
                            .json({
                                projects: [
                                    {
                                        projectId:
                                            "project-1",

                                        title:
                                            "My Project",

                                        memberRole:
                                            "LEAD"
                                    }
                                ]
                            })
                );


            projectController
                .getProjectById
                .mockImplementation(
                    (
                        req,
                        res
                    ) =>
                        res
                            .status(200)
                            .json({
                                project: {
                                    projectId:
                                        req.params
                                            .id
                                }
                            })
                );


            projectController
                .createProject
                .mockImplementation(
                    (
                        req,
                        res
                    ) =>
                        res
                            .status(201)
                            .json({
                                project: {
                                    title:
                                        req.body
                                            .title,

                                    creatorUserId:
                                        req.user.id
                                }
                            })
                );


            projectController
                .updateProject
                .mockImplementation(
                    (
                        req,
                        res
                    ) =>
                        res
                            .status(200)
                            .json({
                                success:
                                    true,

                                project: {
                                    projectId:
                                        req.params
                                            .id,

                                    title:
                                        req.body
                                            .title,

                                    status:
                                        "ACTIVE"
                                }
                            })
                );


            projectController
                .completeProject
                .mockImplementation(
                    (
                        req,
                        res
                    ) =>
                        res
                            .status(200)
                            .json({
                                success:
                                    true,

                                project: {
                                    projectId:
                                        req.params.id,

                                    status:
                                        "COMPLETED"
                                }
                            })
                );


            projectMemberController
                .getProjectMembers
                .mockImplementation(
                    (
                        req,
                        res
                    ) =>
                        res
                            .status(200)
                            .json({
                                success:
                                    true,

                                members: [
                                    {
                                        membershipId:
                                            "membership-1",

                                        userId:
                                            "user-1",

                                        displayName:
                                            "Test Student",

                                        memberRole:
                                            "MEMBER",

                                        positionTitle:
                                            "Frontend Developer"
                                    }
                                ]
                            })
                );
        });


        test(
            "GET /api/projects remains public",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/projects"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    200
                );


                expect(
                    projectController
                        .getProjects
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    authGuard
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "GET /api/projects/mine rejects unauthenticated access",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/projects/mine"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    401
                );


                expect(
                    projectController
                        .getMyProjects
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "GET /api/projects/mine returns authenticated user's projects",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/projects/mine"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    200
                );


                expect(
                    projectController
                        .getMyProjects
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    response.body
                        .projects
                ).toHaveLength(
                    1
                );


                expect(
                    response.body
                        .projects[0]
                        .memberRole
                ).toBe(
                    "LEAD"
                );
            }
        );


        test(
            "GET /api/projects/:id remains public",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/projects/project-1"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    200
                );


                expect(
                    projectController
                        .getProjectById
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    authGuard
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "POST /api/projects rejects unauthenticated creation",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .post(
                            "/api/projects"
                        )
                        .send({
                            title:
                                "Unauthorised Project"
                        });


                expect(
                    response.statusCode
                ).toBe(
                    401
                );


                expect(
                    projectController
                        .createProject
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "POST /api/projects allows authenticated creation",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .post(
                            "/api/projects"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        )
                        .send({
                            title:
                                "Authenticated Project"
                        });


                expect(
                    response.statusCode
                ).toBe(
                    201
                );


                expect(
                    projectController
                        .createProject
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "GET /api/projects/:id/members rejects unauthenticated access",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/projects/project-1/members"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    401
                );


                expect(
                    projectMemberController
                        .getProjectMembers
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "GET /api/projects/:id/members allows authenticated project members",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .get(
                            "/api/projects/project-1/members"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    200
                );


                expect(
                    projectMemberController
                        .getProjectMembers
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "project member endpoint receives membership",
            async () => {
                await request(
                    app
                )
                    .get(
                        "/api/projects/project-1/members"
                    )
                    .set(
                        "Authorization",
                        "Bearer test-token"
                    );


                const req =
                    projectMemberController
                        .getProjectMembers
                        .mock
                        .calls[0][0];


                expect(
                    req.membership
                ).toEqual(
                    expect
                        .objectContaining({
                            projectId:
                                "project-1",

                            memberRole:
                                "MEMBER",

                            active:
                                true
                        })
                );
            }
        );


        test(
            "PATCH /api/projects/:id rejects unauthenticated editing",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .patch(
                            "/api/projects/project-1"
                        )
                        .send({
                            title:
                                "Edited Project"
                        });


                expect(
                    response.statusCode
                ).toBe(
                    401
                );


                expect(
                    projectController
                        .updateProject
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "PATCH /api/projects/:id allows authenticated Project Lead",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .patch(
                            "/api/projects/project-1"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        )
                        .send({
                            title:
                                "Edited Project"
                        });


                expect(
                    response.statusCode
                ).toBe(
                    200
                );


                expect(
                    projectController
                        .updateProject
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    response.body
                        .project
                        .title
                ).toBe(
                    "Edited Project"
                );
            }
        );


        test(
            "project edit endpoint receives Project Lead membership",
            async () => {
                await request(
                    app
                )
                    .patch(
                        "/api/projects/project-1"
                    )
                    .set(
                        "Authorization",
                        "Bearer test-token"
                    )
                    .send({
                        title:
                            "Edited Project"
                    });


                const req =
                    projectController
                        .updateProject
                        .mock
                        .calls[0][0];


                expect(
                    req.membership
                ).toEqual(
                    expect
                        .objectContaining({
                            projectId:
                                "project-1",

                            memberRole:
                                "LEAD",

                            active:
                                true
                        })
                );
            }
        );


        test(
            "PATCH /api/projects/:id/complete rejects unauthenticated access",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .patch(
                            "/api/projects/project-1/complete"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    401
                );


                expect(
                    projectController
                        .completeProject
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "PATCH /api/projects/:id/complete allows authenticated Project Lead",
            async () => {
                const response =
                    await request(
                        app
                    )
                        .patch(
                            "/api/projects/project-1/complete"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        );


                expect(
                    response.statusCode
                ).toBe(
                    200
                );


                expect(
                    response.body
                        .project
                        .status
                ).toBe(
                    "COMPLETED"
                );
            }
        );


        test(
            "project completion endpoint receives Project Lead membership",
            async () => {
                await request(
                    app
                )
                    .patch(
                        "/api/projects/project-1/complete"
                    )
                    .set(
                        "Authorization",
                        "Bearer test-token"
                    );


                const req =
                    projectController
                        .completeProject
                        .mock
                        .calls[0][0];


                expect(
                    req.membership
                ).toEqual(
                    expect
                        .objectContaining({
                            projectId:
                                "project-1",

                            memberRole:
                                "LEAD",

                            active:
                                true
                        })
                );
            }
        );
    }
);