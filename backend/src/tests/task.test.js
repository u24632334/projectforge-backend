const { Task, TASK_STATUS } = require("../models/Task");

describe("Task", () => {
    function buildTask(overrides = {}) {
        return new Task({
            projectId: "project-1",
            milestoneId: "milestone-1",
            title: "Implement login",
            description: "Create the login functionality.",
            ...overrides
        });
    }

    function buildMembership(overrides = {}) {
        return {
            membershipId: "membership-1",
            projectId: "project-1",
            userId: "user-1",
            memberRole: "MEMBER",
            active: true,
            ...overrides
        };
    }

    // Test 27
    test("creates a task with a project ID and milestone ID", () => {
        const task = buildTask();

        expect(task.projectId).toBe("project-1");
        expect(task.milestoneId).toBe("milestone-1");
        expect(task.status).toBe(TASK_STATUS.TODO);
    });

    // Test 28
    test("creates an unassigned task by default", () => {
        const task = buildTask();

        expect(task.assigneeMembershipId).toBeNull();
    });

    // Test 29
    test("assigns a task to a membership from the same project", () => {
        const task = buildTask();
        const membership = buildMembership();

        const result = task.AssignTo(membership);

        expect(result).toBe(true);
        expect(task.assigneeMembershipId).toBe("membership-1");
    });

    // Test 30
    test("rejects assigning a task to a membership from another project", () => {
        const task = buildTask();

        const membership = buildMembership({
            membershipId: "membership-2",
            projectId: "project-2"
        });

        const result = task.AssignTo(membership);

        expect(result).toBe(false);
        expect(task.assigneeMembershipId).toBeNull();
    });

    test("unassigns the current assignee", () => {
        const task = buildTask({
            assigneeMembershipId: "membership-1"
        });

        const result = task.Unassign();

        expect(result).toBe(true);
        expect(task.assigneeMembershipId).toBeNull();
    });

    test("changes TODO to IN_PROGRESS", () => {
        const task = buildTask();

        const result = task.UpdateStatus(TASK_STATUS.IN_PROGRESS);

        expect(result).toBe(true);
        expect(task.status).toBe(TASK_STATUS.IN_PROGRESS);
    });

    test("changes IN_PROGRESS to BLOCKED", () => {
        const task = buildTask({
            status: TASK_STATUS.IN_PROGRESS
        });

        const result = task.UpdateStatus(TASK_STATUS.BLOCKED);

        expect(result).toBe(true);
        expect(task.status).toBe(TASK_STATUS.BLOCKED);
    });

    test("changes BLOCKED to IN_PROGRESS", () => {
        const task = buildTask({
            status: TASK_STATUS.BLOCKED
        });

        const result = task.UpdateStatus(TASK_STATUS.IN_PROGRESS);

        expect(result).toBe(true);
        expect(task.status).toBe(TASK_STATUS.IN_PROGRESS);
    });

    test("changes IN_PROGRESS to DONE", () => {
        const task = buildTask({
            status: TASK_STATUS.IN_PROGRESS
        });

        const result = task.UpdateStatus(TASK_STATUS.DONE);

        expect(result).toBe(true);
        expect(task.status).toBe(TASK_STATUS.DONE);
    });

    test("rejects TODO directly to DONE", () => {
        const task = buildTask();

        const result = task.UpdateStatus(TASK_STATUS.DONE);

        expect(result).toBe(false);
        expect(task.status).toBe(TASK_STATUS.TODO);
    });

    test("rejects TODO directly to BLOCKED", () => {
        const task = buildTask();

        const result = task.UpdateStatus(TASK_STATUS.BLOCKED);

        expect(result).toBe(false);
        expect(task.status).toBe(TASK_STATUS.TODO);
    });

    test("rejects BLOCKED directly to DONE", () => {
        const task = buildTask({
            status: TASK_STATUS.BLOCKED
        });

        const result = task.UpdateStatus(TASK_STATUS.DONE);

        expect(result).toBe(false);
        expect(task.status).toBe(TASK_STATUS.BLOCKED);
    });

    test("rejects any transition from DONE", () => {
        const task = buildTask({
            status: TASK_STATUS.DONE
        });

        const result = task.UpdateStatus(TASK_STATUS.IN_PROGRESS);

        expect(result).toBe(false);
        expect(task.status).toBe(TASK_STATUS.DONE);
    });

    test("rejects an invalid task status", () => {
        const task = buildTask();

        const result = task.UpdateStatus("INVALID");

        expect(result).toBe(false);
        expect(task.status).toBe(TASK_STATUS.TODO);
    });

    test("updates the due date to a valid future date", () => {
        const task = buildTask();
        const futureDate = "2099-12-31";

        const result = task.UpdateDueDate(futureDate);

        expect(result).toBe(true);
        expect(task.dueDate).toBe(futureDate);
    });

    test("rejects a past due date", () => {
        const task = buildTask();

        const result = task.UpdateDueDate("2000-01-01");

        expect(result).toBe(false);
        expect(task.dueDate).toBeNull();
    });

    test("rejects an assignment without a membership", () => {
        const task = buildTask();

        const result = task.AssignTo(null);

        expect(result).toBe(false);
        expect(task.assigneeMembershipId).toBeNull();
    });
});