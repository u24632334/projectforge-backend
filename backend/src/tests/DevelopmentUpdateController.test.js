const mockService = {
    CreateDevelopmentUpdate: jest.fn(),
    GetDevelopmentUpdatesByProject: jest.fn(),
    GetDevelopmentUpdate: jest.fn(),
    UpdateDevelopmentUpdate: jest.fn()
};

jest.mock("../services/DevelopmentUpdateService", () => {
    return jest.fn(() => mockService);
});

jest.mock("../db/developmentUpdateRepository", () => {
    return jest.fn().mockImplementation(() => ({}));
});

const {
    createDevelopmentUpdate,
    getDevelopmentUpdatesByProject,
    getDevelopmentUpdate,
    updateDevelopmentUpdate
} = require("../controllers/DevelopmentUpdateController");

function buildResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

function buildRequest(overrides = {}) {
    return {
        params: {
            projectId: "project-1",
            updateId: "update-1"
        },
        body: {
            content: "Completed the authentication module."
        },
        membership: {
            membershipId: "membership-1"
        },
        ...overrides
    };
}

describe("DevelopmentUpdateController", () => {
    let response;
    let next;

    beforeEach(() => {
        response = buildResponse();
        next = jest.fn();

        jest.clearAllMocks();
    });

    describe("createDevelopmentUpdate", () => {
        test("creates a development update and returns 201", async () => {
            const update = {
                update_id: "update-1",
                author_membership_id: "membership-1",
                content: "Completed the authentication module."
            };

            mockService.CreateDevelopmentUpdate.mockResolvedValue(update);

            await createDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(mockService.CreateDevelopmentUpdate).toHaveBeenCalledWith({
                projectId: "project-1",
                membershipId: "membership-1",
                content: "Completed the authentication module."
            });

            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                update
            });
        });

        test("returns 400 when the update cannot be created", async () => {
            mockService.CreateDevelopmentUpdate.mockResolvedValue(null);

            await createDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                success: false,
                message: "Development update could not be created."
            });
        });

        test("passes unexpected errors to next", async () => {
            const error = new Error("Database failure");

            mockService.CreateDevelopmentUpdate.mockRejectedValue(error);

            await createDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("getDevelopmentUpdatesByProject", () => {
        test("returns project development updates with 200", async () => {
            const updates = [
                {
                    update_id: "update-1",
                    content: "Completed authentication."
                },
                {
                    update_id: "update-2",
                    content: "Started testing."
                }
            ];

            mockService.GetDevelopmentUpdatesByProject.mockResolvedValue(
                updates
            );

            await getDevelopmentUpdatesByProject(
                buildRequest(),
                response,
                next
            );

            expect(
                mockService.GetDevelopmentUpdatesByProject
            ).toHaveBeenCalledWith("project-1");

            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                updates
            });
        });

        test("returns an empty update list when the project has no updates", async () => {
            mockService.GetDevelopmentUpdatesByProject.mockResolvedValue([]);

            await getDevelopmentUpdatesByProject(
                buildRequest(),
                response,
                next
            );

            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                updates: []
            });
        });

        test("passes unexpected errors to next", async () => {
            const error = new Error("Database failure");

            mockService.GetDevelopmentUpdatesByProject.mockRejectedValue(
                error
            );

            await getDevelopmentUpdatesByProject(
                buildRequest(),
                response,
                next
            );

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("getDevelopmentUpdate", () => {
        test("returns a development update with 200", async () => {
            const update = {
                update_id: "update-1",
                project_id: "project-1",
                content: "Completed authentication."
            };

            mockService.GetDevelopmentUpdate.mockResolvedValue(update);

            await getDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(
                mockService.GetDevelopmentUpdate
            ).toHaveBeenCalledWith("update-1");

            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                update
            });
        });

        test("returns 404 when the development update does not exist", async () => {
            mockService.GetDevelopmentUpdate.mockResolvedValue(null);

            await getDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                success: false,
                message: "Development update not found."
            });
        });

        test("returns 404 when the update belongs to another project", async () => {
            mockService.GetDevelopmentUpdate.mockResolvedValue({
                update_id: "update-1",
                project_id: "project-2",
                content: "Other project update."
            });

            await getDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                success: false,
                message: "Development update not found."
            });
        });

        test("passes unexpected errors to next", async () => {
            const error = new Error("Database failure");

            mockService.GetDevelopmentUpdate.mockRejectedValue(error);

            await getDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("updateDevelopmentUpdate", () => {
        test("updates a development update and returns 200", async () => {
            const update = {
                update_id: "update-1",
                content: "Updated progress."
            };

            mockService.UpdateDevelopmentUpdate.mockResolvedValue(update);

            await updateDevelopmentUpdate(
                buildRequest({
                    body: {
                        content: "Updated progress."
                    }
                }),
                response,
                next
            );

            expect(
                mockService.UpdateDevelopmentUpdate
            ).toHaveBeenCalledWith(
                "update-1",
                "membership-1",
                "Updated progress."
            );

            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                update
            });
        });

        test("returns 404 when the development update does not exist", async () => {
            mockService.UpdateDevelopmentUpdate.mockResolvedValue(null);

            await updateDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                success: false,
                message: "Development update not found."
            });
        });

        test("returns 403 when the membership is not authorised to edit", async () => {
            mockService.UpdateDevelopmentUpdate.mockResolvedValue(false);

            await updateDevelopmentUpdate(
                buildRequest({
                    membership: {
                        membershipId: "membership-2"
                    }
                }),
                response,
                next
            );

            expect(
                mockService.UpdateDevelopmentUpdate
            ).toHaveBeenCalledWith(
                "update-1",
                "membership-2",
                "Completed the authentication module."
            );

            expect(response.status).toHaveBeenCalledWith(403);
            expect(response.json).toHaveBeenCalledWith({
                success: false,
                message:
                    "You are not authorised to edit this development update."
            });
        });

        test("passes unexpected errors to next", async () => {
            const error = new Error("Database failure");

            mockService.UpdateDevelopmentUpdate.mockRejectedValue(error);

            await updateDevelopmentUpdate(
                buildRequest(),
                response,
                next
            );

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});