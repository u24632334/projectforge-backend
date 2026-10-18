jest.mock(
    "../services/TeamRadioService",
    () => {
        return jest.fn()
            .mockImplementation(
                () => ({
                    CreateRequest:
                        jest.fn(),

                    GetRequestsByProject:
                        jest.fn(),

                    ResolveRequest:
                        jest.fn(),

                    ReopenRequest:
                        jest.fn()
                })
            );
    }
);


jest.mock(
    "../db/teamRadioRepository",
    () => {
        return jest.fn();
    }
);


jest.mock(
    "../config/db",
    () => ({
        pool: {}
    })
);


const TeamRadioService =
    require(
        "../services/TeamRadioService"
    );


const {
    getAssistanceRequests,
    createAssistanceRequest,
    resolveAssistanceRequest,
    reopenAssistanceRequest
} = require(
    "../controllers/teamRadioController"
);


const serviceInstance =
    TeamRadioService
        .mock
        .results[0]
        .value;


const createRequestMock =
    serviceInstance
        .CreateRequest;


const getRequestsByProjectMock =
    serviceInstance
        .GetRequestsByProject;


const resolveRequestMock =
    serviceInstance
        .ResolveRequest;


const reopenRequestMock =
    serviceInstance
        .ReopenRequest;


function buildResponse() {
    return {
        status:
            jest.fn()
                .mockReturnThis(),

        json:
            jest.fn()
    };
}


describe(
    "TeamRadioController",
    () => {

        beforeEach(
            () => {
                jest.clearAllMocks();
            }
        );


        test(
            "returns assistance requests for a project",
            async () => {
                const requests = [
                    {
                        radio_id:
                            "radio-1",

                        author_membership_id:
                            "membership-1",

                        author_display_name:
                            "Alex Student",

                        category:
                            "TECHNICAL",

                        message:
                            "Need help.",

                        status:
                            "OPEN",

                        project_id:
                            "project-1"
                    }
                ];


                getRequestsByProjectMock
                    .mockResolvedValue(
                        requests
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await getAssistanceRequests(
                    req,
                    res,
                    next
                );


                expect(
                    getRequestsByProjectMock
                ).toHaveBeenCalledWith(
                    "project-1"
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    200
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    requests
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "passes request-list errors to next",
            async () => {
                const error =
                    new Error(
                        "Database error"
                    );


                getRequestsByProjectMock
                    .mockRejectedValue(
                        error
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1"
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await getAssistanceRequests(
                    req,
                    res,
                    next
                );


                expect(
                    next
                ).toHaveBeenCalledWith(
                    error
                );
            }
        );


        test(
            "creates an assistance request",
            async () => {
                const createdRequest = {
                    radio_id:
                        "radio-1",

                    author_membership_id:
                        "membership-1",

                    category:
                        "TECHNICAL",

                    message:
                        "Need help.",

                    status:
                        "OPEN",

                    project_id:
                        "project-1"
                };


                createRequestMock
                    .mockResolvedValue(
                        createdRequest
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    },

                    body: {
                        category:
                            "TECHNICAL",

                        message:
                            "Need help."
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await createAssistanceRequest(
                    req,
                    res,
                    next
                );


                expect(
                    createRequestMock
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    membershipId:
                        "membership-1",

                    category:
                        "TECHNICAL",

                    message:
                        "Need help.",

                    status:
                        "OPEN"
                });


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    201
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    request:
                        createdRequest
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "returns 400 when request cannot be created",
            async () => {
                createRequestMock
                    .mockResolvedValue(
                        null
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    },

                    body: {
                        category:
                            "DEPENDENCY",

                        message:
                            "Waiting on another team."
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await createAssistanceRequest(
                    req,
                    res,
                    next
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    400
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        "Assistance request could not be created."
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "passes creation errors to next",
            async () => {
                const error =
                    new Error(
                        "Database error"
                    );


                createRequestMock
                    .mockRejectedValue(
                        error
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    },

                    body: {
                        category:
                            "TECHNICAL",

                        message:
                            "Need help."
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await createAssistanceRequest(
                    req,
                    res,
                    next
                );


                expect(
                    next
                ).toHaveBeenCalledWith(
                    error
                );
            }
        );


        test(
            "resolves an assistance request",
            async () => {
                const resolvedRequest = {
                    radio_id:
                        "radio-1",

                    author_membership_id:
                        "membership-1",

                    category:
                        "TECHNICAL",

                    message:
                        "Need help.",

                    status:
                        "RESOLVED",

                    project_id:
                        "project-1"
                };


                resolveRequestMock
                    .mockResolvedValue(
                        resolvedRequest
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1",

                        requestId:
                            "radio-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await resolveAssistanceRequest(
                    req,
                    res,
                    next
                );


                expect(
                    resolveRequestMock
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestId:
                        "radio-1"
                });


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    200
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    request:
                        resolvedRequest
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "passes resolve errors to next",
            async () => {
                const error =
                    new Error(
                        "Assistance request is already resolved."
                    );


                error.statusCode =
                    409;


                resolveRequestMock
                    .mockRejectedValue(
                        error
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1",

                        requestId:
                            "radio-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await resolveAssistanceRequest(
                    req,
                    res,
                    next
                );


                expect(
                    resolveRequestMock
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestId:
                        "radio-1"
                });


                expect(
                    next
                ).toHaveBeenCalledWith(
                    error
                );


                expect(
                    res.status
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "reopens a resolved assistance request",
            async () => {
                const reopenedRequest = {
                    radio_id:
                        "radio-1",

                    author_membership_id:
                        "membership-1",

                    category:
                        "TECHNICAL",

                    message:
                        "Need help.",

                    status:
                        "OPEN",

                    project_id:
                        "project-1"
                };


                reopenRequestMock
                    .mockResolvedValue(
                        reopenedRequest
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1",

                        requestId:
                            "radio-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await reopenAssistanceRequest(
                    req,
                    res,
                    next
                );


                expect(
                    reopenRequestMock
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestId:
                        "radio-1"
                });


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    200
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    request:
                        reopenedRequest
                });


                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "passes reopen errors to next",
            async () => {
                const error =
                    new Error(
                        "Assistance request is already open."
                    );


                error.statusCode =
                    409;


                reopenRequestMock
                    .mockRejectedValue(
                        error
                    );


                const req = {
                    params: {
                        projectId:
                            "project-1",

                        requestId:
                            "radio-1"
                    },

                    membership: {
                        membershipId:
                            "membership-1"
                    }
                };


                const res =
                    buildResponse();


                const next =
                    jest.fn();


                await reopenAssistanceRequest(
                    req,
                    res,
                    next
                );


                expect(
                    reopenRequestMock
                ).toHaveBeenCalledWith({
                    projectId:
                        "project-1",

                    requestId:
                        "radio-1"
                });


                expect(
                    next
                ).toHaveBeenCalledWith(
                    error
                );


                expect(
                    res.status
                ).not.toHaveBeenCalled();
            }
        );

    }
);