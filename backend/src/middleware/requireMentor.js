/**
 * Restricts a route to approved mentor accounts.
 *
 * In ProjectForge, an approved mentor is represented by an
 * ACTIVE authenticated user whose current system role is MENTOR.
 * authGuard must run first so req.user contains fresh database data.
 */
function requireMentor(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required."
        });
    }

    if (req.user.role !== "MENTOR") {
        return res.status(403).json({
            success: false,
            error: "Approved mentor access required."
        });
    }

    next();
}

module.exports = requireMentor;
