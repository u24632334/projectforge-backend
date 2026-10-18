/**
 * Middleware used to restrict a route to administrators.
 *
 * authGuard must run before this middleware so that
 * req.user contains the decoded JWT information.
 */
function requireAdmin(req, res, next) {

    // This should normally already be caught by authGuard,
    // but provides an additional safety check.
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required."
        });
    }

    // Only users with the ADMIN system role may continue.
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            error: "Administrator access required."
        });
    }

    next();
}


module.exports = requireAdmin;