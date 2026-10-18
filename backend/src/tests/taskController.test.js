const mockService = {
    CreateTask: jest.fn(),
    GetTasksByProject: jest.fn(),
    GetTask: jest.fn(),
    UpdateTask: jest.fn(),
    DeleteTask: jest.fn()
};

jest.mock("../services/TaskService", () => {
    return jest.fn(() => mockService);
});

const taskController = require("../controllers/taskController");

describe("TaskController", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            body: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
    });

    test("createTask returns 201 when task is created", async () => {
        const task = {
            task_id: "task-1",
            project_id: "project-1",
            title: "Implement login"
        };

        mockService.CreateTask.mockResolvedValue(task);

        req.params.projectId = "project-1";
        req.body = {
            milestoneId: "milestone-1",
            title: "Implement login",
            description: "Create login functionality."
        };

        await taskController.createTask(req, res, next);

        expect(mockService.CreateTask).toHaveBeenCalledWith({
            taskId: undefined,
            projectId: "project-1",
            milestoneId: "milestone-1",
            assigneeMembershipId: null,
            title: "Implement login",
            description: "Create login functionality.",
            status: "TODO",
            dueDate: null
        });

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            task
        });
    });

    test("createTask returns 400 when task cannot be created", async () => {
        mockService.CreateTask.mockResolvedValue(null);

        req.params.projectId = "project-1";
        req.body = {
            milestoneId: "milestone-1",
            title: "Task",
            description: "Description"
        };

        await taskController.createTask(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Task could not be created."
        });
    });

    test("getTasksByProject returns project tasks", async () => {
        const tasks = [
            { task_id: "task-1" },
            { task_id: "task-2" }
        ];

        mockService.GetTasksByProject.mockResolvedValue(tasks);

        req.params.projectId = "project-1";

        await taskController.getTasksByProject(req, res, next);

        expect(mockService.GetTasksByProject).toHaveBeenCalledWith(
            "project-1"
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            tasks
        });
    });

    test("getTask returns 200 when task belongs to project", async () => {
        const task = {
            task_id: "task-1",
            project_id: "project-1"
        };

        mockService.GetTask.mockResolvedValue(task);

        req.params = {
            projectId: "project-1",
            taskId: "task-1"
        };

        await taskController.getTask(req, res, next);

        expect(mockService.GetTask).toHaveBeenCalledWith("task-1");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            task
        });
    });

    test("getTask returns 404 when task does not belong to project", async () => {
        mockService.GetTask.mockResolvedValue({
            task_id: "task-1",
            project_id: "project-2"
        });

        req.params = {
            projectId: "project-1",
            taskId: "task-1"
        };

        await taskController.getTask(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Task not found."
        });
    });

    test("getTask returns 404 when task does not exist", async () => {
        mockService.GetTask.mockResolvedValue(null);

        req.params = {
            projectId: "project-1",
            taskId: "missing-task"
        };

        await taskController.getTask(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Task not found."
        });
    });

    test("updateTask returns 200 when update succeeds", async () => {
        const task = {
            task_id: "task-1",
            status: "IN_PROGRESS"
        };

        mockService.UpdateTask.mockResolvedValue(task);

        req.params = {
            projectId: "project-1",
            taskId: "task-1"
        };

        req.body = {
            status: "IN_PROGRESS"
        };

        await taskController.updateTask(req, res, next);

        expect(mockService.UpdateTask).toHaveBeenCalledWith(
            {
                taskId: "task-1",
                assigneeMembership: undefined,
                status: "IN_PROGRESS",
                title: undefined,
                description: undefined,
                dueDate: undefined
            },
            "project-1"
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            task
        });
    });

    test("updateTask returns 404 when task does not exist", async () => {
        mockService.UpdateTask.mockResolvedValue(null);

        req.params = {
            projectId: "project-1",
            taskId: "missing-task"
        };

        await taskController.updateTask(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Task not found."
        });
    });

    test("updateTask returns 400 when update is rejected", async () => {
        mockService.UpdateTask.mockResolvedValue(false);

        req.params = {
            projectId: "project-1",
            taskId: "task-1"
        };

        req.body = {
            status: "DONE"
        };

        await taskController.updateTask(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Task update rejected."
        });
    });

    test("deleteTask returns 200 when task is deleted", async () => {
        mockService.DeleteTask.mockResolvedValue({
            task_id: "task-1"
        });

        req.params = {
            projectId: "project-1",
            taskId: "task-1"
        };

        await taskController.deleteTask(req, res, next);

        expect(mockService.DeleteTask).toHaveBeenCalledWith(
            "task-1",
            "project-1"
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Task deleted successfully."
        });
    });

    test("deleteTask returns 404 when task does not exist", async () => {
        mockService.DeleteTask.mockResolvedValue(null);

        req.params = {
            projectId: "project-1",
            taskId: "missing-task"
        };

        await taskController.deleteTask(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Task not found."
        });
    });
});