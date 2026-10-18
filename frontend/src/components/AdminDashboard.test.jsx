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


import AdminDashboard
    from "./AdminDashboard";


vi.mock(
    "../context/AuthContext",
    () => ({
        useAuth:
            vi.fn()
    })
);


import {
    useAuth
} from "../context/AuthContext";


const TEST_REPORT = {
    report_id:
        "report-123",

    reporter_user_id:
        "student-1",

    reported_user_id:
        "student-2",

    reported_project_id:
        null,

    reason:
        "Test moderation report",

    status:
        "PENDING",

    created_at:
        "2026-09-13T10:00:00Z"
};


const TEST_MENTOR_APPLICATION = {
    applicationId:
        "mentor-application-1",

    userId:
        "mentor-candidate-1",

    displayName:
        "Dr Mentor",

    email:
        "mentor.candidate@test.com",

    status:
        "PENDING",

    requestedAt:
        "2026-10-08T08:00:00Z"
};


const TEST_SHOWCASE_SUBMISSION = {
    showcase_id:
        "showcase-1",

    project_id:
        "project-1",

    title:
        "Smart Campus Monitor",

    description:
        "A completed student project.",

    category:
        "IoT",

    repository_url:
        "https://github.com/example/project",

    submitted_by:
        "Student Lead",

    created_at:
        "2026-10-08T09:00:00Z"
};


function successfulJsonResponse(
    data
) {
    return {
        ok:
            true,

        json:
            async () =>
                data
    };
}


function failedJsonResponse(
    error,
    message
) {
    return {
        ok:
            false,

        json:
            async () => ({
                error,
                message
            })
    };
}


function createDefaultFetchMock({
    reports = [],
    mentorApplications = [],
    showcaseSubmissions = []
} = {}) {
    return vi.fn(
        async (
            url
        ) => {

            if (
                url ===
                "/api/admin/reports"
            ) {
                return successfulJsonResponse({
                    reports
                });
            }


            if (
                url ===
                "/api/showcase/admin/pending"
            ) {
                return successfulJsonResponse({
                    submissions:
                        showcaseSubmissions
                });
            }


            if (
                url ===
                "/api/admin/mentor-applications"
            ) {
                return successfulJsonResponse({
                    applications:
                        mentorApplications
                });
            }


            throw new Error(
                `Unexpected request: ${url}`
            );
        }
    );
}


