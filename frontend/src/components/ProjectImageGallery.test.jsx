import {
    render,
    screen
} from "@testing-library/react";

import {
    describe,
    expect,
    test
} from "vitest";

import ProjectImageGallery
    from "./ProjectImageGallery";


describe(
    "ProjectImageGallery",
    () => {

        test(
            "renders valid project images",
            () => {
                render(
                    <ProjectImageGallery
                        images={[
                            {
                                imageId:
                                    "image-1",

                                imageUrl:
                                    "/api/project-images/files/one.jpg",

                                originalName:
                                    "Prototype.jpg",

                                displayOrder:
                                    1
                            },

                            {
                                imageId:
                                    "image-2",

                                imageUrl:
                                    "/api/project-images/files/two.png",

                                originalName:
                                    "Final.png",

                                displayOrder:
                                    2
                            }
                        ]}
                    />
                );

                expect(
                    screen.getByAltText(
                        "Prototype.jpg"
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByAltText(
                        "Final.png"
                    )
                ).toBeInTheDocument();
            }
        );


        test(
            "orders images by display order",
            () => {
                render(
                    <ProjectImageGallery
                        images={[
                            {
                                imageId:
                                    "image-2",

                                imageUrl:
                                    "/api/project-images/files/two.jpg",

                                originalName:
                                    "Second.jpg",

                                displayOrder:
                                    2
                            },

                            {
                                imageId:
                                    "image-1",

                                imageUrl:
                                    "/api/project-images/files/one.jpg",

                                originalName:
                                    "First.jpg",

                                displayOrder:
                                    1
                            }
                        ]}
                    />
                );

                const images =
                    screen.getAllByRole(
                        "img"
                    );

                expect(
                    images[0]
                ).toHaveAttribute(
                    "alt",
                    "First.jpg"
                );

                expect(
                    images[1]
                ).toHaveAttribute(
                    "alt",
                    "Second.jpg"
                );
            }
        );


        test(
            "rejects unsafe external image URLs",
            () => {
                render(
                    <ProjectImageGallery
                        images={[
                            {
                                imageId:
                                    "bad-image",

                                imageUrl:
                                    "https://evil.example/image.jpg",

                                originalName:
                                    "Unsafe.jpg",

                                displayOrder:
                                    1
                            }
                        ]}
                    />
                );

                expect(
                    screen.queryByRole(
                        "img"
                    )
                ).not.toBeInTheDocument();
            }
        );


        test(
            "shows an empty state when requested",
            () => {
                render(
                    <ProjectImageGallery
                        images={[]}
                        showEmpty
                    />
                );

                expect(
                    screen.getByText(
                        "No project images were uploaded."
                    )
                ).toBeInTheDocument();
            }
        );

    }
);