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

import "./TeamRadioAlert.css";

const MAX_TEAM_RADIO_MESSAGE_LENGTH =
    1000;


function TeamRadioAlert({
    projectId
}) {
    const {
        token
    } = useAuth();


    const [
        requests,
        setRequests
    ] = useState([]);


    const [
        message,
        setMessage
    ] = useState("");


    const [
        category,
        setCategory
    ] = useState(
        "TECHNICAL"
    );


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
        isLoading,
        setIsLoading
    ] = useState(true);


    const [
        isSubmitting,
        setIsSubmitting
    ] = useState(false);


    const [
        updatingRequestId,
        setUpdatingRequestId
    ] = useState(null);


    useEffect(
        () => {
            if (
                message.length >
                MAX_TEAM_RADIO_MESSAGE_LENGTH
            ) {
                setError(
                    `Maximum characters exceeded. Assistance request message may not exceed ${MAX_TEAM_RADIO_MESSAGE_LENGTH} characters.`
                );

                setActionFeedbackActive(
                    true
                );
            }
        },
        [
            message
        ]
    );


    const loadRequests =
        useCallback(
            async (
                showLoading = true
            ) => {
                // TEAM_RADIO_LOAD_FEEDBACK
                setActionFeedbackActive(
                    false
                );
                if (
                    !projectId
                ) {
                    setRequests(
                        []
                    );

                    setError(
                        "Select a project to view Team Radio."
                    );

                    setIsLoading(
                        false
                    );

                    return;
                }


                if (
                    !token
                ) {
                    setRequests(
                        []
                    );

                    setError(
                        "Please log in to view Team Radio."
                    );

                    setIsLoading(
                        false
                    );

                    return;
                }


                if (
                    showLoading
                ) {
                    setIsLoading(
                        true
                    );
                }


                setError(
                    ""
                );


                try {
                    const response =
                        await fetch(
                            `/api/projects/${projectId}/assistance-requests`,
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
                            data.message ||
                            data.error ||
                            "Failed to load assistance requests."
                        );
                    }


                    setRequests(
                        Array.isArray(
                            data.requests
                        )
                            ? data.requests
                            : []
                    );
                } catch (
                    err
                ) {
                    setRequests(
                        []
                    );

                    setError(
                        err.message ||
                        "Network error loading assistance requests."
                    );
                } finally {
                    if (
                        showLoading
                    ) {
                        setIsLoading(
                            false
                        );
                    }
                }
            },
            [
                projectId,
                token
            ]
        );


    useEffect(
        () => {
            loadRequests();
        },
        [
            loadRequests
        ]
    );


    async function submitRequest(
        event
    ) {
        event.preventDefault();

        if (
            message.length >
            MAX_TEAM_RADIO_MESSAGE_LENGTH
        ) {
            setActionFeedbackActive(
                true
            );

            setError(
                `Maximum characters exceeded. Assistance request message may not exceed ${MAX_TEAM_RADIO_MESSAGE_LENGTH} characters.`
            );

            return;
        }


        if (
            !message.trim() ||
            !projectId ||
            !token
        ) {
            return;
        }


        // TEAM_RADIO_SUBMIT_ACTION_FEEDBACK
        setActionFeedbackActive(
            true
        );


        setError(
            ""
        );

        setIsSubmitting(
            true
        );


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/assistance-requests`,
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
                                category,

                                message:
                                    message.trim()
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
                    "Failed to submit assistance request."
                );
            }


            setMessage(
                ""
            );

            setCategory(
                "TECHNICAL"
            );


            /*
             * Reload from the server rather than inventing
             * the author's display name in the frontend.
             */
            // TEAM_RADIO_SUBMIT_RELOAD_FEEDBACK
            setActionFeedbackActive(
                false
            );


            await loadRequests(
                false
            );
        } catch (
            err
        ) {
            setError(
                err.message ||
                "Network error submitting assistance request."
            );
        } finally {
            setIsSubmitting(
                false
            );
        }
    }


    async function changeRequestStatus(
        requestId,
        action
    ) {
        if (
            !projectId ||
            !token ||
            !requestId
        ) {
            return;
        }


        if (
            action !==
                "resolve" &&
            action !==
                "reopen"
        ) {
            return;
        }


        const targetStatus =
            action ===
            "resolve"
                ? "RESOLVED"
                : "OPEN";


        const previousRequests =
            [...requests];


        // TEAM_RADIO_STATUS_ACTION_FEEDBACK
        setActionFeedbackActive(
            true
        );


        setError(
            ""
        );

        setUpdatingRequestId(
            requestId
        );


        /*
         * Optimistically update the request so the
         * interface responds immediately.
         */
        setRequests(
            current =>
                current.map(
                    request =>
                        request.radio_id ===
                        requestId
                            ? {
                                ...request,

                                status:
                                    targetStatus
                            }
                            : request
                )
        );


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/assistance-requests/${requestId}/${action}`,
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
                setRequests(
                    previousRequests
                );


                throw new Error(
                    data.message ||
                    data.error ||
                    (
                        action ===
                        "resolve"
                            ? "Failed to resolve assistance request."
                            : "Failed to reopen assistance request."
                    )
                );
            }


            /*
             * Reload from the backend so the frontend always
             * reflects the authoritative stored request.
             */
            // TEAM_RADIO_STATUS_RELOAD_FEEDBACK
            setActionFeedbackActive(
                false
            );


            await loadRequests(
                false
            );
        } catch (
            err
        ) {
            setRequests(
                previousRequests
            );


            setError(
                err.message ||
                (
                    action ===
                    "resolve"
                        ? "Network error resolving assistance request."
                        : "Network error reopening assistance request."
                )
            );
        } finally {
            setUpdatingRequestId(
                null
            );
        }
    }


    function formatDate(
        value
    ) {
        if (
            !value
        ) {
            return "";
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
            return "";
        }


        return date
            .toLocaleDateString(
                "en-GB",
                {
                    day:
                        "numeric",

                    month:
                        "short"
                }
            );
    }


    const unresolvedRequests =
        requests.filter(
            request =>
                request.status ===
                "OPEN"
        );


    const resolvedRequests =
        requests.filter(
            request =>
                request.status ===
                "RESOLVED"
        );


    if (
        isLoading
    ) {
        return (
            <div
                className="team-radio-alert"
            >
                <p
                    className="muted"
                >
                    Loading Team Radio...
                </p>
            </div>
        );
    }


    return (
        <div
            className="team-radio-alert"
        >
            <div
                className="team-radio-alert-header"
            >
                <div
                    className="team-radio-alert-title"
                >
                    <strong>
                        Team Radio Alerts
                    </strong>


                    <span
                        className="team-radio-count"
                    >
                        {
                            unresolvedRequests
                                .length
                        }{" "}
                        unresolved blocker
                        {
                            unresolvedRequests
                                .length !==
                            1
                                ? "s"
                                : ""
                        }
                    </span>
                </div>


                {
                    unresolvedRequests
                        .length >
                    0 && (
                        <span
                            className="team-radio-alert-badge"
                        >
                            ACTION REQUIRED
                        </span>
                    )
                }
            </div>


            {
                error &&
                !error.startsWith(
                    "Maximum characters exceeded."
                ) && (
                    <div
                        className="error-banner"
                        role="alert"
                    >
                        {error}
                    </div>
                )
            }


            <form
                onSubmit={
                    submitRequest
                }
                className="team-radio-form"
            >
                <select
                    value={
                        category
                    }
                    onChange={
                        event =>
                            setCategory(
                                event
                                    .target
                                    .value
                            )
                    }
                    aria-label="Assistance request category"
                    disabled={
                        !projectId ||
                        isSubmitting
                    }
                >
                    <option
                        value="TECHNICAL"
                    >
                        Technical
                    </option>

                    <option
                        value="DEPENDENCY"
                    >
                        Dependency
                    </option>

                    <option
                        value="RESOURCE"
                    >
                        Resource
                    </option>

                    <option
                        value="COMMUNICATION"
                    >
                        Communication
                    </option>

                    <option
                        value="OTHER"
                    >
                        Other
                    </option>
                </select>


                <textarea
                    placeholder="Report a blocker or request assistance from your team..."
                    value={
                        message
                    }
                    onChange={
                        event =>
                            setMessage(
                                event
                                    .target
                                    .value
                            )
                    }
                    aria-label="Assistance request message"
                    rows={
                        2
                    }
                    required
                    disabled={
                        !projectId ||
                        isSubmitting
                    }
                />


                <p className="muted">
                    {message.length}/
                    {MAX_TEAM_RADIO_MESSAGE_LENGTH}
                    {" "}characters
                </p>


                <button
                    type="submit"
                    disabled={
                        isSubmitting ||
                        !message.trim() ||
                        message.length >
                            MAX_TEAM_RADIO_MESSAGE_LENGTH ||
                        !projectId
                    }
                    className="f1-primary-btn"
                >
                    {
                        isSubmitting
                            ? "Sending..."
                            : "Send Request"
                    }
                </button>


                {
                    message.length >
                    MAX_TEAM_RADIO_MESSAGE_LENGTH && (
                        <div
                            className="error-banner"
                            role="alert"
                        >
                            {`Maximum characters exceeded. Assistance request message may not exceed ${MAX_TEAM_RADIO_MESSAGE_LENGTH} characters.`}
                        </div>
                    )
                }
            </form>


            {
                unresolvedRequests
                    .length >
                0
                    ? (
                        <div
                            className="team-radio-alert-list"
                        >
                            {
                                unresolvedRequests
                                    .map(
                                        request => (
                                            <div
                                                className="team-radio-alert-item"
                                                key={
                                                    request
                                                        .radio_id
                                                }
                                            >
                                                <strong>
                                                    {
                                                        request
                                                            .message
                                                    }
                                                </strong>


                                                <div
                                                    className="team-radio-meta"
                                                >
                                                    <span>
                                                        Reported by{" "}
                                                        {
                                                            request
                                                                .author_display_name ||
                                                            "Project member"
                                                        }
                                                    </span>


                                                    <small>
                                                        {
                                                            request
                                                                .category
                                                        }

                                                        {
                                                            request
                                                                .created_at
                                                                ? ` • ${formatDate(
                                                                    request
                                                                        .created_at
                                                                )}`
                                                                : ""
                                                        }
                                                    </small>


                                                    <button
                                                        type="button"
                                                        className="f1-primary-btn"
                                                        disabled={
                                                            updatingRequestId ===
                                                            request
                                                                .radio_id
                                                        }
                                                        onClick={() =>
                                                            changeRequestStatus(
                                                                request
                                                                    .radio_id,

                                                                "resolve"
                                                            )
                                                        }
                                                    >
                                                        {
                                                            updatingRequestId ===
                                                            request
                                                                .radio_id
                                                                ? "Updating..."
                                                                : "Resolve"
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )
                            }
                        </div>
                    )
                    : (
                        <p
                            className="muted"
                        >
                            No open assistance requests.
                        </p>
                    )
            }


            {
                resolvedRequests
                    .length >
                0 && (
                    <>
                        <div
                            className="team-radio-alert-header"
                        >
                            <div
                                className="team-radio-alert-title"
                            >
                                <strong>
                                    Resolved Requests
                                </strong>


                                <span
                                    className="team-radio-count"
                                >
                                    {
                                        resolvedRequests
                                            .length
                                    } resolved
                                </span>
                            </div>
                        </div>


                        <div
                            className="team-radio-alert-list"
                        >
                            {
                                resolvedRequests
                                    .map(
                                        request => (
                                            <div
                                                className="team-radio-alert-item"
                                                key={
                                                    request
                                                        .radio_id
                                                }
                                            >
                                                <strong>
                                                    {
                                                        request
                                                            .message
                                                    }
                                                </strong>


                                                <div
                                                    className="team-radio-meta"
                                                >
                                                    <span>
                                                        Reported by{" "}
                                                        {
                                                            request
                                                                .author_display_name ||
                                                            "Project member"
                                                        }
                                                    </span>


                                                    <small>
                                                        {
                                                            request
                                                                .category
                                                        }

                                                        {
                                                            request
                                                                .created_at
                                                                ? ` • ${formatDate(
                                                                    request
                                                                        .created_at
                                                                )}`
                                                                : ""
                                                        }
                                                    </small>


                                                    <button
                                                        type="button"
                                                        className="f1-primary-btn"
                                                        disabled={
                                                            updatingRequestId ===
                                                            request
                                                                .radio_id
                                                        }
                                                        onClick={() =>
                                                            changeRequestStatus(
                                                                request
                                                                    .radio_id,

                                                                "reopen"
                                                            )
                                                        }
                                                    >
                                                        {
                                                            updatingRequestId ===
                                                            request
                                                                .radio_id
                                                                ? "Updating..."
                                                                : "Reopen"
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )
                            }
                        </div>
                    </>
                )
            }
        </div>
    );
}


export default TeamRadioAlert;
