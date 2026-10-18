const express = require("express");
const request = require("supertest");

jest.mock("../config/db", () => ({
    pool: {}
}));

jest.mock("../middleware/authGuard", () => {
    return (req, res, next) => {
        req.user = {
            id: "user-1",
            email: "test@example.com"
        };
        next();
    };
});

jest.mock("../middleware/requireProjectMembership", () => ({
    CreateMembershipLookup: jest.fn(() => jest.fn()),

    BuildRequireProjectMembership: jest.fn(() => {
        return (req, res, next) => {
            req.membership = {
                membershipId: "membership-1",
                projectId: req.params.projectId,
                memberRole: "MEMBER",
                active: true
            };

            next();
        };
    })
}));

jest.mock("../controllers/taskController", () => ({
    createTask: jest.fn((req, res) => {
        res.status(201).json({
            success: true,
            route: "createTask"
        });
    }),

    getTasksByProject: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            route: "getTasksByProject"
        });
    }),

    getTask: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            route: "getTask"
        });
    }),

    updateTask: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            route: "updateTask"
        });
    }),

    deleteTask: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            route: "deleteTask"
        });
    })
}));

const taskRoutes = require("../routes/taskRoutes");
const taskController = require("../controllers/taskController");

describe("Task Routes", () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use("/api", taskRoutes);
    });

    test("POST /projects/:projectId/tasks reaches createTask", async () => {
        const response = await request(app)
            .post("/api/projects/project-1/tasks")
            .send({
                milestoneId: "milestone-1",
                title: "Implement login",
                description: "Create login functionality."
            });

        expect(response.status).toBe(201);

        expect(response.body).toEqual({
            success: true,
            route: "createTask"
        });

        expect(taskController.createTask).toHaveBeenCalledTimes(1);
    });

    test("GET /projects/:projectId/tasks reaches getTasksByProject", async () => {
        const response = await request(app)
            .get("/api/projects/project-1/tasks");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            route: "getTasksByProject"
        });

        expect(taskController.getTasksByProject).toHaveBeenCalledTimes(1);
    });

    test("GET /projects/:projectId/tasks/:taskId reaches getTask", async () => {
        const response = await request(app)
            .get("/api/projects/project-1/tasks/task-1");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            route: "getTask"
        });

        expect(taskController.getTask).toHaveBeenCalledTimes(1);
    });

    test("PATCH /projects/:projectId/tasks/:taskId reaches updateTask", async () => {
        const response = await request(app)
            .patch("/api/projects/project-1/tasks/task-1")
            .send({
                status: "IN_PROGRESS"
            });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            route: "updateTask"
        });

        expect(taskController.updateTask).toHaveBeenCalledTimes(1);
    });

    test("DELETE /projects/:projectId/tasks/:taskId reaches deleteTask", async () => {
        const response = await request(app)
            .delete("/api/projects/project-1/tasks/task-1");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            route: "deleteTask"
        });

        expect(taskController.deleteTask).toHaveBeenCalledTimes(1);
    });

    test("task routes pass through project membership middleware", async () => {
        const response = await request(app)
            .get("/api/projects/project-1/tasks");

        expect(response.status).toBe(200);

        expect(taskController.getTasksByProject).toHaveBeenCalledTimes(1);
    });
});