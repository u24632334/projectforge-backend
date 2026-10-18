jest.mock(
    "../config/db",
    () => ({
        pool: {
            query: jest.fn()
        }
    })
);


const { pool } =
    require("../config/db");

const {
    getProjectMembers
} = require(
    "../controllers/projectMemberController"
);


function buildResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}


describe(
    "Project member controller",
    () => {
        let response;
        let next;


        beforeEach(() => {
            jest.clearAllMocks();

            response =
                buildResponse();

            next =
                jest.fn();
        });


        test(
            "returns active project members",
            async () => {
                const members = [
                    {
                        membershipId:
                            "membership-1",

                        userId:
                            "user-1",

                        displayName:
                            "Alex Student",

                        memberRole:
                            "LEAD",

                        positionTitle:
                            null
                    },

                    {
                        membershipId:
                            "membership-2",

                        userId:
                            "user-2",

                        displayName:
                            "Sam Student",

                        memberRole:
                            "MEMBER",

                        positionTitle:
                            "Frontend Developer"
                    }
                ];

                pool.query.mockResolvedValue({
                    rows: members
                });


                await getProjectMembers(
                    {
                        params: {
                            id:
                                "project-1"
                        }
                    },
                    response,
                    next
                );


                expect(
                    pool.query
                ).toHaveBeenCalledTimes(
                    1
                );

                expect(
                    pool.query
                ).toHaveBeenCalledWith(
                    expect.stringContaining(
                        "FROM project_memberships pm"
                    ),
                    [
                        "project-1"
                    ]
                );

                expect(
                    pool.query.mock
                        .calls[0][0]
                ).toContain(
                    "pm.active = TRUE"
                );

                expect(
                    response.status
                ).toHaveBeenCalledWith(
                    200
                );

                expect(
                    response.json
                ).toHaveBeenCalledWith({
                    success: true,
                    members
                });

                expect(
                    next
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "passes database errors to the error handler",
            async () => {
                const error =
                    new Error(
                        "Database failure"
                    );

                pool.query
                    .mockRejectedValue(
                        error
                    );


                await getProjectMembers(
                    {
                        params: {
                            id:
                                "project-1"
                        }
                    },
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

                expect(
                    response.json
                ).not.toHaveBeenCalled();
            }
        );
    }
);