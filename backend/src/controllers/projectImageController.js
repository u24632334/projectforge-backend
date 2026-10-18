const fs = require("fs/promises");
const path = require("path");

const db =
    require("../config/db");

const pool =
    db.pool || db;

const {
    uploadDirectory
} =
    require(
        "../middleware/projectImageUpload"
    );

const MAX_PROJECT_IMAGES =
    5;

const IMAGE_PUBLIC_BASE =
    "/api/project-images/files";


function toPublicImage(
    row
) {
    return {
        imageId:
            row.image_id,

        projectId:
            row.project_id,

        imageUrl:
            `${IMAGE_PUBLIC_BASE}/${row.file_name}`,

        originalName:
            row.original_name,

        mimeType:
            row.mime_type,

        fileSizeBytes:
            row.file_size_bytes,

        displayOrder:
            row.display_order,

        uploadedAt:
            row.created_at
    };
}


async function removeFiles(
    files
) {
    if (
        !Array.isArray(files)
    ) {
        return;
    }

    await Promise.all(
        files.map(
            async file => {
                if (
                    !file?.path
                ) {
                    return;
                }

                try {
                    await fs.unlink(
                        file.path
                    );
                }
                catch (
                    error
                ) {
                    if (
                        error.code !==
                        "ENOENT"
                    ) {
                        console.error(
                            "Unable to remove uploaded project image:",
                            error
                        );
                    }
                }
            }
        )
    );
}


async function hasValidSignature(
    file
) {
    let handle;

    try {
        handle =
            await fs.open(
                file.path,
                "r"
            );

        const buffer =
            Buffer.alloc(12);

        const {
            bytesRead
        } =
            await handle.read(
                buffer,
                0,
                buffer.length,
                0
            );

        if (
            bytesRead <
            8
        ) {
            return false;
        }

        if (
            file.mimetype ===
            "image/jpeg"
        ) {
            return (
                buffer[0] === 0xff &&
                buffer[1] === 0xd8 &&
                buffer[2] === 0xff
            );
        }

        if (
            file.mimetype ===
            "image/png"
        ) {
            const signature =
                [
                    0x89,
                    0x50,
                    0x4e,
                    0x47,
                    0x0d,
                    0x0a,
                    0x1a,
                    0x0a
                ];

            return signature.every(
                (
                    value,
                    index
                ) =>
                    buffer[index] ===
                    value
            );
        }

        if (
            file.mimetype ===
            "image/webp"
        ) {
            if (
                bytesRead <
                12
            ) {
                return false;
            }

            return (
                buffer
                    .subarray(
                        0,
                        4
                    )
                    .toString(
                        "ascii"
                    ) ===
                    "RIFF" &&

                buffer
                    .subarray(
                        8,
                        12
                    )
                    .toString(
                        "ascii"
                    ) ===
                    "WEBP"
            );
        }

        return false;
    }
    catch {
        return false;
    }
    finally {
        if (
            handle
        ) {
            await handle.close();
        }
    }
}


async function validateUploadedFiles(
    files
) {
    for (
        const file
        of files
    ) {
        const valid =
            await hasValidSignature(
                file
            );

        if (
            !valid
        ) {
            return false;
        }
    }

    return true;
}


async function isImageSetLocked(
    client,
    projectId
) {
    const result =
        await client.query(
            `
                SELECT
                    showcase_id
                FROM showcase_submissions
                WHERE project_id = $1
                LIMIT 1;
            `,
            [
                projectId
            ]
        );

    return (
        result.rows.length >
        0
    );
}


