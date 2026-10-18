import {
    useCallback,
    useEffect,
    useState
} from "react";

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import { useAuth } from "../context/AuthContext";

import "./TaskBoard.css";

const MAX_TASK_TITLE_LENGTH =
    120;

const MAX_TASK_DESCRIPTION_LENGTH =
    1000;


const COLUMNS = [
    {
        status: "TODO",
        title: "To Do"
    },
    {
        status: "IN_PROGRESS",
        title: "In Progress"
    },
    {
        status: "BLOCKED",
        title: "Blocked"
    },
    {
        status: "DONE",
        title: "Done"
    }
];


const STATUS_TRANSITIONS = {
    TODO: [
        "IN_PROGRESS"
    ],

    IN_PROGRESS: [
        "BLOCKED",
        "DONE"
    ],

    BLOCKED: [
        "IN_PROGRESS"
    ],

    DONE: []
};


const STATUS_LABELS = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    BLOCKED: "Blocked",
    DONE: "Done"
};


function TaskBoard({
    projectId
}) {
    const { token } =
        useAuth();

    const [
        tasks,
        setTasks
    ] = useState([]);

    const [
        milestones,
        setMilestones
    ] = useState([]);

    const [
        members,
        setMembers
    ] = useState([]);

    const [
        showForm,
        setShowForm
    ] = useState(false);

    const [
        title,
        setTitle
    ] = useState("");

    const [
        description,
        setDescription
    ] = useState("");

    const [
        dueDate,
        setDueDate
    ] = useState("");

    const [
        milestoneId,
        setMilestoneId
    ] = useState("");

    const [
        assigneeMembershipId,
        setAssigneeMembershipId
    ] = useState("");

    const [
        isLoading,
        setIsLoading
    ] = useState(true);

    const [
        isSubmitting,
        setIsSubmitting
    ] = useState(false);

    const [
        updatingTaskId,
        setUpdatingTaskId
    ] = useState(null);

    const [
        error,
        setError
    ] = useState("");


    const [
        actionFeedbackActive,
        setActionFeedbackActive
    ] = useState(false);


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


    useEffect(
        () => {
            if (
                title.length >
                MAX_TASK_TITLE_LENGTH
            ) {
                setError(
                    `Maximum characters exceeded. Task title may not exceed ${MAX_TASK_TITLE_LENGTH} characters.`
                );

                setActionFeedbackActive(
                    true
                );

                return;
            }

            if (
                description.length >
                MAX_TASK_DESCRIPTION_LENGTH
            ) {
                setError(
                    `Maximum characters exceeded. Task description may not exceed ${MAX_TASK_DESCRIPTION_LENGTH} characters.`
                );

                setActionFeedbackActive(
                    true
                );
            }
        },
        [
            title,
            description
        ]
    );


    const fetchWorkspaceData =
        useCallback(async () => {
            // TASK_BOARD_LOAD_FEEDBACK
            setActionFeedbackActive(
                false
            );
            if (!projectId) {
                setTasks([]);
                setMilestones([]);
                setMembers([]);

                setError(
                    "Select a project to view tasks."
                );

                setIsLoading(false);

                return;
            }

            if (!token) {
                setTasks([]);
                setMilestones([]);
                setMembers([]);

                setError(
                    "Please log in to view project tasks."
                );

                setIsLoading(false);

                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const authHeaders = {
                    Authorization:
                        `Bearer ${token}`
                };

                const [
                    tasksResponse,
                    milestonesResponse,
                    membersResponse
                ] = await Promise.all([
                    fetch(
                        `/api/projects/${projectId}/tasks`,
                        {
                            headers:
                                authHeaders
                        }
                    ),

                    fetch(
                        `/api/projects/${projectId}/milestones`,
                        {
                            headers:
                                authHeaders
                        }
                    ),

                    fetch(
                        `/api/projects/${projectId}/members`,
                        {
                            headers:
                                authHeaders
                        }
                    )
                ]);


                const [
                    tasksData,
                    milestonesData,
                    membersData
                ] = await Promise.all([
                    tasksResponse.json(),
                    milestonesResponse.json(),
                    membersResponse.json()
                ]);


                if (!tasksResponse.ok) {
                    throw new Error(
                        tasksData.message ||
                        tasksData.error ||
                        "Failed to load tasks."
                    );
                }


                if (!milestonesResponse.ok) {
                    throw new Error(
                        milestonesData.message ||
                        milestonesData.error ||
                        "Failed to load milestones."
                    );
                }


                if (!membersResponse.ok) {
                    throw new Error(
                        membersData.message ||
                        membersData.error ||
                        "Failed to load project members."
                    );
                }


                const loadedTasks =
                    tasksData.tasks || [];

                const loadedMilestones =
                    milestonesData.milestones || [];

                const loadedMembers =
                    membersData.members || [];


                setTasks(
                    loadedTasks
                );

                setMilestones(
                    loadedMilestones
                );

                setMembers(
                    loadedMembers
                );


                setMilestoneId(
                    (current) => {
                        if (
                            current &&
                            loadedMilestones.some(
                                (milestone) =>
                                    milestone.milestone_id ===
                                    current
                            )
                        ) {
                            return current;
                        }

                        const openMilestone =
                            loadedMilestones.find(
                                (milestone) =>
                                    milestone.status ===
                                    "OPEN"
                            );

                        return (
                            openMilestone
                                ?.milestone_id ||
                            loadedMilestones[0]
                                ?.milestone_id ||
                            ""
                        );
                    }
                );
            } catch (err) {
                setTasks([]);
                setMilestones([]);
                setMembers([]);

                setError(
                    err.message ||
                    "Network error loading task board."
                );
            } finally {
                setIsLoading(false);
            }
        }, [
            projectId,
            token
        ]);


    useEffect(() => {
        fetchWorkspaceData();
    }, [fetchWorkspaceData]);


    function getMemberName(
        membershipId
    ) {
        if (!membershipId) {
            return "Unassigned";
        }

        const member =
            members.find(
                (item) =>
                    item.membershipId ===
                    membershipId
            );

        return (
            member?.displayName ||
            "Unknown member"
        );
    }


    function getMilestoneTitle(
        taskMilestoneId
    ) {
        const milestone =
            milestones.find(
                (item) =>
                    item.milestone_id ===
                    taskMilestoneId
            );

        return (
            milestone?.title ||
            "Unknown milestone"
        );
    }


    function getStatusIndicator(
        status
    ) {
        if (status === "DONE") {
            return (
                "status-indicator complete"
            );
        }

        if (
            status === "IN_PROGRESS"
        ) {
            return (
                "status-indicator in-progress"
            );
        }

        if (status === "BLOCKED") {
            return (
                "status-indicator blocked"
            );
        }

        return (
            "status-indicator todo"
        );
    }


    async function changeTaskStatus(
        taskId,
        newStatus
    ) {
        const existingTask =
            tasks.find(
                (task) =>
                    task.task_id ===
                    taskId
            );

        if (!existingTask) {
            return;
        }

        if (
            existingTask.status ===
            newStatus
        ) {
            return;
        }

        // TASK_STATUS_ACTION_FEEDBACK
        setActionFeedbackActive(
            true
        );


        const allowedTransitions =
            STATUS_TRANSITIONS[
                existingTask.status
            ] || [];

        if (
            !allowedTransitions.includes(
                newStatus
            )
        ) {
            setError(
                "That task status change is not allowed."
            );

            return;
        }


        const previousTasks =
            [...tasks];

        setError("");

        setUpdatingTaskId(
            taskId
        );


        setTasks(
            (current) =>
                current.map(
                    (task) =>
                        task.task_id ===
                        taskId
                            ? {
                                ...task,
                                status:
                                    newStatus
                            }
                            : task
                )
        );


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/tasks/${taskId}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                status:
                                    newStatus
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {
                setTasks(
                    previousTasks
                );

                throw new Error(
                    data.message ||
                    data.error ||
                    "Task status update rejected."
                );
            }


            if (data.task) {
                setTasks(
                    (current) =>
                        current.map(
                            (task) =>
                                task.task_id ===
                                taskId
                                    ? data.task
                                    : task
                        )
                );
            }
        // TASK_STATUS_SUCCESS_FEEDBACK
        setActionFeedbackActive(
            false
        );


        } catch (err) {
            setTasks(
                previousTasks
            );

            setError(
                err.message ||
                "Network error updating task status."
            );
        } finally {
            setUpdatingTaskId(
                null
            );
        }
    }


    async function createTask(
        event
    ) {
        event.preventDefault();

        setActionFeedbackActive(
            true
        );

        if (
            title.length >
            MAX_TASK_TITLE_LENGTH
        ) {
            setError(
                `Maximum characters exceeded. Task title may not exceed ${MAX_TASK_TITLE_LENGTH} characters.`
            );

            return;
        }

        if (
            description.length >
            MAX_TASK_DESCRIPTION_LENGTH
        ) {
            setError(
                `Maximum characters exceeded. Task description may not exceed ${MAX_TASK_DESCRIPTION_LENGTH} characters.`
            );

            return;
        }

        if (!title.trim()) {
            return;
        }

        // TASK_CREATE_ACTION_FEEDBACK
        setActionFeedbackActive(
            true
        );


        if (!milestoneId) {
            setError(
                "Select a milestone before creating a task."
            );

            return;
        }

        if (!projectId) {
            setError(
                "Select a project before creating a task."
            );

            return;
        }


        setError("");
        setIsSubmitting(true);


        try {
            const response =
                await fetch(
                    `/api/projects/${projectId}/tasks`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                milestoneId,

                                assigneeMembershipId:
                                    assigneeMembershipId ||
                                    null,

                                title:
                                    title.trim(),

                                description:
                                    description.trim() ||
                                    "No description provided.",

                                status:
                                    "TODO",

                                dueDate:
                                    dueDate ||
                                    null
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Failed to create task."
                );
            }


            setTasks(
                (current) => [
                    ...current,
                    data.task
                ]
            );

            setTitle("");
            setDescription("");
            setDueDate("");
            setAssigneeMembershipId("");
            setShowForm(false);
        // TASK_CREATE_SUCCESS_FEEDBACK
        setActionFeedbackActive(
            false
        );


        } catch (err) {
            setError(
                err.message ||
                "Network error creating task."
            );
        } finally {
            setIsSubmitting(false);
        }
    }


    if (isLoading) {
        return (
            <div className="task-board">
                <p className="muted">
                    Loading task board...
                </p>
            </div>
        );
    }


    const canCreateTask =
        Boolean(
            projectId &&
            milestones.length > 0
        );


    return (
        <div className="task-board">

            <div className="task-board-actions">

                <button
                    type="button"
                    className="f1-primary-btn"
                    onClick={() =>
                        setShowForm(
                            !showForm
                        )
                    }
                    disabled={
                        !canCreateTask
                    }
                >
                    {showForm
                        ? "CANCEL"
                        : "ADD TASK"}
                </button>

            </div>


            {error &&
                !error.startsWith(
                    "Maximum characters exceeded."
                ) && (
                <div
                    className="task-board-error"
                    role="alert"
                >
                    {error}
                </div>
            )}


            {!milestones.length &&
                projectId && (
                    <p className="muted">
                        Create a milestone before
                        adding project tasks.
                    </p>
                )}


            {showForm && (
                <form
                    className="task-create-form"
                    onSubmit={
                        createTask
                    }
                >

                    <input
                        type="text"
                        placeholder="Task title..."
                        value={title}
                        onChange={(event) =>
                            setTitle(
                                event.target.value
                            )
                        }
                        required
                        aria-label="Task title"
                    />


                    <small className="muted">
                        {title.length}/
                        {MAX_TASK_TITLE_LENGTH}
                        {" "}characters
                    </small>


                    <input
                        type="text"
                        placeholder="Short description..."
                        value={description}
                        onChange={(event) =>
                            setDescription(
                                event.target.value
                            )
                        }
                        aria-label="Task description"
                    />


                    <small className="muted">
                        {description.length}/
                        {MAX_TASK_DESCRIPTION_LENGTH}
                        {" "}characters
                    </small>


                    <select
                        value={
                            milestoneId
                        }
                        onChange={(event) =>
                            setMilestoneId(
                                event.target.value
                            )
                        }
                        required
                        aria-label="Task milestone"
                    >
                        <option
                            value=""
                            disabled
                        >
                            Select milestone
                        </option>

                        {milestones.map(
                            (milestone) => (
                                <option
                                    key={
                                        milestone.milestone_id
                                    }
                                    value={
                                        milestone.milestone_id
                                    }
                                >
                                    {
                                        milestone.title
                                    }
                                    {
                                        milestone.status
                                            ? ` (${milestone.status})`
                                            : ""
                                    }
                                </option>
                            )
                        )}
                    </select>


                    <select
                        value={
                            assigneeMembershipId
                        }
                        onChange={(event) =>
                            setAssigneeMembershipId(
                                event.target.value
                            )
                        }
                        aria-label="Task assignee"
                    >
                        <option value="">
                            Unassigned
                        </option>

                        {members.map(
                            (member) => (
                                <option
                                    key={
                                        member.membershipId
                                    }
                                    value={
                                        member.membershipId
                                    }
                                >
                                    {
                                        member.displayName
                                    }
                                    {
                                        member.memberRole
                                            ? ` (${member.memberRole})`
                                            : ""
                                    }
                                </option>
                            )
                        )}
                    </select>


                    <input
                        type="date"
                        value={dueDate}
                        onChange={(event) =>
                            setDueDate(
                                event.target.value
                            )
                        }
                        aria-label="Task due date"
                    />


                    <button
                        type="submit"
                        className="f1-primary-btn"
                        disabled={
                            isSubmitting ||
                            title.length >
                                MAX_TASK_TITLE_LENGTH ||
                            description.length >
                                MAX_TASK_DESCRIPTION_LENGTH
                        }
                    >
                        {isSubmitting
                            ? "DEPLOYING..."
                            : "DEPLOY TASK"}
                    </button>


                    {
                        title.length >
                        MAX_TASK_TITLE_LENGTH ? (
                            <div
                                className="task-board-error"
                                role="alert"
                            >
                                {`Maximum characters exceeded. Task title may not exceed ${MAX_TASK_TITLE_LENGTH} characters.`}
                            </div>
                        ) :
                        description.length >
                        MAX_TASK_DESCRIPTION_LENGTH ? (
                            <div
                                className="task-board-error"
                                role="alert"
                            >
                                {`Maximum characters exceeded. Task description may not exceed ${MAX_TASK_DESCRIPTION_LENGTH} characters.`}
                            </div>
                        ) :
                        null
                    }

                </form>
            )}


            <div className="task-columns">

                {COLUMNS.map(
                    (column) => {
                        const columnTasks =
                            tasks.filter(
                                (task) =>
                                    task.status ===
                                    column.status
                            );


                        return (
                            <div
                                className="task-column"
                                key={
                                    column.status
                                }
                            >

                                <div className="task-column-header">

                                    <h3>
                                        {
                                            column.title.toUpperCase()
                                        }
                                    </h3>

                                    <span className="telemetry-data">
                                        {
                                            columnTasks.length
                                        }
                                    </span>

                                </div>


                                {columnTasks.map(
                                    (task) => {
                                        const transitions =
                                            STATUS_TRANSITIONS[
                                                task.status
                                            ] || [];

                                        const options = [
                                            task.status,
                                            ...transitions
                                        ];


                                        return (
                                            <div
                                                className="task-card"
                                                key={
                                                    task.task_id
                                                }
                                            >

                                                <div className="task-card-header">

                                                    <div
                                                        className={
                                                            getStatusIndicator(
                                                                task.status
                                                            )
                                                        }
                                                    />

                                                    <strong>
                                                        {
                                                            task.title
                                                        }
                                                    </strong>

                                                </div>


                                                <span>
                                                    Assigned to{" "}
                                                    {
                                                        getMemberName(
                                                            task.assignee_membership_id
                                                        )
                                                    }
                                                </span>


                                                <span>
                                                    Milestone:{" "}
                                                    {
                                                        getMilestoneTitle(
                                                            task.milestone_id
                                                        )
                                                    }
                                                </span>


                                                <small className="telemetry-data">
                                                    Due:{" "}
                                                    {
                                                        task.due_date ||
                                                        "TBA"
                                                    }
                                                </small>


                                                <select
                                                    value={
                                                        task.status
                                                    }
                                                    onChange={(event) =>
                                                        changeTaskStatus(
                                                            task.task_id,
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        task.status ===
                                                            "DONE" ||
                                                        updatingTaskId ===
                                                            task.task_id
                                                    }
                                                    aria-label={
                                                        `Change status for ${task.title}`
                                                    }
                                                >
                                                    {options.map(
                                                        (status) => (
                                                            <option
                                                                key={
                                                                    status
                                                                }
                                                                value={
                                                                    status
                                                                }
                                                            >
                                                                {
                                                                    STATUS_LABELS[
                                                                        status
                                                                    ]
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}


export default TaskBoard;
