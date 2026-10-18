const {
    pool
} = require("../config/db");

const mentorGuidanceRepository =
    require(
        "../db/mentorGuidanceRepository"
    );

const MAX_GUIDANCE_LENGTH =
    1000;

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


/**
 * Creates an application error compatible with the
 * shared Express error middleware.
 */
function createError(
    message,
    statusCode
) {
    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return error;
}


/**
 * Validates UUID identifiers before PostgreSQL receives them.
 *
 * Missing identifiers and malformed identifiers are reported
 * separately so the API returns useful validation messages.
 */
function requireValidUuid(
    value,
    label
) {
    if (
        value === undefined ||
        value === null ||
        (
            typeof value ===
                "string" &&
            value.trim() ===
                ""
        )
    ) {
        throw createError(
            `${label} is required.`,
            400
        );
    }

    if (
        typeof value !==
            "string" ||
        !UUID_PATTERN.test(
            value.trim()
        )
    ) {
        throw createError(
            `${label} must be a valid UUID.`,
            400
        );
    }

    return value.trim();
}


/**
 * Validate Mentor guidance text.
 */
function validateGuidance(
    guidance
) {
    if (
        typeof guidance !==
            "string" ||
        guidance.trim() ===
            ""
    ) {
        throw createError(
            "Guidance text is required.",
            400
        );
    }

    const cleanGuidance =
        guidance.trim();

    if (
        cleanGuidance.length >
        MAX_GUIDANCE_LENGTH
    ) {
        throw createError(
            `Maximum characters exceeded. Guidance may not exceed ${MAX_GUIDANCE_LENGTH} characters.`,
            400
        );
    }

    return cleanGuidance;
}


// ============================================================
// MENTOR PROJECT DISCOVERY
// ============================================================

async function getEligibleProjectsForMentor({
    mentorUserId
}) {
    const cleanMentorUserId =
        requireValidUuid(
            mentorUserId,
            "Mentor user ID"
        );

    const mentor =
        await mentorGuidanceRepository
            .findApprovedMentor(
                pool,
                cleanMentorUserId
            );

    if (!mentor) {
        throw createError(
            "Approved Mentor access is required.",
            403
        );
    }

    return mentorGuidanceRepository
        .getEligibleProjectsForMentor(
            cleanMentorUserId
        );
}


// ============================================================
// MENTOR ASSIGNMENT REQUEST
// ============================================================

async function requestMentorAssignment({
    projectId,
    mentorUserId
}) {
    const cleanProjectId =
        requireValidUuid(
            projectId,
            "Project ID"
        );

    const cleanMentorUserId =
        requireValidUuid(
            mentorUserId,
            "Mentor user ID"
        );

    const mentor =
        await mentorGuidanceRepository
            .findApprovedMentor(
                pool,
                cleanMentorUserId
            );

    if (!mentor) {
        throw createError(
            "Approved Mentor access is required.",
            403
        );
    }

    const project =
        await mentorGuidanceRepository
            .findProjectById(
                cleanProjectId
            );

    if (!project) {
        throw createError(
            "Project not found.",
            404
        );
    }

    if (
        project.status !==
        "ACTIVE"
    ) {
        throw createError(
            "Mentor support can only be requested for an active project.",
            409
        );
    }

    if (
        project.allow_mentor_support !==
        true
    ) {
        throw createError(
            "This project is not accepting Mentor involvement.",
            403
        );
    }

    const currentAssignment =
        await mentorGuidanceRepository
            .findCurrentAssignment(
                cleanProjectId,
                cleanMentorUserId
            );

    if (currentAssignment) {
        if (
            currentAssignment.status ===
            "PENDING"
        ) {
            throw createError(
                "You already have a pending Mentor request for this project.",
                409
            );
        }

        if (
            currentAssignment.status ===
            "ACTIVE"
        ) {
            throw createError(
                "You are already an active Mentor for this project.",
                409
            );
        }
    }

    try {
        return await mentorGuidanceRepository
            .createMentorAssignment({
                projectId:
                    cleanProjectId,

                mentorUserId:
                    cleanMentorUserId
            });
    }
    catch (error) {
        if (
            error &&
            error.code ===
                "23505"
        ) {
            throw createError(
                "A current Mentor request already exists for this project.",
                409
            );
        }

        throw error;
    }
}


// ============================================================
// PROJECT LEAD - VIEW MENTOR ASSIGNMENTS
// ============================================================

async function getAssignmentsForProject({
    projectId,
    leadUserId
}) {
    const cleanProjectId =
        requireValidUuid(
            projectId,
            "Project ID"
        );

    const cleanLeadUserId =
        requireValidUuid(
            leadUserId,
            "Project Lead user ID"
        );

    const project =
        await mentorGuidanceRepository
            .findProjectById(
                cleanProjectId
            );

    if (!project) {
        throw createError(
            "Project not found.",
            404
        );
    }

    const leadMembership =
        await mentorGuidanceRepository
            .findActiveLeadMembership(
                pool,
                cleanProjectId,
                cleanLeadUserId
            );

    if (!leadMembership) {
        throw createError(
            "Project Lead access required.",
            403
        );
    }

    return mentorGuidanceRepository
        .getAssignmentsForProject(
            cleanProjectId
        );
}


