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

import TeamRadioAlert from "../components/TeamRadioAlert";


vi.mock(
    "../context/AuthContext",
    () => ({
        useAuth: () => ({
            token:
                "fake-test-token"
        })
    })
);


const PROJECT_ID =
    "project-test-1";


const INITIAL_REQUESTS = [
    {
        radio_id:
            "radio-1",

        author_membership_id:
            "membership-1",

        author_display_name:
            "Alex Student",

        category:
            "TECHNICAL",

        message:
            "Energy meter hardware unavailable",

        status:
            "OPEN",

        created_at:
            "2026-10-07T08:00:00.000Z",

        project_id:
            PROJECT_ID
    },

    {
        radio_id:
            "radio-2",

        author_membership_id:
            "membership-2",

        author_display_name:
            "Sam Student",

        category:
            "DEPENDENCY",

        message:
            "Waiting for API credentials",

        status:
            "OPEN",

        created_at:
            "2026-10-06T08:00:00.000Z",

        project_id:
            PROJECT_ID
    },

    {
        radio_id:
            "radio-3",

        author_membership_id:
            "membership-1",

        author_display_name:
            "Alex Student",

        category:
            "RESOURCE",

        message:
            "Resolved equipment request",

        status:
            "RESOLVED",

        created_at:
            "2026-10-05T08:00:00.000Z",

        project_id:
            PROJECT_ID
    }
];


function mockRequestList(
    requests =
        INITIAL_REQUESTS
) {
    fetch.mockResolvedValueOnce({
        ok:
            true,

        json:
            async () => ({
                success:
                    true,

                requests
            })
    });
}


