jest.mock(
    "../services/MilestoneService",
    () => {
        return jest.fn()
            .mockImplementation(
                () => ({
                    GetMilestonesByProject:
                        jest.fn(),

                    CreateMilestone:
                        jest.fn(),

                    MarkMilestoneComplete:
                        jest.fn(),

                    ReopenMilestone:
                        jest.fn()
                })
            );
    }
);


const MilestoneService =
    require(
        "../services/MilestoneService"
    );


const {
    getMilestones,
    createMilestone,
    closeMilestone,
    reopenMilestone
} = require(
    "../controllers/milestoneController"
);


/*
 * The controller creates one MilestoneService instance
 * when it is imported.
 *
 * Keep a reference to that instance before
 * clearAllMocks() resets recorded constructor calls.
 */
const service =
    MilestoneService
        .mock
        .results[0]
        .value;


function buildResponse() {
    return {
        status:
            jest.fn()
                .mockReturnThis(),

        json:
            jest.fn()
                .mockReturnThis()
    };
}


function buildRequest(
    overrides = {}
) {
    return {
        params: {
            projectId:
                "project-1",

            milestoneId:
                "milestone-1"
        },

        body: {
            title:
                "First Milestone",

            description:
                "Initial project milestone",

            dueDate:
                "2026-09-30"
        },

        ...overrides
    };
}


describe(
    "Milestone controller",
    () => {

        let response;
        let next;


        beforeEach(
            () => {
                jest.clearAllMocks();

                response =
                    buildResponse();

                next =
                    jest.fn();
            }
        );


        test(
            "retrieves milestones for a project and returns 200",
            async () => {

                const milestones = [
                    {
                        milestone_id:
                            "milestone-1",

                        project_id:
                            "project-1",

                        title:
                            "First Milestone",

                        status:
                            "OPEN"
                    },

                    {
                        milestone_id:
                            "milestone-2",

                        project_id:
                            "project-1",

                        title:
                            "Second Milestone",

                        status:
                            "COMPLETE"
                    }
                ];


                service
                    .GetMilestonesByProject
                    .mockResolvedValue(
                        milestones
                    );


                await getMilestones(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .GetMilestonesByProject
                ).toHaveBeenCalledWith(
                    "project-1"
                );


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    200
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    milestones
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "creates a milestone and returns 201",
            async () => {

                const milestone = {
                    milestone_id:
                        "milestone-1",

                    project_id:
                        "project-1",

                    title:
                        "First Milestone"
                };


                service
                    .CreateMilestone
                    .mockResolvedValue(
                        milestone
                    );


                await createMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .CreateMilestone
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    title:
                        "First Milestone",

                    description:
                        "Initial project milestone",

                    dueDate:
                        "2026-09-30"
                });


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    201
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    milestone
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "closes a milestone belonging to the authorised project",
            async () => {

                const milestone = {
                    milestone_id:
                        "milestone-1",

                    project_id:
                        "project-1",

                    title:
                        "First Milestone",

                    status:
                        "COMPLETE"
                };


                service
                    .MarkMilestoneComplete
                    .mockResolvedValue(
                        milestone
                    );


                await closeMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .MarkMilestoneComplete
                ).toHaveBeenCalledWith(
                    "milestone-1",
                    "project-1"
                );


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    200
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    milestone
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "returns 404 when the milestone being closed is not in the authorised project",
            async () => {

                service
                    .MarkMilestoneComplete
                    .mockResolvedValue(
                        null
                    );


                await closeMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .MarkMilestoneComplete
                ).toHaveBeenCalledWith(
                    "milestone-1",
                    "project-1"
                );


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    404
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        "Milestone not found"
                });
            }
        );


        test(
            "returns 400 when the milestone cannot be closed",
            async () => {

                service
                    .MarkMilestoneComplete
                    .mockResolvedValue(
                        false
                    );


                await closeMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .MarkMilestoneComplete
                ).toHaveBeenCalledWith(
                    "milestone-1",
                    "project-1"
                );


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    400
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        "Milestone cannot be closed"
                });
            }
        );


        test(
            "reopens a completed milestone belonging to the authorised project",
            async () => {

                const milestone = {
                    milestone_id:
                        "milestone-1",

                    project_id:
                        "project-1",

                    title:
                        "First Milestone",

                    status:
                        "OPEN"
                };


                service
                    .ReopenMilestone
                    .mockResolvedValue(
                        milestone
                    );


                await reopenMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .ReopenMilestone
                ).toHaveBeenCalledWith(
                    "milestone-1",
                    "project-1"
                );


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    200
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    milestone
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "returns 404 when the milestone being reopened is not in the authorised project",
            async () => {

                service
                    .ReopenMilestone
                    .mockResolvedValue(
                        null
                    );


                await reopenMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .ReopenMilestone
                ).toHaveBeenCalledWith(
                    "milestone-1",
                    "project-1"
                );


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    404
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        "Milestone not found"
                });
            }
        );


        test(
            "returns 400 when an already open milestone cannot be reopened",
            async () => {

                service
                    .ReopenMilestone
                    .mockResolvedValue(
                        false
                    );


                await reopenMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    service
                        .ReopenMilestone
                ).toHaveBeenCalledWith(
                    "milestone-1",
                    "project-1"
                );


                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    400
                );


                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        "Milestone cannot be reopened"
                });
            }
        );


        test(
            "passes reopen service errors to next",
            async () => {

                const error =
                    new Error(
                        "Database error"
                    );


                service
                    .ReopenMilestone
                    .mockRejectedValue(
                        error
                    );


                await reopenMilestone(
                    buildRequest(),
                    response,
                    next
                );


                expect(
                    next
                ).toHaveBeenCalledWith(
                    error
                );


                expect(
                    response.status
                ).not.toHaveBeenCalled();
            }
        );

    }
);