exports.getProjectImages =
    async (
        req,
        res
    ) => {
        try {
            const [
                imageResult,
                submissionResult
            ] =
                await Promise.all([
                    pool.query(
                        `
                            SELECT
                                image_id,
                                project_id,
                                uploaded_by_user_id,
                                file_name,
                                original_name,
                                mime_type,
                                file_size_bytes,
                                display_order,
                                created_at
                            FROM project_images
                            WHERE project_id = $1
                            ORDER BY
                                display_order ASC,
                                created_at ASC;
                        `,
                        [
                            req.params.id
                        ]
                    ),

                    pool.query(
                        `
                            SELECT
                                showcase_id
                            FROM showcase_submissions
                            WHERE project_id = $1
                            LIMIT 1;
                        `,
                        [
                            req.params.id
                        ]
                    )
                ]);

            return res
                .status(200)
                .json({
                    images:
                        imageResult.rows.map(
                            toPublicImage
                        ),

                    locked:
                        submissionResult
                            .rows
                            .length >
                        0
                });
        }
        catch (
            error
        ) {
            console.error(
                "Error loading project images:",
                error
            );

            return res
                .status(500)
                .json({
                    error:
                        "Failed to load project images."
                });
        }
    };


exports.uploadProjectImages =
    async (
        req,
        res
    ) => {
        const files =
            Array.isArray(
                req.files
            )
                ? req.files
                : [];

        if (
            files.length ===
            0
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Please select at least one project image."
                });
        }

        if (
            !req.user?.id
        ) {
            await removeFiles(
                files
            );

            return res
                .status(401)
                .json({
                    error:
                        "Authentication required."
                });
        }

        const signaturesValid =
            await validateUploadedFiles(
                files
            );

        if (
            !signaturesValid
        ) {
            await removeFiles(
                files
            );

            return res
                .status(400)
                .json({
                    error:
                        "One or more files are not valid JPG, PNG or WebP images."
                });
        }

        let client;

        try {
            client =
                await pool.connect();

            await client.query(
                "BEGIN"
            );

            const projectResult =
                await client.query(
                    `
                        SELECT
                            project_id
                        FROM projects
                        WHERE project_id = $1
                        FOR UPDATE;
                    `,
                    [
                        req.params.id
                    ]
                );

            if (
                projectResult
                    .rows
                    .length ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                await removeFiles(
                    files
                );

                return res
                    .status(404)
                    .json({
                        error:
                            "Project not found."
                    });
            }

            const locked =
                await isImageSetLocked(
                    client,
                    req.params.id
                );

            if (
                locked
            ) {
                await client.query(
                    "ROLLBACK"
                );

                await removeFiles(
                    files
                );

                return res
                    .status(409)
                    .json({
                        error:
                            "Project images are locked once the project has been submitted for Showcase review."
                    });
            }

            const existingResult =
                await client.query(
                    `
                        SELECT
                            display_order
                        FROM project_images
                        WHERE project_id = $1
                        ORDER BY
                            display_order ASC;
                    `,
                    [
                        req.params.id
                    ]
                );

            const existingOrders =
                new Set(
                    existingResult
                        .rows
                        .map(
                            row =>
                                Number(
                                    row.display_order
                                )
                        )
                );

            if (
                existingOrders.size +
                    files.length >
                MAX_PROJECT_IMAGES
            ) {
                await client.query(
                    "ROLLBACK"
                );

                await removeFiles(
                    files
                );

                return res
                    .status(409)
                    .json({
                        error:
                            "A project may have a maximum of five images."
                    });
            }

            const availableOrders =
                [
                    1,
                    2,
                    3,
                    4,
                    5
                ].filter(
                    order =>
                        !existingOrders.has(
                            order
                        )
                );

            const insertedImages =
                [];

            for (
                let index = 0;
                index <
                files.length;
                index += 1
            ) {
                const file =
                    files[index];

                const originalName =
                    path
                        .basename(
                            String(
                                file.originalname ||
                                "project-image"
                            )
                        )
                        .slice(
                            0,
                            255
                        );

                const result =
                    await client.query(
                        `
                            INSERT INTO project_images (
                                project_id,
                                uploaded_by_user_id,
                                file_name,
                                original_name,
                                mime_type,
                                file_size_bytes,
                                display_order
                            )
                            VALUES (
                                $1,
                                $2,
                                $3,
                                $4,
                                $5,
                                $6,
                                $7
                            )
                            RETURNING
                                image_id,
                                project_id,
                                uploaded_by_user_id,
                                file_name,
                                original_name,
                                mime_type,
                                file_size_bytes,
                                display_order,
                                created_at;
                        `,
                        [
                            req.params.id,
                            req.user.id,
                            file.filename,
                            originalName,
                            file.mimetype,
                            file.size,
                            availableOrders[index]
                        ]
                    );

                insertedImages.push(
                    result.rows[0]
                );
            }

            await client.query(
                "COMMIT"
            );

            return res
                .status(201)
                .json({
                    message:
                        insertedImages.length ===
                        1
                            ? "Project image uploaded successfully."
                            : "Project images uploaded successfully.",

                    images:
                        insertedImages.map(
                            toPublicImage
                        )
                });
        }
        catch (
            error
        ) {
            if (
                client
            ) {
                try {
                    await client.query(
                        "ROLLBACK"
                    );
                }
                catch (
                    rollbackError
                ) {
                    console.error(
                        "Error rolling back project image upload:",
                        rollbackError
                    );
                }
            }

            await removeFiles(
                files
            );

            console.error(
                "Error uploading project images:",
                error
            );

            return res
                .status(500)
                .json({
                    error:
                        "Failed to upload project images."
                });
        }
        finally {
            if (
                client
            ) {
                client.release();
            }
        }
    };


