import React, {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    useAuth
} from "../context/AuthContext";

import {
    sanitizeText
} from "../utils/sanitize.js";

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import ProjectImageGallery
    from "./ProjectImageGallery";

import "./AdminDashboard.css";


async function readResponseJson(
    response
) {
    try {
        return await response.json();
    }
    catch {
        return {};
    }
}


function getMentorApplicationId(
    application
) {
    return (
        application?.applicationId ||
        application?.application_id ||
        ""
    );
}


function getMentorApplicantName(
    application
) {
    return (
        application?.displayName ||
        application?.display_name ||
        application?.applicantName ||
        application?.applicant_name ||
        application?.email ||
        "Mentor Applicant"
    );
}


function getMentorApplicantEmail(
    application
) {
    return (
        application?.email ||
        application?.applicantEmail ||
        application?.applicant_email ||
        ""
    );
}


function getMentorRequestedAt(
    application
) {
    return (
        application?.requestedAt ||
        application?.requested_at ||
        null
    );
}


function getSafeRepositoryUrl(
    value
) {
    if (
        typeof value !== "string"
    ) {
        return "";
    }


    const trimmed =
        value.trim();


    if (!trimmed) {
        return "";
    }


    try {
        const url =
            new URL(trimmed);


        if (
            url.protocol !==
            "https:"
        ) {
            return "";
        }


        const hostname =
            url.hostname
                .toLowerCase();


        if (
            hostname !==
                "github.com" &&
            hostname !==
                "www.github.com" &&
            hostname !==
                "gitlab.com" &&
            hostname !==
                "www.gitlab.com"
        ) {
            return "";
        }


        return url.toString();
    }
    catch {
        return "";
    }
}


