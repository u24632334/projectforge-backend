jest.mock(
    "../db/showcaseRepository",
    () => ({
        getProjectById:
            jest.fn(),

        getActiveProjectLead:
            jest.fn(),

        getSubmissionByProjectId:
            jest.fn(),

        getSubmissionById:
            jest.fn(),

        createSubmission:
            jest.fn(),

        getPendingSubmissions:
            jest.fn(),

        approveSubmission:
            jest.fn(),

        getPublicShowcase:
            jest.fn()
    })
);


const showcaseRepository =
    require(
        "../db/showcaseRepository"
    );

const showcaseService =
    require(
        "../services/showcaseService"
    );


const COMPLETED_PROJECT = {
    project_id:
        "project-1",

    title:
        "Completed Project",

    description:
        "A completed engineering project.",

    category:
        "Software Engineering",

    status:
        "COMPLETED",

    repository_url:
        null
};


const PROJECT_LEAD = {
    membership_id:
        "membership-1",

    project_id:
        "project-1",

    user_id:
        "user-1",

    member_role:
        "LEAD",

    active:
        true
};


const PENDING_SUBMISSION = {
    showcase_id:
        "showcase-1",

    project_id:
        "project-1",

    submitted_by_user_id:
        "user-1",

    status:
        "PENDING",

    approved_by_admin_user_id:
        null,

    approved_at:
        null,

    created_at:
        "2026-10-08T10:00:00Z"
};


