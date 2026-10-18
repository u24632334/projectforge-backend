import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    useAuth
} from "../context/AuthContext";

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import "./ProjectWorkspaceHeader.css";


const PROJECT_CATEGORIES = [
    "Robotics",
    "Software Engineering",
    "Electronics",
    "Embedded Systems"
];

const MAX_PROJECT_TITLE_LENGTH = 120;
const MAX_PROJECT_DESCRIPTION_LENGTH = 1000;
const MAX_REPOSITORY_URL_LENGTH = 2048;


async function readResponseJson(
    response
) {
    try {
        return await response.json();
    }
    catch {
        return {};
    }
}


function getSafeRepositoryUrl(
    value
) {
    if (
        typeof value !==
        "string"
    ) {
        return "";
    }


    const cleanUrl =
        value.trim();


    if (
        !cleanUrl ||
        cleanUrl.length >
            MAX_REPOSITORY_URL_LENGTH
    ) {
        return "";
    }


    try {
        const parsedUrl =
            new URL(
                cleanUrl
            );


        const hostname =
            parsedUrl.hostname
                .toLowerCase();


        if (
            parsedUrl.protocol !==
            "https:"
        ) {
            return "";
        }


        if (
            hostname !==
                "github.com" &&
            hostname !==
                "www.github.com" &&
            hostname !==
                "gitlab.com" &&
            hostname !==
                "www.gitlab.com"
        ) {
            return "";
        }


        return parsedUrl.toString();
    }
    catch {
        return "";
    }
}


function getAssignmentId(
    assignment
) {
    return (
        assignment?.assignmentId ||
        assignment?.assignment_id ||
        ""
    );
}


function getAssignmentStatus(
    assignment
) {
    return String(
        assignment?.status ||
        assignment?.assignmentStatus ||
        assignment?.assignment_status ||
        ""
    )
        .trim()
        .toUpperCase();
}


function getAssignmentMentorName(
    assignment
) {
    return (
        assignment?.mentorName ||
        assignment?.mentor_name ||
        assignment?.displayName ||
        assignment?.display_name ||
        assignment?.mentorEmail ||
        assignment?.mentor_email ||
        "Mentor"
    );
}


function getAssignmentMentorEmail(
    assignment
) {
    return (
        assignment?.mentorEmail ||
        assignment?.mentor_email ||
        assignment?.email ||
        ""
    );
}


function getAssignmentRequestedAt(
    assignment
) {
    return (
        assignment?.requestedAt ||
        assignment?.requested_at ||
        null
    );
}


function formatDate(
    value
) {
    if (!value) {
        return "Unknown";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown";
    }


    return date.toLocaleString();
}


