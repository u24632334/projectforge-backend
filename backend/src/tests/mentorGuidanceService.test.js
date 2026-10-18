jest.mock(
    "../config/db",
    () => ({
        pool: {
            query: jest.fn(),
            connect: jest.fn()
        }
    })
);


jest.mock(
    "../db/mentorGuidanceRepository",
    () => ({
        findProjectById:
            jest.fn(),

        getEligibleProjectsForMentor:
            jest.fn(),

        findCurrentAssignment:
            jest.fn(),

        createMentorAssignment:
            jest.fn(),

        getAssignmentsForProject:
            jest.fn(),

        findAssignmentByIdForUpdate:
            jest.fn(),

        findActiveLeadMembership:
            jest.fn(),

        findApprovedMentor:
            jest.fn(),

        approveAssignment:
            jest.fn(),

        endAssignment:
            jest.fn(),

        findActiveAssignment:
            jest.fn(),

        findActiveProjectMembership:
            jest.fn(),

        createGuidance:
            jest.fn(),

        findGuidanceById:
            jest.fn(),

        updateGuidance:
            jest.fn(),

        getGuidanceForProject:
            jest.fn()
    })
);


const {
    pool
} =
    require(
        "../config/db"
    );


const mentorGuidanceRepository =
    require(
        "../db/mentorGuidanceRepository"
    );


const mentorGuidanceService =
    require(
        "../services/mentorGuidanceService"
    );


const {
    MAX_GUIDANCE_LENGTH
} =
    mentorGuidanceService;


// ============================================================
// VALID TEST UUIDS
// ============================================================

const PROJECT_ID =
    "11111111-1111-4111-8111-111111111111";

const OTHER_PROJECT_ID =
    "22222222-2222-4222-8222-222222222222";

const MENTOR_ID =
    "33333333-3333-4333-8333-333333333333";

const LEAD_ID =
    "44444444-4444-4444-8444-444444444444";

const ASSIGNMENT_ID =
    "55555555-5555-4555-8555-555555555555";

const GUIDANCE_ID =
    "66666666-6666-4666-8666-666666666666";

const OTHER_USER_ID =
    "77777777-7777-4777-8777-777777777777";


