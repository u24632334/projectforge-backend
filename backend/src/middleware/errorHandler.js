/**
 * ProjectForge Global Error Handler
 *
 * Centralises unexpected Express errors so every backend module returns
 * errors using the same JSON structure.
 *
 * Design decisions:
 * - Valid 4xx errors may return their supplied message because they describe
 *   a problem the client can correct.
 * - Known PostgreSQL input-format errors are converted into safe 400 errors.
 * - 5xx and unexpected errors always return a generic message so database
 *   details, stack traces and other implementation information are not
 *   exposed to ordinary users.
 * - Both `statusCode` and Express-style `status` values are supported.
 *
 * This middleware must remain after all routes in app.js so errors from
 * any ProjectForge feature can reach it.
 *
 * @param {Error} err - Error passed by Express or another middleware.
 * @param {import("express").Request} req - Current Express request.
 * @param {import("express").Response} res - Current Express response.
 * @param {import("express").NextFunction} next - Express next function.
 * @returns {import("express").Response} JSON error response.
 */
function errorHandler(
    err,
    req,
    res,
    next
) {

    /*
     * PostgreSQL 22P02:
     * invalid_text_representation
     *
     * This commonly occurs when a malformed value such as
     * "not-a-uuid" is supplied for a UUID database field.
     *
     * It is a client-input problem rather than a server failure,
     * but the PostgreSQL diagnostic itself must not be exposed.
     */
    if (
        err &&
        err.code ===
            "22P02"
    ) {
        if (
            process.env.NODE_ENV !==
            "test"
        ) {
            console.error(
                "ProjectForge request failed:",
                err
            );
        }


        return res
            .status(400)
            .json({
                error:
                    "Invalid request data."
            });
    }


    /*
     * Some libraries use statusCode,
     * while others use status.
     */
    const rawStatus =
        Number(
            err?.statusCode ??
            err?.status
        );


    /*
     * Only HTTP error status codes are accepted.
     *
     * Invalid or missing values are treated as unexpected
     * server failures.
     */
    const hasValidStatus =
        Number.isInteger(
            rawStatus
        ) &&
        rawStatus >=
            400 &&
        rawStatus <=
            599;


    const statusCode =
        hasValidStatus
            ? rawStatus
            : 500;


    const suppliedMessage =
        typeof err?.message ===
            "string"
            ? err.message.trim()
            : "";


    /*
     * Client errors may contain a useful validation message.
     *
     * Internal server errors are deliberately hidden from
     * the client to avoid exposing sensitive implementation
     * information.
     */
    const message =
        statusCode >=
            500
            ? "Internal server error"
            : suppliedMessage ||
              "Request failed";


    /*
     * Jest sets NODE_ENV to "test".
     *
     * Avoid unnecessary console noise during automated tests
     * while still logging failures during normal runtime.
     */
    if (
        process.env.NODE_ENV !==
        "test"
    ) {
        console.error(
            "ProjectForge request failed:",
            err
        );
    }


    return res
        .status(
            statusCode
        )
        .json({
            error:
                message
        });
}


module.exports =
    errorHandler;