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

import TaskBoard from "../components/TaskBoard";


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


const MOCK_TASKS = [
    {
        task_id:
            "task-1",

        milestone_id:
            "milestone-1",

        assignee_membership_id:
            "membership-1",

        title:
            "Configure sensor inputs",

        description:
            "Configure the inputs.",

        due_date:
            "2026-10-20",

        status:
            "TODO"
    },

    {
        task_id:
            "task-2",

        milestone_id:
            "milestone-1",

        assignee_membership_id:
            "membership-2",

        title:
            "Build dashboard interface",

        description:
            "Build the frontend.",

        due_date:
            "2026-10-21",

        status:
            "IN_PROGRESS"
    },

    {
        task_id:
            "task-3",

        milestone_id:
            "milestone-2",

        assignee_membership_id:
            null,

        title:
            "Resolve API blocker",

        description:
            "Fix the blocked API.",

        due_date:
            null,

        status:
            "BLOCKED"
    },

    {
        task_id:
            "task-4",

        milestone_id:
            "milestone-2",

        assignee_membership_id:
            "membership-1",

        title:
            "Complete database setup",

        description:
            "Database completed.",

        due_date:
            "2026-10-18",

        status:
            "DONE"
    }
];


const MOCK_MILESTONES = [
    {
        milestone_id:
            "milestone-1",

        project_id:
            PROJECT_ID,

        title:
            "Backend Integration",

        status:
            "OPEN"
    },

    {
        milestone_id:
            "milestone-2",

        project_id:
            PROJECT_ID,

        title:
            "Final Demo",

        status:
            "OPEN"
    }
];


const MOCK_MEMBERS = [
    {
        membershipId:
            "membership-1",

        userId:
            "user-1",

        displayName:
            "Alex Student",

        memberRole:
            "LEAD",

        positionTitle:
            null
    },

    {
        membershipId:
            "membership-2",

        userId:
            "user-2",

        displayName:
            "Sam Student",

        memberRole:
            "MEMBER",

        positionTitle:
            "Frontend Developer"
    }
];


function mockWorkspaceLoad() {
    fetch
        .mockResolvedValueOnce({
            ok: true,

            json: async () => ({
                success: true,
                tasks:
                    MOCK_TASKS
            })
        })

        .mockResolvedValueOnce({
            ok: true,

            json: async () => ({
                success: true,
                milestones:
                    MOCK_MILESTONES
            })
        })

        .mockResolvedValueOnce({
            ok: true,

            json: async () => ({
                success: true,
                members:
                    MOCK_MEMBERS
            })
        });
}


