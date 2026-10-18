const express = require("express");

const router = express.Router();

const {
    pool
} = require("../config/db");


const {
    validateLoginInput,
    verifyPassword,
    generateToken,
    validateRegistrationInput,
    hashPassword
} = require("../services/authService");


// ============================================================
// POST /api/auth/login
// ============================================================

router.post(
    "/auth/login",
    async (
        req,
        res,
        next
    ) => {
        try {

            // ====================================================
            // VALIDATE INPUT
            // ====================================================

            const validation =
                validateLoginInput(
                    req.body
                );


            if (
                !validation.isValid
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            validation.error
                    });
            }


            const {
                email,
                password
            } = req.body;


            // ====================================================
            // FIND USER
            // ====================================================

            const result =
                await pool.query(
                    `
                        SELECT
                            user_id,
                            email,
                            password_hash,
                            system_role,
                            status
                        FROM users
                        WHERE LOWER(email) =
                            LOWER($1);
                    `,
                    [
                        email.trim()
                    ]
                );


            const user =
                result.rows[0];


            /*
             * Do not reveal whether the email itself exists.
             */
            if (!user) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        message:
                            "Invalid email or password"
                    });
            }


            // ====================================================
            // VERIFY PASSWORD
            // ====================================================

            const isMatch =
                await verifyPassword(
                    password,
                    user.password_hash
                );


            if (!isMatch) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,

                        message:
                            "Invalid email or password"
                    });
            }


            // ====================================================
            // CHECK ACCOUNT STATUS
            // ====================================================

            /*
             * Suspended accounts must not be allowed to log in,
             * even when the password is correct.
             */
            if (
                user.status !==
                "ACTIVE"
            ) {
                return res
                    .status(403)
                    .json({
                        success:
                            false,

                        message:
                            "Account is suspended."
                    });
            }


            // ====================================================
            // GENERATE JWT
            // ====================================================

            const token =
                generateToken({
                    id:
                        user.user_id,

                    email:
                        user.email,

                    role:
                        user.system_role
                });


            // ====================================================
            // SUCCESS
            // ====================================================

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Login successful",

                    token,

                    user: {
                        id:
                            user.user_id,

                        email:
                            user.email,

                        role:
                            user.system_role
                    }
                });
        }
        catch (error) {

            next(error);
        }
    }
);


// ============================================================
// POST /api/auth/register
// ============================================================

router.post(
    "/auth/register",
    async (
        req,
        res,
        next
    ) => {

        let client = null;

        try {

            // ====================================================
            // VALIDATE REGISTRATION INPUT
            // ====================================================

            const validation =
                validateRegistrationInput(
                    req.body
                );


            if (
                !validation.isValid
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            validation.error
                    });
            }


            const {
                email,
                password,
                firstName,
                lastName
            } = req.body;


            /*
             * This value has already been normalised and
             * validated by authService.
             *
             * STUDENT:
             *     Normal student registration.
             *
             * MENTOR:
             *     Account is still created as STUDENT and a
             *     pending Mentor application is created.
             *
             * Public signup must never grant MENTOR or ADMIN
             * privileges directly.
             */
            const requestedRole =
                validation.role ||
                "STUDENT";


            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            const cleanFirstName =
                firstName.trim();


            const cleanLastName =
                lastName.trim();


            const displayName =
                `${cleanFirstName} ${cleanLastName}`;


            // ====================================================
            // CHECK FOR DUPLICATE EMAIL
            // ====================================================

            const existing =
                await pool.query(
                    `
                        SELECT
                            user_id
                        FROM users
                        WHERE LOWER(email) =
                            LOWER($1);
                    `,
                    [
                        cleanEmail
                    ]
                );


            if (
                existing.rows.length >
                0
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            "An account with this email address already exists."
                    });
            }


            // ====================================================
            // HASH PASSWORD
            // ====================================================

            const passwordHash =
                await hashPassword(
                    password
                );


            // ====================================================
            // DATABASE TRANSACTION
            // ====================================================

            client =
                await pool.connect();


            await client.query(
                "BEGIN"
            );


            /*
             * Every publicly registered account starts as
             * STUDENT and ACTIVE.
             *
             * Mentor privileges are granted only after an
             * administrator approves the mentor application.
             */
            const userResult =
                await client.query(
                    `
                        INSERT INTO users (
                            email,
                            password_hash,
                            system_role,
                            status
                        )
                        VALUES (
                            $1,
                            $2,
                            'STUDENT',
                            'ACTIVE'
                        )
                        RETURNING
                            user_id,
                            email,
                            system_role,
                            status;
                    `,
                    [
                        cleanEmail,
                        passwordHash
                    ]
                );


            const newUser =
                userResult.rows[0];


            // ====================================================
            // CREATE DEFAULT PROFILE
            // ====================================================

            await client.query(
                `
                    INSERT INTO profiles (
                        user_id,
                        display_name,
                        availability_hours_per_week
                    )
                    VALUES (
                        $1,
                        $2,
                        0
                    );
                `,
                [
                    newUser.user_id,
                    displayName
                ]
            );


            // ====================================================
            // CREATE MENTOR APPLICATION WHEN REQUESTED
            // ====================================================

            let mentorApplication =
                null;


            if (
                requestedRole ===
                "MENTOR"
            ) {
                const applicationResult =
                    await client.query(
                        `
                            INSERT INTO mentor_applications (
                                user_id,
                                status
                            )
                            VALUES (
                                $1,
                                'PENDING'
                            )
                            RETURNING
                                application_id
                                    AS "applicationId",
                                user_id
                                    AS "userId",
                                status,
                                requested_at
                                    AS "requestedAt";
                        `,
                        [
                            newUser.user_id
                        ]
                    );


                mentorApplication =
                    applicationResult
                        .rows[0];
            }


            await client.query(
                "COMMIT"
            );


            // ====================================================
            // SUCCESS RESPONSE
            // ====================================================

            const message =
                requestedRole ===
                "MENTOR"
                    ? "Account created successfully. Mentor access is pending administrator approval."
                    : "User registered successfully.";


            return res
                .status(201)
                .json({
                    success:
                        true,

                    message,

                    user: {
                        id:
                            newUser.user_id,

                        email:
                            newUser.email,

                        role:
                            newUser.system_role
                    },

                    mentorApplication:
                        mentorApplication
                });
        }
        catch (error) {

            if (client) {
                try {
                    await client.query(
                        "ROLLBACK"
                    );
                }
                catch (
                    rollbackError
                ) {
                    console.error(
                        "Error rolling back registration:",
                        rollbackError
                    );
                }
            }


            /*
             * The email column is protected by a case-insensitive
             * unique index. This catches the unlikely race where
             * two requests pass the earlier duplicate check at
             * nearly the same time.
             */
            if (
                error &&
                error.code ===
                    "23505"
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            "An account with this email address already exists."
                    });
            }


            next(error);
        }
        finally {

            if (client) {
                client.release();
            }
        }
    }
);


module.exports =
    router;