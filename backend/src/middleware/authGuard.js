const jwt =
    require("jsonwebtoken");


const {
    JWT_SECRET
} =
    require(
        "../services/authService"
    );


const {
    pool
} =
    require(
        "../config/db"
    );


/**
 * Protect routes requiring authentication.
 *
 * The JWT is verified first, then the current user record
 * is checked in PostgreSQL so suspended accounts lose
 * access immediately and current database roles are used.
 */
async function authGuard(
    req,
    res,
    next
) {

    const authHeader =
        req.headers[
            "authorization"
        ] ||
        req.headers[
            "Authorization"
        ];


    if (
        typeof authHeader !==
            "string" ||
        !authHeader.startsWith(
            "Bearer "
        )
    ) {
        return res
            .status(401)
            .json({
                success:
                    false,

                error:
                    "Access denied. No token provided."
            });
    }


    const token =
        authHeader
            .slice(
                "Bearer ".length
            )
            .trim();


    /*
     * JWT strings do not contain whitespace.
     *
     * Reject empty tokens and malformed values such as:
     * Bearer token extra-value
     */
    if (
        !token ||
        /\s/.test(
            token
        )
    ) {
        return res
            .status(401)
            .json({
                success:
                    false,

                error:
                    "Access denied. Malformed token."
            });
    }


    /*
     * A missing JWT secret is a server configuration
     * problem, not an authentication failure.
     */
    if (
        !JWT_SECRET
    ) {
        const error =
            new Error(
                "Authentication configuration unavailable."
            );


        error.statusCode =
            500;


        return next(
            error
        );
    }


    let decoded;


    try {

        /*
         * Verify JWT signature and expiry separately
         * from database access.
         */
        decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

    }
    catch (
        error
    ) {

        return res
            .status(401)
            .json({
                success:
                    false,

                error:
                    "Invalid or expired token."
            });
    }


    /*
     * A valid ProjectForge authentication token must
     * identify a user.
     */
    if (
        !decoded ||
        typeof decoded.id !==
            "string" ||
        !decoded.id.trim()
    ) {
        return res
            .status(401)
            .json({
                success:
                    false,

                error:
                    "Invalid or expired token."
            });
    }


    try {

        /*
         * Check the CURRENT database state of the account.
         *
         * Do not trust role, email or account state from
         * an older JWT.
         */
        const result =
            await pool.query(
                `
                    SELECT
                        user_id,
                        email,
                        system_role,
                        status
                    FROM users
                    WHERE user_id = $1
                `,
                [
                    decoded.id
                ]
            );


        const user =
            result.rows[0];


        if (
            !user
        ) {
            return res
                .status(401)
                .json({
                    success:
                        false,

                    error:
                        "Authenticated user no longer exists."
                });
        }


        if (
            user.status !==
            "ACTIVE"
        ) {
            return res
                .status(403)
                .json({
                    success:
                        false,

                    error:
                        "Account is suspended."
                });
        }


        /*
         * Use fresh database information rather than
         * blindly trusting role/email values embedded
         * in the JWT.
         */
        req.user = {
            id:
                user.user_id,

            email:
                user.email,

            role:
                user.system_role
        };


        return next();

    }
    catch (
        error
    ) {

        /*
         * Database/server failures are not authentication
         * failures. Pass them to the shared error handler.
         */
        return next(
            error
        );
    }
}


module.exports =
    authGuard;