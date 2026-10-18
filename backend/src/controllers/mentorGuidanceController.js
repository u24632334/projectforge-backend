const mentorGuidanceService =
    require(
        "../services/mentorGuidanceService"
    );


// ============================================================
// MENTOR PROJECT DISCOVERY
// ============================================================

/**
 * GET /api/mentor/projects
 *
 * Returns ACTIVE projects that explicitly allow
 * Mentor involvement.
 */
async function getEligibleProjects(
    req,
    res,
    next
) {
    try {
        const projects =
            await mentorGuidanceService
                .getEligibleProjectsForMentor({
                    mentorUserId:
                        req.user.id
                });


        return res
            .status(200)
            .json({
                projects
            });
    }
    catch (error) {
        return next(error);
    }
}


// ============================================================
// MENTOR ASSIGNMENT REQUEST
// ============================================================

/**
 * POST /api/mentor/projects/:projectId/assignments
 *
 * Allows an approved Mentor to request participation
 * in an eligible project.
 */
async function requestMentorAssignment(
    req,
    res,
    next
) {
    try {
        const assignment =
            await mentorGuidanceService
                .requestMentorAssignment({
                    projectId:
                        req.params.projectId,

                    mentorUserId:
                        req.user.id
                });


        return res
            .status(201)
            .json({
                message:
                    "Mentor request submitted successfully.",

                assignment
            });
    }
    catch (error) {
        return next(error);
    }
}


// ============================================================
// PROJECT LEAD - VIEW MENTOR ASSIGNMENTS
// ============================================================

/**
 * GET /api/projects/:projectId/mentor-assignments
 *
 * Returns Mentor requests and assignments for the
 * selected project.
 */
async function getProjectMentorAssignments(
    req,
    res,
    next
) {
    try {
        const assignments =
            await mentorGuidanceService
                .getAssignmentsForProject({
                    projectId:
                        req.params.projectId,

                    leadUserId:
                        req.user.id
                });


        return res
            .status(200)
            .json({
                assignments
            });
    }
    catch (error) {
        return next(error);
    }
}


// ============================================================
// PROJECT LEAD - APPROVE MENTOR
// ============================================================

/**
 * PATCH
 * /api/projects/:projectId/mentor-assignments/:assignmentId/approve
 *
 * Approves a PENDING Mentor assignment.
 */
async function approveMentorAssignment(
    req,
    res,
    next
) {
    try {
        const assignment =
            await mentorGuidanceService
                .approveMentorAssignment({
                    projectId:
                        req.params.projectId,

                    assignmentId:
                        req.params.assignmentId,

                    leadUserId:
                        req.user.id
                });


        return res
            .status(200)
            .json({
                message:
                    "Mentor assignment approved successfully.",

                assignment
            });
    }
    catch (error) {
        return next(error);
    }
}


// ============================================================
// PROJECT LEAD - END MENTOR ASSIGNMENT
// ============================================================

/**
 * PATCH
 * /api/projects/:projectId/mentor-assignments/:assignmentId/end
 *
 * Ends an ACTIVE Mentor assignment.
 */
async function endMentorAssignment(
    req,
    res,
    next
) {
    try {
        const assignment =
            await mentorGuidanceService
                .endMentorAssignment({
                    projectId:
                        req.params.projectId,

                    assignmentId:
                        req.params.assignmentId,

                    leadUserId:
                        req.user.id
                });


        return res
            .status(200)
            .json({
                message:
                    "Mentor assignment ended successfully.",

                assignment
            });
    }
    catch (error) {
        return next(error);
    }
}


// ============================================================
// CREATE GUIDANCE
// ============================================================

/**
 * POST /api/projects/:projectId/guidance
 *
 * Creates a new Mentor-guidance entry.
 *
 * The Mentor identity comes only from the authenticated JWT.
 */
async function createGuidance(
    req,
    res,
    next
) {
    try {
        const {
            guidance
        } =
            req.body || {};


        const createdGuidance =
            await mentorGuidanceService
                .createGuidance({
                    projectId:
                        req.params.projectId,

                    mentorUserId:
                        req.user.id,

                    guidance
                });


        return res
            .status(201)
            .json({
                message:
                    "Guidance submitted successfully.",

                guidance:
                    createdGuidance
            });
    }
    catch (error) {
        return next(error);
    }
}


// ============================================================
// VIEW GUIDANCE
// ============================================================

/**
 * GET /api/projects/:projectId/guidance
 *
 * May be viewed by:
 * - an ACTIVE member of the project; or
 * - the ACTIVE assigned Mentor.
 */
async function getGuidance(
    req,
    res,
    next
) {
    try {
        const guidance =
            await mentorGuidanceService
                .getGuidanceForProject({
                    projectId:
                        req.params.projectId,

                    requestingUserId:
                        req.user.id
                });


        return res
            .status(200)
            .json({
                guidance
            });
    }
    catch (error) {
        return next(error);
    }
}


// ============================================================
// EDIT GUIDANCE
// ============================================================

/**
 * PATCH
 * /api/projects/:projectId/guidance/:guidanceId
 *
 * Allows the Mentor who created the guidance to edit it
 * while the assignment remains ACTIVE.
 */
async function editGuidance(
    req,
    res,
    next
) {
    try {
        const {
            guidance
        } =
            req.body || {};


        const updatedGuidance =
            await mentorGuidanceService
                .editGuidance({
                    projectId:
                        req.params.projectId,

                    guidanceId:
                        req.params.guidanceId,

                    mentorUserId:
                        req.user.id,

                    guidance
                });


        return res
            .status(200)
            .json({
                message:
                    "Guidance updated successfully.",

                guidance:
                    updatedGuidance
            });
    }
    catch (error) {
        return next(error);
    }
}


module.exports = {
    getEligibleProjects,
    requestMentorAssignment,

    getProjectMentorAssignments,
    approveMentorAssignment,
    endMentorAssignment,

    createGuidance,
    getGuidance,
    editGuidance
};