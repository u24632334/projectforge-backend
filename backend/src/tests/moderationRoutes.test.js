const request = require("supertest");


jest.mock("../config/db", () => ({
    pool: {
        query: jest.fn()
    }
}));


jest.mock("../services/moderationService");


const { pool } =
    require("../config/db");

const moderationService =
    require("../services/moderationService");

const { generateToken } =
    require("../services/authService");

const app =
    require("../app");


describe("Administrator Moderation API Routes", () => {

    let studentToken;
    let adminToken;


    beforeAll(() => {
        studentToken = generateToken({
            id: "student-1",
            email: "student@test.com",
            role: "STUDENT"
        });

        adminToken = generateToken({
            id: "admin-1",
            email: "admin@test.com",
            role: "ADMIN"
        });
    });


    beforeEach(() => {

    jest.clearAllMocks();


    pool.query.mockImplementation(
        async (query, values) => {

            const userId = values?.[0];


            if (userId === "student-1") {
                return {
                    rows: [
                        {
                            user_id: "student-1",
                            email: "student@test.com",
                            system_role: "STUDENT",
                            status: "ACTIVE"
                        }
                    ]
                };
            }


            if (userId === "admin-1") {
                return {
                    rows: [
                        {
                            user_id: "admin-1",
                            email: "admin@test.com",
                            system_role: "ADMIN",
                            status: "ACTIVE"
                        }
                    ]
                };
            }


            return {
                rows: []
            };
        }
    );

});


    // ========================================================
    // USER SUSPENSION
    // ========================================================

    test(
        "PATCH /api/admin/users/:id/suspend rejects unauthenticated users",
        async () => {

            const response = await request(app)
                .patch(
                    "/api/admin/users/user-1/suspend"
                )
                .send({
                    reason: "Test suspension"
                });


            expect(response.statusCode)
                .toBe(401);

            expect(moderationService.suspendUser)
                .not
                .toHaveBeenCalled();
        }
    );


    test(
        "PATCH /api/admin/users/:id/suspend rejects non-admin users",
        async () => {

            const response = await request(app)
                .patch(
                    "/api/admin/users/user-1/suspend"
                )
                .set(
                    "Authorization",
                    `Bearer ${studentToken}`
                )
                .send({
                    reason: "Test suspension"
                });


            expect(response.statusCode)
                .toBe(403);

            expect(response.body).toEqual({
                success: false,
                error: "Administrator access required."
            });

            expect(moderationService.suspendUser)
                .not
                .toHaveBeenCalled();
        }
    );


    test(
        "PATCH /api/admin/users/:id/suspend allows administrator",
        async () => {

            const mockResult = {
                user: {
                    user_id: "user-1",
                    email: "student@test.com",
                    system_role: "STUDENT",
                    status: "SUSPENDED"
                },

                auditLog: {
                    audit_id: "audit-1",
                    admin_user_id: "admin-1",
                    action_type: "USER_SUSPENDED",
                    target_type: "USER",
                    target_id: "user-1"
                }
            };


            moderationService.suspendUser
                .mockResolvedValue(mockResult);


            const response = await request(app)
                .patch(
                    "/api/admin/users/user-1/suspend"
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                )
                .send({
                    reason:
                        "Repeated abusive behaviour"
                });


            expect(response.statusCode)
                .toBe(200);


            expect(moderationService.suspendUser)
                .toHaveBeenCalledWith(
                    "admin-1",
                    "user-1",
                    "Repeated abusive behaviour"
                );


            expect(response.body).toEqual({
                message:
                    "User suspended successfully.",

                user: mockResult.user,

                auditLog: mockResult.auditLog
            });
        }
    );


    test(
        "PATCH suspension returns 404 when user does not exist",
        async () => {

            const error =
                new Error("User not found.");

            error.statusCode = 404;

            moderationService.suspendUser
                .mockRejectedValue(error);


            const response = await request(app)
                .patch(
                    "/api/admin/users/missing-user/suspend"
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                );


            expect(response.statusCode)
                .toBe(404);

            expect(response.body).toEqual({
                error: "User not found."
            });
        }
    );


    // ========================================================
    // PROJECT CONTENT REMOVAL
    // ========================================================

    test(
        "PATCH /api/admin/projects/:id/remove rejects unauthenticated users",
        async () => {

            const response = await request(app)
                .patch(
                    "/api/admin/projects/project-1/remove"
                );


            expect(response.statusCode)
                .toBe(401);

            expect(
                moderationService.removeProjectContent
            )
                .not
                .toHaveBeenCalled();
        }
    );


    test(
        "PATCH /api/admin/projects/:id/remove rejects non-admin users",
        async () => {

            const response = await request(app)
                .patch(
                    "/api/admin/projects/project-1/remove"
                )
                .set(
                    "Authorization",
                    `Bearer ${studentToken}`
                );


            expect(response.statusCode)
                .toBe(403);

            expect(response.body).toEqual({
                success: false,
                error: "Administrator access required."
            });

            expect(
                moderationService.removeProjectContent
            )
                .not
                .toHaveBeenCalled();
        }
    );


    test(
        "PATCH /api/admin/projects/:id/remove allows administrator",
        async () => {

            const mockResult = {
                project: {
                    project_id: "project-1",
                    owner_user_id: "user-1",
                    title: "Test Project",
                    status: "ARCHIVED"
                },

                auditLog: {
                    audit_id: "audit-2",
                    admin_user_id: "admin-1",
                    action_type: "CONTENT_REMOVED",
                    target_type: "PROJECT",
                    target_id: "project-1"
                }
            };


            moderationService
                .removeProjectContent
                .mockResolvedValue(mockResult);


            const response = await request(app)
                .patch(
                    "/api/admin/projects/project-1/remove"
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                )
                .send({
                    reason:
                        "Inappropriate public content"
                });


            expect(response.statusCode)
                .toBe(200);


            expect(
                moderationService.removeProjectContent
            )
                .toHaveBeenCalledWith(
                    "admin-1",
                    "project-1",
                    "Inappropriate public content"
                );


            expect(response.body).toEqual({
                message:
                    "Project content removed successfully.",

                project: mockResult.project,

                auditLog: mockResult.auditLog
            });
        }
    );


    test(
        "PATCH content removal returns 409 when project is already removed",
        async () => {

            const error = new Error(
                "Project content is already removed."
            );

            error.statusCode = 409;

            moderationService
                .removeProjectContent
                .mockRejectedValue(error);


            const response = await request(app)
                .patch(
                    "/api/admin/projects/project-1/remove"
                )
                .set(
                    "Authorization",
                    `Bearer ${adminToken}`
                );


            expect(response.statusCode)
                .toBe(409);

            expect(response.body).toEqual({
                error:
                    "Project content is already removed."
            });
        }
    );

});