function ProjectWorkspaceHeader({
    projectName,
    status,
    lead,
    repository,
    teamSize
}) {
    const {
        user,
        token
    } = useAuth();


    const [
        currentProjectName,
        setCurrentProjectName
    ] = useState(
        projectName
    );


    const [
        currentRepository,
        setCurrentRepository
    ] = useState(
        repository ||
        ""
    );


    const [
        currentStatus,
        setCurrentStatus
    ] = useState(
        status
    );


    const [
        currentAllowMentorSupport,
        setCurrentAllowMentorSupport
    ] = useState(false);


    const [
        isProjectLead,
        setIsProjectLead
    ] = useState(false);


    const [
        submissionStatus,
        setSubmissionStatus
    ] = useState(null);


    const [
        mentorAssignments,
        setMentorAssignments
    ] = useState([]);


    const [
        mentorAssignmentsLoading,
        setMentorAssignmentsLoading
    ] = useState(false);


    const [
        mentorAssignmentError,
        setMentorAssignmentError
    ] = useState("");


    const [
        busyMentorAssignmentId,
        setBusyMentorAssignmentId
    ] = useState("");


    const [
        isEditing,
        setIsEditing
    ] = useState(false);


    const [
        isLoadingEdit,
        setIsLoadingEdit
    ] = useState(false);


    const [
        isSavingEdit,
        setIsSavingEdit
    ] = useState(false);


    const [
        editTitle,
        setEditTitle
    ] = useState("");


    const [
        editDescription,
        setEditDescription
    ] = useState("");


    const [
        editCategory,
        setEditCategory
    ] = useState(
        "Robotics"
    );


    const [
        editHours,
        setEditHours
    ] = useState(1);


    const [
        editRepository,
        setEditRepository
    ] = useState("");


    const [
        editAllowMentorSupport,
        setEditAllowMentorSupport
    ] = useState(false);


    const [
        isCompleting,
        setIsCompleting
    ] = useState(false);


    const [
        isSubmitting,
        setIsSubmitting
    ] = useState(false);


    const [
        actionError,
        setActionError
    ] = useState("");


    const [
        actionSuccess,
        setActionSuccess
    ] = useState("");


    useAutoDismissFeedback(
        Boolean(
            actionError ||
            actionSuccess
        ),
        () => {
            setActionError("");
            setActionSuccess("");
        }
    );


    const projectId =
        sessionStorage.getItem(
            "projectforge-active-project-id"
        ) || "";


    const normalizedStatus =
        String(
            currentStatus ||
            ""
        )
            .trim()
            .toUpperCase();


    const normalizedSubmissionStatus =
        String(
            submissionStatus ||
            ""
        )
            .trim()
            .toUpperCase();


    const safeRepositoryUrl =
        getSafeRepositoryUrl(
            currentRepository
        );


    const hasRepository =
        Boolean(
            safeRepositoryUrl
        );


    useEffect(
        () => {
            if (
                !projectId ||
                !normalizedSubmissionStatus
            ) {
                return;
            }


            window.dispatchEvent(
                new CustomEvent(
                    "projectforge-showcase-submitted",
                    {
                        detail: {
                            projectId
                        }
                    }
                )
            );
        },
        [
            projectId,
            normalizedSubmissionStatus
        ]
    );


    useEffect(
        () => {
            setCurrentProjectName(
                projectName
            );
        },
        [
            projectName
        ]
    );


    useEffect(
        () => {
            setCurrentRepository(
                repository ||
                ""
            );
        },
        [
            repository
        ]
    );


    useEffect(
        () => {
            setCurrentStatus(
                status
            );
        },
        [
            status
        ]
    );


    useEffect(
        () => {
            let cancelled =
                false;


            async function loadLeadStatus() {
                if (
                    !projectId ||
                    !token ||
                    !user?.id
                ) {
                    setIsProjectLead(
                        false
                    );

                    return;
                }


                try {
                    const response =
                        await fetch(
                            `/api/projects/${projectId}/members`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await readResponseJson(
                            response
                        );


                    if (
                        !response.ok
                    ) {
                        if (
                            !cancelled
                        ) {
                            setIsProjectLead(
                                false
                            );
                        }

                        return;
                    }


                    const members =
                        Array.isArray(
                            data.members
                        )
                            ? data.members
                            : [];


                    const membership =
                        members.find(
                            member =>
                                (
                                    member.userId ||
                                    member.user_id
                                ) ===
                                user.id
                        );


                    const memberRole =
                        membership?.memberRole ||
                        membership?.member_role ||
                        "";


                    if (
                        !cancelled
                    ) {
                        setIsProjectLead(
                            String(
                                memberRole
                            )
                                .toUpperCase() ===
                                "LEAD"
                        );
                    }
                }
                catch {
                    if (
                        !cancelled
                    ) {
                        setIsProjectLead(
                            false
                        );
                    }
                }
            }


            loadLeadStatus();


            return () => {
                cancelled =
                    true;
            };
        },
        [
            projectId,
            token,
            user?.id
        ]
    );


    useEffect(
        () => {
            let cancelled =
                false;


            async function loadProject() {
                if (
                    !projectId
                ) {
                    return;
                }


                try {
                    const response =
                        await fetch(
                            `/api/projects/${projectId}`
                        );


                    const data =
                        await readResponseJson(
                            response
                        );


                    if (
                        !response.ok ||
                        !data.project
                    ) {
                        return;
                    }


                    const project =
                        data.project;


                    if (
                        !cancelled
                    ) {
                        setCurrentProjectName(
                            project.title ||
                            projectName
                        );


                        setCurrentRepository(
                            project.repositoryUrl ||
                            project.repository_url ||
                            ""
                        );


                        setCurrentStatus(
                            project.status ||
                            status
                        );


                        setCurrentAllowMentorSupport(
                            Boolean(
                                project.allowMentorSupport ??
                                project.allow_mentor_support ??
                                false
                            )
                        );
                    }
                }
                catch {
                    /*
                     * Parent workspace props still provide
                     * enough information for the header.
                     */
                }
            }


            loadProject();


            return () => {
                cancelled =
                    true;
            };
        },
        [
            projectId,
            projectName,
            status
        ]
    );


    const loadMentorAssignments =
        useCallback(
            async () => {
                if (
                    !projectId ||
                    !token ||
                    !isProjectLead
                ) {
                    setMentorAssignments(
                        []
                    );

                    setMentorAssignmentError(
                        ""
                    );

                    return;
                }


                setMentorAssignmentsLoading(
                    true
                );

                setMentorAssignmentError(
                    ""
                );


                try {
                    const response =
                        await fetch(
                            `/api/projects/${projectId}/mentor-assignments`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await readResponseJson(
                            response
                        );


                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data.error ||
                            data.message ||
                            "Unable to load Mentor assignments."
                        );
                    }


                    const assignments =
                        data.assignments ||
                        data.mentorAssignments ||
                        data.mentor_assignments ||
                        [];


                    setMentorAssignments(
                        Array.isArray(
                            assignments
                        )
                            ? assignments
                            : []
                    );
                }
                catch (
                    error
                ) {
                    setMentorAssignments(
                        []
                    );

                    setMentorAssignmentError(
                        error.message ||
                        "Unable to load Mentor assignments."
                    );
                }
                finally {
                    setMentorAssignmentsLoading(
                        false
                    );
                }
            },
            [
                projectId,
                token,
                isProjectLead
            ]
        );


    useEffect(
        () => {
            loadMentorAssignments();
        },
        [
            loadMentorAssignments
        ]
    );


    useEffect(
        () => {
            let cancelled =
                false;


            async function loadSubmissionStatus() {
                if (
                    !projectId ||
                    !token ||
                    !isProjectLead ||
                    normalizedStatus !==
                        "COMPLETED"
                ) {
                    if (
                        normalizedStatus !==
                        "COMPLETED"
                    ) {
                        setSubmissionStatus(
                            null
                        );
                    }

                    return;
                }


                try {
                    const response =
                        await fetch(
                            `/api/showcase/submission/${projectId}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await readResponseJson(
                            response
                        );


                    if (
                        !response.ok
                    ) {
                        return;
                    }


                    if (
                        !cancelled
                    ) {
                        setSubmissionStatus(
                            data.submission
                                ?.status ||
                            null
                        );
                    }
                }
                catch {
                    /*
                     * Showcase status failure must not
                     * block the rest of the workspace.
                     */
                }
            }


            loadSubmissionStatus();


            return () => {
                cancelled =
                    true;
            };
        },
        [
            projectId,
            token,
            isProjectLead,
            normalizedStatus
        ]
    );


    useEffect(
        () => {
            if (
                !isEditing
            ) {
                return;
            }

            if (
                editTitle.length >
                MAX_PROJECT_TITLE_LENGTH
            ) {
                setActionError(
                    `Maximum characters exceeded. Project title may not exceed ${MAX_PROJECT_TITLE_LENGTH} characters.`
                );

                setActionSuccess(
                    ""
                );

                return;
            }

            if (
                editDescription.length >
                MAX_PROJECT_DESCRIPTION_LENGTH
            ) {
                setActionError(
                    `Maximum characters exceeded. Project description may not exceed ${MAX_PROJECT_DESCRIPTION_LENGTH} characters.`
                );

                setActionSuccess(
                    ""
                );
            }
        },
        [
            isEditing,
            editTitle,
            editDescription
        ]
    );


    async function handleOpenEdit() {
        if (
            !projectId ||
            !token ||
            !isProjectLead ||
            normalizedStatus !==
                "ACTIVE" ||
            isLoadingEdit
        ) {
            return;
        }


        setActionError("");
        setActionSuccess("");
        setIsLoadingEdit(
            true
        );


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}`
                );


            const data =
                await readResponseJson(
                    response
                );


            if (
                !response.ok ||
                !data.project
            ) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Failed to load project details."
                );
            }


            const project =
                data.project;


            setEditTitle(
                project.title ||
                ""
            );


            setEditDescription(
                project.description ||
                ""
            );


            setEditCategory(
                PROJECT_CATEGORIES.includes(
                    project.category
                )
                    ? project.category
                    : "Robotics"
            );


            setEditHours(
                project.expectedHoursPerWeek ??
                project.expected_hours_per_week ??
                1
            );


            setEditRepository(
                project.repositoryUrl ||
                project.repository_url ||
                ""
            );


            setEditAllowMentorSupport(
                Boolean(
                    project.allowMentorSupport ??
                    project.allow_mentor_support ??
                    false
                )
            );


            setIsEditing(
                true
            );
        }
        catch (
            error
        ) {
            setActionError(
                error.message ||
                "Failed to load project details."
            );
        }
        finally {
            setIsLoadingEdit(
                false
            );
        }
    }


    function handleCancelEdit() {
        if (
            isSavingEdit
        ) {
            return;
        }


        setIsEditing(
            false
        );

        setActionError("");
        setActionSuccess("");
    }


    async function handleSaveEdit(
        event
    ) {
        event.preventDefault();


        if (
            !projectId ||
            !token ||
            !isProjectLead ||
            isSavingEdit
        ) {
            return;
        }


        setActionError("");
        setActionSuccess("");


        const cleanTitle =
            editTitle.trim();


        const cleanDescription =
            editDescription.trim();


        const cleanRepository =
            editRepository.trim();


        const hours =
            Number(
                editHours
            );


        if (
            !cleanTitle ||
            !cleanDescription ||
            !editCategory
        ) {
            setActionError(
                "Title, description, category and commitment hours are required."
            );

            return;
        }


        if (
            cleanTitle.length >
            MAX_PROJECT_TITLE_LENGTH
        ) {
            setActionError(
                `Maximum characters exceeded. Project title may not exceed ${MAX_PROJECT_TITLE_LENGTH} characters.`
            );

            return;
        }


        if (
            cleanDescription.length >
            MAX_PROJECT_DESCRIPTION_LENGTH
        ) {
            setActionError(
                `Maximum characters exceeded. Project description may not exceed ${MAX_PROJECT_DESCRIPTION_LENGTH} characters.`
            );

            return;
        }


        if (
            !PROJECT_CATEGORIES.includes(
                editCategory
            )
        ) {
            setActionError(
                "Please select a valid project category."
            );

            return;
        }


        if (
            !Number.isFinite(
                hours
            ) ||
            !Number.isInteger(
                hours
            ) ||
            hours < 1 ||
            hours > 168
        ) {
            setActionError(
                "Expected commitment must be a whole number between 1 and 168 hours."
            );

            return;
        }


        if (
            cleanRepository.length >
            MAX_REPOSITORY_URL_LENGTH
        ) {
            setActionError(
                `Maximum characters exceeded. Repository URL may not exceed ${MAX_REPOSITORY_URL_LENGTH} characters.`
            );

            return;
        }


        if (
            cleanRepository &&
            !getSafeRepositoryUrl(
                cleanRepository
            )
        ) {
            setActionError(
                "Repository URL must be a valid GitHub or GitLab HTTPS URL."
            );

            return;
        }


        setIsSavingEdit(
            true
        );


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                title:
                                    cleanTitle,

                                description:
                                    cleanDescription,

                                category:
                                    editCategory,

                                expectedHoursPerWeek:
                                    hours,

                                repositoryUrl:
                                    cleanRepository ||
                                    null,

                                allowMentorSupport:
                                    Boolean(
                                        editAllowMentorSupport
                                    )
                            })
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Failed to update project listing."
                );
            }


            setCurrentProjectName(
                data.project?.title ||
                cleanTitle
            );


            setCurrentRepository(
                data.project?.repositoryUrl ||
                data.project?.repository_url ||
                cleanRepository ||
                ""
            );


            setCurrentAllowMentorSupport(
                Boolean(
                    data.project?.allowMentorSupport ??
                    data.project?.allow_mentor_support ??
                    editAllowMentorSupport
                )
            );


            setIsEditing(
                false
            );


            setActionSuccess(
                "Project listing updated successfully."
            );


            await loadMentorAssignments();
        }
        catch (
            error
        ) {
            setActionError(
                error.message ||
                "Failed to update project listing."
            );
        }
        finally {
            setIsSavingEdit(
                false
            );
        }
    }


    async function handleApproveMentorAssignment(
        assignment
    ) {
        const assignmentId =
            getAssignmentId(
                assignment
            );


        if (
            !assignmentId ||
            !projectId ||
            !token ||
            !isProjectLead ||
            busyMentorAssignmentId
        ) {
            return;
        }


        if (
            !currentAllowMentorSupport
        ) {
            setActionError(
                "Enable Mentor support before approving a Mentor request."
            );

            return;
        }


        const mentorName =
            getAssignmentMentorName(
                assignment
            );


        const confirmed =
            window.confirm(
                `Approve ${mentorName} to mentor this project?`
            );


        if (
            !confirmed
        ) {
            return;
        }


        setBusyMentorAssignmentId(
            assignmentId
        );

        setActionError("");
        setActionSuccess("");


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/mentor-assignments/${assignmentId}/approve`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to approve Mentor request."
                );
            }


            setActionSuccess(
                `${mentorName} is now an active Mentor for this project.`
            );


            await loadMentorAssignments();
        }
        catch (
            error
        ) {
            setActionError(
                error.message ||
                "Unable to approve Mentor request."
            );
        }
        finally {
            setBusyMentorAssignmentId(
                ""
            );
        }
    }


    async function handleEndMentorAssignment(
        assignment
    ) {
        const assignmentId =
            getAssignmentId(
                assignment
            );


        if (
            !assignmentId ||
            !projectId ||
            !token ||
            !isProjectLead ||
            busyMentorAssignmentId
        ) {
            return;
        }


        const mentorName =
            getAssignmentMentorName(
                assignment
            );


        const confirmed =
            window.confirm(
                `End ${mentorName}'s Mentor assignment for this project?`
            );


        if (
            !confirmed
        ) {
            return;
        }


        setBusyMentorAssignmentId(
            assignmentId
        );

        setActionError("");
        setActionSuccess("");


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/mentor-assignments/${assignmentId}/end`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to end Mentor assignment."
                );
            }


            setActionSuccess(
                `${mentorName}'s Mentor assignment has ended.`
            );


            await loadMentorAssignments();
        }
        catch (
            error
        ) {
            setActionError(
                error.message ||
                "Unable to end Mentor assignment."
            );
        }
        finally {
            setBusyMentorAssignmentId(
                ""
            );
        }
    }


    async function handleCompleteProject() {
        if (
            !projectId ||
            !token ||
            !isProjectLead ||
            isCompleting
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                "Mark this project as completed? All milestones must be complete. The project will then become eligible for Showcase submission."
            );


        if (
            !confirmed
        ) {
            return;
        }


        setActionError("");
        setActionSuccess("");
        setIsCompleting(
            true
        );

try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/complete`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Failed to mark project as completed."
                );
            }

setIsEditing(
                false
            );


            setCurrentStatus(
                data.project?.status ||
                "COMPLETED"
            );


            setSubmissionStatus(
                null
            );


            setActionSuccess(
                "Project marked as completed. You can now submit it for Showcase approval."
            );
        }
        catch (
            error
        ) {
            setActionError(
                error.message ||
                "Failed to mark project as completed."
            );
        }
        finally {
            setIsCompleting(
                false
            );
        }
    }


    async function handleSubmitToShowcase() {
        if (
            !projectId ||
            !token ||
            !isProjectLead ||
            isSubmitting
        ) {
            return;
        }


        setActionError("");
        setActionSuccess("");
        setIsSubmitting(
            true
        );


        try {
            const response =
                await fetch(
                    "/api/showcase",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                projectId
                            })
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (
                !response.ok
            ) {
                const serverMessage =
                    String(
                        data.error ||
                        data.message ||
                        ""
                    );


                if (
                    response.status ===
                        409 &&
                    serverMessage
                        .toLowerCase()
                        .includes(
                            "already"
                        )
                ) {
                    const statusResponse =
                        await fetch(
                            `/api/showcase/submission/${projectId}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const statusData =
                        await readResponseJson(
                            statusResponse
                        );


                    if (
                        statusResponse.ok
                    ) {
                        setSubmissionStatus(
                            statusData
                                .submission
                                ?.status ||
                            "PENDING"
                        );
                    }


                    setActionSuccess(
                        "This project has already been submitted for Showcase review."
                    );

                    return;
                }


                throw new Error(
                    serverMessage ||
                    "Failed to submit project to the Showcase."
                );
            }


            setSubmissionStatus(
                data.submission
                    ?.status ||
                "PENDING"
            );


            setActionSuccess(
                "Project submitted successfully and is awaiting administrator approval."
            );
        }
        catch (
            error
        ) {
            setActionError(
                error.message ||
                "Failed to submit project to the Showcase."
            );
        }
        finally {
            setIsSubmitting(
                false
            );
        }
    }


    const currentMentorAssignments =
        mentorAssignments.filter(
            assignment => {
                const assignmentStatus =
                    getAssignmentStatus(
                        assignment
                    );


                return (
                    assignmentStatus ===
                        "PENDING" ||
                    assignmentStatus ===
                        "ACTIVE"
                );
            }
        );


    return (
        <section className="workspace-header">

            <div className="workspace-header-main">

                <div>

                    <p className="workspace-label">
                        PROJECT WORKSPACE
                    </p>


                    <h1>
                        {currentProjectName}
                    </h1>


                    <p className="workspace-subtitle">
                        Manage project progress,
                        tasks and team activity.
                    </p>

                </div>


                <span className="status">
                    {currentStatus}
                </span>

            </div>


            <div className="workspace-header-details">

                <div>

                    <span>
                        Lead
                    </span>

                    <strong>
                        {lead}
                    </strong>

                </div>


                <div>

                    <span>
                        Team
                    </span>

                    <strong>
                        {teamSize}
                        {" "}
                        {
                            teamSize ===
                            1
                                ? "member"
                                : "members"
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        Repository
                    </span>


                    {hasRepository ? (

                        <a
                            href={
                                safeRepositoryUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open Repository
                        </a>

                    ) : (

                        <strong>
                            Not provided
                        </strong>

                    )}

                </div>

            </div>


            {isProjectLead && (

                <div
                    style={
                        projectActionsStyle
                    }
                >

                    <div>

                        <strong>
                            Project Lead Controls
                        </strong>


                        <p
                            style={
                                actionDescriptionStyle
                            }
                        >
                            Edit the active project
                            listing or complete the
                            project and submit it for
                            Showcase approval.
                        </p>

                    </div>


                    <div
                        style={
                            actionButtonsStyle
                        }
                    >

                        {normalizedStatus ===
                            "ACTIVE" && (

                            <button
                                type="button"
                                className="button button-secondary"
                                onClick={
                                    handleOpenEdit
                                }
                                disabled={
                                    isLoadingEdit ||
                                    isCompleting ||
                                    isSavingEdit
                                }
                            >
                                {
                                    isLoadingEdit
                                        ? "Loading..."
                                        : "Edit Project Listing"
                                }
                            </button>

                        )}


                        {normalizedStatus ===
                            "ACTIVE" && (

                            <button
                                type="button"
                                className="button button-secondary"
                                onClick={
                                    handleCompleteProject
                                }
                                disabled={
                                    isCompleting ||
                                    isLoadingEdit ||
                                    isSavingEdit
                                }
                            >
                                {
                                    isCompleting
                                        ? "Completing..."
                                        : "Mark Project Complete"
                                }
                            </button>

                        )}


                        {normalizedStatus ===
                            "COMPLETED" &&
                            !normalizedSubmissionStatus && (

                            <button
                                type="button"
                                className="button"
                                onClick={
                                    handleSubmitToShowcase
                                }
                                disabled={
                                    isSubmitting
                                }
                            >
                                {
                                    isSubmitting
                                        ? "Submitting..."
                                        : "Submit to Showcase"
                                }
                            </button>

                        )}


                        {normalizedSubmissionStatus ===
                            "PENDING" && (

                            <span
                                style={
                                    pendingBadgeStyle
                                }
                            >
                                Awaiting Showcase Approval
                            </span>

                        )}


                        {normalizedSubmissionStatus ===
                            "APPROVED" && (

                            <span
                                style={
                                    publishedBadgeStyle
                                }
                            >
                                Approved for Showcase
                            </span>

                        )}

                    </div>

                </div>

            )}


            {isProjectLead &&
                normalizedStatus ===
                    "ACTIVE" && (

                <div
                    style={
                        mentorPanelStyle
                    }
                >

                    <div
                        style={
                            mentorPanelHeaderStyle
                        }
                    >

                        <div>

                            <strong>
                                Mentor Support
                            </strong>


                            <p
                                style={
                                    actionDescriptionStyle
                                }
                            >
                                Review Mentor requests
                                and manage active Mentor
                                assignments.
                            </p>

                        </div>


                        <span
                            style={
                                currentAllowMentorSupport
                                    ? mentorEnabledBadgeStyle
                                    : mentorDisabledBadgeStyle
                            }
                        >
                            {
                                currentAllowMentorSupport
                                    ? "Mentor Support Enabled"
                                    : "Mentor Support Disabled"
                            }
                        </span>

                    </div>


                    {!currentAllowMentorSupport && (

                        <p
                            style={
                                mentorNoticeStyle
                            }
                        >
                            Approved Mentors cannot request
                            new access while Mentor support
                            is disabled. Use Edit Project
                            Listing to enable it.
                        </p>

                    )}


                    {mentorAssignmentError && (

                        <p
                            className="error"
                            role="alert"
                            style={
                                actionMessageStyle
                            }
                        >
                            {mentorAssignmentError}
                        </p>

                    )}


                    {mentorAssignmentsLoading ? (

                        <p
                            style={
                                mentorNoticeStyle
                            }
                        >
                            Loading Mentor requests...
                        </p>

                    ) : currentMentorAssignments
                        .length === 0 ? (

                        <p
                            style={
                                mentorNoticeStyle
                            }
                        >
                            No pending or active Mentor
                            assignments.
                        </p>

                    ) : (

                        <div
                            style={
                                mentorAssignmentsListStyle
                            }
                        >

                            {currentMentorAssignments.map(
                                assignment => {

                                    const assignmentId =
                                        getAssignmentId(
                                            assignment
                                        );


                                    const assignmentStatus =
                                        getAssignmentStatus(
                                            assignment
                                        );


                                    const mentorName =
                                        getAssignmentMentorName(
                                            assignment
                                        );


                                    const mentorEmail =
                                        getAssignmentMentorEmail(
                                            assignment
                                        );


                                    const requestedAt =
                                        getAssignmentRequestedAt(
                                            assignment
                                        );


                                    const isBusy =
                                        busyMentorAssignmentId ===
                                        assignmentId;


                                    return (
                                        <div
                                            key={
                                                assignmentId
                                            }
                                            style={
                                                mentorAssignmentCardStyle
                                            }
                                        >

                                            <div>

                                                <div
                                                    style={
                                                        mentorAssignmentTopStyle
                                                    }
                                                >

                                                    <strong>
                                                        {mentorName}
                                                    </strong>


                                                    <span
                                                        style={
                                                            assignmentStatus ===
                                                            "ACTIVE"
                                                                ? activeMentorBadgeStyle
                                                                : pendingMentorBadgeStyle
                                                        }
                                                    >
                                                        {
                                                            assignmentStatus
                                                        }
                                                    </span>

                                                </div>


                                                {mentorEmail && (

                                                    <p
                                                        style={
                                                            mentorSmallTextStyle
                                                        }
                                                    >
                                                        {mentorEmail}
                                                    </p>

                                                )}


                                                <p
                                                    style={
                                                        mentorSmallTextStyle
                                                    }
                                                >
                                                    Requested:{" "}
                                                    {
                                                        formatDate(
                                                            requestedAt
                                                        )
                                                    }
                                                </p>

                                            </div>


                                            <div
                                                style={
                                                    actionButtonsStyle
                                                }
                                            >

                                                {assignmentStatus ===
                                                    "PENDING" && (

                                                    <button
                                                        type="button"
                                                        className="button"
                                                        disabled={
                                                            isBusy ||
                                                            !currentAllowMentorSupport
                                                        }
                                                        onClick={() =>
                                                            handleApproveMentorAssignment(
                                                                assignment
                                                            )
                                                        }
                                                    >
                                                        {
                                                            isBusy
                                                                ? "Approving..."
                                                                : currentAllowMentorSupport
                                                                    ? "Approve Mentor"
                                                                    : "Enable Mentor Support First"
                                                        }
                                                    </button>

                                                )}


                                                {assignmentStatus ===
                                                    "ACTIVE" && (

                                                    <button
                                                        type="button"
                                                        className="button button-secondary"
                                                        disabled={
                                                            isBusy
                                                        }
                                                        onClick={() =>
                                                            handleEndMentorAssignment(
                                                                assignment
                                                            )
                                                        }
                                                    >
                                                        {
                                                            isBusy
                                                                ? "Ending..."
                                                                : "End Mentor Assignment"
                                                        }
                                                    </button>

                                                )}

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    )}

                </div>

            )}


            {isProjectLead &&
                isEditing &&
                normalizedStatus ===
                    "ACTIVE" && (

                <form
                    onSubmit={
                        handleSaveEdit
                    }
                    style={
                        editPanelStyle
                    }
                >

                    <div
                        style={
                            editHeaderStyle
                        }
                    >

                        <strong>
                            Edit Project Listing
                        </strong>


                        <p
                            style={
                                actionDescriptionStyle
                            }
                        >
                            Update the public
                            project details and
                            Mentor-support preference.
                        </p>

                    </div>


                    <div
                        style={
                            editGridStyle
                        }
                    >

                        <div
                            style={
                                fieldGroupStyle
                            }
                        >

                            <label
                                htmlFor="edit-project-title"
                                style={
                                    labelStyle
                                }
                            >
                                Project Title *
                            </label>


                            <input
                                id="edit-project-title"
                                type="text"
                                required
                                value={
                                    editTitle
                                }
                                onChange={
                                    event =>
                                        setEditTitle(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                style={
                                    inputStyle
                                }
                            />


                            <span
                                style={
                                    helperTextStyle
                                }
                            >
                                {
                                    editTitle.length
                                }/
                                {
                                    MAX_PROJECT_TITLE_LENGTH
                                }
                            </span>

                        </div>


                        <div
                            style={
                                fieldGroupStyle
                            }
                        >

                            <label
                                htmlFor="edit-project-category"
                                style={
                                    labelStyle
                                }
                            >
                                Category *
                            </label>


                            <select
                                id="edit-project-category"
                                value={
                                    editCategory
                                }
                                onChange={
                                    event =>
                                        setEditCategory(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                style={
                                    inputStyle
                                }
                            >

                                {PROJECT_CATEGORIES.map(
                                    category => (

                                        <option
                                            key={
                                                category
                                            }
                                            value={
                                                category
                                            }
                                        >
                                            {category}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        <div
                            style={
                                fieldGroupStyle
                            }
                        >

                            <label
                                htmlFor="edit-project-hours"
                                style={
                                    labelStyle
                                }
                            >
                                Expected Hours/Week *
                            </label>


                            <input
                                id="edit-project-hours"
                                type="number"
                                min="1"
                                max="168"
                                step="1"
                                required
                                value={
                                    editHours
                                }
                                onChange={
                                    event =>
                                        setEditHours(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                style={
                                    inputStyle
                                }
                            />

                        </div>

                    </div>


                    <div
                        style={
                            fieldGroupStyle
                        }
                    >

                        <label
                            htmlFor="edit-project-description"
                            style={
                                labelStyle
                            }
                        >
                            Description *
                        </label>


                        <textarea
                            id="edit-project-description"
                            required
                            value={
                                editDescription
                            }
                            onChange={
                                event =>
                                    setEditDescription(
                                        event
                                            .target
                                            .value
                                    )
                            }
                            style={{
                                ...inputStyle,
                                minHeight:
                                    "95px",
                                resize:
                                    "vertical"
                            }}
                        />


                        <span
                            style={
                                helperTextStyle
                            }
                        >
                            {
                                editDescription.length
                            }/
                            {
                                MAX_PROJECT_DESCRIPTION_LENGTH
                            }
                        </span>

                    </div>


                    <div
                        style={
                            fieldGroupStyle
                        }
                    >

                        <label
                            htmlFor="edit-project-repository"
                            style={
                                labelStyle
                            }
                        >
                            Repository URL
                            {" "}
                            (Optional)
                        </label>


                        <input
                            id="edit-project-repository"
                            type="url"
                            maxLength={
                                MAX_REPOSITORY_URL_LENGTH
                            }
                            value={
                                editRepository
                            }
                            onChange={
                                event =>
                                    setEditRepository(
                                        event
                                            .target
                                            .value
                                    )
                            }
                            placeholder="https://github.com/your-org/your-repo"
                            style={
                                inputStyle
                            }
                        />


                        <span
                            style={
                                helperTextStyle
                            }
                        >
                            {editRepository.length}/
                            {MAX_REPOSITORY_URL_LENGTH}
                            {" "}characters
                        </span>

                    </div>


                    <div
                        style={
                            mentorEditOptionStyle
                        }
                    >

                        <label
                            htmlFor="edit-allow-mentor-support"
                            style={
                                mentorCheckboxLabelStyle
                            }
                        >

                            <input
                                id="edit-allow-mentor-support"
                                type="checkbox"
                                checked={
                                    editAllowMentorSupport
                                }
                                onChange={
                                    event =>
                                        setEditAllowMentorSupport(
                                            event
                                                .target
                                                .checked
                                        )
                                }
                            />


                            <span>

                                <strong>
                                    Allow approved Mentors
                                    to support this project
                                </strong>


                                <span
                                    style={
                                        mentorCheckboxTextStyle
                                    }
                                >
                                    Approved Mentors may
                                    discover the project
                                    and request a Mentor
                                    assignment. Project
                                    Leads still approve
                                    each request.
                                </span>

                            </span>

                        </label>

                    </div>


                    <div
                        style={
                            editButtonsStyle
                        }
                    >

                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={
                                handleCancelEdit
                            }
                            disabled={
                                isSavingEdit
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="button"
                            disabled={
                                isSavingEdit ||
                                editTitle.length >
                                    MAX_PROJECT_TITLE_LENGTH ||
                                editDescription.length >
                                    MAX_PROJECT_DESCRIPTION_LENGTH ||
                                editRepository.length >
                                    MAX_REPOSITORY_URL_LENGTH
                            }
                        >
                            {
                                isSavingEdit
                                    ? "Saving..."
                                    : "Save Changes"
                            }
                        </button>

                    </div>

                </form>

            )}


            {actionError && (

                <p
                    className="error"
                    role="alert"
                    style={
                        actionMessageStyle
                    }
                >
                    {actionError}
                </p>

            )}


            {actionSuccess && (

                <p
                    role="status"
                    style={
                        actionSuccessStyle
                    }
                >
                    {actionSuccess}
                </p>

            )}

        </section>
    );
}


const projectActionsStyle = {
    marginTop:
        "18px",

    paddingTop:
        "16px",

    borderTop:
        "1px solid rgba(255,255,255,0.10)",

    display:
        "flex",

    justifyContent:
        "space-between",

    alignItems:
        "center",

    gap:
        "18px",

    flexWrap:
        "wrap"
};


const actionDescriptionStyle = {
    margin:
        "5px 0 0",

    opacity:
        0.7,

    fontSize:
        "13px"
};


const actionButtonsStyle = {
    display:
        "flex",

    alignItems:
        "center",

    gap:
        "10px",

    flexWrap:
        "wrap"
};


const mentorPanelStyle = {
    marginTop:
        "18px",

    padding:
        "16px",

    borderTop:
        "1px solid rgba(255,255,255,0.10)",

    borderRadius:
        "8px",

    background:
        "rgba(8,17,31,0.32)"
};


const mentorPanelHeaderStyle = {
    display:
        "flex",

    alignItems:
        "center",

    justifyContent:
        "space-between",

    gap:
        "12px",

    flexWrap:
        "wrap"
};


const mentorEnabledBadgeStyle = {
    display:
        "inline-flex",

    padding:
        "7px 10px",

    borderRadius:
        "999px",

    fontSize:
        "11px",

    fontWeight:
        700,

    border:
        "1px solid rgba(73,214,156,0.35)"
};


const mentorDisabledBadgeStyle = {
    display:
        "inline-flex",

    padding:
        "7px 10px",

    borderRadius:
        "999px",

    fontSize:
        "11px",

    fontWeight:
        700,

    opacity:
        0.65,

    border:
        "1px solid rgba(255,255,255,0.14)"
};


const mentorNoticeStyle = {
    margin:
        "12px 0 0",

    opacity:
        0.72,

    fontSize:
        "13px"
};


const mentorAssignmentsListStyle = {
    display:
        "grid",

    gap:
        "10px",

    marginTop:
        "14px"
};


const mentorAssignmentCardStyle = {
    display:
        "flex",

    alignItems:
        "center",

    justifyContent:
        "space-between",

    gap:
        "14px",

    flexWrap:
        "wrap",

    padding:
        "12px",

    borderRadius:
        "8px",

    border:
        "1px solid rgba(255,255,255,0.10)",

    background:
        "rgba(16,26,43,0.70)"
};


const mentorAssignmentTopStyle = {
    display:
        "flex",

    alignItems:
        "center",

    gap:
        "9px",

    flexWrap:
        "wrap"
};


const activeMentorBadgeStyle = {
    padding:
        "4px 7px",

    borderRadius:
        "999px",

    fontSize:
        "10px",

    fontWeight:
        800,

    border:
        "1px solid rgba(73,214,156,0.35)"
};


const pendingMentorBadgeStyle = {
    padding:
        "4px 7px",

    borderRadius:
        "999px",

    fontSize:
        "10px",

    fontWeight:
        800,

    border:
        "1px solid rgba(255,255,255,0.16)",

    opacity:
        0.8
};


const mentorSmallTextStyle = {
    margin:
        "5px 0 0",

    fontSize:
        "12px",

    opacity:
        0.68
};


const editPanelStyle = {
    marginTop:
        "18px",

    padding:
        "18px",

    borderRadius:
        "10px",

    border:
        "1px solid rgba(90,184,255,0.24)",

    background:
        "rgba(8,17,31,0.55)"
};


const editHeaderStyle = {
    marginBottom:
        "16px"
};


const editGridStyle = {
    display:
        "grid",

    gridTemplateColumns:
        "minmax(220px, 2fr) minmax(170px, 1fr) minmax(160px, 1fr)",

    gap:
        "12px"
};


const fieldGroupStyle = {
    display:
        "flex",

    flexDirection:
        "column",

    marginBottom:
        "14px"
};


const labelStyle = {
    marginBottom:
        "6px",

    fontSize:
        "12px",

    fontWeight:
        700
};


const inputStyle = {
    width:
        "100%",

    boxSizing:
        "border-box",

    padding:
        "10px 11px",

    borderRadius:
        "8px",

    border:
        "1px solid #33445e",

    background:
        "#101a2b",

    color:
        "#f5f8fc",

    outline:
        "none"
};


const helperTextStyle = {
    marginTop:
        "5px",

    fontSize:
        "11px",

    opacity:
        0.62
};


const mentorEditOptionStyle = {
    marginBottom:
        "16px",

    padding:
        "12px",

    borderRadius:
        "8px",

    border:
        "1px solid rgba(90,184,255,0.18)",

    background:
        "rgba(40,183,238,0.045)"
};


const mentorCheckboxLabelStyle = {
    display:
        "flex",

    alignItems:
        "flex-start",

    gap:
        "10px",

    cursor:
        "pointer",

    fontSize:
        "13px"
};


const mentorCheckboxTextStyle = {
    display:
        "block",

    marginTop:
        "4px",

    opacity:
        0.68,

    lineHeight:
        1.45
};


const editButtonsStyle = {
    display:
        "flex",

    justifyContent:
        "flex-end",

    gap:
        "10px"
};


const pendingBadgeStyle = {
    display:
        "inline-flex",

    alignItems:
        "center",

    padding:
        "9px 13px",

    borderRadius:
        "8px",

    border:
        "1px solid rgba(255,255,255,0.14)",

    fontWeight:
        600,

    opacity:
        0.85
};


const publishedBadgeStyle = {
    display:
        "inline-flex",

    alignItems:
        "center",

    padding:
        "9px 13px",

    borderRadius:
        "8px",

    border:
        "1px solid rgba(255,255,255,0.14)",

    fontWeight:
        600
};


const actionMessageStyle = {
    marginTop:
        "12px",

    marginBottom:
        0
};


const actionSuccessStyle = {
    marginTop:
        "12px",

    marginBottom:
        0,

    fontWeight:
        600
};


export default ProjectWorkspaceHeader;