describe(
    "TaskBoard Integration Tests",
    () => {

        beforeEach(() => {
            global.fetch =
                vi.fn();
        });


        afterEach(() => {
            vi.restoreAllMocks();
        });


        it(
            "loads tasks, milestones and project members from the API",
            async () => {
                mockWorkspaceLoad();


                render(
                    <TaskBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                expect(
                    await screen.findByText(
                        "Configure sensor inputs"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Build dashboard interface"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Resolve API blocker"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Complete database setup"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getAllByText(
                        /Alex Student/
                    ).length
                ).toBeGreaterThan(0);


                expect(
                    screen.getAllByText(
                        /Backend Integration/
                    ).length
                ).toBeGreaterThan(0);


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    3
                );


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    `/api/projects/${PROJECT_ID}/tasks`,
                    {
                        headers: {
                            Authorization:
                                "Bearer fake-test-token"
                        }
                    }
                );


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


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    `/api/projects/${PROJECT_ID}/members`,
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
            "moves a TODO task to IN_PROGRESS and sends a PATCH request",
            async () => {
                mockWorkspaceLoad();


                fetch.mockResolvedValueOnce({
                    ok: true,

                    json: async () => ({
                        success: true,

                        task: {
                            ...MOCK_TASKS[0],

                            status:
                                "IN_PROGRESS"
                        }
                    })
                });


                render(
                    <TaskBoard
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
                                "Change status for Configure sensor inputs"
                        }
                    );


                expect(
                    statusSelect
                ).toHaveValue(
                    "TODO"
                );


                fireEvent.change(
                    statusSelect,
                    {
                        target: {
                            value:
                                "IN_PROGRESS"
                        }
                    }
                );


                await waitFor(() => {
                    expect(
                        fetch
                    ).toHaveBeenCalledWith(
                        `/api/projects/${PROJECT_ID}/tasks/task-1`,
                        expect.objectContaining({
                            method:
                                "PATCH"
                        })
                    );
                });


                await waitFor(() => {
                    expect(
                        screen.getByRole(
                            "combobox",
                            {
                                name:
                                    "Change status for Configure sensor inputs"
                            }
                        )
                    ).toHaveValue(
                        "IN_PROGRESS"
                    );
                });
            }
        );


        it(
            "creates a task using a real milestone and project member",
            async () => {
                mockWorkspaceLoad();


                fetch.mockResolvedValueOnce({
                    ok: true,

                    json: async () => ({
                        success: true,

                        task: {
                            task_id:
                                "task-new",

                            milestone_id:
                                "milestone-1",

                            assignee_membership_id:
                                "membership-2",

                            title:
                                "Test new task",

                            description:
                                "Test task description",

                            due_date:
                                null,

                            status:
                                "TODO"
                        }
                    })
                });


                render(
                    <TaskBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Configure sensor inputs"
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "ADD TASK"
                        }
                    )
                );


                fireEvent.change(
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Task title"
                        }
                    ),
                    {
                        target: {
                            value:
                                "Test new task"
                        }
                    }
                );


                fireEvent.change(
                    screen.getByRole(
                        "textbox",
                        {
                            name:
                                "Task description"
                        }
                    ),
                    {
                        target: {
                            value:
                                "Test task description"
                        }
                    }
                );


                fireEvent.change(
                    screen.getByRole(
                        "combobox",
                        {
                            name:
                                "Task assignee"
                        }
                    ),
                    {
                        target: {
                            value:
                                "membership-2"
                        }
                    }
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "DEPLOY TASK"
                        }
                    )
                );


                expect(
                    await screen.findByText(
                        "Test new task"
                    )
                ).toBeInTheDocument();


                await waitFor(() => {
                    expect(
                        fetch
                    ).toHaveBeenCalledWith(
                        `/api/projects/${PROJECT_ID}/tasks`,
                        expect.objectContaining({
                            method:
                                "POST"
                        })
                    );
                });


                const postCall =
                    fetch.mock.calls.find(
                        ([url, options]) =>
                            url ===
                                `/api/projects/${PROJECT_ID}/tasks` &&
                            options?.method ===
                                "POST"
                    );


                expect(
                    postCall
                ).toBeDefined();


                const requestBody =
                    JSON.parse(
                        postCall[1].body
                    );


                expect(
                    requestBody
                ).toEqual(
                    expect.objectContaining({
                        milestoneId:
                            "milestone-1",

                        assigneeMembershipId:
                            "membership-2",

                        title:
                            "Test new task",

                        status:
                            "TODO"
                    })
                );
            }
        );


        it(
            "does not create a task without a title",
            async () => {
                mockWorkspaceLoad();


                render(
                    <TaskBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Configure sensor inputs"
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "ADD TASK"
                        }
                    )
                );


                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "DEPLOY TASK"
                        }
                    )
                );


                expect(
                    fetch
                ).toHaveBeenCalledTimes(
                    3
                );


                const postCall =
                    fetch.mock.calls.find(
                        ([url, options]) =>
                            url ===
                                `/api/projects/${PROJECT_ID}/tasks` &&
                            options?.method ===
                                "POST"
                    );


                expect(
                    postCall
                ).toBeUndefined();
            }
        );


        it(
            "shows all four backend task statuses",
            async () => {
                mockWorkspaceLoad();


                render(
                    <TaskBoard
                        projectId={
                            PROJECT_ID
                        }
                    />
                );


                await screen.findByText(
                    "Configure sensor inputs"
                );


                expect(
                    screen.getByRole(
                        "heading",
                        {
                            name:
                                "TO DO"
                        }
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByRole(
                        "heading",
                        {
                            name:
                                "IN PROGRESS"
                        }
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByRole(
                        "heading",
                        {
                            name:
                                "BLOCKED"
                        }
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByRole(
                        "heading",
                        {
                            name:
                                "DONE"
                        }
                    )
                ).toBeInTheDocument();
            }
        );
    }
);