// ============================================================
// PROJECT LEAD - APPROVE MENTOR ASSIGNMENT
// ============================================================

async function approveMentorAssignment({
    projectId,
    assignmentId,
    leadUserId
}) {
    const cleanProjectId =
        requireValidUuid(
            projectId,
            "Project ID"
        );

    const cleanAssignmentId =
        requireValidUuid(
            assignmentId,
            "Mentor assignment ID"
        );

    const cleanLeadUserId =
        requireValidUuid(
            leadUserId,
            "Project Lead user ID"
        );

    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const assignment =
            await mentorGuidanceRepository
                .findAssignmentByIdForUpdate(
                    client,
                    cleanAssignmentId
                );

        if (!assignment) {
            throw createError(
                "Mentor assignment not found.",
                404
            );
        }

        if (
            assignment.project_id !==
            cleanProjectId
        ) {
            throw createError(
                "Mentor assignment does not belong to this project.",
                404
            );
        }

        const leadMembership =
            await mentorGuidanceRepository
                .findActiveLeadMembership(
                    client,
                    cleanProjectId,
                    cleanLeadUserId
                );

        if (!leadMembership) {
            throw createError(
                "Project Lead access required.",
                403
            );
        }

        if (
            assignment.status !==
            "PENDING"
        ) {
            throw createError(
                "Only pending Mentor assignments can be approved.",
                409
            );
        }

        const projectResult =
            await client.query(
                `
                    SELECT
                        project_id,
                        status,
                        allow_mentor_support
                    FROM projects
                    WHERE project_id =
                        $1
                    FOR UPDATE;
                `,
                [
                    cleanProjectId
                ]
            );

        const project =
            projectResult.rows[0];

        if (!project) {
            throw createError(
                "Project not found.",
                404
            );
        }

        if (
            project.status !==
            "ACTIVE"
        ) {
            throw createError(
                "Mentor assignments can only be approved for active projects.",
                409
            );
        }

        if (
            project.allow_mentor_support !==
            true
        ) {
            throw createError(
                "This project is no longer accepting Mentor involvement.",
                409
            );
        }

        const mentor =
            await mentorGuidanceRepository
                .findApprovedMentor(
                    client,
                    assignment
                        .mentor_user_id
                );

        if (!mentor) {
            throw createError(
                "This assignment cannot be approved because the user does not have approved Mentor access.",
                409
            );
        }

        const approvedAssignment =
            await mentorGuidanceRepository
                .approveAssignment(
                    client,
                    cleanAssignmentId
                );

        if (!approvedAssignment) {
            throw createError(
                "The Mentor assignment could not be approved.",
                409
            );
        }

        await client.query(
            "COMMIT"
        );

        return approvedAssignment;
    }
    catch (error) {
        try {
            await client.query(
                "ROLLBACK"
            );
        }
        catch (
            rollbackError
        ) {
            console.error(
                "Error rolling back Mentor approval:",
                rollbackError
            );
        }

        throw error;
    }
    finally {
        client.release();
    }
}


// ============================================================
// PROJECT LEAD - END MENTOR ASSIGNMENT
// ============================================================

async function endMentorAssignment({
    projectId,
    assignmentId,
    leadUserId
}) {
    const cleanProjectId =
        requireValidUuid(
            projectId,
            "Project ID"
        );

    const cleanAssignmentId =
        requireValidUuid(
            assignmentId,
            "Mentor assignment ID"
        );

    const cleanLeadUserId =
        requireValidUuid(
            leadUserId,
            "Project Lead user ID"
        );

    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const assignment =
            await mentorGuidanceRepository
                .findAssignmentByIdForUpdate(
                    client,
                    cleanAssignmentId
                );

        if (!assignment) {
            throw createError(
                "Mentor assignment not found.",
                404
            );
        }

        if (
            assignment.project_id !==
            cleanProjectId
        ) {
            throw createError(
                "Mentor assignment does not belong to this project.",
                404
            );
        }

        const leadMembership =
            await mentorGuidanceRepository
                .findActiveLeadMembership(
                    client,
                    cleanProjectId,
                    cleanLeadUserId
                );

        if (!leadMembership) {
            throw createError(
                "Project Lead access required.",
                403
            );
        }

        if (
            assignment.status !==
            "ACTIVE"
        ) {
            throw createError(
                "Only active Mentor assignments can be ended.",
                409
            );
        }

        const endedAssignment =
            await mentorGuidanceRepository
                .endAssignment(
                    client,
                    cleanAssignmentId
                );

        if (!endedAssignment) {
            throw createError(
                "The Mentor assignment could not be ended.",
                409
            );
        }

        await client.query(
            "COMMIT"
        );

        return endedAssignment;
    }
    catch (error) {
        try {
            await client.query(
                "ROLLBACK"
            );
        }
        catch (
            rollbackError
        ) {
            console.error(
                "Error rolling back Mentor assignment end:",
                rollbackError
            );
        }

        throw error;
    }
    finally {
        client.release();
    }
}


