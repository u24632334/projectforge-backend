const errorHandler =
    require(
        "../middleware/errorHandler"
    );


/**
 * Creates the minimum Express response object required by the
 * error-handling middleware.
 *
 * status() returns the same response object so it behaves like
 * Express's real res.status(...).json(...) chain.
 *
 * @returns {{status: jest.Mock, json: jest.Mock}}
 */
function createMockResponse() {

    const res = {};


    res.status =
        jest.fn()
            .mockReturnValue(
                res
            );


    res.json =
        jest.fn()
            .mockReturnValue(
                res
            );


    return res;
}


describe(
    "ProjectForge global error handler",
    () => {

        test(
            "returns supplied statusCode and message for a known client error",
            () => {

                const error =
                    new Error(
                        "Invalid request"
                    );


                error.statusCode =
                    400;


                const res =
                    createMockResponse();


                errorHandler(
                    error,
                    {},
                    res,
                    jest.fn()
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    400
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    error:
                        "Invalid request"
                });
            }
        );


        test(
            "accepts an Express-style status property",
            () => {

                const error =
                    new Error(
                        "Resource not found"
                    );


                error.status =
                    404;


                const res =
                    createMockResponse();


                errorHandler(
                    error,
                    {},
                    res,
                    jest.fn()
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    404
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    error:
                        "Resource not found"
                });
            }
        );


        test(
            "returns 400 for a PostgreSQL invalid-text-representation error",
            () => {

                const error =
                    new Error(
                        'invalid input syntax for type uuid: "not-a-uuid"'
                    );


                error.code =
                    "22P02";


                const res =
                    createMockResponse();


                errorHandler(
                    error,
                    {},
                    res,
                    jest.fn()
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    400
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    error:
                        "Invalid request data."
                });
            }
        );


        test(
            "does not expose PostgreSQL diagnostic details for malformed UUID input",
            () => {

                const databaseMessage =
                    'invalid input syntax for type uuid: "malicious-value"';


                const error =
                    new Error(
                        databaseMessage
                    );


                error.code =
                    "22P02";


                const res =
                    createMockResponse();


                errorHandler(
                    error,
                    {},
                    res,
                    jest.fn()
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    400
                );


                expect(
                    res.json
                ).not.toHaveBeenCalledWith(
                    expect.objectContaining({
                        error:
                            databaseMessage
                    })
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    error:
                        "Invalid request data."
                });
            }
        );


        test(
            "returns 500 with a safe message for an unexpected error",
            () => {

                const error =
                    new Error(
                        "password=secret database crashed"
                    );


                const res =
                    createMockResponse();


                errorHandler(
                    error,
                    {},
                    res,
                    jest.fn()
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    500
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    error:
                        "Internal server error"
                });


                expect(
                    res.json
                ).not.toHaveBeenCalledWith(
                    expect.objectContaining({
                        error:
                            "password=secret database crashed"
                    })
                );
            }
        );


        test(
            "does not expose a supplied internal-server error message",
            () => {

                const error =
                    new Error(
                        "PostgreSQL authentication failed"
                    );


                error.statusCode =
                    503;


                const res =
                    createMockResponse();


                errorHandler(
                    error,
                    {},
                    res,
                    jest.fn()
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    503
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    error:
                        "Internal server error"
                });
            }
        );


        test(
            "treats an invalid error status as an internal server error",
            () => {

                const error =
                    new Error(
                        "Something failed"
                    );


                error.statusCode =
                    200;


                const res =
                    createMockResponse();


                errorHandler(
                    error,
                    {},
                    res,
                    jest.fn()
                );


                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    500
                );


                expect(
                    res.json
                ).toHaveBeenCalledWith({
                    error:
                        "Internal server error"
                });
            }
        );

    }
);