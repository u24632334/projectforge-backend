const { DevelopmentUpdate } = require("../models/DevelopmentUpdate");

describe("DevelopmentUpdate", () => {
    describe("constructor", () => {
        test("creates a valid development update", () => {
            const update = new DevelopmentUpdate({
                updateId: "update-1",
                projectId: "project-1",
                membershipId: "membership-1",
                content: "Completed the authentication module."
            });

            expect(update.updateId).toBe("update-1");
            expect(update.projectId).toBe("project-1");
            expect(update.membershipId).toBe("membership-1");
            expect(update.content).toBe("Completed the authentication module.");
        });

        test("rejects a missing project ID", () => {
            expect(() => new DevelopmentUpdate({
                membershipId: "membership-1",
                content: "Some progress."
            })).toThrow("Project ID is required.");
        });

        test("rejects a missing membership ID", () => {
            expect(() => new DevelopmentUpdate({
                projectId: "project-1",
                content: "Some progress."
            })).toThrow("Membership ID is required.");
        });

        test("rejects empty content", () => {
            expect(() => new DevelopmentUpdate({
                projectId: "project-1",
                membershipId: "membership-1",
                content: ""
            })).toThrow("Update content is required.");
        });

        test("rejects whitespace-only content", () => {
            expect(() => new DevelopmentUpdate({
                projectId: "project-1",
                membershipId: "membership-1",
                content: "   "
            })).toThrow("Update content is required.");
        });
    });

    describe("CanBeEditedBy", () => {
        const update = new DevelopmentUpdate({
            projectId: "project-1",
            membershipId: "membership-1",
            content: "Initial progress update."
        });

        test("allows the author to edit the update", () => {
            expect(update.CanBeEditedBy("membership-1")).toBe(true);
        });

        test("rejects another membership from editing the update", () => {
            expect(update.CanBeEditedBy("membership-2")).toBe(false);
        });

        test("rejects a missing membership ID", () => {
            expect(update.CanBeEditedBy()).toBe(false);
        });
    });

    describe("UpdateContent", () => {
        test("updates content when valid content is provided", () => {
            const update = new DevelopmentUpdate({
                projectId: "project-1",
                membershipId: "membership-1",
                content: "Initial update."
            });

            expect(update.UpdateContent("Updated progress.")).toBe(true);
            expect(update.content).toBe("Updated progress.");
        });

        test("rejects empty content", () => {
            const update = new DevelopmentUpdate({
                projectId: "project-1",
                membershipId: "membership-1",
                content: "Initial update."
            });

            expect(update.UpdateContent("")).toBe(false);
            expect(update.content).toBe("Initial update.");
        });

        test("rejects whitespace-only content", () => {
            const update = new DevelopmentUpdate({
                projectId: "project-1",
                membershipId: "membership-1",
                content: "Initial update."
            });

            expect(update.UpdateContent("   ")).toBe(false);
            expect(update.content).toBe("Initial update.");
        });
    });
});