const jwt =
    require("jsonwebtoken");


const {
    validateEmail,
    validateRegistrationInput,
    hashPassword,
    verifyPassword,
    validateLoginInput,
    generateToken,
    JWT_SECRET,
    MAX_EMAIL_LENGTH,
    MAX_DISPLAY_NAME_LENGTH,
    MAX_PASSWORD_LENGTH,
    MAX_PASSWORD_BYTES,
    getPasswordByteLength
} =
    require(
        "../services/authService"
    );


// ============================================================
// PFG-16
// IDENTIFY & USER REGISTRATION
// ============================================================

describe(
    "Identify & User Registration Unit Tests (PFG-16)",
    () => {

        describe(
            "Email validation",
            () => {

                test(
                    "accepts correctly formatted email addresses",
                    () => {

                        expect(
                            validateEmail(
                                "student@up.ac.za"
                            )
                        ).toBe(
                            true
                        );


                        expect(
                            validateEmail(
                                "user@test.com"
                            )
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "rejects malformed email addresses",
                    () => {

                        expect(
                            validateEmail(
                                "not-an-email"
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            validateEmail(
                                "user@"
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            validateEmail("")
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "rejects non-string email inputs defensively",
                    () => {

                        expect(
                            validateEmail(
                                12345
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            validateEmail(
                                null
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            validateEmail(
                                undefined
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            validateEmail({})
                        ).toBe(
                            false
                        );


                        expect(
                            validateEmail([])
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "accepts surrounding whitespace around a valid email",
                    () => {

                        expect(
                            validateEmail(
                                "  student@up.ac.za  "
                            )
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "rejects an email longer than the allowed database boundary",
                    () => {

                        const longEmail =
                            `${"a".repeat(
                                MAX_EMAIL_LENGTH
                            )}@test.com`;


                        expect(
                            validateEmail(
                                longEmail
                            )
                        ).toBe(
                            false
                        );
                    }
                );

            }
        );


        describe(
            "Registration input validation",
            () => {

                const validRegistration = {
                    email:
                        "student@up.ac.za",

                    firstName:
                        "Kamesh",

                    lastName:
                        "Padayachi",

                    password:
                        "ValidPassword123"
                };


                test(
                    "accepts complete valid registration data",
                    () => {

                        const outcome =
                            validateRegistrationInput(
                                validRegistration
                            );


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );


                        expect(
                            outcome.error
                        ).toBeNull();


                        expect(
                            outcome.role
                        ).toBe(
                            "STUDENT"
                        );
                    }
                );


                test(
                    "defaults a registration to STUDENT when no requested role is supplied",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );


                        expect(
                            outcome.role
                        ).toBe(
                            "STUDENT"
                        );
                    }
                );


                test(
                    "accepts STUDENT as an explicit registration role",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                requestedRole:
                                    "STUDENT"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );


                        expect(
                            outcome.role
                        ).toBe(
                            "STUDENT"
                        );
                    }
                );


                test(
                    "accepts MENTOR as a requested registration role",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                requestedRole:
                                    "MENTOR"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );


                        expect(
                            outcome.role
                        ).toBe(
                            "MENTOR"
                        );
                    }
                );


                test(
                    "normalises a lowercase Mentor registration request",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                requestedRole:
                                    "mentor"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );


                        expect(
                            outcome.role
                        ).toBe(
                            "MENTOR"
                        );
                    }
                );


                test(
                    "rejects registration attempts requesting ADMIN privileges",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                requestedRole:
                                    "ADMIN"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            outcome.error
                        ).toBe(
                            "Registration role must be STUDENT or MENTOR."
                        );
                    }
                );


                test(
                    "rejects an unknown registration role",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                requestedRole:
                                    "SUPERUSER"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "rejects a password with exactly 7 characters",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                password:
                                    "1234567"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            outcome.error
                        ).toBe(
                            "Password must be at least 8 characters long."
                        );
                    }
                );


                test(
                    "accepts a password with exactly 8 characters",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                password:
                                    "12345678"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );


                        expect(
                            outcome.error
                        ).toBeNull();
                    }
                );


                test(
                    "rejects registration if a required field is missing",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                email:
                                    "student@up.ac.za",

                                firstName:
                                    "Kamesh"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            outcome.error
                        ).toBe(
                            "All fields are mandatory."
                        );
                    }
                );


                test(
                    "rejects blank required registration fields",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                firstName:
                                    "   "
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "rejects null registration input without crashing",
                    () => {

                        const outcome =
                            validateRegistrationInput(
                                null
                            );


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            typeof outcome.error
                        ).toBe(
                            "string"
                        );
                    }
                );


                test(
                    "rejects array registration input without crashing",
                    () => {

                        const outcome =
                            validateRegistrationInput(
                                []
                            );


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "rejects malformed field types without crashing",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                email:
                                    123,

                                password:
                                    {},

                                firstName:
                                    [],

                                lastName:
                                    true
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "rejects an email beyond the maximum length",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                email:
                                    `${"a".repeat(
                                        MAX_EMAIL_LENGTH
                                    )}@test.com`
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "rejects a display name beyond the maximum database length",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                firstName:
                                    "A".repeat(
                                        MAX_DISPLAY_NAME_LENGTH
                                    ),

                                lastName:
                                    "B"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            typeof outcome.error
                        ).toBe(
                            "string"
                        );
                    }
                );


                test(
                    "accepts a display name at the maximum boundary",
                    () => {

                        const lastNameLength =
                            Math.floor(
                                MAX_DISPLAY_NAME_LENGTH /
                                2
                            );


                        const firstNameLength =
                            MAX_DISPLAY_NAME_LENGTH -
                            lastNameLength -
                            1;


                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                firstName:
                                    "A".repeat(
                                        firstNameLength
                                    ),

                                lastName:
                                    "B".repeat(
                                        lastNameLength
                                    )
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "uses a 72-byte bcrypt password boundary",
                    () => {

                        expect(
                            MAX_PASSWORD_BYTES
                        ).toBe(
                            72
                        );


                        expect(
                            MAX_PASSWORD_LENGTH
                        ).toBe(
                            72
                        );
                    }
                );


                test(
                    "accepts an ASCII password exactly at the 72-byte bcrypt boundary",
                    () => {

                        const password =
                            "P".repeat(
                                MAX_PASSWORD_BYTES
                            );


                        expect(
                            getPasswordByteLength(
                                password
                            )
                        ).toBe(
                            72
                        );


                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                password
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "rejects an ASCII password beyond the 72-byte bcrypt boundary",
                    () => {

                        const password =
                            "P".repeat(
                                MAX_PASSWORD_BYTES +
                                1
                            );


                        expect(
                            getPasswordByteLength(
                                password
                            )
                        ).toBe(
                            73
                        );


                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                password
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            outcome.error
                        ).toBe(
                            "Password must be 72 UTF-8 bytes or fewer."
                        );
                    }
                );


                test(
                    "accepts a multibyte password exactly at 72 UTF-8 bytes",
                    () => {

                        /*
                         * The Euro symbol occupies 3 UTF-8 bytes.
                         * 24 symbols therefore occupy exactly 72 bytes.
                         */
                        const password =
                            "€".repeat(
                                24
                            );


                        expect(
                            password.length
                        ).toBe(
                            24
                        );


                        expect(
                            getPasswordByteLength(
                                password
                            )
                        ).toBe(
                            72
                        );


                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                password
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "rejects a multibyte password exceeding 72 UTF-8 bytes",
                    () => {

                        const password =
                            "€".repeat(
                                25
                            );


                        expect(
                            password.length
                        ).toBe(
                            25
                        );


                        expect(
                            getPasswordByteLength(
                                password
                            )
                        ).toBe(
                            75
                        );


                        const outcome =
                            validateRegistrationInput({
                                ...validRegistration,

                                password
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            outcome.error
                        ).toBe(
                            "Password must be 72 UTF-8 bytes or fewer."
                        );
                    }
                );

            }
        );


        describe(
            "Password hashing",
            () => {

                test(
                    "hashes a password so plain text is not stored",
                    async () => {

                        const realPassword =
                            "MySecretPassword123";


                        const hash =
                            await hashPassword(
                                realPassword
                            );


                        expect(
                            hash
                        ).not.toBe(
                            realPassword
                        );


                        expect(
                            hash.startsWith(
                                "$2"
                            )
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "verifyPassword returns true for the correct password",
                    async () => {

                        const realPassword =
                            "MySecretPassword123";


                        const hash =
                            await hashPassword(
                                realPassword
                            );


                        const check =
                            await verifyPassword(
                                realPassword,
                                hash
                            );


                        expect(
                            check
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "verifyPassword returns false for an incorrect password",
                    async () => {

                        const hash =
                            await hashPassword(
                                "MySecretPassword123"
                            );


                        const check =
                            await verifyPassword(
                                "WrongPassword456",
                                hash
                            );


                        expect(
                            check
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "hashPassword rejects passwords shorter than 8 characters",
                    async () => {

                        await expect(
                            hashPassword(
                                "short"
                            )
                        ).rejects.toThrow(
                            "Password must be at least 8 characters long."
                        );


                        await expect(
                            hashPassword("")
                        ).rejects.toThrow(
                            "Password must be at least 8 characters long."
                        );
                    }
                );


                test(
                    "hashPassword accepts an ASCII password exactly at 72 bytes",
                    async () => {

                        const password =
                            "P".repeat(
                                72
                            );


                        const hash =
                            await hashPassword(
                                password
                            );


                        expect(
                            hash.startsWith(
                                "$2"
                            )
                        ).toBe(
                            true
                        );


                        expect(
                            await verifyPassword(
                                password,
                                hash
                            )
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "hashPassword rejects an ASCII password beyond 72 bytes",
                    async () => {

                        await expect(
                            hashPassword(
                                "P".repeat(
                                    73
                                )
                            )
                        ).rejects.toThrow(
                            "Password must be 72 UTF-8 bytes or fewer."
                        );
                    }
                );


                test(
                    "hashPassword accepts a multibyte password exactly at 72 bytes",
                    async () => {

                        const password =
                            "€".repeat(
                                24
                            );


                        const hash =
                            await hashPassword(
                                password
                            );


                        expect(
                            await verifyPassword(
                                password,
                                hash
                            )
                        ).toBe(
                            true
                        );
                    }
                );


                test(
                    "hashPassword rejects a multibyte password beyond 72 bytes",
                    async () => {

                        await expect(
                            hashPassword(
                                "€".repeat(
                                    25
                                )
                            )
                        ).rejects.toThrow(
                            "Password must be 72 UTF-8 bytes or fewer."
                        );
                    }
                );


                test(
                    "hashPassword rejects malformed non-string input safely",
                    async () => {

                        await expect(
                            hashPassword(
                                12345678
                            )
                        ).rejects.toThrow();
                    }
                );


                test(
                    "verifyPassword returns false safely when input or hash is missing",
                    async () => {

                        expect(
                            await verifyPassword(
                                "",
                                "$2b$10$dummyhash"
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            await verifyPassword(
                                "Password123",
                                ""
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            await verifyPassword(
                                null,
                                null
                            )
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "verifyPassword safely rejects malformed argument types",
                    async () => {

                        expect(
                            await verifyPassword(
                                123,
                                "not-a-hash"
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            await verifyPassword(
                                "Password123",
                                {}
                            )
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "verifyPassword returns false for a malformed bcrypt hash",
                    async () => {

                        const result =
                            await verifyPassword(
                                "ValidPassword123!",
                                "not-a-valid-bcrypt-hash"
                            );


                        expect(
                            result
                        ).toBe(
                            false
                        );
                    }
                );


                test(
                    "verifyPassword rejects passwords beyond the bcrypt byte boundary",
                    async () => {

                        const hash =
                            await hashPassword(
                                "ValidPassword123!"
                            );


                        expect(
                            await verifyPassword(
                                "P".repeat(
                                    73
                                ),
                                hash
                            )
                        ).toBe(
                            false
                        );


                        expect(
                            await verifyPassword(
                                "€".repeat(
                                    25
                                ),
                                hash
                            )
                        ).toBe(
                            false
                        );
                    }
                );



                test(
                    "rejects a registration password with a leading space",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                email:
                                    "student@up.ac.za",

                                firstName:
                                    "Kamesh",

                                lastName:
                                    "Padayachi",

                                password:
                                    " ProjectForge123!"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            outcome.error
                        ).toBe(
                            "Password may not begin or end with spaces."
                        );
                    }
                );


                test(
                    "rejects a registration password with a trailing space",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                email:
                                    "student@up.ac.za",

                                firstName:
                                    "Kamesh",

                                lastName:
                                    "Padayachi",

                                password:
                                    "ProjectForge123! "
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            false
                        );


                        expect(
                            outcome.error
                        ).toBe(
                            "Password may not begin or end with spaces."
                        );
                    }
                );


                test(
                    "allows spaces inside a registration password",
                    () => {

                        const outcome =
                            validateRegistrationInput({
                                email:
                                    "student@up.ac.za",

                                firstName:
                                    "Kamesh",

                                lastName:
                                    "Padayachi",

                                password:
                                    "Project Forge123!"
                            });


                        expect(
                            outcome.isValid
                        ).toBe(
                            true
                        );


                        expect(
                            outcome.error
                        ).toBeNull();
                    }
                );
            }
        );

    }
);


// ============================================================
// PFG-22
// LOGIN INPUT VALIDATION
// ============================================================

describe(
    "Login Input Validation Tests (PFG-22)",
    () => {

        test(
            "accepts valid email and password input",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            "Password123!"
                    });


                expect(
                    result.isValid
                ).toBe(
                    true
                );


                expect(
                    result.error
                ).toBeNull();
            }
        );


        test(
            "rejects a missing or blank email",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "   ",

                        password:
                            "Password123!"
                    });


                expect(
                    result.isValid
                ).toBe(
                    false
                );


                expect(
                    result.error
                ).toBe(
                    "Email is required."
                );
            }
        );


        test(
            "rejects invalid email format",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "not-a-valid-email",

                        password:
                            "Password123!"
                    });


                expect(
                    result.isValid
                ).toBe(
                    false
                );


                expect(
                    result.error
                ).toBe(
                    "Invalid email address."
                );
            }
        );


        test(
            "rejects an email beyond the configured maximum length",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            `${"a".repeat(
                                MAX_EMAIL_LENGTH
                            )}@test.com`,

                        password:
                            "Password123!"
                    });


                expect(
                    result.isValid
                ).toBe(
                    false
                );
            }
        );


        test(
            "rejects an empty password",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            ""
                    });


                expect(
                    result.isValid
                ).toBe(
                    false
                );


                expect(
                    result.error
                ).toBe(
                    "Password is required."
                );
            }
        );


        test(
            "accepts a login password exactly at the 72-byte boundary",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            "P".repeat(
                                72
                            )
                    });


                expect(
                    result.isValid
                ).toBe(
                    true
                );
            }
        );


        test(
            "rejects a login password beyond the 72-byte boundary",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            "P".repeat(
                                73
                            )
                    });


                expect(
                    result.isValid
                ).toBe(
                    false
                );


                expect(
                    result.error
                ).toBe(
                    "Password must be 72 UTF-8 bytes or fewer."
                );
            }
        );


        test(
            "rejects a multibyte login password beyond 72 UTF-8 bytes",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            "€".repeat(
                                25
                            )
                    });


                expect(
                    result.isValid
                ).toBe(
                    false
                );


                expect(
                    result.error
                ).toBe(
                    "Password must be 72 UTF-8 bytes or fewer."
                );
            }
        );




        test(
            "rejects login passwords with leading or trailing spaces",
            () => {

                const leading =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            " ProjectForge123!"
                    });


                const trailing =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            "ProjectForge123! "
                    });


                expect(
                    leading.isValid
                ).toBe(
                    false
                );


                expect(
                    leading.error
                ).toBe(
                    "Password may not begin or end with spaces."
                );


                expect(
                    trailing.isValid
                ).toBe(
                    false
                );


                expect(
                    trailing.error
                ).toBe(
                    "Password may not begin or end with spaces."
                );
            }
        );


        test(
            "allows spaces inside a login password",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            "student@up.ac.za",

                        password:
                            "Project Forge123!"
                    });


                expect(
                    result.isValid
                ).toBe(
                    true
                );


                expect(
                    result.error
                ).toBeNull();
            }
        );


        test(
            "rejects null or non-object input safely",
            () => {

                const nullResult =
                    validateLoginInput(
                        null
                    );


                const arrayResult =
                    validateLoginInput(
                        []
                    );


                expect(
                    nullResult.isValid
                ).toBe(
                    false
                );


                expect(
                    nullResult.error
                ).toBe(
                    "Invalid input data."
                );


                expect(
                    arrayResult.isValid
                ).toBe(
                    false
                );
            }
        );


        test(
            "rejects malformed login field types without crashing",
            () => {

                const result =
                    validateLoginInput({
                        email:
                            123,

                        password:
                            {}
                    });


                expect(
                    result.isValid
                ).toBe(
                    false
                );
            }
        );

    }
);


