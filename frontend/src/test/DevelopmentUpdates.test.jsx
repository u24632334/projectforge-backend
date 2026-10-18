import React from "react";

import {
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";

import DevelopmentUpdates from "../components/DevelopmentUpdates";


vi.mock(
    "../context/AuthContext",
    () => ({
        useAuth: () => ({
            token:
                "fake-test-token",

            user: {
                id:
                    "user-1",

                email:
                    "alex@student.test",

                role:
                    "STUDENT"
            }
        })
    })
);


const PROJECT_ID =
    "project-test-1";


const INITIAL_UPDATES = [
    {
        update_id:
            "update-1",

        author_membership_id:
            "membership-1",

        author_user_id:
            "user-1",

        author_display_name:
            "Alex Student",

        project_id:
            PROJECT_ID,

        content:
            "Completed the initial dashboard layout.",

        created_at:
            "2026-10-08T08:00:00.000Z"
    },

    {
        update_id:
            "update-2",

        author_membership_id:
            "membership-2",

        author_user_id:
            "user-2",

        author_display_name:
            "Sam Student",

        project_id:
            PROJECT_ID,

        content:
            "Configured the sensor inputs.",

        created_at:
            "2026-10-07T08:00:00.000Z"
    }
];


function mockInitialLoad(
    updates =
        INITIAL_UPDATES
) {
    fetch.mockResolvedValueOnce({
        ok: true,

        json: async () => ({
            success: true,
            updates
        })
    });
}


describe(
    "DevelopmentUpdates Integration Tests",
    () => {

        beforeEach(() => {
            global.fetch =
                vi.fn();
        });


        afterEach(() => {
            vi.restoreAllMocks();
        });


        it(
            "loads real development updates from the project API",
            async () => {
                mockInitialLoad();


                render(
                    <DevelopmentUpdates
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                expect(
                    await screen.findByText(
                        "Completed the initial dashboard layout."
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Configured the sensor inputs."
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Alex Student"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Sam Student"
                    )
                ).toBeInTheDocument();


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    `/api/projects/${PROJECT_ID}/development-updates`,
                    {
                        headers: {
                            Authorization:
                                "Bearer fake-test-token"
                        }
                    }
                );
            }
        );


        it(
            "shows Edit only for the authenticated user's update",
            async () => {
                mockInitialLoad();


                render(
                    <DevelopmentUpdates
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Completed the initial dashboard layout."
                );


                expect(
                    screen.getAllByRole(
                        "button",
                        {
                            name:
                                "Edit"
                        }
                    )
                ).toHaveLength(
                    1
                );
            }
        );


        it(
            "posts a new development update and reloads the server list",
            async () => {
                mockInitialLoad();


                fetch
                    .mockResolvedValueOnce({
                        ok: true,

                        json: async () => ({
                            success: true,

                            update: {
                                update_id:
                                    "update-new",

                                author_membership_id:
                                    "membership-1",

                                content:
                                    "Completed the Task Board implementation."
                            }
                        })
                    })

                    .mockResolvedValueOnce({
                        ok: true,

                        json: async () => ({
                            success: true,

                            updates: [
                                {
                                    update_id:
                                        "update-new",

                                    author_membership_id:
                                        "membership-1",

                                    author_user_id:
                                        "user-1",

                                    author_display_name:
                                        "Alex Student",

                                    project_id:
                                        PROJECT_ID,

                                    content:
                                        "Completed the Task Board implementation.",

                                    created_at:
                                        "2026-10-08T09:00:00.000Z"
                                },

                                ...INITIAL_UPDATES
                            ]
                        })
                    });


                render(
                    <DevelopmentUpdates
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Completed the initial dashboard layout."
                );


                const input =
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Development update"
                        }
                    );


                fireEvent.change(
                    input,
                    {
                        target: {
                            value:
                                "Completed the Task Board implementation."
                        }
                    }
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Post Update"
                        }
                    )
                );


                await waitFor(() => {
                    expect(
                        fetch
                    ).toHaveBeenCalledWith(
                        `/api/projects/${PROJECT_ID}/development-updates`,
                        expect.objectContaining({
                            method:
                                "POST"
                        })
                    );
                });


                expect(
                    await screen.findByText(
                        "Completed the Task Board implementation."
                    )
                ).toBeInTheDocument();


                expect(
                    input
                ).toHaveValue(
                    ""
                );


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    3
                );
            }
        );


        it(
            "does not post a blank development update",
            async () => {
                mockInitialLoad();


                render(
                    <DevelopmentUpdates
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Completed the initial dashboard layout."
                );


                const input =
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Development update"
                        }
                    );


                fireEvent.change(
                    input,
                    {
                        target: {
                            value:
                                "   "
                        }
                    }
                );


                const button =
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Post Update"
                        }
                    );


                expect(
                    button
                ).toBeDisabled();


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        it(
            "edits the authenticated user's update and reloads it from the API",
            async () => {
                mockInitialLoad();


                fetch
                    .mockResolvedValueOnce({
                        ok: true,

                        json: async () => ({
                            success: true,

                            update: {
                                update_id:
                                    "update-1",

                                author_membership_id:
                                    "membership-1",

                                content:
                                    "Updated the dashboard implementation."
                            }
                        })
                    })

                    .mockResolvedValueOnce({
                        ok: true,

                        json: async () => ({
                            success: true,

                            updates: [
                                {
                                    ...INITIAL_UPDATES[0],

                                    content:
                                        "Updated the dashboard implementation."
                                },

                                INITIAL_UPDATES[1]
                            ]
                        })
                    });


                render(
                    <DevelopmentUpdates
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Completed the initial dashboard layout."
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Edit"
                        }
                    )
                );


                const editInput =
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Edit update by Alex Student"
                        }
                    );


                fireEvent.change(
                    editInput,
                    {
                        target: {
                            value:
                                "Updated the dashboard implementation."
                        }
                    }
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Save"
                        }
                    )
                );


                await waitFor(() => {
                    expect(
                        fetch
                    ).toHaveBeenCalledWith(
                        `/api/projects/${PROJECT_ID}/development-updates/update-1`,
                        expect.objectContaining({
                            method:
                                "PATCH"
                        })
                    );
                });


                expect(
                    await screen.findByText(
                        "Updated the dashboard implementation."
                    )
                ).toBeInTheDocument();


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    3
                );
            }
        );


        it(
            "cancels an edit without sending a PATCH request",
            async () => {
                mockInitialLoad();


                render(
                    <DevelopmentUpdates
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Completed the initial dashboard layout."
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Edit"
                        }
                    )
                );


                const editInput =
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Edit update by Alex Student"
                        }
                    );


                fireEvent.change(
                    editInput,
                    {
                        target: {
                            value:
                                "This change should be cancelled."
                        }
                    }
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Cancel"
                        }
                    )
                );


                expect(
                    screen.getByText(
                        "Completed the initial dashboard layout."
                    )
                ).toBeInTheDocument();


                expect(
                    screen.queryByText(
                        "This change should be cancelled."
                    )
                ).not.toBeInTheDocument();


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );


        it(
            "shows an empty state when there are no development updates",
            async () => {
                mockInitialLoad([]);


                render(
                    <DevelopmentUpdates
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                expect(
                    await screen.findByText(
                        "No development updates have been posted yet."
                    )
                ).toBeInTheDocument();
            }
        );
    }
);