describe(
    "AdminDashboard",
    () => {

        beforeEach(() => {

            vi.clearAllMocks();


            useAuth.mockReturnValue({
                token:
                    "test-admin-token",

                user: {
                    id:
                        "admin-1",

                    email:
                        "admin@test.com",

                    role:
                        "ADMIN"
                }
            });


            global.fetch =
                vi.fn();


            window.confirm =
                vi.fn(
                    () => true
                );
        });


        test(
            "loads reports, Showcase approvals and Mentor applications",
            async () => {

                global.fetch =
                    createDefaultFetchMock({
                        reports: [
                            TEST_REPORT
                        ],

                        mentorApplications: [
                            TEST_MENTOR_APPLICATION
                        ],

                        showcaseSubmissions: [
                            TEST_SHOWCASE_SUBMISSION
                        ]
                    });


                render(
                    <AdminDashboard />
                );


                expect(
                    await screen.findByText(
                        "Test moderation report"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Dr Mentor"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "Smart Campus Monitor"
                    )
                ).toBeInTheDocument();


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    "/api/admin/reports",
                    {
                        headers: {
                            Authorization:
                                "Bearer test-admin-token"
                        }
                    }
                );


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    "/api/showcase/admin/pending",
                    {
                        headers: {
                            Authorization:
                                "Bearer test-admin-token"
                        }
                    }
                );


                expect(
                    fetch
                ).toHaveBeenCalledWith(
                    "/api/admin/mentor-applications",
                    {
                        headers: {
                            Authorization:
                                "Bearer test-admin-token"
                        }
                    }
                );
            }
        );


        test(
            "sanitises unsafe report content before displaying it",
            async () => {

                const unsafeReport = {
                    ...TEST_REPORT,

                    reason:
                        '<script>alert("XSS")</script>Safe moderation report'
                };


                global.fetch =
                    createDefaultFetchMock({
                        reports: [
                            unsafeReport
                        ]
                    });


                render(
                    <AdminDashboard />
                );


                expect(
                    await screen.findByText(
                        "Safe moderation report"
                    )
                ).toBeInTheDocument();


                expect(
                    document.querySelector(
                        "script"
                    )
                ).not.toBeInTheDocument();
            }
        );


        test(
            "dismisses a report using the correct PATCH endpoint",
            async () => {

                global.fetch =
                    vi.fn(
                        async (
                            url,
                            options = {}
                        ) => {

                            if (
                                url ===
                                "/api/admin/reports"
                            ) {
                                return successfulJsonResponse({
                                    reports: [
                                        TEST_REPORT
                                    ]
                                });
                            }


                            if (
                                url ===
                                "/api/showcase/admin/pending"
                            ) {
                                return successfulJsonResponse({
                                    submissions: []
                                });
                            }


                            if (
                                url ===
                                "/api/admin/mentor-applications"
                            ) {
                                return successfulJsonResponse({
                                    applications: []
                                });
                            }


                            if (
                                url ===
                                    "/api/admin/reports/report-123/dismiss" &&
                                options.method ===
                                    "PATCH"
                            ) {
                                return successfulJsonResponse({
                                    message:
                                        "Report dismissed successfully."
                                });
                            }


                            throw new Error(
                                `Unexpected request: ${url}`
                            );
                        }
                    );


                render(
                    <AdminDashboard />
                );


                const dismissButton =
                    await screen.findByRole(
                        "button",
                        {
                            name:
                                "Dismiss Report"
                        }
                    );


                fireEvent.click(
                    dismissButton
                );


                await waitFor(
                    () => {

                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            "/api/admin/reports/report-123/dismiss",
                            {
                                method:
                                    "PATCH",

                                headers: {
                                    Authorization:
                                        "Bearer test-admin-token"
                                }
                            }
                        );

                    }
                );


                expect(
                    await screen.findByText(
                        "Report dismissed successfully."
                    )
                ).toBeInTheDocument();


                await waitFor(
                    () => {

                        expect(
                            screen.queryByText(
                                "Test moderation report"
                            )
                        ).not.toBeInTheDocument();

                    }
                );
            }
        );


        test(
            "suspends the reported user using the correct PATCH endpoint",
            async () => {

                global.fetch =
                    vi.fn(
                        async (
                            url,
                            options = {}
                        ) => {

                            if (
                                url ===
                                "/api/admin/reports"
                            ) {
                                return successfulJsonResponse({
                                    reports: [
                                        TEST_REPORT
                                    ]
                                });
                            }


                            if (
                                url ===
                                "/api/showcase/admin/pending"
                            ) {
                                return successfulJsonResponse({
                                    submissions: []
                                });
                            }


                            if (
                                url ===
                                "/api/admin/mentor-applications"
                            ) {
                                return successfulJsonResponse({
                                    applications: []
                                });
                            }


                            if (
                                url ===
                                    "/api/admin/users/student-2/suspend" &&
                                options.method ===
                                    "PATCH"
                            ) {
                                return successfulJsonResponse({
                                    message:
                                        "User suspended successfully."
                                });
                            }


                            throw new Error(
                                `Unexpected request: ${url}`
                            );
                        }
                    );


                render(
                    <AdminDashboard />
                );


                const suspendButton =
                    await screen.findByRole(
                        "button",
                        {
                            name:
                                "Suspend User"
                        }
                    );


                fireEvent.click(
                    suspendButton
                );


                expect(
                    window.confirm
                ).toHaveBeenCalled();


                await waitFor(
                    () => {

                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            "/api/admin/users/student-2/suspend",
                            {
                                method:
                                    "PATCH",

                                headers: {
                                    Authorization:
                                        "Bearer test-admin-token",

                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        reason:
                                            "Suspended from report report-123"
                                    })
                            }
                        );

                    }
                );


                expect(
                    await screen.findByText(
                        "User suspended successfully."
                    )
                ).toBeInTheDocument();
            }
        );


        test(
            "loads and displays a pending Mentor application",
            async () => {

                global.fetch =
                    createDefaultFetchMock({
                        mentorApplications: [
                            TEST_MENTOR_APPLICATION
                        ]
                    });


                render(
                    <AdminDashboard />
                );


                expect(
                    await screen.findByText(
                        "Dr Mentor"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByText(
                        "mentor.candidate@test.com"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Approve Mentor"
                        }
                    )
                ).toBeInTheDocument();


                expect(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "Reject Application"
                        }
                    )
                ).toBeInTheDocument();
            }
        );


        test(
            "approves a Mentor application using the correct PATCH endpoint",
            async () => {

                global.fetch =
                    vi.fn(
                        async (
                            url,
                            options = {}
                        ) => {

                            if (
                                url ===
                                "/api/admin/reports"
                            ) {
                                return successfulJsonResponse({
                                    reports: []
                                });
                            }


                            if (
                                url ===
                                "/api/showcase/admin/pending"
                            ) {
                                return successfulJsonResponse({
                                    submissions: []
                                });
                            }


                            if (
                                url ===
                                "/api/admin/mentor-applications"
                            ) {
                                return successfulJsonResponse({
                                    applications: [
                                        TEST_MENTOR_APPLICATION
                                    ]
                                });
                            }


                            if (
                                url ===
                                    "/api/admin/mentor-applications/mentor-application-1/approve" &&
                                options.method ===
                                    "PATCH"
                            ) {
                                return successfulJsonResponse({
                                    message:
                                        "Mentor application approved successfully."
                                });
                            }


                            throw new Error(
                                `Unexpected request: ${url}`
                            );
                        }
                    );


                render(
                    <AdminDashboard />
                );


                const approveButton =
                    await screen.findByRole(
                        "button",
                        {
                            name:
                                "Approve Mentor"
                        }
                    );


                fireEvent.click(
                    approveButton
                );


                expect(
                    window.confirm
                ).toHaveBeenCalledWith(
                    "Approve Dr Mentor as a Mentor?"
                );


                await waitFor(
                    () => {

                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            "/api/admin/mentor-applications/mentor-application-1/approve",
                            {
                                method:
                                    "PATCH",

                                headers: {
                                    Authorization:
                                        "Bearer test-admin-token"
                                }
                            }
                        );

                    }
                );


                expect(
                    await screen.findByText(
                        "Dr Mentor approved as a Mentor."
                    )
                ).toBeInTheDocument();


                expect(
                    screen.queryByRole(
                        "button",
                        {
                            name:
                                "Approve Mentor"
                        }
                    )
                ).not.toBeInTheDocument();
            }
        );


        test(
            "rejects a Mentor application using the correct PATCH endpoint",
            async () => {

                global.fetch =
                    vi.fn(
                        async (
                            url,
                            options = {}
                        ) => {

                            if (
                                url ===
                                "/api/admin/reports"
                            ) {
                                return successfulJsonResponse({
                                    reports: []
                                });
                            }


                            if (
                                url ===
                                "/api/showcase/admin/pending"
                            ) {
                                return successfulJsonResponse({
                                    submissions: []
                                });
                            }


                            if (
                                url ===
                                "/api/admin/mentor-applications"
                            ) {
                                return successfulJsonResponse({
                                    applications: [
                                        TEST_MENTOR_APPLICATION
                                    ]
                                });
                            }


                            if (
                                url ===
                                    "/api/admin/mentor-applications/mentor-application-1/reject" &&
                                options.method ===
                                    "PATCH"
                            ) {
                                return successfulJsonResponse({
                                    message:
                                        "Mentor application rejected successfully."
                                });
                            }


                            throw new Error(
                                `Unexpected request: ${url}`
                            );
                        }
                    );


                render(
                    <AdminDashboard />
                );


                const rejectButton =
                    await screen.findByRole(
                        "button",
                        {
                            name:
                                "Reject Application"
                        }
                    );


                fireEvent.click(
                    rejectButton
                );


                expect(
                    window.confirm
                ).toHaveBeenCalledWith(
                    "Reject the Mentor application from Dr Mentor?"
                );


                await waitFor(
                    () => {

                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            "/api/admin/mentor-applications/mentor-application-1/reject",
                            {
                                method:
                                    "PATCH",

                                headers: {
                                    Authorization:
                                        "Bearer test-admin-token"
                                }
                            }
                        );

                    }
                );


                expect(
                    await screen.findByText(
                        "Dr Mentor's Mentor application was rejected."
                    )
                ).toBeInTheDocument();


                expect(
                    screen.queryByRole(
                        "button",
                        {
                            name:
                                "Reject Application"
                        }
                    )
                ).not.toBeInTheDocument();
            }
        );


        test(
            "approves a Showcase submission using the correct PATCH endpoint",
            async () => {

                global.fetch =
                    vi.fn(
                        async (
                            url,
                            options = {}
                        ) => {

                            if (
                                url ===
                                "/api/admin/reports"
                            ) {
                                return successfulJsonResponse({
                                    reports: []
                                });
                            }


                            if (
                                url ===
                                "/api/admin/mentor-applications"
                            ) {
                                return successfulJsonResponse({
                                    applications: []
                                });
                            }


                            if (
                                url ===
                                "/api/showcase/admin/pending"
                            ) {
                                return successfulJsonResponse({
                                    submissions: [
                                        TEST_SHOWCASE_SUBMISSION
                                    ]
                                });
                            }


                            if (
                                url ===
                                    "/api/showcase/admin/showcase-1/approve" &&
                                options.method ===
                                    "PATCH"
                            ) {
                                return successfulJsonResponse({
                                    message:
                                        "Showcase submission approved."
                                });
                            }


                            throw new Error(
                                `Unexpected request: ${url}`
                            );
                        }
                    );


                render(
                    <AdminDashboard />
                );


                const approveButton =
                    await screen.findByRole(
                        "button",
                        {
                            name:
                                "Approve Showcase"
                        }
                    );


                fireEvent.click(
                    approveButton
                );


                expect(
                    window.confirm
                ).toHaveBeenCalledWith(
                    'Approve "Smart Campus Monitor" for the public Showcase?'
                );


                await waitFor(
                    () => {

                        expect(
                            fetch
                        ).toHaveBeenCalledWith(
                            "/api/showcase/admin/showcase-1/approve",
                            {
                                method:
                                    "PATCH",

                                headers: {
                                    Authorization:
                                        "Bearer test-admin-token"
                                }
                            }
                        );

                    }
                );


                expect(
                    await screen.findByText(
                        '"Smart Campus Monitor" approved for the public Showcase.'
                    )
                ).toBeInTheDocument();


                expect(
                    screen.queryByRole(
                        "button",
                        {
                            name:
                                "Approve Showcase"
                        }
                    )
                ).not.toBeInTheDocument();
            }
        );


        test(
            "does not render an unsafe Showcase repository URL",
            async () => {

                global.fetch =
                    createDefaultFetchMock({
                        showcaseSubmissions: [
                            {
                                ...TEST_SHOWCASE_SUBMISSION,

                                repository_url:
                                    "javascript:alert('XSS')"
                            }
                        ]
                    });


                render(
                    <AdminDashboard />
                );


                expect(
                    await screen.findByText(
                        "Smart Campus Monitor"
                    )
                ).toBeInTheDocument();


                expect(
                    screen.queryByRole(
                        "link",
                        {
                            name:
                                "Open Repository"
                        }
                    )
                ).not.toBeInTheDocument();
            }
        );


        test(
            "shows an error when reports cannot be loaded",
            async () => {

                global.fetch =
                    vi.fn(
                        async (
                            url
                        ) => {

                            if (
                                url ===
                                "/api/admin/reports"
                            ) {
                                return failedJsonResponse(
                                    "Administrator access required."
                                );
                            }


                            if (
                                url ===
                                "/api/showcase/admin/pending"
                            ) {
                                return successfulJsonResponse({
                                    submissions: []
                                });
                            }


                            if (
                                url ===
                                "/api/admin/mentor-applications"
                            ) {
                                return successfulJsonResponse({
                                    applications: []
                                });
                            }


                            throw new Error(
                                `Unexpected request: ${url}`
                            );
                        }
                    );


                render(
                    <AdminDashboard />
                );


                expect(
                    await screen.findByText(
                        "Administrator access required."
                    )
                ).toBeInTheDocument();


                expect(
                    screen.queryByText(
                        "Test moderation report"
                    )
                ).not.toBeInTheDocument();
            }
        );


        test(
            "handles a non-JSON Admin API error without crashing",
            async () => {

                global.fetch =
                    vi.fn(
                        async (
                            url
                        ) => {

                            if (
                                url ===
                                "/api/admin/reports"
                            ) {
                                return {
                                    ok:
                                        false,

                                    json:
                                        async () => {
                                            throw new Error(
                                                "Invalid JSON"
                                            );
                                        }
                                };
                            }


                            if (
                                url ===
                                "/api/showcase/admin/pending"
                            ) {
                                return successfulJsonResponse({
                                    submissions: []
                                });
                            }


                            if (
                                url ===
                                "/api/admin/mentor-applications"
                            ) {
                                return successfulJsonResponse({
                                    applications: []
                                });
                            }


                            throw new Error(
                                `Unexpected request: ${url}`
                            );
                        }
                    );


                render(
                    <AdminDashboard />
                );


                expect(
                    await screen.findByText(
                        "Unable to load reports."
                    )
                ).toBeInTheDocument();
            }
        );


        test(
            "blocks non-admin users from viewing the dashboard",
            () => {

                useAuth.mockReturnValue({
                    token:
                        "student-token",

                    user: {
                        id:
                            "student-1",

                        email:
                            "student@test.com",

                        role:
                            "STUDENT"
                    }
                });


                render(
                    <AdminDashboard />
                );


                expect(
                    screen.getByText(
                        "You do not have permission to access this page."
                    )
                ).toBeInTheDocument();


                expect(
                    fetch
                ).not.toHaveBeenCalled();
            }
        );
    }
);