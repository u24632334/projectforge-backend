const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");


const MAX_IMAGE_SIZE =
    5 * 1024 * 1024;

const MAX_IMAGES_PER_REQUEST =
    5;


const uploadDirectory =
    path.resolve(
        __dirname,
        "../../uploads/project-images"
    );


fs.mkdirSync(
    uploadDirectory,
    {
        recursive: true
    }
);


const extensionByMimeType = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};


const storage =
    multer.diskStorage({
        destination: (
            req,
            file,
            callback
        ) => {
            callback(
                null,
                uploadDirectory
            );
        },

        filename: (
            req,
            file,
            callback
        ) => {
            const extension =
                extensionByMimeType[
                    file.mimetype
                ] || "";

            callback(
                null,
                `${crypto.randomUUID()}${extension}`
            );
        }
    });


function fileFilter(
    req,
    file,
    callback
) {
    if (
        !Object.prototype
            .hasOwnProperty.call(
                extensionByMimeType,
                file.mimetype
            )
    ) {
        const error =
            new Error(
                "Only JPG, PNG and WebP images are allowed."
            );

        error.statusCode =
            400;

        callback(
            error
        );

        return;
    }

    callback(
        null,
        true
    );
}


async function removeUploadedFiles(
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
                    await fs.promises.unlink(
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
                            "Unable to clean up rejected project image:",
                            error
                        );
                    }
                }
            }
        )
    );
}


const uploader =
    multer({
        storage,

        limits: {
            fileSize:
                MAX_IMAGE_SIZE,

            files:
                MAX_IMAGES_PER_REQUEST
        },

        fileFilter
    });


function projectImageUpload(
    req,
    res,
    next
) {
    uploader.array(
        "images",
        MAX_IMAGES_PER_REQUEST
    )(
        req,
        res,
        async error => {
            if (!error) {
                next();
                return;
            }


            await removeUploadedFiles(
                req.files
            );


            if (
                error instanceof
                multer.MulterError
            ) {
                if (
                    error.code ===
                    "LIMIT_FILE_SIZE"
                ) {
                    return res
                        .status(400)
                        .json({
                            error:
                                "Each project image must be 5 MB or smaller."
                        });
                }

                if (
                    error.code ===
                    "LIMIT_FILE_COUNT"
                ) {
                    return res
                        .status(400)
                        .json({
                            error:
                                "A maximum of five images can be uploaded at once."
                        });
                }

                return res
                    .status(400)
                    .json({
                        error:
                            "Project image upload failed."
                    });
            }


            return res
                .status(
                    error.statusCode ||
                    400
                )
                .json({
                    error:
                        error.message ||
                        "Project image upload failed."
                });
        }
    );
}


module.exports = {
    projectImageUpload,
    uploadDirectory
};