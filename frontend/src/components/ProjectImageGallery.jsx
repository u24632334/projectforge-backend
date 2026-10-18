import "./ProjectImageGallery.css";


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


export default function ProjectImageGallery({
    images,
    label = "Project images",
    compact = false,
    showEmpty = false
}) {
    const safeImages =
        Array.isArray(
            images
        )
            ? images
                .map(
                    normaliseImage
                )
                .map(
                    image => ({
                        ...image,

                        imageUrl:
                            getSafeImageUrl(
                                image.imageUrl
                            )
                    })
                )
                .filter(
                    image =>
                        Boolean(
                            image.imageUrl
                        )
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        first.displayOrder -
                        second.displayOrder
                )
                .slice(
                    0,
                    5
                )
            : [];


    if (
        safeImages.length ===
        0
    ) {
        if (
            !showEmpty
        ) {
            return null;
        }

        return (
            <div className="project-gallery-empty">
                No project images were uploaded.
            </div>
        );
    }


    return (
        <section
            className={
                compact
                    ? "project-gallery project-gallery-compact"
                    : "project-gallery"
            }
            aria-label={
                label
            }
        >

            <div className="project-gallery-grid">

                {safeImages.map(
                    (
                        image,
                        index
                    ) => (

                        <a
                            key={
                                image.imageId ||
                                `${image.imageUrl}-${index}`
                            }
                            className="project-gallery-item"
                            href={
                                image.imageUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            aria-label={
                                `Open ${image.originalName}`
                            }
                        >

                            <img
                                src={
                                    image.imageUrl
                                }
                                alt={
                                    image.originalName
                                }
                                loading="lazy"
                            />

                        </a>

                    )
                )}

            </div>

        </section>
    );
}