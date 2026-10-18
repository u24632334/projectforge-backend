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

import MilestoneBoard from "../components/MilestoneBoard";


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


const STORED_MILESTONES = [
    {
        milestone_id:
            "milestone-1",

        project_id:
            PROJECT_ID,

        title:
            "Prototype Complete",

        description:
            "Initial prototype completed.",

        due_date:
            "2026-09-20",

        status:
            "COMPLETE"
    },

    {
        milestone_id:
            "milestone-2",

        project_id:
            PROJECT_ID,

        title:
            "Backend Integration",

        description:
            "Connect backend services.",

        due_date:
            "2026-09-27",

        status:
            "OPEN"
    }
];


function mockMilestoneList(
    milestones =
        STORED_MILESTONES
) {
    fetch.mockResolvedValueOnce({
        ok:
            true,

        json:
            async () => ({
                success:
                    true,

                milestones
            })
    });
}


describe(
    "MilestoneBoard Integration Tests",
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
            "loads milestones from the project API",
            async () => {

                mockMilestoneList();


                render(
                    <MilestoneBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                expect(
                    await screen
                        .findByText(
                            "Prototype Complete"
                        )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Backend Integration"
                    )
                ).toBeInTheDocument();


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    `/api/projects/${PROJECT_ID}/milestones`,
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
            "shows an empty state when the project has no milestones",
            async () => {

                mockMilestoneList(
                    []
                );


                render(
                    <MilestoneBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                expect(
                    await screen
                        .findByText(
                            "No milestones have been created for this project yet."
                        )
                ).toBeInTheDocument();
            }
        );


        it(
            "creates a new milestone and sends a POST request",
            async () => {

                mockMilestoneList(
                    []
                );


                fetch.mockResolvedValueOnce({
                    ok:
                        true,

                    json:
                        async () => ({
                            success:
                                true,

                            milestone: {
                                milestone_id:
                                    "milestone-new",

                                project_id:
                                    PROJECT_ID,

                                title:
                                    "Testing Complete",

                                description:
                                    "Complete all project tests.",

                                due_date:
                                    null,

                                status:
                                    "OPEN"
                            }
                        })
                });


                render(
                    <MilestoneBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "No milestones have been created for this project yet."
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Add Milestone"
                        }
                    )
                );


                fireEvent.change(
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Milestone title"
                        }
                    ),
                    {
                        target: {
                            value:
                                "Testing Complete"
                        }
                    }
                );


                fireEvent.change(
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Milestone description"
                        }
                    ),
                    {
                        target: {
                            value:
                                "Complete all project tests."
                        }
                    }
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Create Milestone"
                        }
                    )
                );


                expect(
                    await screen
                        .findByText(
                            "Testing Complete"
                        )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Complete all project tests."
                    )
                ).toBeInTheDocument();


                await waitFor(
                    () => {
                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            `/api/projects/${PROJECT_ID}/milestones`,
                            expect.objectContaining({
                                method:
                                    "POST"
                            })
                        );
                    }
                );
            }
        );


        it(
            "does not create a milestone without a title",
            async () => {

                mockMilestoneList(
                    []
                );


                render(
                    <MilestoneBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "No milestones have been created for this project yet."
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Add Milestone"
                        }
                    )
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Create Milestone"
                        }
                    )
                );


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    1
                );


                expect(
                    fetch
                ).not.toHaveBeenCalledWith(
                    `/api/projects/${PROJECT_ID}/milestones`,
                    expect.objectContaining({
                        method:
                            "POST"
                    })
                );
            }
        );


        it(
            "completes an open milestone and sends the close PATCH request",
            async () => {

                mockMilestoneList();


                fetch.mockResolvedValueOnce({
                    ok:
                        true,

                    json:
                        async () => ({
                            success:
                                true,

                            milestone: {
                                milestone_id:
                                    "milestone-2",

                                project_id:
                                    PROJECT_ID,

                                title:
                                    "Backend Integration",

                                description:
                                    "Connect backend services.",

                                due_date:
                                    "2026-09-27",

                                status:
                                    "COMPLETE"
                            }
                        })
                });


                render(
                    <MilestoneBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                const statusSelect =
                    await screen.findByRole(
                        "combobox",
                        {
                            name:
                                "Change status for Backend Integration"
                        }
                    );


                expect(
                    statusSelect
                ).toHaveValue(
                    "OPEN"
                );


                fireEvent.change(
                    statusSelect,
                    {
                        target: {
                            value:
                                "COMPLETE"
                        }
                    }
                );


                await waitFor(
                    () => {
                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            `/api/projects/${PROJECT_ID}/milestones/milestone-2/close`,
                            expect.objectContaining({
                                method:
                                    "PATCH"
                            })
                        );
                    }
                );


                await waitFor(
                    () => {
                        expect(
                            statusSelect
                        ).toHaveValue(
                            "COMPLETE"
                        );
                    }
                );
            }
        );


        it(
            "reopens a completed milestone and sends the reopen PATCH request",
            async () => {

                mockMilestoneList();


                fetch.mockResolvedValueOnce({
                    ok:
                        true,

                    json:
                        async () => ({
                            success:
                                true,

                            milestone: {
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    PROJECT_ID,

                                title:
                                    "Prototype Complete",

                                description:
                                    "Initial prototype completed.",

                                due_date:
                                    "2026-09-20",

                                status:
                                    "OPEN"
                            }
                        })
                });


                render(
                    <MilestoneBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                const statusSelect =
                    await screen.findByRole(
                        "combobox",
                        {
                            name:
                                "Change status for Prototype Complete"
                        }
                    );


                expect(
                    statusSelect
                ).toHaveValue(
                    "COMPLETE"
                );


                expect(
                    statusSelect
                ).not.toBeDisabled();


                fireEvent.change(
                    statusSelect,
                    {
                        target: {
                            value:
                                "OPEN"
                        }
                    }
                );


                await waitFor(
                    () => {
                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            `/api/projects/${PROJECT_ID}/milestones/milestone-1/reopen`,
                            expect.objectContaining({
                                method:
                                    "PATCH"
                            })
                        );
                    }
                );


                await waitFor(
                    () => {
                        expect(
                            statusSelect
                        ).toHaveValue(
                            "OPEN"
                        );
                    }
                );
            }
        );

    }
);