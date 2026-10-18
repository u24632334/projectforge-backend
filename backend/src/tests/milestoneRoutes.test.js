const express =
    require("express");

const request =
    require("supertest");


let mockAuthenticated =
    true;

let mockProjectLead =
    true;


jest.mock(
    "../middleware/authGuard",
    () => {
        return jest.fn(
            (
                req,
                res,
                next
            ) => {
                if (
                    !mockAuthenticated
                ) {
                    return res
                        .status(401)
                        .json({
                            success:
                                false,

                            error:
                                "Authentication required."
                        });
                }


                req.user = {
                    id:
                        "user-1",

                    email:
                        "test@example.com",

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
                    findMembership,
                    options = {}
                ) => {
                    return (
                        req,
                        res,
                        next
                    ) => {
                        if (
                            options.requireLead &&
                            !mockProjectLead
                        ) {
                            return res
                                .status(403)
                                .json({
                                    success:
                                        false,

                                    error:
                                        "Project Lead access required."
                                });
                        }


                        req.membership = {
                            membershipId:
                                "membership-1",

                            projectId:
                                req.params
                                    .projectId,

                            userId:
                                "user-1",

                            memberRole:
                                mockProjectLead
                                    ? "LEAD"
                                    : "MEMBER",

                            active:
                                true
                        };


                        return next();
                    };
                }
            )
    })
);


jest.mock(
    "../controllers/milestoneController",
    () => ({
        getMilestones:
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

                            milestones: [
                                {
                                    milestone_id:
                                        "milestone-1",

                                    project_id:
                                        req.params
                                            .projectId,

                                    title:
                                        "First Milestone",

                                    status:
                                        "OPEN"
                                }
                            ]
                        });
                }
            ),

        createMilestone:
            jest.fn(
                (
                    req,
                    res
                ) => {
                    return res
                        .status(201)
                        .json({
                            success:
                                true,

                            milestone: {
                                project_id:
                                    req.params
                                        .projectId,

                                title:
                                    req.body
                                        .title
                            }
                        });
                }
            ),

        closeMilestone:
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

                            milestone: {
                                milestone_id:
                                    req.params
                                        .milestoneId,

                                project_id:
                                    req.params
                                        .projectId,

                                status:
                                    "COMPLETE"
                            }
                        });
                }
            ),

        reopenMilestone:
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

                            milestone: {
                                milestone_id:
                                    req.params
                                        .milestoneId,

                                project_id:
                                    req.params
                                        .projectId,

                                status:
                                    "OPEN"
                            }
                        });
                }
            )
    })
);


jest.mock(
    "../config/db",
    () => ({
        pool: {}
    })
);


const milestoneRoutes =
    require(
        "../routes/milestoneRoutes"
    );


const milestoneController =
    require(
        "../controllers/milestoneController"
    );