describe(
    "showcaseService.createShowcaseSubmission",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "creates a pending showcase submission for a completed project led by the user",
            async () => {
                showcaseRepository
                    .getProjectById
                    .mockResolvedValue(
                        COMPLETED_PROJECT
                    );


                showcaseRepository
                    .getActiveProjectLead
                    .mockResolvedValue(
                        PROJECT_LEAD
                    );


                showcaseRepository
                    .getSubmissionByProjectId
                    .mockResolvedValue(
                        null
                    );


                showcaseRepository
                    .createSubmission
                    .mockResolvedValue(
                        PENDING_SUBMISSION
                    );


                const result =
                    await showcaseService
                        .createShowcaseSubmission({
                            projectId:
                                "project-1",

                            submittedByUserId:
                                "user-1"
                        });


                expect(
                    result.project
                ).toEqual(
                    COMPLETED_PROJECT
                );


                expect(
                    result.status
                ).toBe(
                    "PENDING"
                );


                expect(
                    showcaseRepository
                        .createSubmission
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    submittedByUserId:
                        "user-1"
                });
            }
        );


        test.each([
            undefined,
            null,
            ""
        ])(
            "rejects missing project ID (%p)",
            async (
                projectId
            ) => {
                await expect(
                    showcaseService
                        .createShowcaseSubmission({
                            projectId,

                            submittedByUserId:
                                "user-1"
                        })
                ).rejects
                    .toMatchObject({
                        message:
                            "Project ID is required.",

                        statusCode:
                            400
                    });
            }
        );


        test(
            "rejects a missing submitting user ID",
            async () => {
                await expect(
                    showcaseService
                        .createShowcaseSubmission({
                            projectId:
                                "project-1",

                            submittedByUserId:
                                null
                        })
                ).rejects
                    .toMatchObject({
                        message:
                            "Submitting user ID is required.",

                        statusCode:
                            400
                    });
            }
        );


        test(
            "returns 404 when the project does not exist",
            async () => {
                showcaseRepository
                    .getProjectById
                    .mockResolvedValue(
                        null
                    );


                await expect(
                    showcaseService
                        .createShowcaseSubmission({
                            projectId:
                                "missing-project",

                            submittedByUserId:
                                "user-1"
                        })
                ).rejects
                    .toMatchObject({
                        message:
                            "Project not found.",

                        statusCode:
                            404
                    });
            }
        );


        test.each([
            "DRAFT",
            "ACTIVE",
            "ARCHIVED"
        ])(
            "rejects a project with %s status",
            async (
                status
            ) => {
                showcaseRepository
                    .getProjectById
                    .mockResolvedValue({
                        ...COMPLETED_PROJECT,
                        status
                    });


                await expect(
                    showcaseService
                        .createShowcaseSubmission({
                            projectId:
                                "project-1",

                            submittedByUserId:
                                "user-1"
                        })
                ).rejects
                    .toMatchObject({
                        statusCode:
                            409
                    });


                expect(
                    showcaseRepository
                        .createSubmission
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "rejects showcase submission by a user who is not the Project Lead",
            async () => {
                showcaseRepository
                    .getProjectById
                    .mockResolvedValue(
                        COMPLETED_PROJECT
                    );


                showcaseRepository
                    .getActiveProjectLead
                    .mockResolvedValue(
                        null
                    );


                await expect(
                    showcaseService
                        .createShowcaseSubmission({
                            projectId:
                                "project-1",

                            submittedByUserId:
                                "user-2"
                        })
                ).rejects
                    .toMatchObject({
                        message:
                            "Project Lead access required.",

                        statusCode:
                            403
                    });


                expect(
                    showcaseRepository
                        .createSubmission
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "rejects a duplicate showcase submission",
            async () => {
                showcaseRepository
                    .getProjectById
                    .mockResolvedValue(
                        COMPLETED_PROJECT
                    );


                showcaseRepository
                    .getActiveProjectLead
                    .mockResolvedValue(
                        PROJECT_LEAD
                    );


                showcaseRepository
                    .getSubmissionByProjectId
                    .mockResolvedValue(
                        PENDING_SUBMISSION
                    );


                await expect(
                    showcaseService
                        .createShowcaseSubmission({
                            projectId:
                                "project-1",

                            submittedByUserId:
                                "user-1"
                        })
                ).rejects
                    .toMatchObject({
                        message:
                            "Project has already been submitted to the showcase.",

                        statusCode:
                            409
                    });


                expect(
                    showcaseRepository
                        .createSubmission
                ).not
                    .toHaveBeenCalled();
            }
        );
    }
);


describe(
    "showcaseService.getShowcaseSubmissionStatus",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "returns the Project Lead's showcase submission status",
            async () => {
                showcaseRepository
                    .getActiveProjectLead
                    .mockResolvedValue(
                        PROJECT_LEAD
                    );


                showcaseRepository
                    .getSubmissionByProjectId
                    .mockResolvedValue(
                        PENDING_SUBMISSION
                    );


                const result =
                    await showcaseService
                        .getShowcaseSubmissionStatus({
                            projectId:
                                "project-1",

                            userId:
                                "user-1"
                        });


                expect(
                    result
                ).toEqual(
                    PENDING_SUBMISSION
                );
            }
        );


        test(
            "rejects submission-status access by a non-Lead",
            async () => {
                showcaseRepository
                    .getActiveProjectLead
                    .mockResolvedValue(
                        null
                    );


                await expect(
                    showcaseService
                        .getShowcaseSubmissionStatus({
                            projectId:
                                "project-1",

                            userId:
                                "user-2"
                        })
                ).rejects
                    .toMatchObject({
                        message:
                            "Project Lead access required.",

                        statusCode:
                            403
                    });
            }
        );
    }
);


describe(
    "showcaseService.getPendingShowcaseSubmissions",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "returns pending submissions for administrator review",
            async () => {
                showcaseRepository
                    .getPendingSubmissions
                    .mockResolvedValue([
                        PENDING_SUBMISSION
                    ]);


                await expect(
                    showcaseService
                        .getPendingShowcaseSubmissions()
                ).resolves
                    .toEqual([
                        PENDING_SUBMISSION
                    ]);
            }
        );
    }
);