exports.deleteProjectImage =
    async (
        req,
        res
    ) => {
        if (
            !req.user?.id
        ) {
            return res
                .status(401)
                .json({
                    error:
                        "Authentication required."
                });
        }

        let client;

        try {
            client =
                await pool.connect();

            await client.query(
                "BEGIN"
            );

            const projectResult =
                await client.query(
                    `
                        SELECT
                            project_id
                        FROM projects
                        WHERE project_id = $1
                        FOR UPDATE;
                    `,
                    [
                        req.params.id
                    ]
                );

            if (
                projectResult
                    .rows
                    .length ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(404)
                    .json({
                        error:
                            "Project not found."
                    });
            }

            const locked =
                await isImageSetLocked(
                    client,
                    req.params.id
                );

            if (
                locked
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(409)
                    .json({
                        error:
                            "Project images are locked once the project has been submitted for Showcase review."
                    });
            }

            const imageResult =
                await client.query(
                    `
                        SELECT
                            image_id,
                            file_name
                        FROM project_images
                        WHERE
                            image_id = $1
                            AND project_id = $2
                        LIMIT 1;
                    `,
                    [
                        req.params.imageId,
                        req.params.id
                    ]
                );

            if (
                imageResult
                    .rows
                    .length ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(404)
                    .json({
                        error:
                            "Project image not found."
                    });
            }

            const image =
                imageResult.rows[0];

            await client.query(
                `
                    DELETE FROM project_images
                    WHERE
                        image_id = $1
                        AND project_id = $2;
                `,
                [
                    req.params.imageId,
                    req.params.id
                ]
            );

            await client.query(
                "COMMIT"
            );

            try {
                await fs.unlink(
                    path.join(
                        uploadDirectory,
                        image.file_name
                    )
                );
            }
            catch (
                error
            ) {
                if (
                    error.code !==
                    "ENOENT"
                ) {
                    console.error(
                        "Unable to remove project image file:",
                        error
                    );
                }
            }

            return res
                .status(200)
                .json({
                    message:
                        "Project image removed successfully."
                });
        }
        catch (
            error
        ) {
            if (
                client
            ) {
                try {
                    await client.query(
                        "ROLLBACK"
                    );
                }
                catch (
                    rollbackError
                ) {
                    console.error(
                        "Error rolling back project image deletion:",
                        rollbackError
                    );
                }
            }

            console.error(
                "Error deleting project image:",
                error
            );

            return res
                .status(500)
                .json({
                    error:
                        "Failed to remove project image."
                });
        }
        finally {
            if (
                client
            ) {
                client.release();
            }
        }
    };