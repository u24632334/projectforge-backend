const TaskRepository = require("../db/taskRepository");

describe("TaskRepository", () => {
    let pool;
    let repository;

    beforeEach(() => {
        pool = {
            query: jest.fn()
        };

        repository = new TaskRepository(pool);
    });

    test("create inserts a task and returns the created row", async () => {
        const databaseRow = {
            task_id: "task-1",
            milestone_id: "milestone-1",
            assignee_membership_id: "membership-1",
            title: "Implement login",
            description: "Create login functionality.",
            status: "TODO",
            due_date: "2026-12-31"
        };

        pool.query.mockResolvedValue({
            rows: [databaseRow]
        });

        const task = {
            taskId: null,
            projectId: "project-1",
            milestoneId: "milestone-1",
            assigneeMembershipId: "membership-1",
            title: "Implement login",
            description: "Create login functionality.",
            status: "TODO",
            dueDate: "2026-12-31"
        };

        const result = await repository.create(task);

        expect(result).toEqual({
            ...databaseRow,
            project_id: "project-1"
        });

        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test("create returns null when the project or assignee relationship is invalid", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const task = {
            taskId: null,
            projectId: "project-1",
            milestoneId: "milestone-1",
            assigneeMembershipId: "membership-2",
            title: "Implement login",
            description: "Create login functionality.",
            status: "TODO",
            dueDate: null
        };

        const result = await repository.create(task);

        expect(result).toBeNull();
    });

    test("findByProject returns all tasks for the project", async () => {
        const rows = [
            {
                task_id: "task-1",
                milestone_id: "milestone-1",
                project_id: "project-1",
                title: "Task 1",
                due_date: "2026-10-01"
            },
            {
                task_id: "task-2",
                milestone_id: "milestone-2",
                project_id: "project-1",
                title: "Task 2",
                due_date: "2026-11-01"
            }
        ];

        pool.query.mockResolvedValue({ rows });

        const result = await repository.findByProject("project-1");

        expect(result).toEqual(rows);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test("findById returns the requested task", async () => {
        const row = {
            task_id: "task-1",
            milestone_id: "milestone-1",
            project_id: "project-1",
            title: "Implement login",
            due_date: "2026-12-31"
        };

        pool.query.mockResolvedValue({
            rows: [row]
        });

        const result = await repository.findById("task-1");

        expect(result).toEqual(row);
    });

    test("findById returns null when the task does not exist", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const result = await repository.findById("missing-task");

        expect(result).toBeNull();
    });

    test("update returns the updated task", async () => {
        const row = {
            task_id: "task-1",
            milestone_id: "milestone-1",
            project_id: "project-1",
            assignee_membership_id: "membership-1",
            title: "Updated task",
            description: "Updated description",
            status: "IN_PROGRESS",
            due_date: "2026-12-31"
        };

        pool.query.mockResolvedValue({
            rows: [row]
        });

        const task = {
            taskId: "task-1",
            projectId: "project-1",
            milestoneId: "milestone-1",
            assigneeMembershipId: "membership-1",
            title: "Updated task",
            description: "Updated description",
            status: "IN_PROGRESS",
            dueDate: "2026-12-31"
        };

        const result = await repository.update(task);

        expect(result).toEqual(row);
    });

    test("update returns null when the task is not in the project", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const task = {
            taskId: "task-1",
            projectId: "project-2",
            milestoneId: "milestone-1",
            assigneeMembershipId: "membership-1",
            title: "Updated task",
            description: "Updated description",
            status: "IN_PROGRESS",
            dueDate: null
        };

        const result = await repository.update(task);

        expect(result).toBeNull();
    });

    test("delete returns the deleted task", async () => {
        const row = {
            task_id: "task-1",
            milestone_id: "milestone-1",
            title: "Deleted task"
        };

        pool.query.mockResolvedValue({
            rows: [row]
        });

        const result = await repository.delete(
            "task-1",
            "project-1"
        );

        expect(result).toEqual(row);
    });

    test("delete returns null when the task is not in the project", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const result = await repository.delete(
            "task-1",
            "project-2"
        );

        expect(result).toBeNull();
    });
});