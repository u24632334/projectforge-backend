const showcaseService =
    require(
        "../services/showcaseService"
    );


async function createShowcaseSubmission(
    req,
    res,
    next
) {
    try {
        const {
            projectId
        } = req.body ||
            {};


        const submission =
            await showcaseService
                .createShowcaseSubmission({
                    projectId,
                    submittedByUserId:
                        req.user.id
                });


        return res
            .status(201)
            .json({
                message:
                    "Project submitted for showcase approval successfully.",

                submission
            });
    } catch (
        error
    ) {
        next(
            error
        );
    }
}


async function getShowcaseSubmissionStatus(
    req,
    res,
    next
) {
    try {
        const submission =
            await showcaseService
                .getShowcaseSubmissionStatus({
                    projectId:
                        req.params
                            .projectId,

                    userId:
                        req.user.id
                });


        return res
            .status(200)
            .json({
                submission
            });
    } catch (
        error
    ) {
        next(
            error
        );
    }
}


async function getPendingShowcaseSubmissions(
    req,
    res,
    next
) {
    try {
        const submissions =
            await showcaseService
                .getPendingShowcaseSubmissions();


        return res
            .status(200)
            .json({
                submissions
            });
    } catch (
        error
    ) {
        next(
            error
        );
    }
}


async function approveShowcaseSubmission(
    req,
    res,
    next
) {
    try {
        const submission =
            await showcaseService
                .approveShowcaseSubmission({
                    showcaseId:
                        req.params
                            .showcaseId,

                    adminUserId:
                        req.user.id
                });


        return res
            .status(200)
            .json({
                message:
                    "Showcase submission approved successfully.",

                submission
            });
    } catch (
        error
    ) {
        next(
            error
        );
    }
}


async function getPublicShowcase(
    req,
    res,
    next
) {
    try {
        const projects =
            await showcaseService
                .getPublicShowcase();


        return res
            .status(200)
            .json({
                projects
            });
    } catch (
        error
    ) {
        next(
            error
        );
    }
}


module.exports = {
    createShowcaseSubmission,
    getShowcaseSubmissionStatus,
    getPendingShowcaseSubmissions,
    approveShowcaseSubmission,
    getPublicShowcase
};