describe(
    "Mentor Guidance Service",
    () => {

        let client;


        beforeEach(() => {

            jest.clearAllMocks();


            client = {
                query:
                    jest.fn(),

                release:
                    jest.fn()
            };


            pool.connect
                .mockResolvedValue(
                    client
                );
        });


        // ====================================================
        // ELIGIBLE PROJECT DISCOVERY
        // ====================================================

        describe(
            "getEligibleProjectsForMentor",
            () => {

                test(
                    "returns active projects available to an approved Mentor",
                    async () => {

                        mentorGuidanceRepository
                            .findApprovedMentor
                            .mockResolvedValue({
                                user_id:
                                    MENTOR_ID,

                                system_role:
                                    "MENTOR",

                                status:
                                    "ACTIVE"
                            });


                        const projects = [
                            {
                                projectId:
                                    PROJECT_ID,

                                title:
                                    "Control Project",

                                allowMentorSupport:
                                    true
                            }
                        ];


                        mentorGuidanceRepository
                            .getEligibleProjectsForMentor
                            .mockResolvedValue(
                                projects
                            );


                        const result =
                            await mentorGuidanceService
                                .getEligibleProjectsForMentor({
                                    mentorUserId:
                                        MENTOR_ID
                                });


                        expect(
                            mentorGuidanceRepository
                                .findApprovedMentor
                        ).toHaveBeenCalledWith(
                            pool,
                            MENTOR_ID
                        );


                        expect(
                            mentorGuidanceRepository
                                .getEligibleProjectsForMentor
                        ).toHaveBeenCalledWith(
                            MENTOR_ID
                        );


                        expect(
                            result
                        ).toEqual(
                            projects
                        );
                    }
                );


                test(
                    "rejects a missing Mentor user ID",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .getEligibleProjectsForMentor({})
                        ).rejects.toMatchObject({
                            message:
                                "Mentor user ID is required.",

                            statusCode:
                                400
                        });
                    }
                );


                test(
                    "rejects a malformed Mentor user ID before the database is called",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .getEligibleProjectsForMentor({
                                    mentorUserId:
                                        "mentor-1"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Mentor user ID must be a valid UUID.",

                            statusCode:
                                400
                        });


                        expect(
                            mentorGuidanceRepository
                                .findApprovedMentor
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects a user who is not an approved active Mentor",
                    async () => {

                        mentorGuidanceRepository
                            .findApprovedMentor
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .getEligibleProjectsForMentor({
                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Approved Mentor access is required.",

                            statusCode:
                                403
                        });
                    }
                );
            }
        );


        // ====================================================
        // MENTOR ASSIGNMENT REQUEST
        // ====================================================

        describe(
            "requestMentorAssignment",
            () => {

                beforeEach(() => {

                    mentorGuidanceRepository
                        .findApprovedMentor
                        .mockResolvedValue({
                            user_id:
                                MENTOR_ID,

                            system_role:
                                "MENTOR",

                            status:
                                "ACTIVE"
                        });


                    mentorGuidanceRepository
                        .findProjectById
                        .mockResolvedValue({
                            project_id:
                                PROJECT_ID,

                            status:
                                "ACTIVE",

                            allow_mentor_support:
                                true
                        });


                    mentorGuidanceRepository
                        .findCurrentAssignment
                        .mockResolvedValue(
                            null
                        );
                });


                test(
                    "creates a PENDING Mentor assignment request",
                    async () => {

                        const assignment = {
                            assignmentId:
                                ASSIGNMENT_ID,

                            projectId:
                                PROJECT_ID,

                            mentorUserId:
                                MENTOR_ID,

                            status:
                                "PENDING"
                        };


                        mentorGuidanceRepository
                            .createMentorAssignment
                            .mockResolvedValue(
                                assignment
                            );


                        const result =
                            await mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                });


                        expect(
                            mentorGuidanceRepository
                                .createMentorAssignment
                        ).toHaveBeenCalledWith({
                            projectId:
                                PROJECT_ID,

                            mentorUserId:
                                MENTOR_ID
                        });


                        expect(
                            result.status
                        ).toBe(
                            "PENDING"
                        );
                    }
                );


                test(
                    "rejects a malformed project ID",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        "project-1",

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project ID must be a valid UUID.",

                            statusCode:
                                400
                        });


                        expect(
                            mentorGuidanceRepository
                                .findApprovedMentor
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects a user who no longer has approved Mentor access",
                    async () => {

                        mentorGuidanceRepository
                            .findApprovedMentor
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Approved Mentor access is required.",

                            statusCode:
                                403
                        });
                    }
                );


                test(
                    "returns 404 when the requested project does not exist",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project not found.",

                            statusCode:
                                404
                        });
                    }
                );


                test(
                    "rejects Mentor support requests for a non-active project",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue({
                                project_id:
                                    PROJECT_ID,

                                status:
                                    "COMPLETED",

                                allow_mentor_support:
                                    true
                            });


                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            statusCode:
                                409
                        });
                    }
                );


                test(
                    "rejects Mentor support when the project has not opted in",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue({
                                project_id:
                                    PROJECT_ID,

                                status:
                                    "ACTIVE",

                                allow_mentor_support:
                                    false
                            });


                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "This project is not accepting Mentor involvement.",

                            statusCode:
                                403
                        });
                    }
                );


                test(
                    "rejects a duplicate PENDING Mentor request",
                    async () => {

                        mentorGuidanceRepository
                            .findCurrentAssignment
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                status:
                                    "PENDING"
                            });


                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "You already have a pending Mentor request for this project.",

                            statusCode:
                                409
                        });


                        expect(
                            mentorGuidanceRepository
                                .createMentorAssignment
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects a duplicate ACTIVE Mentor assignment",
                    async () => {

                        mentorGuidanceRepository
                            .findCurrentAssignment
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                status:
                                    "ACTIVE"
                            });


                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "You are already an active Mentor for this project.",

                            statusCode:
                                409
                        });
                    }
                );


                test(
                    "converts a database duplicate race condition into HTTP 409",
                    async () => {

                        const duplicateError =
                            new Error(
                                "duplicate"
                            );

                        duplicateError.code =
                            "23505";


                        mentorGuidanceRepository
                            .createMentorAssignment
                            .mockRejectedValue(
                                duplicateError
                            );


                        await expect(
                            mentorGuidanceService
                                .requestMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "A current Mentor request already exists for this project.",

                            statusCode:
                                409
                        });
                    }
                );
            }
        );


        // ====================================================
        // PROJECT LEAD - VIEW ASSIGNMENTS
        // ====================================================

        describe(
            "getAssignmentsForProject",
            () => {

                test(
                    "returns assignments to the active Project Lead",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue({
                                project_id:
                                    PROJECT_ID
                            });


                        mentorGuidanceRepository
                            .findActiveLeadMembership
                            .mockResolvedValue({
                                membership_id:
                                    "lead-membership",

                                member_role:
                                    "LEAD",

                                active:
                                    true
                            });


                        const assignments = [
                            {
                                assignmentId:
                                    ASSIGNMENT_ID,

                                status:
                                    "PENDING"
                            }
                        ];


                        mentorGuidanceRepository
                            .getAssignmentsForProject
                            .mockResolvedValue(
                                assignments
                            );


                        const result =
                            await mentorGuidanceService
                                .getAssignmentsForProject({
                                    projectId:
                                        PROJECT_ID,

                                    leadUserId:
                                        LEAD_ID
                                });


                        expect(
                            mentorGuidanceRepository
                                .findActiveLeadMembership
                        ).toHaveBeenCalledWith(
                            pool,
                            PROJECT_ID,
                            LEAD_ID
                        );


                        expect(
                            result
                        ).toEqual(
                            assignments
                        );
                    }
                );


                test(
                    "returns 404 when the project does not exist",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .getAssignmentsForProject({
                                    projectId:
                                        PROJECT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project not found.",

                            statusCode:
                                404
                        });
                    }
                );


                test(
                    "rejects a user who is not the active Project Lead",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue({
                                project_id:
                                    PROJECT_ID
                            });


                        mentorGuidanceRepository
                            .findActiveLeadMembership
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .getAssignmentsForProject({
                                    projectId:
                                        PROJECT_ID,

                                    leadUserId:
                                        OTHER_USER_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project Lead access required.",

                            statusCode:
                                403
                        });
                    }
                );
            }
        );


        // ====================================================
        // APPROVE MENTOR ASSIGNMENT
        // ====================================================

        describe(
            "approveMentorAssignment",
            () => {

                function configureSuccessfulApproval() {

                    mentorGuidanceRepository
                        .findAssignmentByIdForUpdate
                        .mockResolvedValue({
                            assignment_id:
                                ASSIGNMENT_ID,

                            project_id:
                                PROJECT_ID,

                            mentor_user_id:
                                MENTOR_ID,

                            status:
                                "PENDING"
                        });


                    mentorGuidanceRepository
                        .findActiveLeadMembership
                        .mockResolvedValue({
                            membership_id:
                                "lead-membership",

                            project_id:
                                PROJECT_ID,

                            user_id:
                                LEAD_ID,

                            member_role:
                                "LEAD",

                            active:
                                true
                        });


                    mentorGuidanceRepository
                        .findApprovedMentor
                        .mockResolvedValue({
                            user_id:
                                MENTOR_ID,

                            system_role:
                                "MENTOR",

                            status:
                                "ACTIVE"
                        });


                    mentorGuidanceRepository
                        .approveAssignment
                        .mockResolvedValue({
                            assignmentId:
                                ASSIGNMENT_ID,

                            projectId:
                                PROJECT_ID,

                            mentorUserId:
                                MENTOR_ID,

                            status:
                                "ACTIVE"
                        });


                    client.query
                        .mockResolvedValueOnce({
                            rows: []
                        })
                        .mockResolvedValueOnce({
                            rows: [
                                {
                                    project_id:
                                        PROJECT_ID,

                                    status:
                                        "ACTIVE",

                                    allow_mentor_support:
                                        true
                                }
                            ]
                        })
                        .mockResolvedValueOnce({
                            rows: []
                        });
                }


                test(
                    "changes a valid pending assignment to ACTIVE",
                    async () => {

                        configureSuccessfulApproval();


                        const result =
                            await mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                });


                        expect(
                            result.status
                        ).toBe(
                            "ACTIVE"
                        );


                        expect(
                            mentorGuidanceRepository
                                .approveAssignment
                        ).toHaveBeenCalledWith(
                            client,
                            ASSIGNMENT_ID
                        );


                        expect(
                            client.query
                        ).toHaveBeenCalledWith(
                            "COMMIT"
                        );


                        expect(
                            client.release
                        ).toHaveBeenCalledTimes(
                            1
                        );
                    }
                );


                test(
                    "returns 404 when the assignment does not exist",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue(
                                null
                            );


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Mentor assignment not found.",

                            statusCode:
                                404
                        });


                        expect(
                            client.query
                        ).toHaveBeenCalledWith(
                            "ROLLBACK"
                        );


                        expect(
                            client.release
                        ).toHaveBeenCalled();
                    }
                );


                test(
                    "rejects an assignment belonging to another project before changing state",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                project_id:
                                    OTHER_PROJECT_ID,

                                mentor_user_id:
                                    MENTOR_ID,

                                status:
                                    "PENDING"
                            });


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Mentor assignment does not belong to this project.",

                            statusCode:
                                404
                        });


                        expect(
                            mentorGuidanceRepository
                                .approveAssignment
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects approval by a non-Lead",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                project_id:
                                    PROJECT_ID,

                                mentor_user_id:
                                    MENTOR_ID,

                                status:
                                    "PENDING"
                            });


                        mentorGuidanceRepository
                            .findActiveLeadMembership
                            .mockResolvedValue(
                                null
                            );


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        OTHER_USER_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project Lead access required.",

                            statusCode:
                                403
                        });
                    }
                );


                test(
                    "rejects approval when the assignment is not PENDING",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                project_id:
                                    PROJECT_ID,

                                mentor_user_id:
                                    MENTOR_ID,

                                status:
                                    "ACTIVE"
                            });


                        mentorGuidanceRepository
                            .findActiveLeadMembership
                            .mockResolvedValue({
                                member_role:
                                    "LEAD",

                                active:
                                    true
                            });


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Only pending Mentor assignments can be approved.",

                            statusCode:
                                409
                        });
                    }
                );


                test(
                    "rejects approval if the project is no longer active",
                    async () => {

                        configureSuccessfulApproval();


                        client.query
                            .mockReset()
                            .mockResolvedValueOnce({
                                rows: []
                            })
                            .mockResolvedValueOnce({
                                rows: [
                                    {
                                        project_id:
                                            PROJECT_ID,

                                        status:
                                            "COMPLETED",

                                        allow_mentor_support:
                                            true
                                    }
                                ]
                            })
                            .mockResolvedValueOnce({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            statusCode:
                                409
                        });


                        expect(
                            mentorGuidanceRepository
                                .approveAssignment
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects approval if Mentor support has been disabled",
                    async () => {

                        configureSuccessfulApproval();


                        client.query
                            .mockReset()
                            .mockResolvedValueOnce({
                                rows: []
                            })
                            .mockResolvedValueOnce({
                                rows: [
                                    {
                                        project_id:
                                            PROJECT_ID,

                                        status:
                                            "ACTIVE",

                                        allow_mentor_support:
                                            false
                                    }
                                ]
                            })
                            .mockResolvedValueOnce({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "This project is no longer accepting Mentor involvement.",

                            statusCode:
                                409
                        });
                    }
                );


                test(
                    "rejects approval if the requested user no longer has approved Mentor privileges",
                    async () => {

                        configureSuccessfulApproval();


                        mentorGuidanceRepository
                            .findApprovedMentor
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .approveMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            statusCode:
                                409
                        });


                        expect(
                            mentorGuidanceRepository
                                .approveAssignment
                        ).not.toHaveBeenCalled();
                    }
                );
            }
        );


        // ====================================================
        // END MENTOR ASSIGNMENT
        // ====================================================

        describe(
            "endMentorAssignment",
            () => {

                test(
                    "changes an ACTIVE assignment to ENDED",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                project_id:
                                    PROJECT_ID,

                                mentor_user_id:
                                    MENTOR_ID,

                                status:
                                    "ACTIVE"
                            });


                        mentorGuidanceRepository
                            .findActiveLeadMembership
                            .mockResolvedValue({
                                member_role:
                                    "LEAD",

                                active:
                                    true
                            });


                        mentorGuidanceRepository
                            .endAssignment
                            .mockResolvedValue({
                                assignmentId:
                                    ASSIGNMENT_ID,

                                projectId:
                                    PROJECT_ID,

                                status:
                                    "ENDED"
                            });


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        const result =
                            await mentorGuidanceService
                                .endMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                });


                        expect(
                            result.status
                        ).toBe(
                            "ENDED"
                        );


                        expect(
                            client.query
                        ).toHaveBeenCalledWith(
                            "COMMIT"
                        );
                    }
                );


                test(
                    "rejects ending an assignment belonging to another project",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                project_id:
                                    OTHER_PROJECT_ID,

                                mentor_user_id:
                                    MENTOR_ID,

                                status:
                                    "ACTIVE"
                            });


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .endMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            statusCode:
                                404
                        });


                        expect(
                            mentorGuidanceRepository
                                .endAssignment
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects a non-Lead trying to end an assignment",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                project_id:
                                    PROJECT_ID,

                                mentor_user_id:
                                    MENTOR_ID,

                                status:
                                    "ACTIVE"
                            });


                        mentorGuidanceRepository
                            .findActiveLeadMembership
                            .mockResolvedValue(
                                null
                            );


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .endMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        OTHER_USER_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project Lead access required.",

                            statusCode:
                                403
                        });
                    }
                );


                test(
                    "rejects ending a non-ACTIVE assignment",
                    async () => {

                        mentorGuidanceRepository
                            .findAssignmentByIdForUpdate
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                project_id:
                                    PROJECT_ID,

                                mentor_user_id:
                                    MENTOR_ID,

                                status:
                                    "PENDING"
                            });


                        mentorGuidanceRepository
                            .findActiveLeadMembership
                            .mockResolvedValue({
                                member_role:
                                    "LEAD",

                                active:
                                    true
                            });


                        client.query
                            .mockResolvedValue({
                                rows: []
                            });


                        await expect(
                            mentorGuidanceService
                                .endMentorAssignment({
                                    projectId:
                                        PROJECT_ID,

                                    assignmentId:
                                        ASSIGNMENT_ID,

                                    leadUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Only active Mentor assignments can be ended.",

                            statusCode:
                                409
                        });
                    }
                );
            }
        );


        // ====================================================
        // CREATE GUIDANCE
        // ====================================================

        describe(
            "createGuidance",
            () => {

                beforeEach(() => {

                    mentorGuidanceRepository
                        .findProjectById
                        .mockResolvedValue({
                            project_id:
                                PROJECT_ID,

                            status:
                                "ACTIVE"
                        });


                    mentorGuidanceRepository
                        .findActiveAssignment
                        .mockResolvedValue({
                            assignment_id:
                                ASSIGNMENT_ID,

                            project_id:
                                PROJECT_ID,

                            mentor_user_id:
                                MENTOR_ID,

                            status:
                                "ACTIVE"
                        });
                });


                test(
                    "creates trimmed guidance for an actively assigned Mentor",
                    async () => {

                        mentorGuidanceRepository
                            .createGuidance
                            .mockResolvedValue({
                                guidanceId:
                                    GUIDANCE_ID,

                                assignmentId:
                                    ASSIGNMENT_ID,

                                guidance:
                                    "Improve the API tests."
                            });


                        const result =
                            await mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "  Improve the API tests.  "
                                });


                        expect(
                            mentorGuidanceRepository
                                .createGuidance
                        ).toHaveBeenCalledWith({
                            assignmentId:
                                ASSIGNMENT_ID,

                            guidance:
                                "Improve the API tests."
                        });


                        expect(
                            result.guidance
                        ).toBe(
                            "Improve the API tests."
                        );
                    }
                );


                test(
                    "rejects a missing project ID",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Useful guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project ID is required.",

                            statusCode:
                                400
                        });
                    }
                );


                test(
                    "rejects a malformed project ID before repository access",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        "project-1",

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Useful guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project ID must be a valid UUID.",

                            statusCode:
                                400
                        });


                        expect(
                            mentorGuidanceRepository
                                .findProjectById
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects a missing Mentor user ID",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidance:
                                        "Useful guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Mentor user ID is required.",

                            statusCode:
                                400
                        });
                    }
                );


                test.each([
                    undefined,
                    null,
                    "",
                    "   ",
                    123,
                    {},
                    []
                ])(
                    "rejects invalid guidance text: %p",
                    async (
                        guidance
                    ) => {

                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Guidance text is required.",

                            statusCode:
                                400
                        });


                        expect(
                            mentorGuidanceRepository
                                .findProjectById
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "accepts guidance exactly at the maximum length",
                    async () => {

                        const guidance =
                            "G".repeat(
                                MAX_GUIDANCE_LENGTH
                            );


                        mentorGuidanceRepository
                            .createGuidance
                            .mockResolvedValue({
                                guidanceId:
                                    GUIDANCE_ID,

                                assignmentId:
                                    ASSIGNMENT_ID,

                                guidance
                            });


                        const result =
                            await mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance
                                });


                        expect(
                            result.guidance.length
                        ).toBe(
                            MAX_GUIDANCE_LENGTH
                        );
                    }
                );


                test(
                    "rejects guidance longer than the maximum length",
                    async () => {

                        const guidance =
                            "G".repeat(
                                MAX_GUIDANCE_LENGTH +
                                1
                            );


                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance
                                })
                        ).rejects.toMatchObject({
                            statusCode:
                                400
                        });


                        expect(
                            mentorGuidanceRepository
                                .findProjectById
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "returns 404 when the project does not exist",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Useful guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project not found.",

                            statusCode:
                                404
                        });
                    }
                );


                test(
                    "rejects guidance for a non-active project",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue({
                                project_id:
                                    PROJECT_ID,

                                status:
                                    "COMPLETED"
                            });


                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Useful guidance"
                                })
                        ).rejects.toMatchObject({
                            statusCode:
                                409
                        });
                    }
                );


                test(
                    "rejects guidance when no ACTIVE Mentor assignment exists",
                    async () => {

                        mentorGuidanceRepository
                            .findActiveAssignment
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .createGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Useful guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "An active Mentor assignment is required before guidance can be submitted.",

                            statusCode:
                                403
                        });


                        expect(
                            mentorGuidanceRepository
                                .createGuidance
                        ).not.toHaveBeenCalled();
                    }
                );
            }
        );


        // ====================================================
        // VIEW GUIDANCE
        // ====================================================

        describe(
            "getGuidanceForProject",
            () => {

                beforeEach(() => {

                    mentorGuidanceRepository
                        .findProjectById
                        .mockResolvedValue({
                            project_id:
                                PROJECT_ID,

                            status:
                                "ACTIVE"
                        });
                });


                test(
                    "allows an active project member to read guidance",
                    async () => {

                        mentorGuidanceRepository
                            .findActiveProjectMembership
                            .mockResolvedValue({
                                membership_id:
                                    "member-1",

                                active:
                                    true
                            });


                        const guidance = [
                            {
                                guidanceId:
                                    GUIDANCE_ID,

                                guidance:
                                    "Check the control loop."
                            }
                        ];


                        mentorGuidanceRepository
                            .getGuidanceForProject
                            .mockResolvedValue(
                                guidance
                            );


                        const result =
                            await mentorGuidanceService
                                .getGuidanceForProject({
                                    projectId:
                                        PROJECT_ID,

                                    requestingUserId:
                                        LEAD_ID
                                });


                        expect(
                            result
                        ).toEqual(
                            guidance
                        );


                        expect(
                            mentorGuidanceRepository
                                .findActiveAssignment
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "allows the active assigned Mentor to read guidance",
                    async () => {

                        mentorGuidanceRepository
                            .findActiveProjectMembership
                            .mockResolvedValue(
                                null
                            );


                        mentorGuidanceRepository
                            .findActiveAssignment
                            .mockResolvedValue({
                                assignment_id:
                                    ASSIGNMENT_ID,

                                status:
                                    "ACTIVE"
                            });


                        mentorGuidanceRepository
                            .getGuidanceForProject
                            .mockResolvedValue([
                                {
                                    guidanceId:
                                        GUIDANCE_ID
                                }
                            ]);


                        const result =
                            await mentorGuidanceService
                                .getGuidanceForProject({
                                    projectId:
                                        PROJECT_ID,

                                    requestingUserId:
                                        MENTOR_ID
                                });


                        expect(
                            result
                        ).toHaveLength(
                            1
                        );
                    }
                );


                test(
                    "rejects an unrelated authenticated user",
                    async () => {

                        mentorGuidanceRepository
                            .findActiveProjectMembership
                            .mockResolvedValue(
                                null
                            );


                        mentorGuidanceRepository
                            .findActiveAssignment
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .getGuidanceForProject({
                                    projectId:
                                        PROJECT_ID,

                                    requestingUserId:
                                        OTHER_USER_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "You do not have access to this project's Mentor guidance.",

                            statusCode:
                                403
                        });
                    }
                );


                test(
                    "rejects viewing guidance without a project ID",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .getGuidanceForProject({
                                    requestingUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project ID is required.",

                            statusCode:
                                400
                        });
                    }
                );


                test(
                    "rejects viewing guidance without an authenticated user ID",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .getGuidanceForProject({
                                    projectId:
                                        PROJECT_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Authenticated user ID is required.",

                            statusCode:
                                400
                        });
                    }
                );


                test(
                    "returns 404 when viewing guidance for a missing project",
                    async () => {

                        mentorGuidanceRepository
                            .findProjectById
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .getGuidanceForProject({
                                    projectId:
                                        PROJECT_ID,

                                    requestingUserId:
                                        LEAD_ID
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Project not found.",

                            statusCode:
                                404
                        });
                    }
                );
            }
        );


        // ====================================================
        // EDIT GUIDANCE
        // ====================================================

        describe(
            "editGuidance",
            () => {

                test(
                    "allows the owning Mentor to edit guidance while the assignment is ACTIVE",
                    async () => {

                        mentorGuidanceRepository
                            .findGuidanceById
                            .mockResolvedValue({
                                guidanceId:
                                    GUIDANCE_ID,

                                projectId:
                                    PROJECT_ID,

                                mentorUserId:
                                    MENTOR_ID,

                                assignmentStatus:
                                    "ACTIVE",

                                guidance:
                                    "Old guidance"
                            });


                        mentorGuidanceRepository
                            .updateGuidance
                            .mockResolvedValue({
                                guidanceId:
                                    GUIDANCE_ID,

                                assignmentId:
                                    ASSIGNMENT_ID,

                                guidance:
                                    "Updated guidance"
                            });


                        const result =
                            await mentorGuidanceService
                                .editGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidanceId:
                                        GUIDANCE_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "  Updated guidance  "
                                });


                        expect(
                            mentorGuidanceRepository
                                .updateGuidance
                        ).toHaveBeenCalledWith(
                            GUIDANCE_ID,
                            "Updated guidance"
                        );


                        expect(
                            result.guidance
                        ).toBe(
                            "Updated guidance"
                        );
                    }
                );


                test(
                    "returns 404 when the guidance entry does not exist",
                    async () => {

                        mentorGuidanceRepository
                            .findGuidanceById
                            .mockResolvedValue(
                                null
                            );


                        await expect(
                            mentorGuidanceService
                                .editGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidanceId:
                                        GUIDANCE_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Updated guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Guidance entry not found.",

                            statusCode:
                                404
                        });
                    }
                );


                test(
                    "rejects editing guidance through the wrong project URL",
                    async () => {

                        mentorGuidanceRepository
                            .findGuidanceById
                            .mockResolvedValue({
                                guidanceId:
                                    GUIDANCE_ID,

                                projectId:
                                    OTHER_PROJECT_ID,

                                mentorUserId:
                                    MENTOR_ID,

                                assignmentStatus:
                                    "ACTIVE"
                            });


                        await expect(
                            mentorGuidanceService
                                .editGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidanceId:
                                        GUIDANCE_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Updated guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Guidance entry does not belong to this project.",

                            statusCode:
                                404
                        });


                        expect(
                            mentorGuidanceRepository
                                .updateGuidance
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects a Mentor attempting to edit another Mentor's guidance",
                    async () => {

                        mentorGuidanceRepository
                            .findGuidanceById
                            .mockResolvedValue({
                                guidanceId:
                                    GUIDANCE_ID,

                                projectId:
                                    PROJECT_ID,

                                mentorUserId:
                                    OTHER_USER_ID,

                                assignmentStatus:
                                    "ACTIVE"
                            });


                        await expect(
                            mentorGuidanceService
                                .editGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidanceId:
                                        GUIDANCE_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Updated guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "You may only edit your own Mentor guidance.",

                            statusCode:
                                403
                        });
                    }
                );


                test(
                    "rejects editing guidance after the Mentor assignment has ended",
                    async () => {

                        mentorGuidanceRepository
                            .findGuidanceById
                            .mockResolvedValue({
                                guidanceId:
                                    GUIDANCE_ID,

                                projectId:
                                    PROJECT_ID,

                                mentorUserId:
                                    MENTOR_ID,

                                assignmentStatus:
                                    "ENDED"
                            });


                        await expect(
                            mentorGuidanceService
                                .editGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidanceId:
                                        GUIDANCE_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "Updated guidance"
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Guidance can only be edited while the Mentor assignment is active.",

                            statusCode:
                                409
                        });
                    }
                );


                test(
                    "rejects blank replacement guidance",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .editGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidanceId:
                                        GUIDANCE_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "   "
                                })
                        ).rejects.toMatchObject({
                            message:
                                "Guidance text is required.",

                            statusCode:
                                400
                        });


                        expect(
                            mentorGuidanceRepository
                                .findGuidanceById
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects edited guidance longer than the maximum limit",
                    async () => {

                        await expect(
                            mentorGuidanceService
                                .editGuidance({
                                    projectId:
                                        PROJECT_ID,

                                    guidanceId:
                                        GUIDANCE_ID,

                                    mentorUserId:
                                        MENTOR_ID,

                                    guidance:
                                        "G".repeat(
                                            MAX_GUIDANCE_LENGTH +
                                            1
                                        )
                                })
                        ).rejects.toMatchObject({
                            statusCode:
                                400
                        });


                        expect(
                            mentorGuidanceRepository
                                .updateGuidance
                        ).not.toHaveBeenCalled();
                    }
                );
            }
        );
    }
);