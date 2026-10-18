import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useAuth
} from "../context/AuthContext";

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import "./ProjectImageManager.css";


const MAX_PROJECT_IMAGES =
    5;

const MAX_IMAGE_SIZE =
    5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
    new Set([
        "image/jpeg",
        "image/png",
        "image/webp"
    ]);


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


function getSafeImageUrl(
    value
) {
    if (
        typeof value !==
        "string"
    ) {
        return "";
    }

    const cleanValue =
        value.trim();

    if (
        !cleanValue.startsWith(
            "/api/project-images/files/"
        )
    ) {
        return "";
    }

    return cleanValue;
}


function normaliseImage(
    image
) {
    return {
        imageId:
            image?.imageId ||
            image?.image_id ||
            "",

        imageUrl:
            image?.imageUrl ||
            image?.image_url ||
            "",

        originalName:
            image?.originalName ||
            image?.original_name ||
            "Project image",

        displayOrder:
            Number(
                image?.displayOrder ??
                image?.display_order ??
                0
            )
    };
}


export default function ProjectImageManager({
    projectId,
    showcaseLocked = false
}) {
    const {
        token
    } = useAuth();

    const inputRef =
        useRef(null);

    const [
        images,
        setImages
    ] =
        useState([]);

    const [
        loading,
        setLoading
    ] =
        useState(true);

    const [
        selectedFiles,
        setSelectedFiles
    ] =
        useState([]);

    const [
        uploading,
        setUploading
    ] =
        useState(false);

    const [
        deletingImageId,
        setDeletingImageId
    ] =
        useState("");

    const [
        error,
        setError
    ] =
        useState("");

    const [
        success,
        setSuccess
    ] =
        useState("");


    const [
        actionFeedbackActive,
        setActionFeedbackActive
    ] = useState(false);


    useAutoDismissFeedback(
        actionFeedbackActive &&
            Boolean(
                error ||
                success
            ),
        () => {
            setError("");
            setSuccess("");
            setActionFeedbackActive(false);
        }
    );

    const [
        serverLocked,
        setServerLocked
    ] =
        useState(false);


    const locked =
        showcaseLocked ||
        serverLocked;

    const remainingSlots =
        Math.max(
            0,
            MAX_PROJECT_IMAGES -
                images.length
        );


    useEffect(
        () => {
            function handleShowcaseSubmitted(
                event
            ) {
                if (
                    String(
                        event?.detail?.projectId ||
                        ""
                    ) !==
                    String(
                        projectId ||
                        ""
                    )
                ) {
                    return;
                }


                setServerLocked(
                    true
                );

                setSelectedFiles(
                    []
                );

                setError(
                    ""
                );

                setSuccess(
                    ""
                );


                if (
                    inputRef.current
                ) {
                    inputRef.current.value =
                        "";
                }
            }


            window.addEventListener(
                "projectforge-showcase-submitted",
                handleShowcaseSubmitted
            );


            return () => {
                window.removeEventListener(
                    "projectforge-showcase-submitted",
                    handleShowcaseSubmitted
                );
            };
        },
        [
            projectId
        ]
    );


    useEffect(
        () => {
            let cancelled =
                false;

            async function loadImages() {
                // PROJECT_IMAGE_LOAD_FEEDBACK
                setActionFeedbackActive(
                    false
                );
                if (
                    !projectId ||
                    !token
                ) {
                    if (
                        !cancelled
                    ) {
                        setImages([]);
                        setLoading(false);
                    }

                    return;
                }

                setLoading(true);
                setError("");

                try {
                    const response =
                        await fetch(
                            `/api/projects/${projectId}/images`,
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
                            "Unable to load project images."
                        );
                    }

                    if (
                        cancelled
                    ) {
                        return;
                    }

                    const loadedImages =
                        Array.isArray(
                            data.images
                        )
                            ? data.images
                                .map(
                                    normaliseImage
                                )
                                .sort(
                                    (
                                        first,
                                        second
                                    ) =>
                                        first.displayOrder -
                                        second.displayOrder
                                )
                            : [];

                    setImages(
                        loadedImages
                    );

                    if (
                        data.locked ===
                        true
                    ) {
                        setServerLocked(
                            true
                        );
                    }
                }
                catch (
                    loadError
                ) {
                    if (
                        !cancelled
                    ) {
                        setError(
                            loadError.message ||
                            "Unable to load project images."
                        );

                        setImages([]);
                    }
                }
                finally {
                    if (
                        !cancelled
                    ) {
                        setLoading(
                            false
                        );
                    }
                }
            }

            loadImages();

            return () => {
                cancelled =
                    true;
            };
        },
        [
            projectId,
            token
        ]
    );


    function clearMessages() {
        setActionFeedbackActive(true);
        setError("");
        setSuccess("");
    }


    function clearSelection() {
        setSelectedFiles([]);

        if (
            inputRef.current
        ) {
            inputRef.current.value =
                "";
        }
    }


    function handleFileSelection(
        event
    ) {
        clearMessages();

        const files =
            Array.from(
                event.target.files ||
                []
            );

        if (
            files.length ===
            0
        ) {
            setSelectedFiles(
                []
            );

            return;
        }

        if (
            locked
        ) {
            setError(
                "Project images are locked because the project has already been submitted for Showcase review."
            );

            clearSelection();

            return;
        }

        if (
            remainingSlots ===
            0
        ) {
            setError(
                "This project already has the maximum of five images."
            );

            clearSelection();

            return;
        }

        if (
            files.length >
            remainingSlots
        ) {
            setError(
                `You can only add ${remainingSlots} more ${
                    remainingSlots === 1
                        ? "image"
                        : "images"
                }.`
            );

            clearSelection();

            return;
        }

        for (
            const file
            of files
        ) {
            if (
                !ALLOWED_IMAGE_TYPES.has(
                    file.type
                )
            ) {
                setError(
                    "Only JPG, PNG and WebP images are allowed."
                );

                clearSelection();

                return;
            }

            if (
                file.size >
                MAX_IMAGE_SIZE
            ) {
                setError(
                    "Each project image must be 5 MB or smaller."
                );

                clearSelection();

                return;
            }

            if (
                file.size <=
                0
            ) {
                setError(
                    "Empty image files cannot be uploaded."
                );

                clearSelection();

                return;
            }
        }

        setSelectedFiles(
            files
        );
    }


    async function handleUpload() {
        if (
            !projectId ||
            !token ||
            locked ||
            uploading ||
            selectedFiles.length ===
                0
        ) {
            return;
        }

        clearMessages();

        setUploading(
            true
        );

        const formData =
            new FormData();

        selectedFiles.forEach(
            file => {
                formData.append(
                    "images",
                    file
                );
            }
        );

        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/images`,
                    {
                        method:
                            "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            formData
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
                    response.status ===
                    409 &&
                    String(
                        data.error ||
                        data.message ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            "locked"
                        )
                ) {
                    setServerLocked(
                        true
                    );
                }

                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to upload project images."
                );
            }

            const uploadedImages =
                Array.isArray(
                    data.images
                )
                    ? data.images
                        .map(
                            normaliseImage
                        )
                    : [];

            setImages(
                currentImages =>
                    [
                        ...currentImages,
                        ...uploadedImages
                    ]
                        .sort(
                            (
                                first,
                                second
                            ) =>
                                first.displayOrder -
                                second.displayOrder
                        )
            );

            clearSelection();

            setSuccess(
                data.message ||
                (
                    uploadedImages.length ===
                    1
                        ? "Project image uploaded successfully."
                        : "Project images uploaded successfully."
                )
            );
        }
        catch (
            uploadError
        ) {
            setError(
                uploadError.message ||
                "Unable to upload project images."
            );
        }
        finally {
            setUploading(
                false
            );
        }
    }


    async function handleDelete(
        image
    ) {
        if (
            !projectId ||
            !token ||
            !image?.imageId ||
            locked ||
            deletingImageId
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Remove "${image.originalName}" from this project?`
            );

        if (
            !confirmed
        ) {
            return;
        }

        clearMessages();

        setDeletingImageId(
            image.imageId
        );

        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/images/${image.imageId}`,
                    {
                        method:
                            "DELETE",

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
                    response.status ===
                    409
                ) {
                    setServerLocked(
                        true
                    );
                }

                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to remove project image."
                );
            }

            setImages(
                currentImages =>
                    currentImages.filter(
                        currentImage =>
                            currentImage.imageId !==
                            image.imageId
                    )
            );

            setSuccess(
                data.message ||
                "Project image removed successfully."
            );
        }
        catch (
            deleteError
        ) {
            setError(
                deleteError.message ||
                "Unable to remove project image."
            );
        }
        finally {
            setDeletingImageId(
                ""
            );
        }
    }


    return (
        <section
            className="project-image-manager"
            aria-labelledby="project-images-heading"
        >

            <div className="project-image-heading">

                <div>

                    <h2
                        id="project-images-heading"
                    >
                        Project Images
                    </h2>

                    <p>
                        Add up to five images to represent
                        the project in the public Showcase.
                    </p>

                </div>


                <span className="project-image-count">
                    {images.length}/
                    {MAX_PROJECT_IMAGES}
                </span>

            </div>


            {loading ? (

                <p className="project-image-muted">
                    Loading project images...
                </p>

            ) : (

                <>

                    {images.length ===
                    0 ? (

                        <div className="project-image-empty">
                            No project images have been
                            uploaded yet.
                        </div>

                    ) : (

                        <div className="project-image-grid">

                            {images.map(
                                image => {

                                    const safeImageUrl =
                                        getSafeImageUrl(
                                            image.imageUrl
                                        );

                                    if (
                                        !safeImageUrl
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <article
                                            className="project-image-card"
                                            key={
                                                image.imageId
                                            }
                                        >

                                            <img
                                                src={
                                                    safeImageUrl
                                                }
                                                alt={
                                                    image.originalName
                                                }
                                            />


                                            <div className="project-image-card-footer">

                                                <span
                                                    title={
                                                        image.originalName
                                                    }
                                                >
                                                    {
                                                        image.originalName
                                                    }
                                                </span>


                                                {!locked && (

                                                    <button
                                                        type="button"
                                                        className="project-image-remove"
                                                        onClick={
                                                            () =>
                                                                handleDelete(
                                                                    image
                                                                )
                                                        }
                                                        disabled={
                                                            Boolean(
                                                                deletingImageId
                                                            )
                                                        }
                                                    >
                                                        {
                                                            deletingImageId ===
                                                            image.imageId
                                                                ? "Removing..."
                                                                : "Remove"
                                                        }
                                                    </button>

                                                )}

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </div>

                    )}


                    {locked ? (

                        <div className="project-image-locked">
                            Images are locked because this
                            project has already been submitted
                            for Showcase review.
                        </div>

                    ) : remainingSlots >
                    0 ? (

                        <div className="project-image-upload">

                            <label
                                htmlFor="project-image-input"
                            >
                                Add Project Images
                            </label>


                            <input
                                ref={
                                    inputRef
                                }
                                id="project-image-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={
                                    handleFileSelection
                                }
                                disabled={
                                    uploading
                                }
                            />


                            <p className="project-image-muted">
                                JPG, PNG or WebP. Maximum
                                5 MB each.{" "}
                                {remainingSlots}{" "}
                                {
                                    remainingSlots ===
                                    1
                                        ? "slot"
                                        : "slots"
                                }{" "}
                                remaining.
                            </p>


                            {selectedFiles.length >
                            0 && (

                                <div className="project-image-selection">

                                    <strong>
                                        Selected:
                                    </strong>

                                    <ul>

                                        {selectedFiles.map(
                                            (
                                                file,
                                                index
                                            ) => (

                                                <li
                                                    key={
                                                        `${file.name}-${file.size}-${index}`
                                                    }
                                                >
                                                    {
                                                        file.name
                                                    }
                                                </li>

                                            )
                                        )}

                                    </ul>

                                </div>

                            )}


                            <div className="project-image-actions">

                                {selectedFiles.length >
                                0 && (

                                    <button
                                        type="button"
                                        className="button button-secondary"
                                        onClick={
                                            clearSelection
                                        }
                                        disabled={
                                            uploading
                                        }
                                    >
                                        Clear
                                    </button>

                                )}


                                <button
                                    type="button"
                                    className="button"
                                    onClick={
                                        handleUpload
                                    }
                                    disabled={
                                        uploading ||
                                        selectedFiles.length ===
                                            0
                                    }
                                >
                                    {
                                        uploading
                                            ? "Uploading..."
                                            : selectedFiles.length >
                                                1
                                                ? `Upload ${selectedFiles.length} Images`
                                                : "Upload Image"
                                    }
                                </button>

                            </div>

                        </div>

                    ) : (

                        <div className="project-image-limit">
                            Maximum of five project images
                            reached.
                        </div>

                    )}

                </>

            )}


            {error && (

                <p
                    className="project-image-error"
                    role="alert"
                >
                    {error}
                </p>

            )}


            {success && (

                <p
                    className="project-image-success"
                    role="status"
                >
                    {success}
                </p>

            )}

        </section>
    );
}