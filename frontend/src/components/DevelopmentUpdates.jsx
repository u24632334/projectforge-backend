import {
    useCallback,
    useEffect,
    useState
} from "react";

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import { useAuth } from "../context/AuthContext";

import "./DevelopmentUpdates.css";

const MAX_DEVELOPMENT_UPDATE_LENGTH =
    1000;


function DevelopmentUpdates({
    projectId
}) {
    const {
        token,
        user
    } = useAuth();

    const [
        updates,
        setUpdates
    ] = useState([]);

    const [
        content,
        setContent
    ] = useState("");

    const [
        editingId,
        setEditingId
    ] = useState(null);

    const [
        editContent,
        setEditContent
    ] = useState("");

    const [
        isLoading,
        setIsLoading
    ] = useState(true);

    const [
        isPosting,
        setIsPosting
    ] = useState(false);

    const [
        isSaving,
        setIsSaving
    ] = useState(false);

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


    useEffect(
        () => {
            if (
                content.length >
                MAX_DEVELOPMENT_UPDATE_LENGTH
            ) {
                setError(
                    `Maximum characters exceeded. Development update may not exceed ${MAX_DEVELOPMENT_UPDATE_LENGTH} characters.`
                );

                setActionFeedbackActive(
                    true
                );

                return;
            }

            if (
                editContent.length >
                MAX_DEVELOPMENT_UPDATE_LENGTH
            ) {
                setError(
                    `Maximum characters exceeded. Development update may not exceed ${MAX_DEVELOPMENT_UPDATE_LENGTH} characters.`
                );

                setActionFeedbackActive(
                    true
                );
            }
        },
        [
            content,
            editContent
        ]
    );


    const loadUpdates =
        useCallback(
            async (
                showLoading = true
            ) => {
                // DEVELOPMENT_UPDATE_LOAD_FEEDBACK
                setActionFeedbackActive(
                    false
                );
                if (!projectId) {
                    setUpdates([]);

                    setError(
                        "Select a project to view development updates."
                    );

                    setIsLoading(false);

                    return;
                }


                if (!token) {
                    setUpdates([]);

                    setError(
                        "Please log in to view development updates."
                    );

                    setIsLoading(false);

                    return;
                }


                if (showLoading) {
                    setIsLoading(true);
                }

                setError("");


                try {
                    const response =
                        await fetch(
                            `/api/projects/${projectId}/development-updates`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            data.error ||
                            "Failed to load development updates."
                        );
                    }


                    setUpdates(
                        data.updates || []
                    );
                } catch (err) {
                    setError(
                        err.message ||
                        "Network error loading development updates."
                    );
                } finally {
                    if (showLoading) {
                        setIsLoading(false);
                    }
                }
            },
            [
                projectId,
                token
            ]
        );


    useEffect(() => {
        loadUpdates();
    }, [loadUpdates]);


    async function postUpdate() {
        if (
            content.length >
            MAX_DEVELOPMENT_UPDATE_LENGTH
        ) {
            setActionFeedbackActive(
                true
            );

            setError(
                `Maximum characters exceeded. Development update may not exceed ${MAX_DEVELOPMENT_UPDATE_LENGTH} characters.`
            );

            return;
        }
        if (
            !content.trim() ||
            !projectId
        ) {
            return;
        }


        // DEVELOPMENT_UPDATE_POST_FEEDBACK
        setActionFeedbackActive(
            true
        );


        setError("");
        setIsPosting(true);


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/development-updates`,
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
                                content:
                                    content.trim()
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Failed to post development update."
                );
            }


            setContent("");


            await loadUpdates(
                false
            );
        } catch (err) {
            setError(
                err.message ||
                "Network error posting development update."
            );
        } finally {
            setIsPosting(false);
        }
    }


    function startEditing(
        update
    ) {
        setEditingId(
            update.update_id
        );

        setEditContent(
            update.content
        );

        setError("");
    }


    function cancelEdit() {
        setEditingId(
            null
        );

        setEditContent(
            ""
        );
    }


    async function saveEdit(
        updateId
    ) {
        if (
            editContent.length >
            MAX_DEVELOPMENT_UPDATE_LENGTH
        ) {
            setActionFeedbackActive(
                true
            );

            setError(
                `Maximum characters exceeded. Development update may not exceed ${MAX_DEVELOPMENT_UPDATE_LENGTH} characters.`
            );

            return;
        }
        if (
            !editContent.trim() ||
            !projectId
        ) {
            return;
        }


        // DEVELOPMENT_UPDATE_EDIT_FEEDBACK
        setActionFeedbackActive(
            true
        );


        setError("");
        setIsSaving(true);


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/development-updates/${updateId}`,
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
                                content:
                                    editContent.trim()
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Failed to update development update."
                );
            }


            setEditingId(
                null
            );

            setEditContent(
                ""
            );


            await loadUpdates(
                false
            );
        } catch (err) {
            setError(
                err.message ||
                "Network error updating development update."
            );
        } finally {
            setIsSaving(false);
        }
    }


    function formatDate(
        value
    ) {
        if (!value) {
            return "";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }


        return date.toLocaleString(
            "en-GB",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );
    }


    if (isLoading) {
        return (
            <section className="development-updates">
                <p className="muted">
                    Loading development updates...
                </p>
            </section>
        );
    }


    return (
        <section className="development-updates">

            <div className="development-updates-header">

                <div>
                    <h2>
                        Development Updates
                    </h2>

                    <p>
                        Share project progress
                        with your team.
                    </p>
                </div>

            </div>


            {error &&
                !error.startsWith(
                    "Maximum characters exceeded."
                ) && (
                <div
                    className="development-update-error"
                    role="alert"
                >
                    {error}
                </div>
            )}


            <div className="development-update-form">

                <textarea
                    value={content}
                    onChange={(event) =>
                        setContent(
                            event.target.value
                        )
                    }
                    placeholder="Share a development update..."
                    aria-label="Development update"
                    disabled={
                        !projectId ||
                        isPosting
                    }
                />


                <p className="muted">
                    {content.length}/
                    {MAX_DEVELOPMENT_UPDATE_LENGTH}
                    {" "}characters
                </p>


                <button
                    type="button"
                    className="button"
                    onClick={
                        postUpdate
                    }
                    disabled={
                        isPosting ||
                        !content.trim() ||
                        content.length >
                            MAX_DEVELOPMENT_UPDATE_LENGTH ||
                        !projectId
                    }
                >
                    {isPosting
                        ? "Posting..."
                        : "Post Update"}
                </button>


                {content.length >
                    MAX_DEVELOPMENT_UPDATE_LENGTH && (
                    <div
                        className="development-update-error"
                        role="alert"
                    >
                        {`Maximum characters exceeded. Development update may not exceed ${MAX_DEVELOPMENT_UPDATE_LENGTH} characters.`}
                    </div>
                )}

            </div>


            {updates.length === 0 ? (

                <p className="muted">
                    No development updates
                    have been posted yet.
                </p>

            ) : (

                <div className="development-update-list">

                    {updates.map(
                        (update) => {
                            const isOwner =
                                Boolean(
                                    user?.id &&
                                    update.author_user_id ===
                                        user.id
                                );


                            return (
                                <article
                                    className="development-update"
                                    key={
                                        update.update_id
                                    }
                                >

                                    <div className="development-update-meta">

                                        <strong>
                                            {
                                                update.author_display_name ||
                                                "Project member"
                                            }
                                        </strong>

                                        <span>
                                            {
                                                formatDate(
                                                    update.created_at
                                                )
                                            }
                                        </span>

                                    </div>


                                    {editingId ===
                                    update.update_id ? (

                                        <div className="development-update-edit">

                                            <textarea
                                                value={
                                                    editContent
                                                }
                                                aria-label={
                                                    `Edit update by ${
                                                        update.author_display_name ||
                                                        "project member"
                                                    }`
                                                }
                                                onChange={(event) =>
                                                    setEditContent(
                                                        event.target.value
                                                    )
                                                }
                                                disabled={
                                                    isSaving
                                                }
                                            />


                                            <p className="muted">
                                                {editContent.length}/
                                                {MAX_DEVELOPMENT_UPDATE_LENGTH}
                                                {" "}characters
                                            </p>


                                            <div className="development-update-actions">

                                                <button
                                                    type="button"
                                                    className="button"
                                                    onClick={() =>
                                                        saveEdit(
                                                            update.update_id
                                                        )
                                                    }
                                                    disabled={
                                                        isSaving ||
                                                        !editContent.trim() ||
                                                        editContent.length >
                                                            MAX_DEVELOPMENT_UPDATE_LENGTH
                                                    }
                                                >
                                                    {isSaving
                                                        ? "Saving..."
                                                        : "Save"}
                                                </button>


                                                <button
                                                    type="button"
                                                    className="button button-secondary"
                                                    onClick={
                                                        cancelEdit
                                                    }
                                                    disabled={
                                                        isSaving
                                                    }
                                                >
                                                    Cancel
                                                </button>

                                            </div>


                                            {editContent.length >
                                                MAX_DEVELOPMENT_UPDATE_LENGTH && (
                                                <div
                                                    className="development-update-error"
                                                    role="alert"
                                                >
                                                    {`Maximum characters exceeded. Development update may not exceed ${MAX_DEVELOPMENT_UPDATE_LENGTH} characters.`}
                                                </div>
                                            )}

                                        </div>

                                    ) : (

                                        <>

                                            <p>
                                                {
                                                    update.content
                                                }
                                            </p>


                                            {isOwner && (
                                                <button
                                                    type="button"
                                                    className="text-button development-update-edit-button"
                                                    onClick={() =>
                                                        startEditing(
                                                            update
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>
                                            )}

                                        </>

                                    )}

                                </article>
                            );
                        }
                    )}

                </div>
            )}

        </section>
    );
}


export default DevelopmentUpdates;
