const express = require("express");
const cors = require("cors");
const path = require("path");

const {
    pool
} = require("./config/db");

const errorHandler =
    require("./middleware/errorHandler");

const authGuard =
    require("./middleware/authGuard");

const {
    BuildRequireProjectMembership,
    CreateMembershipLookup
} = require(
    "./middleware/requireProjectMembership"
);

const reportRoutes =
    require("./routes/reportRoutes");

const authRoutes =
    require("./routes/authRoutes");

const moderationRoutes =
    require("./routes/moderationRoutes");

const profileRoutes =
    require("./routes/profileRoutes");

const developmentUpdateRoutes =
    require("./routes/developmentUpdateRoutes");

const mentorGuidanceRoutes =
    require("./routes/mentorGuidanceRoutes");

const showcaseRoutes =
    require("./routes/showcaseRoutes");

const projectRoutes =
    require("./routes/projectRoutes");

const applicationRoutes =
    require("./routes/applicationRoutes");

const milestoneRoutes =
    require("./routes/milestoneRoutes");

const taskRoutes =
    require("./routes/taskRoutes");

const teamRadioRoutes =
    require("./routes/teamRadioRoutes");

const buildPitWallRouter =
    require("./routes/pitwall");

const buildTeamHealthRouter =
    require("./routes/teamHealth");

const buildTeamHealthSubmissionRouter =
    require("./routes/teamHealthSubmission");

const PitWallRepository =
    require("./db/pitWallRepository");

const TeamHealthRepository =
    require("./db/teamHealthRepository");

const TeamHealthSubmissionRepository =
    require(
        "./db/teamHealthSubmissionRepository"
    );


const app =
    express();


// Middleware
app.use(
    cors()
);

app.use(
    express.json()
);


/**
 * Project image files.
 *
 * Files are stored using generated UUID filenames only.
 * MIME types are limited during upload to JPG, PNG and WebP.
 */
app.use(
    "/api/project-images/files",
    express.static(
        path.resolve(
            __dirname,
            "../uploads/project-images"
        ),
        {
            index: false,

            dotfiles:
                "deny",

            setHeaders:
                response => {
                    response.setHeader(
                        "X-Content-Type-Options",
                        "nosniff"
                    );
                }
        }
    )
);


/**
 * Shared project-membership middleware used by the
 * team-health route factories.
 */
const findMembership =
    CreateMembershipLookup(
        pool
    );

const requireProjectMembership =
    BuildRequireProjectMembership(
        findMembership
    );


/**
 * Adapter for the team-health subsystem.
 *
 * The shared membership middleware stores membership
 * information on req.membership.
 *
 * The anonymous team-health submission flow expects
 * req.user.membershipId, so this adapter safely exposes
 * the existing membership ID in that location.
 */
function authorizeProjectMember(
    req,
    res,
    next
) {
    return requireProjectMembership(
        req,
        res,
        error => {
            if (
                error
            ) {
                return next(
                    error
                );
            }

            if (
                req.user &&
                req.membership
            ) {
                req.user.membershipId =
                    req.membership
                        .membershipId;
            }

            return next();
        }
    );
}


/**
 * Health-check endpoint.
 * Confirms that the ProjectForge API is running and available.
 */
app.get(
    "/api/health",
    (
        req,
        res
    ) => {
        res
            .status(200)
            .json({
                status:
                    "OK",

                service:
                    "ProjectForge API"
            });
    }
);


/**
 * Authentication, reporting, moderation and profile routes.
 */
app.use(
    "/api",
    reportRoutes
);

app.use(
    "/api",
    authRoutes
);

app.use(
    "/api",
    moderationRoutes
);

app.use(
    "/api/profiles",
    profileRoutes
);


/**
 * Project creation, discovery and application routes.
 */
app.use(
    "/api/projects",
    projectRoutes
);

app.use(
    "/api/applications",
    applicationRoutes
);


/**
 * Project workspace routes.
 *
 * Authentication and project-membership checks are already
 * implemented inside these routers.
 */
app.use(
    "/api",
    milestoneRoutes
);

app.use(
    "/api",
    taskRoutes
);

app.use(
    "/api",
    teamRadioRoutes
);

app.use(
    "/api",
    developmentUpdateRoutes
);


/**
 * Pit Wall private check-ins.
 */
const pitWallRepository =
    new PitWallRepository(
        pool
    );

app.use(
    "/api/pitwall",
    buildPitWallRouter(
        pitWallRepository,
        authGuard
    )
);


/**
 * Anonymous team-health submission and aggregated summary.
 */
const teamHealthRepository =
    new TeamHealthRepository(
        pool
    );

const teamHealthSubmissionRepository =
    new TeamHealthSubmissionRepository(
        pool
    );

app.use(
    "/api",
    buildTeamHealthRouter(
        teamHealthRepository,
        authGuard,
        authorizeProjectMember
    )
);

app.use(
    "/api",
    buildTeamHealthSubmissionRouter(
        teamHealthSubmissionRepository,
        authGuard,
        authorizeProjectMember
    )
);


/**
 * Mentor guidance and public showcase.
 */
app.use(
    "/api",
    mentorGuidanceRoutes
);

app.use(
    "/api",
    showcaseRoutes
);


/**
 * Handles requests to routes that do not exist.
 */
app.use(
    (
        req,
        res
    ) => {
        res
            .status(404)
            .json({
                error:
                    "Route not found"
            });
    }
);


// Global error-handling middleware.
// This must be registered after the application routes.
app.use(
    errorHandler
);


module.exports =
    app;