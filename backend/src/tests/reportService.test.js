const reportModel = require("../models/reportModel");

const {
    createReport,
    getPendingReports,
    getReportById,
    dismissReport
} = require("../services/reportService");


// Mock the database model so these are true unit tests.
jest.mock("../models/reportModel");


describe("Report and Moderation Service Unit Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe("createReport", () => {

        test("creates a valid user report", async () => {
            const mockReport = {
                report_id: "report-1",
                reporter_user_id: "user-1",
                reported_user_id: "user-2",
                reported_project_id: null,
                reason: "Inappropriate behaviour",
                status: "PENDING"
            };

            reportModel.createReport.mockResolvedValue(mockReport);

            const result = await createReport({
                reporterUserId: "user-1",
                reportedUserId: "user-2",
                reason: "Inappropriate behaviour"
            });

            expect(reportModel.createReport).toHaveBeenCalledWith({
                reporterUserId: "user-1",
                reportedUserId: "user-2",
                reportedProjectId: null,
                reason: "Inappropriate behaviour"
            });

            expect(result).toEqual(mockReport);
        });


        test("creates a valid project report", async () => {
            const mockReport = {
                report_id: "report-2",
                reporter_user_id: "user-1",
                reported_user_id: null,
                reported_project_id: "project-1",
                reason: "Inappropriate project content",
                status: "PENDING"
            };

            reportModel.createReport.mockResolvedValue(mockReport);

            const result = await createReport({
                reporterUserId: "user-1",
                reportedProjectId: "project-1",
                reason: "Inappropriate project content"
            });

            expect(result).toEqual(mockReport);
        });


        test("rejects a report with no reporter", async () => {
            await expect(
                createReport({
                    reportedUserId: "user-2",
                    reason: "Test reason"
                })
            ).rejects.toMatchObject({
                message: "Reporter user ID is required.",
                statusCode: 400
            });
        });


        test("rejects a blank reason", async () => {
            await expect(
                createReport({
                    reporterUserId: "user-1",
                    reportedUserId: "user-2",
                    reason: "   "
                })
            ).rejects.toMatchObject({
                message: "A report reason is required.",
                statusCode: 400
            });
        });


        test("rejects a report with no target", async () => {
            await expect(
                createReport({
                    reporterUserId: "user-1",
                    reason: "Test reason"
                })
            ).rejects.toMatchObject({
                statusCode: 400
            });
        });


        test("rejects a report with both user and project targets", async () => {
            await expect(
                createReport({
                    reporterUserId: "user-1",
                    reportedUserId: "user-2",
                    reportedProjectId: "project-1",
                    reason: "Test reason"
                })
            ).rejects.toMatchObject({
                statusCode: 400
            });
        });

    });


    describe("getPendingReports", () => {

        test("returns pending reports from the model", async () => {
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

            reportModel.getPendingReports.mockResolvedValue(mockReports);

            const result = await getPendingReports();

            expect(reportModel.getPendingReports).toHaveBeenCalled();
            expect(result).toEqual(mockReports);
        });

    });


    describe("getReportById", () => {

        test("returns an existing report", async () => {
            const mockReport = {
                report_id: "report-1",
                status: "PENDING"
            };

            reportModel.getReportById.mockResolvedValue(mockReport);

            const result = await getReportById("report-1");

            expect(reportModel.getReportById)
                .toHaveBeenCalledWith("report-1");

            expect(result).toEqual(mockReport);
        });


        test("returns 404 when the report does not exist", async () => {
            reportModel.getReportById.mockResolvedValue(null);

            await expect(
                getReportById("missing-report")
            ).rejects.toMatchObject({
                message: "Report not found.",
                statusCode: 404
            });
        });

    });


    describe("dismissReport", () => {

        test("dismisses a pending report", async () => {
            const existingReport = {
                report_id: "report-1",
                status: "PENDING"
            };

            const dismissedReport = {
                report_id: "report-1",
                status: "DISMISSED",
                reviewed_by_user_id: "admin-1"
            };

            reportModel.getReportById
                .mockResolvedValue(existingReport);

            reportModel.dismissReport
                .mockResolvedValue(dismissedReport);

            const result = await dismissReport(
                "report-1",
                "admin-1"
            );

            expect(reportModel.dismissReport)
                .toHaveBeenCalledWith(
                    "report-1",
                    "admin-1"
                );

            expect(result).toEqual(dismissedReport);
        });


        test("rejects dismissing a report that does not exist", async () => {
            reportModel.getReportById.mockResolvedValue(null);

            await expect(
                dismissReport(
                    "missing-report",
                    "admin-1"
                )
            ).rejects.toMatchObject({
                message: "Report not found.",
                statusCode: 404
            });
        });


        test("rejects dismissing a non-pending report", async () => {
            reportModel.getReportById.mockResolvedValue({
                report_id: "report-1",
                status: "DISMISSED"
            });

            await expect(
                dismissReport(
                    "report-1",
                    "admin-1"
                )
            ).rejects.toMatchObject({
                message: "Only pending reports can be dismissed.",
                statusCode: 409
            });
        });

    });

});