// ============================================================
// PFG-22
// JWT GENERATION
// ============================================================

describe(
    "JWT Generation Tests (PFG-22)",
    () => {

        test(
            "has a JWT secret available in the Jest test environment",
            () => {

                expect(
                    typeof JWT_SECRET
                ).toBe(
                    "string"
                );


                expect(
                    JWT_SECRET.length
                ).toBeGreaterThan(
                    0
                );
            }
        );


        test(
            "generates a valid signed JWT with the correct payload",
            () => {

                const testUser = {
                    id:
                        "u123",

                    email:
                        "student@up.ac.za",

                    role:
                        "STUDENT"
                };


                const token =
                    generateToken(
                        testUser
                    );


                expect(
                    typeof token
                ).toBe(
                    "string"
                );


                const decoded =
                    jwt.verify(
                        token,
                        JWT_SECRET
                    );


                expect(
                    decoded.id
                ).toBe(
                    "u123"
                );


                expect(
                    decoded.email
                ).toBe(
                    "student@up.ac.za"
                );


                expect(
                    decoded.role
                ).toBe(
                    "STUDENT"
                );
            }
        );


        test(
            "defaults the JWT role to STUDENT when no role is supplied",
            () => {

                const token =
                    generateToken({
                        id:
                            "u456",

                        email:
                            "student@up.ac.za"
                    });


                const decoded =
                    jwt.verify(
                        token,
                        JWT_SECRET
                    );


                expect(
                    decoded.role
                ).toBe(
                    "STUDENT"
                );
            }
        );


        test(
            "preserves approved MENTOR role in the JWT",
            () => {

                const token =
                    generateToken({
                        id:
                            "mentor-user",

                        email:
                            "mentor@up.ac.za",

                        role:
                            "MENTOR"
                    });


                const decoded =
                    jwt.verify(
                        token,
                        JWT_SECRET
                    );


                expect(
                    decoded.role
                ).toBe(
                    "MENTOR"
                );
            }
        );


        test(
            "throws if user ID or email is missing",
            () => {

                expect(
                    () =>
                        generateToken(
                            null
                        )
                ).toThrow(
                    "User id and email is required to generate a token."
                );


                expect(
                    () =>
                        generateToken({
                            id:
                                "u123"
                        })
                ).toThrow(
                    "User id and email is required to generate a token."
                );


                expect(
                    () =>
                        generateToken({
                            email:
                                "student@up.ac.za"
                        })
                ).toThrow(
                    "User id and email is required to generate a token."
                );
            }
        );


        test(
            "generates a token with an expiration timestamp in the future",
            () => {

                const token =
                    generateToken({
                        id:
                            "u123",

                        email:
                            "student@up.ac.za",

                        role:
                            "STUDENT"
                    });


                const decoded =
                    jwt.verify(
                        token,
                        JWT_SECRET
                    );


                expect(
                    decoded.exp
                ).toBeDefined();


                expect(
                    decoded.exp
                ).toBeGreaterThan(
                    Math.floor(
                        Date.now() /
                        1000
                    )
                );
            }
        );


        test(
            "uses a deterministic fallback secret only in the test environment",
            () => {

                const previousSecret =
                    process.env.JWT_SECRET;

                const previousNodeEnv =
                    process.env.NODE_ENV;


                try {
                    delete process.env
                        .JWT_SECRET;

                    process.env.NODE_ENV =
                        "test";


                    let isolatedAuthService;


                    jest.isolateModules(
                        () => {
                            isolatedAuthService =
                                require(
                                    "../services/authService"
                                );
                        }
                    );


                    expect(
                        isolatedAuthService
                            .JWT_SECRET
                    ).toBe(
                        "projectforge-test-secret-only"
                    );


                    const token =
                        isolatedAuthService
                            .generateToken({
                                id:
                                    "test-user",

                                email:
                                    "test@projectforge.local",

                                role:
                                    "STUDENT"
                            });


                    expect(
                        jwt.verify(
                            token,
                            isolatedAuthService
                                .JWT_SECRET
                        ).id
                    ).toBe(
                        "test-user"
                    );
                } finally {
                    if (
                        previousSecret ===
                        undefined
                    ) {
                        delete process.env
                            .JWT_SECRET;
                    } else {
                        process.env.JWT_SECRET =
                            previousSecret;
                    }


                    if (
                        previousNodeEnv ===
                        undefined
                    ) {
                        delete process.env
                            .NODE_ENV;
                    } else {
                        process.env.NODE_ENV =
                            previousNodeEnv;
                    }
                }
            }
        );


        test(
            "does not use the test fallback when a non-test environment has no JWT secret",
            () => {

                const previousSecret =
                    process.env.JWT_SECRET;

                const previousNodeEnv =
                    process.env.NODE_ENV;


                try {
                    delete process.env
                        .JWT_SECRET;

                    process.env.NODE_ENV =
                        "production";


                    let isolatedAuthService;


                    jest.isolateModules(
                        () => {
                            isolatedAuthService =
                                require(
                                    "../services/authService"
                                );
                        }
                    );


                    expect(
                        isolatedAuthService
                            .JWT_SECRET
                    ).toBeNull();


                    expect(
                        () =>
                            isolatedAuthService
                                .generateToken({
                                    id:
                                        "production-user",

                                    email:
                                        "user@projectforge.local",

                                    role:
                                        "STUDENT"
                                })
                    ).toThrow(
                        "JWT_SECRET environment variable is required."
                    );
                } finally {
                    if (
                        previousSecret ===
                        undefined
                    ) {
                        delete process.env
                            .JWT_SECRET;
                    } else {
                        process.env.JWT_SECRET =
                            previousSecret;
                    }


                    if (
                        previousNodeEnv ===
                        undefined
                    ) {
                        delete process.env
                            .NODE_ENV;
                    } else {
                        process.env.NODE_ENV =
                            previousNodeEnv;
                    }
                }
            }
        );

    }
);