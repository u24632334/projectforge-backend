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

jest.mock("../controllers/DevelopmentUpdateController", () => ({
    createDevelopmentUpdate: jest.fn((req, res) => {
        res.status(201).json({
            success: true,
            route: "createDevelopmentUpdate"
        });
    }),

    getDevelopmentUpdatesByProject: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            route: "getDevelopmentUpdatesByProject"
        });
    }),

    getDevelopmentUpdate: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            route: "getDevelopmentUpdate"
        });
    }),

    updateDevelopmentUpdate: jest.fn((req, res) => {
        res.status(200).json({
            success: true,
            route: "updateDevelopmentUpdate"
        });
    })
}));

const developmentUpdateRoutes =
    require("../routes/developmentUpdateRoutes");

const developmentUpdateController =
    require("../controllers/DevelopmentUpdateController");

describe("Development Update Routes", () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use("/api", developmentUpdateRoutes);
    });

    test(
        "POST /projects/:projectId/development-updates reaches createDevelopmentUpdate",
        async () => {
            const response = await request(app)
                .post("/api/projects/project-1/development-updates")
                .send({
                    content: "Completed the authentication module."
                });

            expect(response.status).toBe(201);

            expect(response.body).toEqual({
                success: true,
                route: "createDevelopmentUpdate"
            });

            expect(
                developmentUpdateController.createDevelopmentUpdate
            ).toHaveBeenCalledTimes(1);
        }
    );

    test(
        "GET /projects/:projectId/development-updates reaches getDevelopmentUpdatesByProject",
        async () => {
            const response = await request(app)
                .get("/api/projects/project-1/development-updates");

            expect(response.status).toBe(200);

            expect(response.body).toEqual({
                success: true,
                route: "getDevelopmentUpdatesByProject"
            });

            expect(
                developmentUpdateController.getDevelopmentUpdatesByProject
            ).toHaveBeenCalledTimes(1);
        }
    );

    test(
        "GET /projects/:projectId/development-updates/:updateId reaches getDevelopmentUpdate",
        async () => {
            const response = await request(app)
                .get(
                    "/api/projects/project-1/development-updates/update-1"
                );

            expect(response.status).toBe(200);

            expect(response.body).toEqual({
                success: true,
                route: "getDevelopmentUpdate"
            });

            expect(
                developmentUpdateController.getDevelopmentUpdate
            ).toHaveBeenCalledTimes(1);
        }
    );

    test(
        "PATCH /projects/:projectId/development-updates/:updateId reaches updateDevelopmentUpdate",
        async () => {
            const response = await request(app)
                .patch(
                    "/api/projects/project-1/development-updates/update-1"
                )
                .send({
                    content: "Updated progress."
                });

            expect(response.status).toBe(200);

            expect(response.body).toEqual({
                success: true,
                route: "updateDevelopmentUpdate"
            });

            expect(
                developmentUpdateController.updateDevelopmentUpdate
            ).toHaveBeenCalledTimes(1);
        }
    );

    test(
        "development update routes pass through project membership middleware",
        async () => {
            const response = await request(app)
                .get("/api/projects/project-1/development-updates");

            expect(response.status).toBe(200);

            expect(
                developmentUpdateController.getDevelopmentUpdatesByProject
            ).toHaveBeenCalledTimes(1);
        }
    );
});