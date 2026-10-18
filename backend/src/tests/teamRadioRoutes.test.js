const request =
    require("supertest");

const express =
    require("express");


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
                    !authHeader.startsWith(
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
        BuildRequireProjectMembership:
            jest.fn(
                () => {
                    return (
                        req,
                        res,
                        next
                    ) => {
                        req.membership = {
                            membershipId:
                                "membership-1",

                            projectId:
                                req.params
                                    .projectId,

                            userId:
                                "user-1",

                            memberRole:
                                "MEMBER",

                            active:
                                true
                        };


                        return next();
                    };
                }
            ),

        CreateMembershipLookup:
            jest.fn(
                () =>
                    jest.fn()
            )
    })
);


jest.mock(
    "../config/db",
    () => ({
        pool: {}
    })
);


jest.mock(
    "../controllers/teamRadioController",
    () => ({
        getAssistanceRequests:
            jest.fn(
                (
                    req,
                    res
                ) => {
                    return res
                        .status(200)
                        .json({
                            success:
                                true,

                            requests:
                                []
                        });
                }
            ),

        createAssistanceRequest:
            jest.fn(
                (
                    req,
                    res
                ) => {
                    return res
                        .status(201)
                        .json({
                            success:
                                true
                        });
                }
            ),

        resolveAssistanceRequest:
            jest.fn(
                (
                    req,
                    res
                ) => {
                    return res
                        .status(200)
                        .json({
                            success:
                                true,

                            request: {
                                radio_id:
                                    req.params
                                        .requestId,

                                status:
                                    "RESOLVED"
                            }
                        });
                }
            ),

        reopenAssistanceRequest:
            jest.fn(
                (
                    req,
                    res
                ) => {
                    return res
                        .status(200)
                        .json({
                            success:
                                true,

                            request: {
                                radio_id:
                                    req.params
                                        .requestId,

                                status:
                                    "OPEN"
                            }
                        });
                }
            )
    })
);


const teamRadioRoutes =
    require(
        "../routes/teamRadioRoutes"
    );


const teamRadioController =
    require(
        "../controllers/teamRadioController"
    );


function buildApp() {
    const app =
        express();


    app.use(
        express.json()
    );


    app.use(
        teamRadioRoutes
    );


    return app;
}


describe(
    "Team Radio Routes",
    () => {
        let app;


        beforeEach(
            () => {
                jest.clearAllMocks();

                app =
                    buildApp();
            }
        );


        test(
            "GET assistance requests rejects unauthenticated access",
            async () => {
                const response =
                    await request(app)
                        .get(
                            "/projects/project-1/assistance-requests"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    teamRadioController
                        .getAssistanceRequests
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "GET assistance requests reaches controller",
            async () => {
                const response =
                    await request(app)
                        .get(
                            "/projects/project-1/assistance-requests"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    teamRadioController
                        .getAssistanceRequests
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    response.body.success
                ).toBe(
                    true
                );
            }
        );


        test(
            "GET assistance requests passes project membership",
            async () => {
                await request(app)
                    .get(
                        "/projects/project-1/assistance-requests"
                    )
                    .set(
                        "Authorization",
                        "Bearer test-token"
                    );


                const [req] =
                    teamRadioController
                        .getAssistanceRequests
                        .mock.calls[0];


                expect(
                    req.membership
                ).toEqual(
                    expect.objectContaining({
                        membershipId:
                            "membership-1",

                        projectId:
                            "project-1",

                        active:
                            true
                    })
                );
            }
        );


        test(
            "POST assistance request rejects unauthenticated access",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/projects/project-1/assistance-requests"
                        )
                        .send({
                            category:
                                "TECHNICAL",

                            message:
                                "Need help."
                        });


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    teamRadioController
                        .createAssistanceRequest
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "POST assistance request reaches controller",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/projects/project-1/assistance-requests"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        )
                        .send({
                            category:
                                "TECHNICAL",

                            message:
                                "Need help."
                        });


                expect(
                    response.status
                ).toBe(
                    201
                );


                expect(
                    teamRadioController
                        .createAssistanceRequest
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "POST assistance request passes project membership",
            async () => {
                await request(app)
                    .post(
                        "/projects/project-1/assistance-requests"
                    )
                    .set(
                        "Authorization",
                        "Bearer test-token"
                    )
                    .send({
                        category:
                            "DEPENDENCY",

                        message:
                            "Waiting on another team."
                    });


                const [req] =
                    teamRadioController
                        .createAssistanceRequest
                        .mock.calls[0];


                expect(
                    req.membership
                ).toEqual(
                    expect.objectContaining({
                        membershipId:
                            "membership-1",

                        projectId:
                            "project-1",

                        active:
                            true
                    })
                );
            }
        );


        test(
            "PATCH resolve rejects unauthenticated access",
            async () => {
                const response =
                    await request(app)
                        .patch(
                            "/projects/project-1/assistance-requests/radio-1/resolve"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    teamRadioController
                        .resolveAssistanceRequest
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "PATCH resolve reaches controller",
            async () => {
                const response =
                    await request(app)
                        .patch(
                            "/projects/project-1/assistance-requests/radio-1/resolve"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    teamRadioController
                        .resolveAssistanceRequest
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    response.body
                        .request
                        .status
                ).toBe(
                    "RESOLVED"
                );
            }
        );


        test(
            "PATCH resolve passes project membership and route parameters",
            async () => {
                await request(app)
                    .patch(
                        "/projects/project-1/assistance-requests/radio-1/resolve"
                    )
                    .set(
                        "Authorization",
                        "Bearer test-token"
                    );


                const [req] =
                    teamRadioController
                        .resolveAssistanceRequest
                        .mock.calls[0];


                expect(
                    req.params
                        .projectId
                ).toBe(
                    "project-1"
                );


                expect(
                    req.params
                        .requestId
                ).toBe(
                    "radio-1"
                );


                expect(
                    req.membership
                ).toEqual(
                    expect.objectContaining({
                        membershipId:
                            "membership-1",

                        projectId:
                            "project-1",

                        active:
                            true
                    })
                );
            }
        );


        test(
            "PATCH reopen rejects unauthenticated access",
            async () => {
                const response =
                    await request(app)
                        .patch(
                            "/projects/project-1/assistance-requests/radio-1/reopen"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    teamRadioController
                        .reopenAssistanceRequest
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "PATCH reopen reaches controller",
            async () => {
                const response =
                    await request(app)
                        .patch(
                            "/projects/project-1/assistance-requests/radio-1/reopen"
                        )
                        .set(
                            "Authorization",
                            "Bearer test-token"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    teamRadioController
                        .reopenAssistanceRequest
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    response.body
                        .request
                        .status
                ).toBe(
                    "OPEN"
                );
            }
        );


        test(
            "PATCH reopen passes project membership and route parameters",
            async () => {
                await request(app)
                    .patch(
                        "/projects/project-1/assistance-requests/radio-1/reopen"
                    )
                    .set(
                        "Authorization",
                        "Bearer test-token"
                    );


                const [req] =
                    teamRadioController
                        .reopenAssistanceRequest
                        .mock.calls[0];


                expect(
                    req.params
                        .projectId
                ).toBe(
                    "project-1"
                );


                expect(
                    req.params
                        .requestId
                ).toBe(
                    "radio-1"
                );


                expect(
                    req.membership
                ).toEqual(
                    expect.objectContaining({
                        membershipId:
                            "membership-1",

                        projectId:
                            "project-1",

                        active:
                            true
                    })
                );
            }
        );

    }
);