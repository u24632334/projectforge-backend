const express = require('express');
const request = require('supertest');


jest.mock(
    '../controllers/applicationController',
    () => ({
        submitApplication: jest.fn(),
        getApplications: jest.fn(),
        updateApplicationStatus: jest.fn()
    })
);


jest.mock(
    '../middleware/authGuard',
    () => {
        return jest.fn(
            (req, res, next) => {
                const authHeader =
                    req.headers.authorization;

                if (
                    !authHeader ||
                    !authHeader.startsWith(
                        'Bearer '
                    )
                ) {
                    return res.status(401).json({
                        success: false,
                        error:
                            'Access denied. No token provided.'
                    });
                }

                req.user = {
                    id: 'user-1',
                    email:
                        'student@projectforge.local',
                    role: 'STUDENT'
                };

                return next();
            }
        );
    }
);


const applicationController =
    require(
        '../controllers/applicationController'
    );

const applicationRoutes =
    require('../routes/applicationRoutes');


function buildApp() {
    const app = express();

    app.use(express.json());

    app.use(
        '/api/applications',
        applicationRoutes
    );

    return app;
}


describe(
    'Application routes',
    () => {
        let app;

        beforeEach(() => {
            jest.clearAllMocks();

            app = buildApp();

            applicationController
                .submitApplication
                .mockImplementation(
                    (req, res) => {
                        return res.status(201).json({
                            application: {
                                applicantUserId:
                                    req.user.id,
                                positionId:
                                    req.body.positionId,
                                status: 'PENDING'
                            }
                        });
                    }
                );

            applicationController
                .getApplications
                .mockImplementation(
                    (req, res) => {
                        return res.status(200).json({
                            reviewerUserId:
                                req.user.id,
                            applications: []
                        });
                    }
                );

            applicationController
                .updateApplicationStatus
                .mockImplementation(
                    (req, res) => {
                        return res.status(200).json({
                            reviewerUserId:
                                req.user.id,
                            application: {
                                applicationId:
                                    req.params.id,
                                status:
                                    req.body.status
                            }
                        });
                    }
                );
        });


        test(
            'POST /api/applications rejects unauthenticated submission',
            async () => {
                const response =
                    await request(app)
                        .post(
                            '/api/applications'
                        )
                        .send({
                            positionId:
                                'position-1',
                            message:
                                'I would like to join.'
                        });

                expect(
                    response.statusCode
                ).toBe(401);

                expect(
                    applicationController
                        .submitApplication
                ).not.toHaveBeenCalled();
            }
        );


        test(
            'POST /api/applications allows authenticated submission',
            async () => {
                const response =
                    await request(app)
                        .post(
                            '/api/applications'
                        )
                        .set(
                            'Authorization',
                            'Bearer test-token'
                        )
                        .send({
                            positionId:
                                'position-1',
                            message:
                                'I would like to join.'
                        });

                expect(
                    response.statusCode
                ).toBe(201);

                expect(
                    applicationController
                        .submitApplication
                ).toHaveBeenCalledTimes(1);

                expect(
                    response.body.application
                        .applicantUserId
                ).toBe('user-1');
            }
        );


        test(
            'authenticated application submission receives the JWT user on req.user',
            async () => {
                await request(app)
                    .post(
                        '/api/applications'
                    )
                    .set(
                        'Authorization',
                        'Bearer test-token'
                    )
                    .send({
                        positionId:
                            'position-1',
                        message:
                            'Application message'
                    });

                const req =
                    applicationController
                        .submitApplication
                        .mock.calls[0][0];

                expect(req.user).toEqual({
                    id: 'user-1',
                    email:
                        'student@projectforge.local',
                    role: 'STUDENT'
                });
            }
        );


        test(
            'GET /api/applications rejects unauthenticated review',
            async () => {
                const response =
                    await request(app)
                        .get(
                            '/api/applications'
                        );

                expect(
                    response.statusCode
                ).toBe(401);

                expect(
                    applicationController
                        .getApplications
                ).not.toHaveBeenCalled();
            }
        );


        test(
            'GET /api/applications allows authenticated review request',
            async () => {
                const response =
                    await request(app)
                        .get(
                            '/api/applications'
                        )
                        .set(
                            'Authorization',
                            'Bearer test-token'
                        );

                expect(
                    response.statusCode
                ).toBe(200);

                expect(
                    applicationController
                        .getApplications
                ).toHaveBeenCalledTimes(1);

                expect(
                    response.body.reviewerUserId
                ).toBe('user-1');
            }
        );


        test(
            'PATCH /api/applications/:id/status rejects unauthenticated status changes',
            async () => {
                const response =
                    await request(app)
                        .patch(
                            '/api/applications/application-1/status'
                        )
                        .send({
                            status: 'ACCEPTED'
                        });

                expect(
                    response.statusCode
                ).toBe(401);

                expect(
                    applicationController
                        .updateApplicationStatus
                ).not.toHaveBeenCalled();
            }
        );


        test(
            'PATCH /api/applications/:id/status allows authenticated status requests',
            async () => {
                const response =
                    await request(app)
                        .patch(
                            '/api/applications/application-1/status'
                        )
                        .set(
                            'Authorization',
                            'Bearer test-token'
                        )
                        .send({
                            status: 'ACCEPTED'
                        });

                expect(
                    response.statusCode
                ).toBe(200);

                expect(
                    applicationController
                        .updateApplicationStatus
                ).toHaveBeenCalledTimes(1);

                expect(
                    response.body.application
                        .applicationId
                ).toBe('application-1');

                expect(
                    response.body.reviewerUserId
                ).toBe('user-1');
            }
        );
    }
);