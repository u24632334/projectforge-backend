import {
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";

import {
    beforeEach,
    describe,
    expect,
    test,
    vi
} from "vitest";

import ProjectImageManager
    from "./ProjectImageManager";

import {
    useAuth
} from "../context/AuthContext";


vi.mock(
    "../context/AuthContext",
    () => ({
        useAuth:
            vi.fn()
    })
);


function successfulJsonResponse(
    data
) {
    return {
        ok:
            true,

        status:
            200,

        json:
            async () =>
                data
    };
}


describe(
    "ProjectImageManager",
    () => {

        beforeEach(
            () => {
                vi.clearAllMocks();

                useAuth.mockReturnValue({
                    token:
                        "student-token",

                    user: {
                        id:
                            "student-1",

                        role:
                            "STUDENT"
                    }
                });

                global.fetch =
                    vi.fn();
            }
        );


        test(
            "loads existing project images",
            async () => {
                fetch.mockResolvedValueOnce(
                    successfulJsonResponse({
                        images: [
                            {
                                imageId:
                                    "image-1",

                                imageUrl:
                                    "/api/project-images/files/test-image.jpg",

                                originalName:
                                    "Prototype.jpg",

                                displayOrder:
                                    1
                            }
                        ]
                    })
                );

                render(
                    <ProjectImageManager
                        projectId="project-1"
                    />
                );

                expect(
                    screen.getByText(
                        "Loading project images..."
                    )
                ).toBeInTheDocument();

                expect(
                    await screen.findByAltText(
                        "Prototype.jpg"
                    )
                ).toBeInTheDocument();

                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    "/api/projects/project-1/images",
                    {
                        headers: {
                            Authorization:
                                "Bearer student-token"
                        }
                    }
                );
            }
        );


        test(
            "shows an empty state when the project has no images",
            async () => {
                fetch.mockResolvedValueOnce(
                    successfulJsonResponse({
                        images:
                            []
                    })
                );

                render(
                    <ProjectImageManager
                        projectId="project-1"
                    />
                );

                expect(
                    await screen.findByText(
                        "No project images have been uploaded yet."
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByText(
                        "0/5"
                    )
                ).toBeInTheDocument();
            }
        );


        test(
            "rejects unsupported files before upload",
            async () => {
                fetch.mockResolvedValueOnce(
                    successfulJsonResponse({
                        images:
                            []
                    })
                );

                render(
                    <ProjectImageManager
                        projectId="project-1"
                    />
                );

                await screen.findByText(
                    "No project images have been uploaded yet."
                );

                const file =
                    new File(
                        [
                            "not-an-image"
                        ],
                        "notes.txt",
                        {
                            type:
                                "text/plain"
                        }
                    );

                fireEvent.change(
                    screen.getByLabelText(
                        "Add Project Images"
                    ),
                    {
                        target: {
                            files: [
                                file
                            ]
                        }
                    }
                );

                expect(
                    await screen.findByRole(
                        "alert"
                    )
                ).toHaveTextContent(
                    "Only JPG, PNG and WebP images are allowed."
                );

                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        test(
            "uploads a valid image using multipart form data",
            async () => {
                fetch
                    .mockResolvedValueOnce(
                        successfulJsonResponse({
                            images:
                                []
                        })
                    )
                    .mockResolvedValueOnce({
                        ok:
                            true,

                        status:
                            201,

                        json:
                            async () => ({
                                message:
                                    "Project image uploaded successfully.",

                                images: [
                                    {
                                        imageId:
                                            "image-new",

                                        imageUrl:
                                            "/api/project-images/files/new-image.png",

                                        originalName:
                                            "Prototype.png",

                                        displayOrder:
                                            1
                                    }
                                ]
                            })
                    });

                render(
                    <ProjectImageManager
                        projectId="project-1"
                    />
                );

                await screen.findByText(
                    "No project images have been uploaded yet."
                );

                const file =
                    new File(
                        [
                            "image-content"
                        ],
                        "Prototype.png",
                        {
                            type:
                                "image/png"
                        }
                    );

                fireEvent.change(
                    screen.getByLabelText(
                        "Add Project Images"
                    ),
                    {
                        target: {
                            files: [
                                file
                            ]
                        }
                    }
                );

                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Upload Image"
                        }
                    )
                );

                await waitFor(
                    () => {
                        expect(
                            fetch
                        ).toHaveBeenCalledTimes(
                            2
                        );
                    }
                );

                const [
                    uploadUrl,
                    uploadOptions
                ] =
                    fetch.mock.calls[1];

                expect(
                    uploadUrl
                ).toBe(
                    "/api/projects/project-1/images"
                );

                expect(
                    uploadOptions.method
                ).toBe(
                    "POST"
                );

                expect(
                    uploadOptions.headers
                ).toEqual({
                    Authorization:
                        "Bearer student-token"
                });

                expect(
                    uploadOptions.body
                ).toBeInstanceOf(
                    FormData
                );

                expect(
                    await screen.findByAltText(
                        "Prototype.png"
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByRole(
                        "status"
                    )
                ).toHaveTextContent(
                    "Project image uploaded successfully."
                );
            }
        );


        test(
            "disables image changes once the showcase is locked",
            async () => {
                fetch.mockResolvedValueOnce(
                    successfulJsonResponse({
                        images: [
                            {
                                imageId:
                                    "image-1",

                                imageUrl:
                                    "/api/project-images/files/locked.jpg",

                                originalName:
                                    "Locked.jpg",

                                displayOrder:
                                    1
                            }
                        ]
                    })
                );

                render(
                    <ProjectImageManager
                        projectId="project-1"
                        showcaseLocked
                    />
                );

                await screen.findByAltText(
                    "Locked.jpg"
                );

                expect(
                    screen.getByText(
                        /Images are locked because this project has already been submitted/i
                    )
                ).toBeInTheDocument();

                expect(
                    screen.queryByRole(
                        "button",
                        {
                            name:
                                "Remove"
                        }
                    )
                ).not.toBeInTheDocument();

                expect(
                    screen.queryByLabelText(
                        "Add Project Images"
                    )
                ).not.toBeInTheDocument();
            }
        );

    }
);