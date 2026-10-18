jest.mock("../config/db", () => ({
    pool: {
        connect: jest.fn()
    }
}));

jest.mock("../models/moderationModel");

const { pool } = require("../config/db");
const moderationModel = require("../models/moderationModel");

const {
    suspendUser,
    removeProjectContent
} = require("../services/moderationService");


describe("Moderation Service", () => {

    let client;

    beforeEach(() => {
        jest.clearAllMocks();

        client = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };

        pool.connect.mockResolvedValue(client);
    });


    // ========================================================
    // USER SUSPENSION
    // ========================================================

    test("suspends a user and creates an audit log", async () => {
        moderationModel.getUserById.mockResolvedValue({
            user_id: "user-1",
            email: "student@test.com",
            system_role: "STUDENT",
            status: "ACTIVE"
        });

        moderationModel.suspendUser.mockResolvedValue({
            user_id: "user-1",
            email: "student@test.com",
            system_role: "STUDENT",
            status: "SUSPENDED"
        });

        moderationModel.createAuditLog.mockResolvedValue({
            audit_id: "audit-1",
            admin_user_id: "admin-1",
            action_type: "USER_SUSPENDED",
            target_type: "USER",
            target_id: "user-1"
        });


        const result = await suspendUser(
            "admin-1",
            "user-1",
            "Repeated abusive behaviour"
        );


        expect(client.query)
            .toHaveBeenNthCalledWith(1, "BEGIN");

        expect(moderationModel.getUserById)
            .toHaveBeenCalledWith(
                client,
                "user-1"
            );

        expect(moderationModel.suspendUser)
            .toHaveBeenCalledWith(
                client,
                "user-1"
            );

        expect(moderationModel.createAuditLog)
            .toHaveBeenCalledWith(
                client,
                {
                    adminUserId: "admin-1",
                    actionType: "USER_SUSPENDED",
                    targetType: "USER",
                    targetId: "user-1",
                    details: {
                        previousStatus: "ACTIVE",
                        reason: "Repeated abusive behaviour"
                    }
                }
            );

        expect(client.query)
            .toHaveBeenCalledWith("COMMIT");

        expect(client.release)
            .toHaveBeenCalled();

        expect(result.user.status)
            .toBe("SUSPENDED");

        expect(result.auditLog.audit_id)
            .toBe("audit-1");
    });


    test("rejects suspension when user does not exist", async () => {
        moderationModel.getUserById.mockResolvedValue(null);

        await expect(
            suspendUser(
                "admin-1",
                "missing-user",
                "Test reason"
            )
        ).rejects.toMatchObject({
            message: "User not found.",
            statusCode: 404
        });

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(moderationModel.suspendUser)
            .not
            .toHaveBeenCalled();

        expect(client.release)
            .toHaveBeenCalled();
    });


    test("rejects suspension when user is already suspended", async () => {
        moderationModel.getUserById.mockResolvedValue({
            user_id: "user-1",
            status: "SUSPENDED"
        });

        await expect(
            suspendUser(
                "admin-1",
                "user-1"
            )
        ).rejects.toMatchObject({
            message: "User is already suspended.",
            statusCode: 409
        });

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(moderationModel.suspendUser)
            .not
            .toHaveBeenCalled();
    });


    test("prevents administrator from suspending own account", async () => {
        await expect(
            suspendUser(
                "admin-1",
                "admin-1"
            )
        ).rejects.toMatchObject({
            message:
                "Administrators cannot suspend their own account.",
            statusCode: 400
        });

        expect(pool.connect)
            .not
            .toHaveBeenCalled();
    });


    test("rolls back user suspension if audit logging fails", async () => {
        moderationModel.getUserById.mockResolvedValue({
            user_id: "user-1",
            status: "ACTIVE"
        });

        moderationModel.suspendUser.mockResolvedValue({
            user_id: "user-1",
            status: "SUSPENDED"
        });

        moderationModel.createAuditLog.mockRejectedValue(
            new Error("Audit database failure")
        );


        await expect(
            suspendUser(
                "admin-1",
                "user-1",
                "Test reason"
            )
        ).rejects.toThrow(
            "Audit database failure"
        );


        expect(moderationModel.suspendUser)
            .toHaveBeenCalled();

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(client.query)
            .not
            .toHaveBeenCalledWith("COMMIT");

        expect(client.release)
            .toHaveBeenCalled();
    });


    // ========================================================
    // PROJECT CONTENT REMOVAL
    // ========================================================

    test("archives project content and creates an audit log", async () => {
        moderationModel.getProjectById.mockResolvedValue({
            project_id: "project-1",
            owner_user_id: "user-1",
            title: "Test Project",
            status: "ACTIVE"
        });

        moderationModel.archiveProject.mockResolvedValue({
            project_id: "project-1",
            owner_user_id: "user-1",
            title: "Test Project",
            status: "ARCHIVED"
        });

        moderationModel.createAuditLog.mockResolvedValue({
            audit_id: "audit-2",
            admin_user_id: "admin-1",
            action_type: "CONTENT_REMOVED",
            target_type: "PROJECT",
            target_id: "project-1"
        });


        const result =
            await removeProjectContent(
                "admin-1",
                "project-1",
                "Inappropriate public content"
            );


        expect(client.query)
            .toHaveBeenNthCalledWith(1, "BEGIN");

        expect(moderationModel.getProjectById)
            .toHaveBeenCalledWith(
                client,
                "project-1"
            );

        expect(moderationModel.archiveProject)
            .toHaveBeenCalledWith(
                client,
                "project-1"
            );

        expect(moderationModel.createAuditLog)
            .toHaveBeenCalledWith(
                client,
                {
                    adminUserId: "admin-1",
                    actionType: "CONTENT_REMOVED",
                    targetType: "PROJECT",
                    targetId: "project-1",
                    details: {
                        previousStatus: "ACTIVE",
                        reason: "Inappropriate public content"
                    }
                }
            );

        expect(client.query)
            .toHaveBeenCalledWith("COMMIT");

        expect(client.release)
            .toHaveBeenCalled();

        expect(result.project.status)
            .toBe("ARCHIVED");

        expect(result.auditLog.audit_id)
            .toBe("audit-2");
    });


    test("rejects content removal when project does not exist", async () => {
        moderationModel.getProjectById.mockResolvedValue(null);

        await expect(
            removeProjectContent(
                "admin-1",
                "missing-project"
            )
        ).rejects.toMatchObject({
            message: "Project not found.",
            statusCode: 404
        });

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(moderationModel.archiveProject)
            .not
            .toHaveBeenCalled();

        expect(client.release)
            .toHaveBeenCalled();
    });


    test("rejects content removal when project is already archived", async () => {
        moderationModel.getProjectById.mockResolvedValue({
            project_id: "project-1",
            status: "ARCHIVED"
        });

        await expect(
            removeProjectContent(
                "admin-1",
                "project-1"
            )
        ).rejects.toMatchObject({
            message: "Project content is already removed.",
            statusCode: 409
        });

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(moderationModel.archiveProject)
            .not
            .toHaveBeenCalled();
    });

});