const request =
    require("supertest");


jest.mock(
    "../config/db",
    () => ({
        pool: {
            query:
                jest.fn()
        }
    })
);


jest.mock(
    "../services/mentorGuidanceService"
);


const {
    pool
} =
    require(
        "../config/db"
    );


const mentorGuidanceService =
    require(
        "../services/mentorGuidanceService"
    );


const {
    generateToken
} =
    require(
        "../services/authService"
    );


const app =
    require("../app");


// ============================================================
// TEST USERS
// ============================================================

describe(
    "Mentor Guidance API Routes",
    () => {

        let mentorToken;
        let studentToken;
        let adminToken;
        let suspendedMentorToken;


        beforeAll(() => {

            mentorToken =
                generateToken({
                    id:
                        "mentor-1",

                    email:
                        "mentor@test.com",

                    role:
                        "MENTOR"
                });


            studentToken =
                generateToken({
                    id:
                        "student-1",

                    email:
                        "student@test.com",

                    role:
                        "STUDENT"
                });


            adminToken =
                generateToken({
                    id:
                        "admin-1",

                    email:
                        "admin@test.com",

                    role:
                        "ADMIN"
                });


            suspendedMentorToken =
                generateToken({
                    id:
                        "mentor-suspended",

                    email:
                        "suspended@test.com",

                    role:
                        "MENTOR"
                });
        });


        beforeEach(() => {

            jest.clearAllMocks();


            /*
             * authGuard and requireMentor query the current
             * database account rather than trusting only
             * the role stored inside the JWT.
             */
            pool.query.mockImplementation(
                async (
                    query,
                    values
                ) => {

                    const userId =
                        values?.[0];


                    const users = {
                        "mentor-1": {
                            user_id:
                                "mentor-1",

                            email:
                                "mentor@test.com",

                            system_role:
                                "MENTOR",

                            status:
                                "ACTIVE"
                        },

                        "student-1": {
                            user_id:
                                "student-1",

                            email:
                                "student@test.com",

                            system_role:
                                "STUDENT",

                            status:
                                "ACTIVE"
                        },

                        "admin-1": {
                            user_id:
                                "admin-1",

                            email:
                                "admin@test.com",

                            system_role:
                                "ADMIN",

                            status:
                                "ACTIVE"
                        },

                        "mentor-suspended": {
                            user_id:
                                "mentor-suspended",

                            email:
                                "suspended@test.com",

                            system_role:
                                "MENTOR",

                            status:
                                "SUSPENDED"
                        }
                    };


                    return {
                        rows:
                            users[userId]
                                ? [
                                    users[
                                        userId
                                    ]
                                ]
                                : []
                    };
                }
            );
        });


        // ====================================================
        // MENTOR PROJECT DISCOVERY
        // ====================================================

        test(
            "rejects unauthenticated access to Mentor project discovery",
            async () => {

                const response =
                    await request(app)
                        .get(
                            "/api/mentor/projects"
                        );


                expect(
                    response.statusCode
                ).toBe(401);


                expect(
                    mentorGuidanceService
                        .getEligibleProjectsForMentor
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "allows an approved active Mentor to browse eligible projects",
            async () => {

                const projects = [
                    {
                        projectId:
                            "project-1",

                        title:
                            "Control System",

                        allowMentorSupport:
                            true,

                        assignmentStatus:
                            null
                    }
                ];


                mentorGuidanceService
                    .getEligibleProjectsForMentor
                    .mockResolvedValue(
                        projects
                    );


                const response =
                    await request(app)
                        .get(
                            "/api/mentor/projects"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${mentorToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(200);


                expect(
                    mentorGuidanceService
                        .getEligibleProjectsForMentor
                ).toHaveBeenCalledWith({
                    mentorUserId:
                        "mentor-1"
                });


                expect(
                    response.body
                ).toEqual({
                    projects
                });
            }
        );


        test(
            "rejects a Student trying to browse the Mentor project list",
            async () => {

                const response =
                    await request(app)
                        .get(
                            "/api/mentor/projects"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .getEligibleProjectsForMentor
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects an Administrator trying to use Mentor project discovery",
            async () => {

                const response =
                    await request(app)
                        .get(
                            "/api/mentor/projects"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${adminToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .getEligibleProjectsForMentor
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects a suspended Mentor from Mentor project discovery",
            async () => {

                const response =
                    await request(app)
                        .get(
                            "/api/mentor/projects"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${suspendedMentorToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .getEligibleProjectsForMentor
                ).not.toHaveBeenCalled();
            }
        );


        // ====================================================
        // MENTOR ASSIGNMENT REQUEST
        // ====================================================

        test(
            "allows an approved Mentor to request a project assignment",
            async () => {

                const assignment = {
                    assignmentId:
                        "assignment-1",

                    projectId:
                        "project-1",

                    mentorUserId:
                        "mentor-1",

                    status:
                        "PENDING"
                };


                mentorGuidanceService
                    .requestMentorAssignment
                    .mockResolvedValue(
                        assignment
                    );


                const response =
                    await request(app)
                        .post(
                            "/api/mentor/projects/project-1/assignments"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${mentorToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(201);


                expect(
                    mentorGuidanceService
                        .requestMentorAssignment
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    mentorUserId:
                        "mentor-1"
                });


                expect(
                    response.body
                ).toEqual({
                    message:
                        "Mentor request submitted successfully.",

                    assignment
                });
            }
        );


        test(
            "rejects a Student trying to request a Mentor assignment",
            async () => {

                const response =
                    await request(app)
                        .post(
                            "/api/mentor/projects/project-1/assignments"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .requestMentorAssignment
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects an unauthenticated Mentor assignment request",
            async () => {

                const response =
                    await request(app)
                        .post(
                            "/api/mentor/projects/project-1/assignments"
                        );


                expect(
                    response.statusCode
                ).toBe(401);


                expect(
                    mentorGuidanceService
                        .requestMentorAssignment
                ).not.toHaveBeenCalled();
            }
        );


        // ====================================================
        // PROJECT LEAD - ASSIGNMENT REVIEW
        // ====================================================

        test(
            "passes an authenticated user to the service when viewing project Mentor assignments",
            async () => {

                const assignments = [
                    {
                        assignmentId:
                            "assignment-1",

                        projectId:
                            "project-1",

                        mentorUserId:
                            "mentor-1",

                        status:
                            "PENDING"
                    }
                ];


                mentorGuidanceService
                    .getAssignmentsForProject
                    .mockResolvedValue(
                        assignments
                    );


                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/mentor-assignments"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(200);


                expect(
                    mentorGuidanceService
                        .getAssignmentsForProject
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    leadUserId:
                        "student-1"
                });


                expect(
                    response.body
                ).toEqual({
                    assignments
                });
            }
        );


        test(
            "returns a Project Lead authorization error from the service",
            async () => {

                const error =
                    new Error(
                        "Project Lead access required."
                    );

                error.statusCode =
                    403;


                mentorGuidanceService
                    .getAssignmentsForProject
                    .mockRejectedValue(
                        error
                    );


                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/mentor-assignments"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    response.body
                ).toEqual({
                    error:
                        "Project Lead access required."
                });
            }
        );


        test(
            "allows the service to approve a pending Mentor assignment for the Project Lead",
            async () => {

                const assignment = {
                    assignmentId:
                        "assignment-1",

                    projectId:
                        "project-1",

                    mentorUserId:
                        "mentor-1",

                    status:
                        "ACTIVE"
                };


                mentorGuidanceService
                    .approveMentorAssignment
                    .mockResolvedValue(
                        assignment
                    );


                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/mentor-assignments/assignment-1/approve"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(200);


                expect(
                    mentorGuidanceService
                        .approveMentorAssignment
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    assignmentId:
                        "assignment-1",

                    leadUserId:
                        "student-1"
                });


                expect(
                    response.body.assignment
                        .status
                ).toBe(
                    "ACTIVE"
                );
            }
        );


        test(
            "allows the service to end an active Mentor assignment for the Project Lead",
            async () => {

                const assignment = {
                    assignmentId:
                        "assignment-1",

                    projectId:
                        "project-1",

                    mentorUserId:
                        "mentor-1",

                    status:
                        "ENDED"
                };


                mentorGuidanceService
                    .endMentorAssignment
                    .mockResolvedValue(
                        assignment
                    );


                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/mentor-assignments/assignment-1/end"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(200);


                expect(
                    mentorGuidanceService
                        .endMentorAssignment
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    assignmentId:
                        "assignment-1",

                    leadUserId:
                        "student-1"
                });


                expect(
                    response.body.assignment
                        .status
                ).toBe(
                    "ENDED"
                );
            }
        );


        // ====================================================
        // CREATE GUIDANCE
        // ====================================================

        test(
            "rejects unauthenticated users trying to submit guidance",
            async () => {

                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/guidance"
                        )
                        .send({
                            guidance:
                                "Improve the test coverage."
                        });


                expect(
                    response.statusCode
                ).toBe(401);


                expect(
                    mentorGuidanceService
                        .createGuidance
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects Student accounts trying to submit Mentor guidance",
            async () => {

                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        )
                        .send({
                            guidance:
                                "Improve the test coverage."
                        });


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .createGuidance
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects Administrator accounts from submitting Mentor guidance",
            async () => {

                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${adminToken}`
                        )
                        .send({
                            guidance:
                                "Improve the test coverage."
                        });


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .createGuidance
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects suspended Mentor accounts from submitting guidance",
            async () => {

                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${suspendedMentorToken}`
                        )
                        .send({
                            guidance:
                                "Improve the test coverage."
                        });


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .createGuidance
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "allows an active approved Mentor to submit guidance",
            async () => {

                const createdGuidance = {
                    guidanceId:
                        "guidance-1",

                    assignmentId:
                        "assignment-1",

                    guidance:
                        "Improve the test coverage."
                };


                mentorGuidanceService
                    .createGuidance
                    .mockResolvedValue(
                        createdGuidance
                    );


                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${mentorToken}`
                        )
                        .send({
                            guidance:
                                "Improve the test coverage."
                        });


                expect(
                    response.statusCode
                ).toBe(201);


                expect(
                    mentorGuidanceService
                        .createGuidance
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    mentorUserId:
                        "mentor-1",

                    guidance:
                        "Improve the test coverage."
                });


                expect(
                    response.body
                ).toEqual({
                    message:
                        "Guidance submitted successfully.",

                    guidance:
                        createdGuidance
                });
            }
        );


        test(
            "returns guidance validation errors from the service",
            async () => {

                const error =
                    new Error(
                        "Guidance text is required."
                    );

                error.statusCode =
                    400;


                mentorGuidanceService
                    .createGuidance
                    .mockRejectedValue(
                        error
                    );


                const response =
                    await request(app)
                        .post(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${mentorToken}`
                        )
                        .send({
                            guidance:
                                ""
                        });


                expect(
                    response.statusCode
                ).toBe(400);


                expect(
                    response.body
                ).toEqual({
                    error:
                        "Guidance text is required."
                });
            }
        );


        // ====================================================
        // VIEW GUIDANCE
        // ====================================================

        test(
            "rejects unauthenticated users trying to view project guidance",
            async () => {

                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/guidance"
                        );


                expect(
                    response.statusCode
                ).toBe(401);


                expect(
                    mentorGuidanceService
                        .getGuidanceForProject
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "passes an authenticated Mentor to the guidance authorization service",
            async () => {

                const entries = [
                    {
                        guidanceId:
                            "guidance-1",

                        guidance:
                            "Check the control loop.",

                        mentorName:
                            "Mentor One"
                    }
                ];


                mentorGuidanceService
                    .getGuidanceForProject
                    .mockResolvedValue(
                        entries
                    );


                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${mentorToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(200);


                expect(
                    mentorGuidanceService
                        .getGuidanceForProject
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestingUserId:
                        "mentor-1"
                });


                expect(
                    response.body
                ).toEqual({
                    guidance:
                        entries
                });
            }
        );


        test(
            "allows an authenticated Student through the route so project membership can be checked by the service",
            async () => {

                const entries = [
                    {
                        guidanceId:
                            "guidance-1",

                        guidance:
                            "Check the control loop.",

                        mentorName:
                            "Mentor One"
                    }
                ];


                mentorGuidanceService
                    .getGuidanceForProject
                    .mockResolvedValue(
                        entries
                    );


                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(200);


                expect(
                    mentorGuidanceService
                        .getGuidanceForProject
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestingUserId:
                        "student-1"
                });
            }
        );


        test(
            "returns 403 when the service determines an authenticated user is not a project member or active Mentor",
            async () => {

                const error =
                    new Error(
                        "You do not have access to this project's Mentor guidance."
                    );

                error.statusCode =
                    403;


                mentorGuidanceService
                    .getGuidanceForProject
                    .mockRejectedValue(
                        error
                    );


                const response =
                    await request(app)
                        .get(
                            "/api/projects/project-1/guidance"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        );


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    response.body
                ).toEqual({
                    error:
                        "You do not have access to this project's Mentor guidance."
                });
            }
        );


        // ====================================================
        // EDIT GUIDANCE
        // ====================================================

        test(
            "allows an active approved Mentor to edit guidance",
            async () => {

                const updatedGuidance = {
                    guidanceId:
                        "guidance-1",

                    assignmentId:
                        "assignment-1",

                    guidance:
                        "Updated guidance."
                };


                mentorGuidanceService
                    .editGuidance
                    .mockResolvedValue(
                        updatedGuidance
                    );


                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/guidance/guidance-1"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${mentorToken}`
                        )
                        .send({
                            guidance:
                                "Updated guidance."
                        });


                expect(
                    response.statusCode
                ).toBe(200);


                expect(
                    mentorGuidanceService
                        .editGuidance
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    guidanceId:
                        "guidance-1",

                    mentorUserId:
                        "mentor-1",

                    guidance:
                        "Updated guidance."
                });


                expect(
                    response.body
                ).toEqual({
                    message:
                        "Guidance updated successfully.",

                    guidance:
                        updatedGuidance
                });
            }
        );


        test(
            "rejects a Student trying to edit Mentor guidance",
            async () => {

                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/guidance/guidance-1"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${studentToken}`
                        )
                        .send({
                            guidance:
                                "Changed text."
                        });


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .editGuidance
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "rejects a suspended Mentor trying to edit guidance",
            async () => {

                const response =
                    await request(app)
                        .patch(
                            "/api/projects/project-1/guidance/guidance-1"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${suspendedMentorToken}`
                        )
                        .send({
                            guidance:
                                "Changed text."
                        });


                expect(
                    response.statusCode
                ).toBe(403);


                expect(
                    mentorGuidanceService
                        .editGuidance
                ).not.toHaveBeenCalled();
            }
        );
    }
);