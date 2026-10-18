const showcaseRepository =
    require(
        "../db/showcaseRepository"
    );


function createError(
    message,
    statusCode
) {
    const error =
        new Error(
            message
        );

    error.statusCode =
        statusCode;

    return error;
}


async function createShowcaseSubmission({
    projectId,
    submittedByUserId
}) {
    if (
        !projectId
    ) {
        throw createError(
            "Project ID is required.",
            400
        );
    }


    if (
        !submittedByUserId
    ) {
        throw createError(
            "Submitting user ID is required.",
            400
        );
    }


    const project =
        await showcaseRepository
            .getProjectById(
                projectId
            );


    if (
        !project
    ) {
        throw createError(
            "Project not found.",
            404
        );
    }


    if (
        project.status !==
        "COMPLETED"
    ) {
        throw createError(
            "Only completed projects can be submitted to the showcase.",
            409
        );
    }


    const projectLead =
        await showcaseRepository
            .getActiveProjectLead(
                projectId,
                submittedByUserId
            );


    if (
        !projectLead
    ) {
        throw createError(
            "Project Lead access required.",
            403
        );
    }


    const existingSubmission =
        await showcaseRepository
            .getSubmissionByProjectId(
                projectId
            );


    if (
        existingSubmission
    ) {
        throw createError(
            "Project has already been submitted to the showcase.",
            409
        );
    }


    const submission =
        await showcaseRepository
            .createSubmission({
                projectId,
                submittedByUserId
            });


    return {
        ...submission,
        project
    };
}


async function getShowcaseSubmissionStatus({
    projectId,
    userId
}) {
    if (
        !projectId
    ) {
        throw createError(
            "Project ID is required.",
            400
        );
    }


    if (
        !userId
    ) {
        throw createError(
            "User ID is required.",
            400
        );
    }


    const projectLead =
        await showcaseRepository
            .getActiveProjectLead(
                projectId,
                userId
            );


    if (
        !projectLead
    ) {
        throw createError(
            "Project Lead access required.",
            403
        );
    }


    return showcaseRepository
        .getSubmissionByProjectId(
            projectId
        );
}


async function getPendingShowcaseSubmissions() {
    return showcaseRepository
        .getPendingSubmissions();
}


async function approveShowcaseSubmission({
    showcaseId,
    adminUserId
}) {
    if (
        !showcaseId
    ) {
        throw createError(
            "Showcase submission ID is required.",
            400
        );
    }


    if (
        !adminUserId
    ) {
        throw createError(
            "Administrator user ID is required.",
            400
        );
    }


    const submission =
        await showcaseRepository
            .getSubmissionById(
                showcaseId
            );


    if (
        !submission
    ) {
        throw createError(
            "Showcase submission not found.",
            404
        );
    }


    if (
        submission.project_status !==
        "COMPLETED"
    ) {
        throw createError(
            "Only completed projects can be approved for the showcase.",
            409
        );
    }


    if (
        submission.status ===
        "APPROVED"
    ) {
        throw createError(
            "Showcase submission has already been approved.",
            409
        );
    }


    const approved =
        await showcaseRepository
            .approveSubmission(
                showcaseId,
                adminUserId
            );


    if (
        !approved
    ) {
        throw createError(
            "Showcase submission could not be approved.",
            409
        );
    }


    return approved;
}


async function getPublicShowcase() {
    return showcaseRepository
        .getPublicShowcase();
}


module.exports = {
    createShowcaseSubmission,
    getShowcaseSubmissionStatus,
    getPendingShowcaseSubmissions,
    approveShowcaseSubmission,
    getPublicShowcase
};