// ============================================================
// CREATE GUIDANCE
// ============================================================

async function createGuidance({
    projectId,
    mentorUserId,
    guidance
}) {
    const cleanProjectId =
        requireValidUuid(
            projectId,
            "Project ID"
        );

    const cleanMentorUserId =
        requireValidUuid(
            mentorUserId,
            "Mentor user ID"
        );

    const cleanGuidance =
        validateGuidance(
            guidance
        );

    const project =
        await mentorGuidanceRepository
            .findProjectById(
                cleanProjectId
            );

    if (!project) {
        throw createError(
            "Project not found.",
            404
        );
    }

    if (
        project.status !==
        "ACTIVE"
    ) {
        throw createError(
            "Guidance can only be added to an active project.",
            409
        );
    }

    const assignment =
        await mentorGuidanceRepository
            .findActiveAssignment(
                cleanProjectId,
                cleanMentorUserId
            );

    if (!assignment) {
        throw createError(
            "An active Mentor assignment is required before guidance can be submitted.",
            403
        );
    }

    return mentorGuidanceRepository
        .createGuidance({
            assignmentId:
                assignment
                    .assignment_id,

            guidance:
                cleanGuidance
        });
}


// ============================================================
// VIEW GUIDANCE
// ============================================================

async function getGuidanceForProject({
    projectId,
    requestingUserId
}) {
    const cleanProjectId =
        requireValidUuid(
            projectId,
            "Project ID"
        );

    const cleanRequestingUserId =
        requireValidUuid(
            requestingUserId,
            "Authenticated user ID"
        );

    const project =
        await mentorGuidanceRepository
            .findProjectById(
                cleanProjectId
            );

    if (!project) {
        throw createError(
            "Project not found.",
            404
        );
    }

    const membership =
        await mentorGuidanceRepository
            .findActiveProjectMembership(
                cleanProjectId,
                cleanRequestingUserId
            );

    let mentorAssignment =
        null;

    if (!membership) {
        mentorAssignment =
            await mentorGuidanceRepository
                .findActiveAssignment(
                    cleanProjectId,
                    cleanRequestingUserId
                );
    }

    if (
        !membership &&
        !mentorAssignment
    ) {
        throw createError(
            "You do not have access to this project's Mentor guidance.",
            403
        );
    }

    return mentorGuidanceRepository
        .getGuidanceForProject(
            cleanProjectId
        );
}


// ============================================================
// EDIT GUIDANCE
// ============================================================

async function editGuidance({
    projectId,
    guidanceId,
    mentorUserId,
    guidance
}) {
    const cleanProjectId =
        requireValidUuid(
            projectId,
            "Project ID"
        );

    const cleanGuidanceId =
        requireValidUuid(
            guidanceId,
            "Guidance ID"
        );

    const cleanMentorUserId =
        requireValidUuid(
            mentorUserId,
            "Mentor user ID"
        );

    const cleanGuidance =
        validateGuidance(
            guidance
        );

    const existingGuidance =
        await mentorGuidanceRepository
            .findGuidanceById(
                cleanGuidanceId
            );

    if (!existingGuidance) {
        throw createError(
            "Guidance entry not found.",
            404
        );
    }

    if (
        existingGuidance
            .projectId !==
        cleanProjectId
    ) {
        throw createError(
            "Guidance entry does not belong to this project.",
            404
        );
    }

    if (
        existingGuidance
            .mentorUserId !==
        cleanMentorUserId
    ) {
        throw createError(
            "You may only edit your own Mentor guidance.",
            403
        );
    }

    if (
        existingGuidance
            .assignmentStatus !==
        "ACTIVE"
    ) {
        throw createError(
            "Guidance can only be edited while the Mentor assignment is active.",
            409
        );
    }

    const updatedGuidance =
        await mentorGuidanceRepository
            .updateGuidance(
                cleanGuidanceId,
                cleanGuidance
            );

    if (!updatedGuidance) {
        throw createError(
            "Guidance entry not found.",
            404
        );
    }

    return updatedGuidance;
}


module.exports = {
    MAX_GUIDANCE_LENGTH,

    getEligibleProjectsForMentor,
    requestMentorAssignment,

    getAssignmentsForProject,
    approveMentorAssignment,
    endMentorAssignment,

    createGuidance,
    getGuidanceForProject,
    editGuidance
};