function AdminDashboard() {
    const {
        token,
        user
    } = useAuth();


    const [
        reports,
        setReports
    ] = useState([]);


    const [
        showcaseSubmissions,
        setShowcaseSubmissions
    ] = useState([]);


    const [
        mentorApplications,
        setMentorApplications
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        showcaseLoading,
        setShowcaseLoading
    ] = useState(true);


    const [
        mentorLoading,
        setMentorLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    const [
        message,
        setMessage
    ] = useState("");


    const [
        actionFeedbackActive,
        setActionFeedbackActive
    ] = useState(false);


    // ADMIN_DASHBOARD_FEEDBACK_SPLIT
    useAutoDismissFeedback(
        actionFeedbackActive &&
            Boolean(
                error
            ),
        () => {
            setError("");
            setActionFeedbackActive(
                false
            );
        }
    );


    useAutoDismissFeedback(
        Boolean(
            message
        ),
        () => {
            setMessage("");
        }
    );


    const [
        busyReportId,
        setBusyReportId
    ] = useState(null);


    const [
        busyShowcaseId,
        setBusyShowcaseId
    ] = useState(null);


    const [
        busyMentorApplicationId,
        setBusyMentorApplicationId
    ] = useState(null);


    const loadReports =
        useCallback(
            async () => {

                // ADMIN_REPORT_LOAD_FEEDBACK
                setActionFeedbackActive(
                    false
                );

                if (!token) {
                    setReports([]);
                    setLoading(false);

                    return;
                }


                setLoading(true);


                try {
                    const response =
                        await fetch(
                            "/api/admin/reports",
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await readResponseJson(
                            response
                        );


                    if (!response.ok) {
                        throw new Error(
                            data.error ||
                            data.message ||
                            "Unable to load reports."
                        );
                    }


                    setReports(
                        Array.isArray(
                            data.reports
                        )
                            ? data.reports
                            : []
                    );
                }
                catch (
                    loadError
                ) {
                    setError(
                        loadError.message ||
                        "Unable to load reports."
                    );

                    setReports([]);
                }
                finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                token
            ]
        );


    const loadShowcaseSubmissions =
        useCallback(
            async () => {

                // ADMIN_SHOWCASE_LOAD_FEEDBACK
                setActionFeedbackActive(
                    false
                );

                if (!token) {
                    setShowcaseSubmissions(
                        []
                    );

                    setShowcaseLoading(
                        false
                    );

                    return;
                }


                setShowcaseLoading(
                    true
                );


                try {
                    const response =
                        await fetch(
                            "/api/showcase/admin/pending",
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await readResponseJson(
                            response
                        );


                    if (!response.ok) {
                        throw new Error(
                            data.error ||
                            data.message ||
                            "Unable to load showcase submissions."
                        );
                    }


                    setShowcaseSubmissions(
                        Array.isArray(
                            data.submissions
                        )
                            ? data.submissions
                            : []
                    );
                }
                catch (
                    loadError
                ) {
                    setError(
                        loadError.message ||
                        "Unable to load showcase submissions."
                    );

                    setShowcaseSubmissions(
                        []
                    );
                }
                finally {
                    setShowcaseLoading(
                        false
                    );
                }
            },
            [
                token
            ]
        );


    const loadMentorApplications =
        useCallback(
            async () => {

                // ADMIN_MENTOR_LOAD_FEEDBACK
                setActionFeedbackActive(
                    false
                );

                if (!token) {
                    setMentorApplications(
                        []
                    );

                    setMentorLoading(
                        false
                    );

                    return;
                }


                setMentorLoading(
                    true
                );


                try {
                    const response =
                        await fetch(
                            "/api/admin/mentor-applications",
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    const data =
                        await readResponseJson(
                            response
                        );


                    if (!response.ok) {
                        throw new Error(
                            data.error ||
                            data.message ||
                            "Unable to load Mentor applications."
                        );
                    }


                    const applications =
                        data.applications ||
                        data.mentorApplications ||
                        data.mentor_applications ||
                        [];


                    setMentorApplications(
                        Array.isArray(
                            applications
                        )
                            ? applications
                            : []
                    );
                }
                catch (
                    loadError
                ) {
                    setError(
                        loadError.message ||
                        "Unable to load Mentor applications."
                    );

                    setMentorApplications(
                        []
                    );
                }
                finally {
                    setMentorLoading(
                        false
                    );
                }
            },
            [
                token
            ]
        );


    const refreshAll =
        useCallback(
            async () => {

                setError("");
                setMessage("");


                await Promise.all([
                    loadReports(),
                    loadShowcaseSubmissions(),
                    loadMentorApplications()
                ]);
            },
            [
                loadReports,
                loadShowcaseSubmissions,
                loadMentorApplications
            ]
        );


    useEffect(
        () => {

            if (
                token &&
                user?.role ===
                    "ADMIN"
            ) {
                refreshAll();
            }

        },
        [
            token,
            user?.role,
            refreshAll
        ]
    );


    async function dismissReport(
        reportId
    ) {

        setActionFeedbackActive(true);
        if (
            !reportId ||
            !token ||
            busyReportId
        ) {
            return;
        }


        setBusyReportId(
            reportId
        );

        setError("");
        setMessage("");


        try {
            const response =
                await fetch(
                    `/api/admin/reports/${reportId}/dismiss`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to dismiss report."
                );
            }


            setReports(
                currentReports =>
                    currentReports.filter(
                        report =>
                            report.report_id !==
                            reportId
                    )
            );


            setMessage(
                "Report dismissed successfully."
            );
        }
        catch (
            actionError
        ) {
            setError(
                actionError.message ||
                "Unable to dismiss report."
            );
        }
        finally {
            setBusyReportId(
                null
            );
        }
    }


    async function suspendUser(
        report
    ) {

        setActionFeedbackActive(true);
        if (
            !report?.reported_user_id
        ) {
            setError(
                "This report does not target a user."
            );

            return;
        }


        if (
            busyReportId
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                "Suspend the reported user?"
            );


        if (!confirmed) {
            return;
        }


        setBusyReportId(
            report.report_id
        );

        setError("");
        setMessage("");


        try {
            const response =
                await fetch(
                    `/api/admin/users/${report.reported_user_id}/suspend`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                reason:
                                    `Suspended from report ${report.report_id}`
                            })
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to suspend user."
                );
            }


            setMessage(
                "User suspended successfully."
            );
        }
        catch (
            actionError
        ) {
            setError(
                actionError.message ||
                "Unable to suspend user."
            );
        }
        finally {
            setBusyReportId(
                null
            );
        }
    }


    async function approveShowcase(
        submission
    ) {

        setActionFeedbackActive(true);
        const showcaseId =
            submission
                ?.showcase_id;


        if (
            !showcaseId ||
            !token ||
            busyShowcaseId
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                `Approve "${submission.title}" for the public Showcase?`
            );


        if (!confirmed) {
            return;
        }


        setBusyShowcaseId(
            showcaseId
        );

        setError("");
        setMessage("");


        try {
            const response =
                await fetch(
                    `/api/showcase/admin/${showcaseId}/approve`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to approve showcase submission."
                );
            }


            setShowcaseSubmissions(
                current =>
                    current.filter(
                        item =>
                            item.showcase_id !==
                            showcaseId
                    )
            );


            setMessage(
                `"${submission.title}" approved for the public Showcase.`
            );
        }
        catch (
            actionError
        ) {
            setError(
                actionError.message ||
                "Unable to approve showcase submission."
            );
        }
        finally {
            setBusyShowcaseId(
                null
            );
        }
    }


    async function approveMentorApplication(
        application
    ) {

        setActionFeedbackActive(true);
        const applicationId =
            getMentorApplicationId(
                application
            );


        if (
            !applicationId ||
            !token ||
            busyMentorApplicationId
        ) {
            return;
        }


        const applicantName =
            getMentorApplicantName(
                application
            );


        const confirmed =
            window.confirm(
                `Approve ${applicantName} as a Mentor?`
            );


        if (!confirmed) {
            return;
        }


        setBusyMentorApplicationId(
            applicationId
        );

        setError("");
        setMessage("");


        try {
            const response =
                await fetch(
                    `/api/admin/mentor-applications/${applicationId}/approve`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to approve Mentor application."
                );
            }


            setMentorApplications(
                current =>
                    current.filter(
                        item =>
                            getMentorApplicationId(
                                item
                            ) !==
                            applicationId
                    )
            );


            setMessage(
                `${applicantName} approved as a Mentor.`
            );
        }
        catch (
            actionError
        ) {
            setError(
                actionError.message ||
                "Unable to approve Mentor application."
            );
        }
        finally {
            setBusyMentorApplicationId(
                null
            );
        }
    }


    async function rejectMentorApplication(
        application
    ) {

        setActionFeedbackActive(true);
        const applicationId =
            getMentorApplicationId(
                application
            );


        if (
            !applicationId ||
            !token ||
            busyMentorApplicationId
        ) {
            return;
        }


        const applicantName =
            getMentorApplicantName(
                application
            );


        const confirmed =
            window.confirm(
                `Reject the Mentor application from ${applicantName}?`
            );


        if (!confirmed) {
            return;
        }


        setBusyMentorApplicationId(
            applicationId
        );

        setError("");
        setMessage("");


        try {
            const response =
                await fetch(
                    `/api/admin/mentor-applications/${applicationId}/reject`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await readResponseJson(
                    response
                );


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Unable to reject Mentor application."
                );
            }


            setMentorApplications(
                current =>
                    current.filter(
                        item =>
                            getMentorApplicationId(
                                item
                            ) !==
                            applicationId
                    )
            );


            setMessage(
                `${applicantName}'s Mentor application was rejected.`
            );
        }
        catch (
            actionError
        ) {
            setError(
                actionError.message ||
                "Unable to reject Mentor application."
            );
        }
        finally {
            setBusyMentorApplicationId(
                null
            );
        }
    }


    function formatDate(
        date
    ) {
        if (!date) {
            return "Unknown";
        }


        const parsedDate =
            new Date(
                date
            );


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Unknown";
        }


        return parsedDate
            .toLocaleString();
    }


    if (
        !user ||
        user.role !==
            "ADMIN"
    ) {
        return (
            <section className="admin-dashboard">

                <div className="admin-heading">

                    <h1>
                        Administration
                    </h1>

                    <p>
                        Administrator access is required.
                    </p>

                </div>


                <div
                    className="admin-error"
                    role="alert"
                >
                    You do not have permission
                    to access this page.
                </div>

            </section>
        );
    }


    return (
        <section className="admin-dashboard">

            <div className="admin-heading">

                <div>

                    <h1>
                        Administration
                    </h1>

                    <p>
                        Review Mentor applications,
                        moderation reports and completed
                        projects awaiting Showcase approval.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-refresh"
                    onClick={
                        refreshAll
                    }
                    disabled={
                        !token ||
                        loading ||
                        showcaseLoading ||
                        mentorLoading
                    }
                >
                    Refresh
                </button>

            </div>


            {error && (

                <div
                    className="admin-error"
                    role="alert"
                >
                    {error}
                </div>

            )}


            {message && (

                <div
                    className="admin-success"
                    role="status"
                >
                    {message}
                </div>

            )}


            {/* ==================================================
                MENTOR ACCOUNT APPROVALS
            ================================================== */}

            <div className="admin-panel">

                <div className="admin-panel-header">

                    <div>

                        <h2>
                            Pending Mentor Applications
                        </h2>

                        <p>
                            Review users requesting approved
                            Mentor access to ProjectForge.
                        </p>

                    </div>


                    <span className="report-count">
                        {
                            mentorApplications
                                .length
                        }
                    </span>

                </div>


                {mentorLoading ? (

                    <p className="admin-muted">
                        Loading Mentor applications...
                    </p>

                ) : mentorApplications
                    .length === 0 ? (

                    <div className="admin-empty">
                        No Mentor applications
                        awaiting approval.
                    </div>

                ) : (

                    <div className="report-list">

                        {mentorApplications.map(
                            application => {

                                const applicationId =
                                    getMentorApplicationId(
                                        application
                                    );


                                const applicantName =
                                    getMentorApplicantName(
                                        application
                                    );


                                const applicantEmail =
                                    getMentorApplicantEmail(
                                        application
                                    );


                                const requestedAt =
                                    getMentorRequestedAt(
                                        application
                                    );


                                const isBusy =
                                    busyMentorApplicationId ===
                                    applicationId;


                                return (
                                    <article
                                        className="report-card"
                                        key={
                                            applicationId
                                        }
                                    >

                                        <div className="report-top">

                                            <div>

                                                <span className="report-status">
                                                    PENDING
                                                </span>

                                                <h3>
                                                    {
                                                        sanitizeText(
                                                            applicantName
                                                        )
                                                    }
                                                </h3>

                                            </div>


                                            <span className="report-date">
                                                {
                                                    formatDate(
                                                        requestedAt
                                                    )
                                                }
                                            </span>

                                        </div>


                                        <div className="report-information">

                                            <div>

                                                <strong>
                                                    Email
                                                </strong>

                                                <span>
                                                    {
                                                        sanitizeText(
                                                            applicantEmail ||
                                                            "Not available"
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Requested Role
                                                </strong>

                                                <span>
                                                    Mentor
                                                </span>

                                            </div>

                                        </div>


                                        <div className="report-actions">

                                            <button
                                                type="button"
                                                className="admin-button dismiss"
                                                disabled={
                                                    isBusy
                                                }
                                                onClick={() =>
                                                    approveMentorApplication(
                                                        application
                                                    )
                                                }
                                            >
                                                {
                                                    isBusy
                                                        ? "Processing..."
                                                        : "Approve Mentor"
                                                }
                                            </button>


                                            <button
                                                type="button"
                                                className="admin-button suspend"
                                                disabled={
                                                    isBusy
                                                }
                                                onClick={() =>
                                                    rejectMentorApplication(
                                                        application
                                                    )
                                                }
                                            >
                                                {
                                                    isBusy
                                                        ? "Processing..."
                                                        : "Reject Application"
                                                }
                                            </button>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>

                )}

            </div>


            {/* ==================================================
                SHOWCASE APPROVALS
            ================================================== */}

            <div className="admin-panel">

                <div className="admin-panel-header">

                    <div>

                        <h2>
                            Pending Showcase Approvals
                        </h2>

                        <p>
                            Completed projects awaiting
                            administrator approval before
                            becoming public.
                        </p>

                    </div>


                    <span className="report-count">
                        {
                            showcaseSubmissions
                                .length
                        }
                    </span>

                </div>


                {showcaseLoading ? (

                    <p className="admin-muted">
                        Loading showcase submissions...
                    </p>

                ) : showcaseSubmissions
                    .length === 0 ? (

                    <div className="admin-empty">
                        No showcase submissions
                        awaiting approval.
                    </div>

                ) : (

                    <div className="report-list">

                        {showcaseSubmissions.map(
                            submission => {

                                const repositoryUrl =
                                    getSafeRepositoryUrl(
                                        submission
                                            .repository_url
                                    );


                                return (
                                    <article
                                        className="report-card"
                                        key={
                                            submission
                                                .showcase_id
                                        }
                                    >

                                        <div className="report-top">

                                            <div>

                                                <span className="report-status">
                                                    PENDING
                                                </span>


                                                <h3>
                                                    {
                                                        sanitizeText(
                                                            submission
                                                                .title
                                                        )
                                                    }
                                                </h3>

                                            </div>


                                            <span className="report-date">
                                                {
                                                    formatDate(
                                                        submission
                                                            .created_at
                                                    )
                                                }
                                            </span>

                                        </div>


                                        <div className="report-information">

                                            <div>

                                                <strong>
                                                    Category
                                                </strong>

                                                <span>
                                                    {
                                                        sanitizeText(
                                                            submission
                                                                .category
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Submitted By
                                                </strong>

                                                <span>
                                                    {
                                                        sanitizeText(
                                                            submission
                                                                .submitted_by
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        <div className="report-reason">

                                            <strong>
                                                Project Description
                                            </strong>

                                            <p>
                                                {
                                                    sanitizeText(
                                                        submission
                                                            .description
                                                    )
                                                }
                                            </p>

                                        </div>


                                        <ProjectImageGallery
                                            images={
                                                submission
                                                    .images
                                            }
                                            label={
                                                `Images for ${
                                                    sanitizeText(
                                                        submission
                                                            .title
                                                    ) ||
                                                    "project"
                                                }`
                                            }
                                            compact
                                            showEmpty
                                        />


                                        {repositoryUrl && (

                                            <div className="report-information">

                                                <div>

                                                    <strong>
                                                        Repository
                                                    </strong>

                                                    <a
                                                        href={
                                                            repositoryUrl
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Open Repository
                                                    </a>

                                                </div>

                                            </div>

                                        )}


                                        <div className="report-actions">

                                            <button
                                                type="button"
                                                className="admin-button dismiss"
                                                disabled={
                                                    busyShowcaseId ===
                                                    submission
                                                        .showcase_id
                                                }
                                                onClick={() =>
                                                    approveShowcase(
                                                        submission
                                                    )
                                                }
                                            >
                                                {
                                                    busyShowcaseId ===
                                                    submission
                                                        .showcase_id
                                                        ? "Approving..."
                                                        : "Approve Showcase"
                                                }
                                            </button>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>

                )}

            </div>


            {/* ==================================================
                MODERATION REPORTS
            ================================================== */}

            <div className="admin-panel">

                <div className="admin-panel-header">

                    <div>

                        <h2>
                            Active Reports
                        </h2>

                        <p>
                            Pending reports requiring
                            administrator review.
                        </p>

                    </div>


                    <span className="report-count">
                        {reports.length}
                    </span>

                </div>


                {loading ? (

                    <p className="admin-muted">
                        Loading reports...
                    </p>

                ) : reports.length ===
                    0 ? (

                    <div className="admin-empty">
                        No active reports.
                    </div>

                ) : (

                    <div className="report-list">

                        {reports.map(
                            report => (

                                <article
                                    className="report-card"
                                    key={
                                        report.report_id
                                    }
                                >

                                    <div className="report-top">

                                        <div>

                                            <span className="report-status">
                                                {
                                                    report.status
                                                }
                                            </span>


                                            <h3>
                                                {
                                                    report
                                                        .reported_user_id
                                                        ? "User Report"
                                                        : "Project Report"
                                                }
                                            </h3>

                                        </div>


                                        <span className="report-date">
                                            {
                                                formatDate(
                                                    report
                                                        .created_at
                                                )
                                            }
                                        </span>

                                    </div>


                                    <div className="report-information">

                                        <div>
                                            <strong>
                                                Reporter
                                            </strong>

                                            <span>
                                                {
                                                    sanitizeText(
                                                        report
                                                            .reporter_name ||
                                                        report
                                                            .reporter_email ||
                                                        report
                                                            .reporter_user_id ||
                                                        "Unknown user"
                                                    )
                                                }
                                            </span>

                                        </div>


                                        {report
                                            .reported_user_id && (

                                            <div>

                                                <strong>
                                                    Reported User
                                                </strong>

                                                <span>
                                                    {
                                                        sanitizeText(
                                                        report
                                                            .reported_user_name ||
                                                        report
                                                            .reported_user_email ||
                                                        report
                                                            .reported_user_id ||
                                                        "Unknown user"
                                                    )
                                                    }
                                                </span>

                                            </div>

                                        )}


                                        {report
                                            .reported_project_id && (

                                            <div>

                                                <strong>
                                                    Reported Project
                                                </strong>

                                                <span>
                                                    {
                                                        sanitizeText(
                                                        report
                                                            .reported_project_title ||
                                                        report
                                                            .reported_project_id ||
                                                        "Unknown project"
                                                    )
                                                    }
                                                </span>

                                            </div>

                                        )}

                                    </div>


                                    <div className="report-reason">

                                        <strong>
                                            Reason
                                        </strong>

                                        <p>
                                            {
                                                sanitizeText(
                                                    report.reason
                                                )
                                            }
                                        </p>

                                    </div>


                                    <div className="report-actions">

                                        <button
                                            type="button"
                                            className="admin-button dismiss"
                                            disabled={
                                                busyReportId ===
                                                report
                                                    .report_id
                                            }
                                            onClick={() =>
                                                dismissReport(
                                                    report
                                                        .report_id
                                                )
                                            }
                                        >
                                            {
                                                busyReportId ===
                                                report
                                                    .report_id
                                                    ? "Processing..."
                                                    : "Dismiss Report"
                                            }
                                        </button>


                                        {report
                                            .reported_user_id && (

                                            <button
                                                type="button"
                                                className="admin-button suspend"
                                                disabled={
                                                    busyReportId ===
                                                    report
                                                        .report_id
                                                }
                                                onClick={() =>
                                                    suspendUser(
                                                        report
                                                    )
                                                }
                                            >
                                                {
                                                    busyReportId ===
                                                    report
                                                        .report_id
                                                        ? "Processing..."
                                                        : "Suspend User"
                                                }
                                            </button>

                                        )}

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                )}

            </div>

        </section>
    );
}


export default AdminDashboard;