describe(
    "Milestone routes",
    () => {

        let app;


        beforeEach(
            () => {
                mockAuthenticated =
                    true;

                mockProjectLead =
                    true;

                jest.clearAllMocks();


                app =
                    express();


                app.use(
                    express.json()
                );


                app.use(
                    "/api",
                    milestoneRoutes
                );
            }
        );


        test(
            "GET /projects/:projectId/milestones reaches the list controller",
            async () => {

                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/milestones"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body.success
                ).toBe(
                    true
                );


                expect(
                    response.body
                        .milestones
                ).toHaveLength(
                    1
                );


                expect(
                    response.body
                        .milestones[0]
                        .project_id
                ).toBe(
                    "project-1"
                );


                expect(
                    milestoneController
                        .getMilestones
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "allows a non-lead active project member to retrieve milestones",
            async () => {

                mockProjectLead =
                    false;


                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/milestones"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body.success
                ).toBe(
                    true
                );


                expect(
                    milestoneController
                        .getMilestones
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "POST /projects/:projectId/milestones reaches the create controller",
            async () => {

                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/milestones"
                        )
                        .send({
                            title:
                                "First Milestone",

                            description:
                                "Initial milestone",

                            dueDate:
                                "2026-09-30"
                        });


                expect(
                    response.status
                ).toBe(
                    201
                );


                expect(
                    response.body.success
                ).toBe(
                    true
                );


                expect(
                    response.body
                        .milestone
                        .project_id
                ).toBe(
                    "project-1"
                );


                expect(
                    response.body
                        .milestone
                        .title
                ).toBe(
                    "First Milestone"
                );


                expect(
                    milestoneController
                        .createMilestone
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "PATCH close reaches the close controller",
            async () => {

                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/milestones/milestone-1/close"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body.success
                ).toBe(
                    true
                );


                expect(
                    response.body
                        .milestone
                        .milestone_id
                ).toBe(
                    "milestone-1"
                );


                expect(
                    response.body
                        .milestone
                        .project_id
                ).toBe(
                    "project-1"
                );


                expect(
                    response.body
                        .milestone
                        .status
                ).toBe(
                    "COMPLETE"
                );


                expect(
                    milestoneController
                        .closeMilestone
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "PATCH reopen reaches the reopen controller",
            async () => {

                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/milestones/milestone-1/reopen"
                        );


                expect(
                    response.status
                ).toBe(
                    200
                );


                expect(
                    response.body.success
                ).toBe(
                    true
                );


                expect(
                    response.body
                        .milestone
                        .milestone_id
                ).toBe(
                    "milestone-1"
                );


                expect(
                    response.body
                        .milestone
                        .project_id
                ).toBe(
                    "project-1"
                );


                expect(
                    response.body
                        .milestone
                        .status
                ).toBe(
                    "OPEN"
                );


                expect(
                    milestoneController
                        .reopenMilestone
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "rejects an unauthenticated milestone read request",
            async () => {

                mockAuthenticated =
                    false;


                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/milestones"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    response.body.success
                ).toBe(
                    false
                );


                expect(
                    response.body.error
                ).toBe(
                    "Authentication required."
                );


                expect(
                    milestoneController
                        .getMilestones
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects an unauthenticated milestone create request",
            async () => {

                mockAuthenticated =
                    false;


                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/milestones"
                        )
                        .send({
                            title:
                                "First Milestone",

                            description:
                                "Initial milestone",

                            dueDate:
                                "2026-09-30"
                        });


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    milestoneController
                        .createMilestone
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects an unauthenticated milestone close request",
            async () => {

                mockAuthenticated =
                    false;


                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/milestones/milestone-1/close"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    milestoneController
                        .closeMilestone
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects an unauthenticated milestone reopen request",
            async () => {

                mockAuthenticated =
                    false;


                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/milestones/milestone-1/reopen"
                        );


                expect(
                    response.status
                ).toBe(
                    401
                );


                expect(
                    milestoneController
                        .reopenMilestone
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects a non-lead project member from creating a milestone",
            async () => {

                mockProjectLead =
                    false;


                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/milestones"
                        )
                        .send({
                            title:
                                "First Milestone",

                            description:
                                "Initial milestone",

                            dueDate:
                                "2026-09-30"
                        });


                expect(
                    response.status
                ).toBe(
                    403
                );


                expect(
                    response.body.error
                ).toBe(
                    "Project Lead access required."
                );


                expect(
                    milestoneController
                        .createMilestone
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects a non-lead project member from closing a milestone",
            async () => {

                mockProjectLead =
                    false;


                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/milestones/milestone-1/close"
                        );


                expect(
                    response.status
                ).toBe(
                    403
                );


                expect(
                    response.body.error
                ).toBe(
                    "Project Lead access required."
                );


                expect(
                    milestoneController
                        .closeMilestone
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects a non-lead project member from reopening a milestone",
            async () => {

                mockProjectLead =
                    false;


                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/milestones/milestone-1/reopen"
                        );


                expect(
                    response.status
                ).toBe(
                    403
                );


                expect(
                    response.body.error
                ).toBe(
                    "Project Lead access required."
                );


                expect(
                    milestoneController
                        .reopenMilestone
                ).not.toHaveBeenCalled();
            }
        );

    }
);