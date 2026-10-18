const TaskService = require("../services/TaskService");

describe("TaskService", () => {
    let repository;
    let service;

    beforeEach(() => {
        repository = {
            create: jest.fn(),
            findByProject: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        service = new TaskService(repository);
    });

    test("CreateTask creates a task through the repository", async () => {
        repository.create.mockResolvedValue({
            task_id: "task-1",
            project_id: "project-1"
        });

        const result = await service.CreateTask({
            taskId: "task-1",
            projectId: "project-1",
            milestoneId: "milestone-1",
            title: "Implement login",
            description: "Create login functionality.",
            status: "TODO",
            dueDate: null
        });

        expect(repository.create).toHaveBeenCalledTimes(1);
        expect(result.task_id).toBe("task-1");
    });

    test("GetTasksByProject returns project tasks", async () => {
        const tasks = [
            { task_id: "task-1" },
            { task_id: "task-2" }
        ];

        repository.findByProject.mockResolvedValue(tasks);

        const result = await service.GetTasksByProject("project-1");

        expect(repository.findByProject)
            .toHaveBeenCalledWith("project-1");

        expect(result).toEqual(tasks);
    });

    test("GetTask returns the requested task", async () => {
        const task = {
            task_id: "task-1",
            project_id: "project-1"
        };

        repository.findById.mockResolvedValue(task);

        const result = await service.GetTask("task-1");

        expect(repository.findById)
            .toHaveBeenCalledWith("task-1");

        expect(result).toEqual(task);
    });

    test("UpdateTask updates a valid status transition", async () => {
        repository.findById.mockResolvedValue({
            task_id: "task-1",
            project_id: "project-1",
            milestone_id: "milestone-1",
            assignee_membership_id: "membership-1",
            title: "Task",
            description: "Description",
            status: "TODO",
            due_date: null
        });

        repository.update.mockResolvedValue({
            task_id: "task-1",
            status: "IN_PROGRESS"
        });

        const result = await service.UpdateTask({
        taskId: "task-1",
        status: "IN_PROGRESS"
    }, "project-1");

        expect(repository.update).toHaveBeenCalledTimes(1);
        expect(result.status).toBe("IN_PROGRESS");
    });

    test("UpdateTask rejects an invalid status transition", async () => {
        repository.findById.mockResolvedValue({
            task_id: "task-1",
            project_id: "project-1",
            milestone_id: "milestone-1",
            assignee_membership_id: null,
            title: "Task",
            description: "Description",
            status: "TODO",
            due_date: null
        });

        const result = await service.UpdateTask({
        taskId: "task-1",
        status: "DONE"
    }, "project-1");

        expect(result).toBe(false);
        expect(repository.update).not.toHaveBeenCalled();
    });

    test("UpdateTask rejects an assignee from another project", async () => {
        repository.findById.mockResolvedValue({
            task_id: "task-1",
            project_id: "project-1",
            milestone_id: "milestone-1",
            assignee_membership_id: null,
            title: "Task",
            description: "Description",
            status: "TODO",
            due_date: null
        });

        const result = await service.UpdateTask({
    taskId: "task-1",
    assigneeMembership: {
        membershipId: "membership-2",
        projectId: "project-2"
    }
}, "project-1");

        expect(result).toBe(false);
        expect(repository.update).not.toHaveBeenCalled();
    });

    test("UpdateTask returns null when the task does not exist", async () => {
        repository.findById.mockResolvedValue(null);

        const result = await service.UpdateTask({
            taskId: "missing-task",
            status: "IN_PROGRESS"
        });

        expect(result).toBeNull();
        expect(repository.update).not.toHaveBeenCalled();
    });

    test("DeleteTask deletes the task for the project", async () => {
        const deletedTask = {
            task_id: "task-1"
        };

        repository.delete.mockResolvedValue(deletedTask);

        const result = await service.DeleteTask(
            "task-1",
            "project-1"
        );

        expect(repository.delete)
            .toHaveBeenCalledWith("task-1", "project-1");

        expect(result).toEqual(deletedTask);
    });
});