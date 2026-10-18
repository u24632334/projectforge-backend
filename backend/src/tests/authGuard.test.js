const jwt =
    require("jsonwebtoken");


jest.mock(
    "../config/db",
    () => ({
        pool: {
            query:
                jest.fn()
        }
    })
);


const {
    pool
} =
    require(
        "../config/db"
    );


const authGuard =
    require(
        "../middleware/authGuard"
    );


const {
    JWT_SECRET
} =
    require(
        "../services/authService"
    );


describe(
    "authGuard Middleware Unit Tests (PFG-23)",
    () => {

        let mockReq;
        let mockRes;
        let mockNext;


        beforeEach(
            () => {

                jest.clearAllMocks();


                mockReq = {
                    headers: {}
                };


                mockRes = {
                    status:
                        jest.fn()
                            .mockReturnThis(),

                    json:
                        jest.fn()
                            .mockReturnThis()
                };


                mockNext =
                    jest.fn();
            }
        );


        test(
            "Passes valid Bearer token, loads active user, and calls next()",
            async () => {

                const token =
                    jwt.sign(
                        {
                            id:
                                "u123",

                            email:
                                "student@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET,
                        {
                            expiresIn:
                                "1h"
                        }
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token}`;


                pool.query
                    .mockResolvedValue({
                        rows: [
                            {
                                user_id:
                                    "u123",

                                email:
                                    "student@test.com",

                                system_role:
                                    "STUDENT",

                                status:
                                    "ACTIVE"
                            }
                        ]
                    });


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
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
                        "FROM users"
                    ),
                    [
                        "u123"
                    ]
                );


                expect(
                    mockNext
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    mockNext
                ).toHaveBeenCalledWith();


                expect(
                    mockReq.user
                ).toEqual({
                    id:
                        "u123",

                    email:
                        "student@test.com",

                    role:
                        "STUDENT"
                });


                expect(
                    mockRes.status
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Uses the current database role instead of a stale role stored in the JWT",
            async () => {

                /*
                 * Pretend this token was created while the
                 * account was still a STUDENT.
                 */
                const token =
                    jwt.sign(
                        {
                            id:
                                "u123",

                            email:
                                "old-email@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET,
                        {
                            expiresIn:
                                "1h"
                        }
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token}`;


                /*
                 * The account has since been approved
                 * as a MENTOR and its email changed.
                 */
                pool.query
                    .mockResolvedValue({
                        rows: [
                            {
                                user_id:
                                    "u123",

                                email:
                                    "mentor@test.com",

                                system_role:
                                    "MENTOR",

                                status:
                                    "ACTIVE"
                            }
                        ]
                    });


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockNext
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    mockReq.user
                ).toEqual({
                    id:
                        "u123",

                    email:
                        "mentor@test.com",

                    role:
                        "MENTOR"
                });


                expect(
                    mockReq.user.role
                ).not.toBe(
                    "STUDENT"
                );


                expect(
                    mockReq.user.email
                ).not.toBe(
                    "old-email@test.com"
                );
            }
        );


        test(
            "Rejects request when no Bearer token is provided",
            async () => {

                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Access denied. No token provided."
                });


                expect(
                    mockNext
                ).not.toHaveBeenCalled();


                expect(
                    pool.query
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Rejects invalid JWT",
            async () => {

                mockReq
                    .headers
                    .authorization =
                    "Bearer invalid-token";


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Invalid or expired token."
                });


                expect(
                    mockNext
                ).not.toHaveBeenCalled();


                expect(
                    pool.query
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Rejects token when authenticated user no longer exists",
            async () => {

                const token =
                    jwt.sign(
                        {
                            id:
                                "missing-user",

                            email:
                                "missing@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token}`;


                pool.query
                    .mockResolvedValue({
                        rows: []
                    });


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Authenticated user no longer exists."
                });


                expect(
                    mockNext
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Rejects suspended user even with valid JWT",
            async () => {

                const token =
                    jwt.sign(
                        {
                            id:
                                "u123",

                            email:
                                "student@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token}`;


                pool.query
                    .mockResolvedValue({
                        rows: [
                            {
                                user_id:
                                    "u123",

                                email:
                                    "student@test.com",

                                system_role:
                                    "STUDENT",

                                status:
                                    "SUSPENDED"
                            }
                        ]
                    });


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    403
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Account is suspended."
                });


                expect(
                    mockNext
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Rejects request when Bearer token is empty or whitespace",
            async () => {

                mockReq
                    .headers
                    .authorization =
                    "Bearer ";


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Access denied. Malformed token."
                });


                expect(
                    mockNext
                ).not.toHaveBeenCalled();


                expect(
                    pool.query
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Rejects a Bearer value containing extra whitespace-separated data",
            async () => {

                const token =
                    jwt.sign(
                        {
                            id:
                                "u123",

                            email:
                                "student@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token} unexpected-extra-value`;


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Access denied. Malformed token."
                });


                expect(
                    pool.query
                ).not.toHaveBeenCalled();


                expect(
                    mockNext
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Accepts token sent via capitalized Authorization header",
            async () => {

                const token =
                    jwt.sign(
                        {
                            id:
                                "u123",

                            email:
                                "student@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET,
                        {
                            expiresIn:
                                "1h"
                        }
                    );


                mockReq
                    .headers[
                        "Authorization"
                    ] =
                    `Bearer ${token}`;


                pool.query
                    .mockResolvedValue({
                        rows: [
                            {
                                user_id:
                                    "u123",

                                email:
                                    "student@test.com",

                                system_role:
                                    "STUDENT",

                                status:
                                    "ACTIVE"
                            }
                        ]
                    });


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockNext
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    mockReq.user.id
                ).toBe(
                    "u123"
                );
            }
        );


        test(
            "Rejects expired JWT token with 401",
            async () => {

                const token =
                    jwt.sign(
                        {
                            id:
                                "u123",

                            email:
                                "student@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET,
                        {
                            expiresIn:
                                "-1s"
                        }
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token}`;


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Invalid or expired token."
                });


                expect(
                    mockNext
                ).not.toHaveBeenCalled();


                expect(
                    pool.query
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Rejects authorization header that does not use Bearer scheme",
            async () => {

                mockReq
                    .headers
                    .authorization =
                    "Basic dXNlcjpwYXNzd29yZA==";


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Access denied. No token provided."
                });


                expect(
                    mockNext
                ).not.toHaveBeenCalled();


                expect(
                    pool.query
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Rejects a signed token that does not contain a user ID",
            async () => {

                const token =
                    jwt.sign(
                        {
                            email:
                                "student@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET,
                        {
                            expiresIn:
                                "1h"
                        }
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token}`;


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    mockRes.status
                ).toHaveBeenCalledWith(
                    401
                );


                expect(
                    mockRes.json
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    error:
                        "Invalid or expired token."
                });


                expect(
                    pool.query
                ).not.toHaveBeenCalled();


                expect(
                    mockNext
                ).not.toHaveBeenCalled();
            }
        );


        test(
            "Passes database failures to next instead of reporting an invalid token",
            async () => {

                const token =
                    jwt.sign(
                        {
                            id:
                                "u123",

                            email:
                                "student@test.com",

                            role:
                                "STUDENT"
                        },
                        JWT_SECRET,
                        {
                            expiresIn:
                                "1h"
                        }
                    );


                mockReq
                    .headers
                    .authorization =
                    `Bearer ${token}`;


                const databaseError =
                    new Error(
                        "Database unavailable"
                    );


                pool.query
                    .mockRejectedValue(
                        databaseError
                    );


                await authGuard(
                    mockReq,
                    mockRes,
                    mockNext
                );


                expect(
                    pool.query
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    mockNext
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    mockNext
                ).toHaveBeenCalledWith(
                    databaseError
                );


                expect(
                    mockRes.status
                ).not.toHaveBeenCalled();


                expect(
                    mockRes.json
                ).not.toHaveBeenCalled();
            }
        );

    }
);