describe(
    "TeamRadioAlert Integration Tests",
    () => {

        beforeEach(
            () => {
                global.fetch =
                    vi.fn();
            }
        );


        afterEach(
            () => {
                vi.restoreAllMocks();
            }
        );


        it(
            "loads open and resolved assistance requests",
            async () => {

                mockRequestList();


                render(
                    <TeamRadioAlert
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                expect(
                    await screen.findByText(
                        "Energy meter hardware unavailable"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Waiting for API credentials"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Resolved equipment request"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "2 unresolved blockers"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "ACTION REQUIRED"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Resolved Requests"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "1 resolved"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getAllByText(
                        /Reported by Alex Student/
                    ).length
                ).toBeGreaterThanOrEqual(
                    1
                );


                expect(
                    screen.getAllByRole(
                        "button",
                        {
                            name:
                                "Resolve"
                        }
                    )
                ).toHaveLength(
                    2
                );


                expect(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Reopen"
                        }
                    )
                ).toBeInTheDocument();


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    `/api/projects/${PROJECT_ID}/assistance-requests`,
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
            "submits a new assistance request and reloads the server list",
            async () => {

                fetch
                    .mockResolvedValueOnce({
                        ok:
                            true,

                        json:
                            async () => ({
                                success:
                                    true,

                                requests:
                                    INITIAL_REQUESTS
                            })
                    })

                    .mockResolvedValueOnce({
                        ok:
                            true,

                        json:
                            async () => ({
                                success:
                                    true,

                                request: {
                                    radio_id:
                                        "radio-new",

                                    message:
                                        "Database connection failing",

                                    status:
                                        "OPEN"
                                }
                            })
                    })

                    .mockResolvedValueOnce({
                        ok:
                            true,

                        json:
                            async () => ({
                                success:
                                    true,

                                requests: [
                                    {
                                        radio_id:
                                            "radio-new",

                                        author_membership_id:
                                            "membership-1",

                                        author_display_name:
                                            "Alex Student",

                                        category:
                                            "TECHNICAL",

                                        message:
                                            "Database connection failing",

                                        status:
                                            "OPEN",

                                        created_at:
                                            "2026-10-08T08:00:00.000Z",

                                        project_id:
                                            PROJECT_ID
                                    },

                                    ...INITIAL_REQUESTS
                                ]
                            })
                    });


                render(
                    <TeamRadioAlert
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Energy meter hardware unavailable"
                );


                fireEvent.change(
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Assistance request message"
                        }
                    ),
                    {
                        target: {
                            value:
                                "Database connection failing"
                        }
                    }
                );


                fireEvent.change(
                    screen.getByRole(
                        "combobox",
                        {
                            name:
                                "Assistance request category"
                        }
                    ),
                    {
                        target: {
                            value:
                                "TECHNICAL"
                        }
                    }
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Send Request"
                        }
                    )
                );


                await waitFor(
                    () => {
                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            `/api/projects/${PROJECT_ID}/assistance-requests`,
                            expect.objectContaining({
                                method:
                                    "POST"
                            })
                        );
                    }
                );


                expect(
                    await screen.findByText(
                        "Database connection failing"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "3 unresolved blockers"
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
            "does not submit an empty assistance request",
            async () => {

                mockRequestList(
                    []
                );


                render(
                    <TeamRadioAlert
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "No open assistance requests."
                );


                const button =
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Send Request"
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


                const postCall =
                    fetch.mock.calls.find(
                        (
                            [
                                url,
                                options
                            ]
                        ) =>
                            url ===
                                `/api/projects/${PROJECT_ID}/assistance-requests` &&
                            options?.method ===
                                "POST"
                    );


                expect(
                    postCall
                ).toBeUndefined();
            }
        );


        it(
            "shows resolved request history when there are no open requests",
            async () => {

                mockRequestList([
                    {
                        radio_id:
                            "radio-resolved",

                        author_membership_id:
                            "membership-1",

                        author_display_name:
                            "Alex Student",

                        category:
                            "TECHNICAL",

                        message:
                            "Old resolved blocker",

                        status:
                            "RESOLVED",

                        created_at:
                            "2026-10-01T08:00:00.000Z",

                        project_id:
                            PROJECT_ID
                    }
                ]);


                render(
                    <TeamRadioAlert
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                expect(
                    await screen.findByText(
                        "No open assistance requests."
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "0 unresolved blockers"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.queryByText(
                        "ACTION REQUIRED"
                    )
                ).not.toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Old resolved blocker"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Resolved Requests"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "1 resolved"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Reopen"
                        }
                    )
                ).toBeInTheDocument();
            }
        );


        it(
            "resolves an open assistance request and sends the resolve PATCH request",
            async () => {

                mockRequestList();


                fetch
                    .mockResolvedValueOnce({
                        ok:
                            true,

                        json:
                            async () => ({
                                success:
                                    true,

                                request: {
                                    radio_id:
                                        "radio-1",

                                    status:
                                        "RESOLVED"
                                }
                            })
                    })

                    .mockResolvedValueOnce({
                        ok:
                            true,

                        json:
                            async () => ({
                                success:
                                    true,

                                requests: [
                                    {
                                        ...INITIAL_REQUESTS[0],

                                        status:
                                            "RESOLVED"
                                    },

                                    INITIAL_REQUESTS[1],
                                    INITIAL_REQUESTS[2]
                                ]
                            })
                    });


                render(
                    <TeamRadioAlert
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Energy meter hardware unavailable"
                );


                const resolveButtons =
                    screen.getAllByRole(
                        "button",
                        {
                            name:
                                "Resolve"
                        }
                    );


                fireEvent.click(
                    resolveButtons[0]
                );


                await waitFor(
                    () => {
                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            `/api/projects/${PROJECT_ID}/assistance-requests/radio-1/resolve`,
                            expect.objectContaining({
                                method:
                                    "PATCH",

                                headers: {
                                    Authorization:
                                        "Bearer fake-test-token"
                                }
                            })
                        );
                    }
                );


                await waitFor(
                    () => {
                        expect(
                            screen.getByText(
                                "1 unresolved blocker"
                            )
                        ).toBeInTheDocument();
                    }
                );


                expect(
                    screen.getByText(
                        "2 resolved"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Energy meter hardware unavailable"
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
            "reopens a resolved assistance request and sends the reopen PATCH request",
            async () => {

                mockRequestList();


                fetch
                    .mockResolvedValueOnce({
                        ok:
                            true,

                        json:
                            async () => ({
                                success:
                                    true,

                                request: {
                                    radio_id:
                                        "radio-3",

                                    status:
                                        "OPEN"
                                }
                            })
                    })

                    .mockResolvedValueOnce({
                        ok:
                            true,

                        json:
                            async () => ({
                                success:
                                    true,

                                requests: [
                                    INITIAL_REQUESTS[0],
                                    INITIAL_REQUESTS[1],
                                    {
                                        ...INITIAL_REQUESTS[2],

                                        status:
                                            "OPEN"
                                    }
                                ]
                            })
                    });


                render(
                    <TeamRadioAlert
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Resolved equipment request"
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Reopen"
                        }
                    )
                );


                await waitFor(
                    () => {
                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            `/api/projects/${PROJECT_ID}/assistance-requests/radio-3/reopen`,
                            expect.objectContaining({
                                method:
                                    "PATCH",

                                headers: {
                                    Authorization:
                                        "Bearer fake-test-token"
                                }
                            })
                        );
                    }
                );


                await waitFor(
                    () => {
                        expect(
                            screen.getByText(
                                "3 unresolved blockers"
                            )
                        ).toBeInTheDocument();
                    }
                );


                expect(
                    screen.queryByText(
                        "Resolved Requests"
                    )
                ).not.toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Resolved equipment request"
                    )
                ).toBeInTheDocument();


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    3
                );
            }
        );

    }
);