describe(
    "showcaseService.approveShowcaseSubmission",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "approves a pending completed-project submission",
            async () => {
                showcaseRepository
                    .getSubmissionById
                    .mockResolvedValue({
                        ...PENDING_SUBMISSION,

                        project_status:
                            "COMPLETED"
                    });


                showcaseRepository
                    .approveSubmission
                    .mockResolvedValue({
                        ...PENDING_SUBMISSION,

                        status:
                            "APPROVED",

                        approved_by_admin_user_id:
                            "admin-1",

                        approved_at:
                            "2026-10-08T11:00:00Z"
                    });


                const result =
                    await showcaseService
                        .approveShowcaseSubmission({
                            showcaseId:
                                "showcase-1",

                            adminUserId:
                                "admin-1"
                        });


                expect(
                    result.status
                ).toBe(
                    "APPROVED"
                );


                expect(
                    showcaseRepository
                        .approveSubmission
                ).toHaveBeenCalledWith(
                    "showcase-1",
                    "admin-1"
                );
            }
        );


        test(
            "returns 404 when the showcase submission does not exist",
            async () => {
                showcaseRepository
                    .getSubmissionById
                    .mockResolvedValue(
                        null
                    );


                await expect(
                    showcaseService
                        .approveShowcaseSubmission({
                            showcaseId:
                                "missing-showcase",

                            adminUserId:
                                "admin-1"
                        })
                ).rejects
                    .toMatchObject({
                        statusCode:
                            404
                    });
            }
        );


        test(
            "rejects approval when the project is not completed",
            async () => {
                showcaseRepository
                    .getSubmissionById
                    .mockResolvedValue({
                        ...PENDING_SUBMISSION,

                        project_status:
                            "ACTIVE"
                    });


                await expect(
                    showcaseService
                        .approveShowcaseSubmission({
                            showcaseId:
                                "showcase-1",

                            adminUserId:
                                "admin-1"
                        })
                ).rejects
                    .toMatchObject({
                        statusCode:
                            409
                    });


                expect(
                    showcaseRepository
                        .approveSubmission
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "rejects a submission that is already approved",
            async () => {
                showcaseRepository
                    .getSubmissionById
                    .mockResolvedValue({
                        ...PENDING_SUBMISSION,

                        status:
                            "APPROVED",

                        project_status:
                            "COMPLETED"
                    });


                await expect(
                    showcaseService
                        .approveShowcaseSubmission({
                            showcaseId:
                                "showcase-1",

                            adminUserId:
                                "admin-1"
                        })
                ).rejects
                    .toMatchObject({
                        statusCode:
                            409
                    });


                expect(
                    showcaseRepository
                        .approveSubmission
                ).not
                    .toHaveBeenCalled();
            }
        );


        test(
            "returns conflict if a pending submission can no longer be approved",
            async () => {
                showcaseRepository
                    .getSubmissionById
                    .mockResolvedValue({
                        ...PENDING_SUBMISSION,

                        project_status:
                            "COMPLETED"
                    });


                showcaseRepository
                    .approveSubmission
                    .mockResolvedValue(
                        null
                    );


                await expect(
                    showcaseService
                        .approveShowcaseSubmission({
                            showcaseId:
                                "showcase-1",

                            adminUserId:
                                "admin-1"
                        })
                ).rejects
                    .toMatchObject({
                        statusCode:
                            409
                    });
            }
        );
    }
);


describe(
    "showcaseService.getPublicShowcase",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });


        test(
            "returns the approved public showcase list",
            async () => {
                const projects = [
                    {
                        showcase_id:
                            "showcase-1",

                        project_id:
                            "project-1",

                        title:
                            "Public Project",

                        participants: [
                            "Alex",
                            "Sam"
                        ]
                    }
                ];


                showcaseRepository
                    .getPublicShowcase
                    .mockResolvedValue(
                        projects
                    );


                await expect(
                    showcaseService
                        .getPublicShowcase()
                ).resolves
                    .toEqual(
                        projects
                    );
            }
        );


        test(
            "returns an empty list when no projects are approved",
            async () => {
                showcaseRepository
                    .getPublicShowcase
                    .mockResolvedValue(
                        []
                    );


                await expect(
                    showcaseService
                        .getPublicShowcase()
                ).resolves
                    .toEqual(
                        []
                    );
            }
        );
    }
);