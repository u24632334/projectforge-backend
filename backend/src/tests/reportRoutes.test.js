const request = require("supertest");


jest.mock("../config/db", () => ({
    pool: {
        query: jest.fn(),
        end: jest.fn()
    }
}));


jest.mock("../services/reportService");


const { pool } =
    require("../config/db");

const reportService =
    require("../services/reportService");

const { generateToken } =
    require("../services/authService");

const app =
    require("../app");


describe("Report and Moderation API Routes", () => {

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


    test("POST /api/reports rejects unauthenticated users", async () => {
        const response = await request(app)
            .post("/api/reports")
            .send({
                reportedUserId: "user-2",
                reason: "Inappropriate behaviour"
            });

        expect(response.statusCode).toBe(401);

        expect(response.body).toEqual({
            success: false,
            error: "Access denied. No token provided."
        });
    });


    test("POST /api/reports creates a report for authenticated user", async () => {
        const mockReport = {
            report_id: "report-1",
            reporter_user_id: "student-1",
            reported_user_id: "user-2",
            reported_project_id: null,
            reason: "Inappropriate behaviour",
            status: "PENDING"
        };

        reportService.createReport.mockResolvedValue(mockReport);

        const response = await request(app)
            .post("/api/reports")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                reportedUserId: "user-2",
                reason: "Inappropriate behaviour"
            });

        expect(response.statusCode).toBe(201);

        expect(reportService.createReport).toHaveBeenCalledWith({
            reporterUserId: "student-1",
            reportedUserId: "user-2",
            reportedProjectId: undefined,
            reason: "Inappropriate behaviour"
        });

        expect(response.body).toEqual({
            message: "Report submitted successfully.",
            report: mockReport
        });
    });


    test("POST /api/reports uses JWT identity instead of reporterUserId from body", async () => {
        const mockReport = {
            report_id: "report-1",
            reporter_user_id: "student-1",
            status: "PENDING"
        };

        reportService.createReport.mockResolvedValue(mockReport);

        await request(app)
            .post("/api/reports")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                reporterUserId: "fake-user",
                reportedUserId: "user-2",
                reason: "Test reason"
            });

        expect(reportService.createReport).toHaveBeenCalledWith(
            expect.objectContaining({
                reporterUserId: "student-1"
            })
        );
    });


    test("POST /api/reports returns validation error", async () => {
        const error = new Error("A report reason is required.");
        error.statusCode = 400;

        reportService.createReport.mockRejectedValue(error);

        const response = await request(app)
            .post("/api/reports")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                reportedUserId: "user-2",
                reason: ""
            });

        expect(response.statusCode).toBe(400);

        expect(response.body).toEqual({
            error: "A report reason is required."
        });
    });


    test("GET /api/admin/reports rejects unauthenticated users", async () => {
        const response = await request(app)
            .get("/api/admin/reports");

        expect(response.statusCode).toBe(401);
    });


    test("GET /api/admin/reports rejects non-admin users", async () => {
        const response = await request(app)
            .get("/api/admin/reports")
            .set("Authorization", `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(403);

        expect(response.body).toEqual({
            success: false,
            error: "Administrator access required."
        });
    });


    test("GET /api/admin/reports allows admin users", async () => {
        const mockReports = [
            {
                report_id: "report-1",
                status: "PENDING"
            },
            {
                report_id: "report-2",
                status: "PENDING"
            }
        ];

        reportService.getPendingReports.mockResolvedValue(mockReports);

        const response = await request(app)
            .get("/api/admin/reports")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            reports: mockReports
        });
    });


    test("GET /api/admin/reports/:reportId returns one report for admin", async () => {
        const mockReport = {
            report_id: "report-1",
            status: "PENDING"
        };

        reportService.getReportById.mockResolvedValue(mockReport);

        const response = await request(app)
            .get("/api/admin/reports/report-1")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            report: mockReport
        });

        expect(reportService.getReportById)
            .toHaveBeenCalledWith("report-1");
    });


    test("GET /api/admin/reports/:reportId returns 404 when missing", async () => {
        const error = new Error("Report not found.");
        error.statusCode = 404;

        reportService.getReportById.mockRejectedValue(error);

        const response = await request(app)
            .get("/api/admin/reports/missing-report")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(404);

        expect(response.body).toEqual({
            error: "Report not found."
        });
    });


    test("PATCH dismiss uses authenticated admin as reviewer", async () => {
        const mockReport = {
            report_id: "report-1",
            status: "DISMISSED",
            reviewed_by_user_id: "admin-1"
        };

        reportService.dismissReport.mockResolvedValue(mockReport);

        const response = await request(app)
            .patch("/api/admin/reports/report-1/dismiss")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                reviewedByUserId: "fake-admin"
            });

        expect(response.statusCode).toBe(200);

        expect(reportService.dismissReport)
            .toHaveBeenCalledWith(
                "report-1",
                "admin-1"
            );

        expect(response.body).toEqual({
            message: "Report dismissed successfully.",
            report: mockReport
        });
    });


    test("PATCH dismiss rejects non-admin users", async () => {
        const response = await request(app)
            .patch("/api/admin/reports/report-1/dismiss")
            .set("Authorization", `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(403);
    });


    test("PATCH dismiss returns 409 for already reviewed report", async () => {
        const error =
            new Error("Only pending reports can be dismissed.");

        error.statusCode = 409;

        reportService.dismissReport.mockRejectedValue(error);

        const response = await request(app)
            .patch("/api/admin/reports/report-1/dismiss")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(409);

        expect(response.body).toEqual({
            error: "Only pending reports can be dismissed."
        });
    });


    afterAll(async () => {
        await pool.end();
    });

});