const DevelopmentUpdateService = require("../services/DevelopmentUpdateService");

describe("DevelopmentUpdateService", () => {
    let service;
    let repository;

    beforeEach(() => {
        repository = {
            create: jest.fn(),
            findByProject: jest.fn(),
            findById: jest.fn(),
            update: jest.fn()
        };

        service = new DevelopmentUpdateService(repository);
    });

    describe("CreateDevelopmentUpdate", () => {
        test("creates and persists a valid development update", async () => {
            const data = {
                updateId: "update-1",
                projectId: "project-1",
                membershipId: "membership-1",
                content: "Completed the authentication module."
            };

            const savedUpdate = {
                update_id: "update-1",
                author_membership_id: "membership-1",
                content: data.content
            };

            repository.create.mockResolvedValue(savedUpdate);

            const result = await service.CreateDevelopmentUpdate(data);

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    updateId: "update-1",
                    projectId: "project-1",
                    membershipId: "membership-1",
                    content: data.content
                })
            );

            expect(result).toEqual(savedUpdate);
        });

        test("rejects invalid development update content", async () => {
            const data = {
                projectId: "project-1",
                membershipId: "membership-1",
                content: ""
            };

            await expect(
                service.CreateDevelopmentUpdate(data)
            ).rejects.toThrow("Update content is required.");

            expect(repository.create).not.toHaveBeenCalled();
        });
    });

    describe("GetDevelopmentUpdatesByProject", () => {
        test("returns development updates for a project", async () => {
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

            repository.findByProject.mockResolvedValue(updates);

            const result =
                await service.GetDevelopmentUpdatesByProject("project-1");

            expect(repository.findByProject).toHaveBeenCalledWith("project-1");
            expect(result).toEqual(updates);
        });
    });

    describe("GetDevelopmentUpdate", () => {
        test("returns the requested development update", async () => {
            const update = {
                update_id: "update-1",
                content: "Completed authentication."
            };

            repository.findById.mockResolvedValue(update);

            const result =
                await service.GetDevelopmentUpdate("update-1");

            expect(repository.findById).toHaveBeenCalledWith("update-1");
            expect(result).toEqual(update);
        });

        test("returns null when the update does not exist", async () => {
            repository.findById.mockResolvedValue(null);

            const result =
                await service.GetDevelopmentUpdate("missing-update");

            expect(result).toBeNull();
        });
    });

    describe("UpdateDevelopmentUpdate", () => {
        test("allows the author to update their development update", async () => {
            repository.findById.mockResolvedValue({
                update_id: "update-1",
                project_id: "project-1",
                author_membership_id: "membership-1",
                content: "Initial progress.",
                created_at: new Date()
            });

            const updated = {
                update_id: "update-1",
                author_membership_id: "membership-1",
                content: "Updated progress."
            };

            repository.update.mockResolvedValue(updated);

            const result = await service.UpdateDevelopmentUpdate(
                "update-1",
                "membership-1",
                "Updated progress."
            );

            expect(repository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    updateId: "update-1",
                    membershipId: "membership-1",
                    content: "Updated progress."
                })
            );

            expect(result).toEqual(updated);
        });

        test("rejects another membership from editing the update", async () => {
            repository.findById.mockResolvedValue({
                update_id: "update-1",
                project_id: "project-1",
                author_membership_id: "membership-1",
                content: "Initial progress.",
                created_at: new Date()
            });

            const result = await service.UpdateDevelopmentUpdate(
                "update-1",
                "membership-2",
                "Attempted edit."
            );

            expect(result).toBe(false);
            expect(repository.update).not.toHaveBeenCalled();
        });

        test("rejects blank replacement content", async () => {
            repository.findById.mockResolvedValue({
                update_id: "update-1",
                project_id: "project-1",
                author_membership_id: "membership-1",
                content: "Initial progress.",
                created_at: new Date()
            });

            const result = await service.UpdateDevelopmentUpdate(
                "update-1",
                "membership-1",
                "   "
            );

            expect(result).toBe(false);
            expect(repository.update).not.toHaveBeenCalled();
        });

        test("returns null when the update does not exist", async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.UpdateDevelopmentUpdate(
                "missing-update",
                "membership-1",
                "New content."
            );

            expect(result).toBeNull();
            expect(repository.update).not.toHaveBeenCalled();
        });
    });
});