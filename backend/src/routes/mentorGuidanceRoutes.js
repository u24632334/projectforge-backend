const express =
    require("express");

const mentorGuidanceController =
    require(
        "../controllers/mentorGuidanceController"
    );

const authGuard =
    require(
        "../middleware/authGuard"
    );

const requireMentor =
    require(
        "../middleware/requireMentor"
    );


const router =
    express.Router();


// ============================================================
// MENTOR PROJECT DISCOVERY
// ============================================================

/**
 * GET /api/mentor/projects
 *
 * Returns ACTIVE projects that explicitly permit
 * Mentor involvement.
 *
 * Only an authenticated approved Mentor may use
 * this endpoint.
 */
router.get(
    "/mentor/projects",
    authGuard,
    requireMentor,
    mentorGuidanceController
        .getEligibleProjects
);


// ============================================================
// MENTOR ASSIGNMENT REQUEST
// ============================================================

/**
 * POST /api/mentor/projects/:projectId/assignments
 *
 * Allows an approved Mentor to request participation
 * in an eligible project.
 *
 * The resulting MentorAssignment begins in PENDING state.
 */
router.post(
    "/mentor/projects/:projectId/assignments",
    authGuard,
    requireMentor,
    mentorGuidanceController
        .requestMentorAssignment
);


// ============================================================
// PROJECT LEAD - VIEW MENTOR ASSIGNMENTS
// ============================================================

/**
 * GET /api/projects/:projectId/mentor-assignments
 *
 * Returns Mentor requests and assignments for the
 * selected project.
 *
 * Any authenticated user reaches the service, but the
 * service permits only the ACTIVE Project Lead.
 */
router.get(
    "/projects/:projectId/mentor-assignments",
    authGuard,
    mentorGuidanceController
        .getProjectMentorAssignments
);


// ============================================================
// PROJECT LEAD - APPROVE MENTOR ASSIGNMENT
// ============================================================

/**
 * PATCH
 * /api/projects/:projectId/mentor-assignments/:assignmentId/approve
 *
 * Changes:
 *
 * PENDING -> ACTIVE
 *
 * only when:
 * - the caller is the active Project Lead;
 * - the assignment belongs to this project;
 * - the project remains ACTIVE;
 * - Mentor involvement remains enabled; and
 * - the assigned user still has approved Mentor access.
 */
router.patch(
    "/projects/:projectId/mentor-assignments/:assignmentId/approve",
    authGuard,
    mentorGuidanceController
        .approveMentorAssignment
);


// ============================================================
// PROJECT LEAD - END MENTOR ASSIGNMENT
// ============================================================

/**
 * PATCH
 * /api/projects/:projectId/mentor-assignments/:assignmentId/end
 *
 * Changes:
 *
 * ACTIVE -> ENDED
 *
 * Only the active Project Lead may end the relationship.
 */
router.patch(
    "/projects/:projectId/mentor-assignments/:assignmentId/end",
    authGuard,
    mentorGuidanceController
        .endMentorAssignment
);


// ============================================================
// VIEW GUIDANCE
// ============================================================

/**
 * GET /api/projects/:projectId/guidance
 *
 * IMPORTANT:
 *
 * This route intentionally does NOT use requireMentor.
 *
 * Guidance must be readable by the project team that
 * receives it.
 *
 * The service authorises either:
 * - an ACTIVE project member; or
 * - an ACTIVE assigned Mentor.
 *
 * Unrelated authenticated users are rejected.
 */
router.get(
    "/projects/:projectId/guidance",
    authGuard,
    mentorGuidanceController
        .getGuidance
);


// ============================================================
// CREATE GUIDANCE
// ============================================================

/**
 * POST /api/projects/:projectId/guidance
 *
 * Only an approved Mentor account may reach the controller.
 *
 * The service then additionally requires an ACTIVE
 * MentorAssignment for the selected project.
 */
router.post(
    "/projects/:projectId/guidance",
    authGuard,
    requireMentor,
    mentorGuidanceController
        .createGuidance
);


// ============================================================
// EDIT GUIDANCE
// ============================================================

/**
 * PATCH
 * /api/projects/:projectId/guidance/:guidanceId
 *
 * Only an approved Mentor may reach the controller.
 *
 * The service additionally verifies:
 * - the guidance belongs to this project;
 * - the guidance belongs to this Mentor; and
 * - the MentorAssignment is still ACTIVE.
 */
router.patch(
    "/projects/:projectId/guidance/:guidanceId",
    authGuard,
    requireMentor,
    mentorGuidanceController
        .editGuidance
);


module.exports =
    router;