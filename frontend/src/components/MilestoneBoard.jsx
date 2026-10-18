import {
    useCallback,
    useEffect,
    useState
} from "react";

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import {
    useAuth
} from "../context/AuthContext";

import "./MilestoneBoard.css";

const MAX_MILESTONE_TITLE_LENGTH =
    120;

const MAX_MILESTONE_DESCRIPTION_LENGTH =
    1000;


function MilestoneBoard({
    projectId
}) {
    const {
        token
    } = useAuth();


    const [
        milestones,
        setMilestones
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        showForm,
        setShowForm
    ] = useState(false);


    const [
        title,
        setTitle
    ] = useState("");


    const [
        description,
        setDescription
    ] = useState("");


    const [
        dueDate,
        setDueDate
    ] = useState("");


    const [
        error,
        setError
    ] = useState("");


    const [
        actionFeedbackActive,
        setActionFeedbackActive
    ] = useState(false);


    useAutoDismissFeedback(
        actionFeedbackActive &&
            Boolean(
                error
            ),
        () => {
            setError("");
            setActionFeedbackActive(
                false
            );
        }
    );


    const [
        isSubmitting,
        setIsSubmitting
    ] = useState(false);


    const [
        updatingMilestoneId,
        setUpdatingMilestoneId
    ] = useState(null);


    useEffect(
        () => {
            if (
                title.length >
                MAX_MILESTONE_TITLE_LENGTH
            ) {
                setError(
                    `Maximum characters exceeded. Milestone title may not exceed ${MAX_MILESTONE_TITLE_LENGTH} characters.`
                );

                setActionFeedbackActive(
                    true
                );

                return;
            }

            if (
                description.length >
                MAX_MILESTONE_DESCRIPTION_LENGTH
            ) {
                setError(
                    `Maximum characters exceeded. Milestone description may not exceed ${MAX_MILESTONE_DESCRIPTION_LENGTH} characters.`
                );

                setActionFeedbackActive(
                    true
                );
            }
        },
        [
            title,
            description
        ]
    );


    const loadMilestones =
        useCallback(
            async () => {
                // MILESTONE_LOAD_FEEDBACK
                setActionFeedbackActive(
                    false
                );
                if (
                    !projectId
                ) {
                    setMilestones(
                        []
                    );

                    setLoading(
                        false
                    );

                    setError(
                        "Select a project to view milestones."
                    );

                    return;
                }


                if (
                    !token
                ) {
                    setMilestones(
                        []
                    );

                    setLoading(
                        false
                    );

                    setError(
                        "Please log in to view project milestones."
                    );

                    return;
                }


                setLoading(
                    true
                );

                setError(
                    ""
                );


                try {
                    const response =
                        await fetch(
                            `/api/projects/${projectId}/milestones`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await response
                            .json();


                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data.error ||
                            data.message ||
                            "Failed to load milestones."
                        );
                    }


                    setMilestones(
                        Array.isArray(
                            data.milestones
                        )
                            ? data.milestones
                            : []
                    );
                } catch (
                    err
                ) {
                    setMilestones(
                        []
                    );

                    setError(
                        err.message ||
                        "Network error loading milestones."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                projectId,
                token
            ]
        );


    useEffect(
        () => {
            loadMilestones();
        },
        [
            loadMilestones
        ]
    );


    async function createMilestone(
        event
    ) {
        event.preventDefault();

        setActionFeedbackActive(
            true
        );

        if (
            title.length >
            MAX_MILESTONE_TITLE_LENGTH
        ) {
            setError(
                `Maximum characters exceeded. Milestone title may not exceed ${MAX_MILESTONE_TITLE_LENGTH} characters.`
            );

            return;
        }

        if (
            description.length >
            MAX_MILESTONE_DESCRIPTION_LENGTH
        ) {
            setError(
                `Maximum characters exceeded. Milestone description may not exceed ${MAX_MILESTONE_DESCRIPTION_LENGTH} characters.`
            );

            return;
        }


        if (
            !title.trim()
        ) {
            return;
        }


        // MILESTONE_CREATE_ACTION_FEEDBACK
        setActionFeedbackActive(
            true
        );


        if (
            !projectId
        ) {
            setError(
                "Select a project before creating a milestone."
            );

            return;
        }


        setError(
            ""
        );

        setIsSubmitting(
            true
        );


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/milestones`,
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
                                title:
                                    title.trim(),

                                description:
                                    description.trim(),

                                dueDate:
                                    dueDate ||
                                    null
                            })
                    }
                );


            const data =
                await response
                    .json();


            if (
                !response.ok
            ) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Failed to create milestone."
                );
            }


            setMilestones(
                current => [
                    ...current,
                    data.milestone
                ]
            );


            setTitle(
                ""
            );

            setDescription(
                ""
            );

            setDueDate(
                ""
            );

            setShowForm(
                false
            );
        // MILESTONE_CREATE_SUCCESS_FEEDBACK
        setActionFeedbackActive(
            false
        );


        } catch (
            err
        ) {
            setError(
                err.message ||
                "Network error creating milestone."
            );
        } finally {
            setIsSubmitting(
                false
            );
        }
    }


    async function changeMilestoneStatus(
        milestoneId,
        newStatus
    ) {
        if (
            !projectId ||
            !token ||
            updatingMilestoneId ===
                milestoneId
        ) {
            return;
        }


        if (
            newStatus !==
                "OPEN" &&
            newStatus !==
                "COMPLETE"
        ) {
            return;
        }


        const existingMilestone =
            milestones.find(
                milestone =>
                    milestone
                        .milestone_id ===
                    milestoneId
            );


        if (
            !existingMilestone
        ) {
            return;
        }


        if (
            existingMilestone
                .status ===
            newStatus
        ) {
            return;
        }


        const isCompleting =
            newStatus ===
            "COMPLETE";


        const action =
            isCompleting
                ? "close"
                : "reopen";


        const failureMessage =
            isCompleting
                ? "Failed to close milestone."
                : "Failed to reopen milestone.";


        const networkFailureMessage =
            isCompleting
                ? "Network error closing milestone."
                : "Network error reopening milestone.";


        // MILESTONE_STATUS_ACTION_FEEDBACK
        setActionFeedbackActive(
            true
        );


        setError(
            ""
        );


        setUpdatingMilestoneId(
            milestoneId
        );


        const previousMilestones =
            [...milestones];


        /*
         * Optimistically update the interface so the
         * state change feels immediate.
         *
         * If the server rejects the operation, the
         * previous milestone state is restored.
         */
        setMilestones(
            current =>
                current.map(
                    milestone =>
                        milestone
                            .milestone_id ===
                        milestoneId
                            ? {
                                ...milestone,

                                status:
                                    newStatus
                            }
                            : milestone
                )
        );


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/milestones/${milestoneId}/${action}`,
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
                await response
                    .json();


            if (
                !response.ok
            ) {
                setMilestones(
                    previousMilestones
                );


                throw new Error(
                    data.message ||
                    data.error ||
                    failureMessage
                );
            }


            if (
                data.milestone
            ) {
                setMilestones(
                    current =>
                        current.map(
                            milestone =>
                                milestone
                                    .milestone_id ===
                                milestoneId
                                    ? data.milestone
                                    : milestone
                        )
                );
            }
        // MILESTONE_STATUS_SUCCESS_FEEDBACK
        setActionFeedbackActive(
            false
        );


        } catch (
            err
        ) {
            setMilestones(
                previousMilestones
            );


            setError(
                err.message ||
                networkFailureMessage
            );
        } finally {
            setUpdatingMilestoneId(
                null
            );
        }
    }


    if (
        loading
    ) {
        return (
            <section
                className="milestone-board"
            >
                <div
                    className="milestone-empty"
                >
                    Loading milestones...
                </div>
            </section>
        );
    }


    return (
        <section
            className="milestone-board"
        >
            <div
                className="milestone-actions"
            >
                <button
                    type="button"
                    className={
                        showForm
                            ? "milestone-btn-secondary"
                            : "milestone-btn-primary"
                    }
                    onClick={() =>
                        setShowForm(
                            !showForm
                        )
                    }
                    disabled={
                        !projectId
                    }
                >
                    {
                        showForm
                            ? "Cancel"
                            : "Add Milestone"
                    }
                </button>
            </div>


            {
                error &&
                !error.startsWith(
                    "Maximum characters exceeded."
                ) && (
                    <div
                        className="milestone-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )
            }


            {
                showForm && (
                    <form
                        className="milestone-form"
                        onSubmit={
                            createMilestone
                        }
                    >
                        <div
                            className="milestone-form-row"
                        >
                            <input
                                type="text"
                                placeholder="Milestone title..."
                                value={
                                    title
                                }
                                onChange={
                                    event =>
                                        setTitle(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                required
                                aria-label="Milestone title"
                            />


                            <input
                                type="date"
                                value={
                                    dueDate
                                }
                                onChange={
                                    event =>
                                        setDueDate(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                aria-label="Milestone due date"
                            />
                        </div>


                        <p className="muted">
                            {title.length}/
                            {MAX_MILESTONE_TITLE_LENGTH}
                            {" "}characters in milestone title
                        </p>


                        <textarea
                            placeholder="Milestone description..."
                            value={
                                description
                            }
                            onChange={
                                event =>
                                    setDescription(
                                        event
                                            .target
                                            .value
                                    )
                            }
                            required
                            aria-label="Milestone description"
                        />


                        <p className="muted">
                            {description.length}/
                            {MAX_MILESTONE_DESCRIPTION_LENGTH}
                            {" "}characters in milestone description
                        </p>


                        <div
                            className="milestone-form-footer"
                        >
                            <button
                                type="submit"
                                className="milestone-btn-primary"
                                disabled={
                                    isSubmitting ||
                                    title.length >
                                        MAX_MILESTONE_TITLE_LENGTH ||
                                    description.length >
                                        MAX_MILESTONE_DESCRIPTION_LENGTH
                                }
                            >
                                {
                                    isSubmitting
                                        ? "Creating..."
                                        : "Create Milestone"
                                }
                            </button>


                            {
                                title.length >
                                MAX_MILESTONE_TITLE_LENGTH ? (
                                    <div
                                        className="milestone-error"
                                        role="alert"
                                    >
                                        {`Maximum characters exceeded. Milestone title may not exceed ${MAX_MILESTONE_TITLE_LENGTH} characters.`}
                                    </div>
                                ) :
                                description.length >
                                MAX_MILESTONE_DESCRIPTION_LENGTH ? (
                                    <div
                                        className="milestone-error"
                                        role="alert"
                                    >
                                        {`Maximum characters exceeded. Milestone description may not exceed ${MAX_MILESTONE_DESCRIPTION_LENGTH} characters.`}
                                    </div>
                                ) :
                                null
                            }
                        </div>
                    </form>
                )
            }


            {
                milestones.length ===
                0
                    ? (
                        <div
                            className="milestone-empty"
                        >
                            No milestones have been
                            created for this project yet.
                        </div>
                    )
                    : (
                        <div
                            className="milestone-list"
                        >
                            {
                                milestones.map(
                                    milestone => (
                                        <div
                                            className="milestone-card"
                                            key={
                                                milestone
                                                    .milestone_id
                                            }
                                        >
                                            <div
                                                className="milestone-info"
                                            >
                                                <strong>
                                                    {
                                                        milestone
                                                            .title
                                                    }
                                                </strong>


                                                <p>
                                                    {
                                                        milestone
                                                            .description ||
                                                        "No description provided."
                                                    }
                                                </p>


                                                <small>
                                                    {
                                                        milestone
                                                            .due_date
                                                            ? `Due ${milestone.due_date}`
                                                            : "No due date"
                                                    }
                                                </small>
                                            </div>


                                            <select
                                                value={
                                                    milestone
                                                        .status
                                                }
                                                onChange={
                                                    event =>
                                                        changeMilestoneStatus(
                                                            milestone
                                                                .milestone_id,

                                                            event
                                                                .target
                                                                .value
                                                        )
                                                }
                                                aria-label={
                                                    `Change status for ${milestone.title}`
                                                }
                                                aria-busy={
                                                    updatingMilestoneId ===
                                                    milestone
                                                        .milestone_id
                                                }
                                            >
                                                <option
                                                    value="OPEN"
                                                >
                                                    Open
                                                </option>

                                                <option
                                                    value="COMPLETE"
                                                >
                                                    Complete
                                                </option>
                                            </select>
                                        </div>
                                    )
                                )
                            }
                        </div>
                    )
            }
        </section>
    );
}


export default MilestoneBoard;
