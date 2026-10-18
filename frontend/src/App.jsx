import {
  useCallback,
  useEffect,
  useState
} from "react";

import useAutoDismissFeedback
  from "./hooks/useAutoDismissFeedback";

import LoginForm from "./components/LoginForm";
import ProfileEdit from "./components/ProfileEdit";
import AdminDashboard from "./components/AdminDashboard";
import MentorGuidancePanel from "./components/MentorGuidancePanel";
import PublicShowcase from "./components/PublicShowcase";
import DiscoverProjects from "./components/DiscoverProjects";
import ProjectForm from "./components/ProjectForm";
import ApplicationReview from "./components/ApplicationReview";

import {
  useAuth
} from "./context/AuthContext";

import ProjectWorkspaceHeader
  from "./components/ProjectWorkspaceHeader";

import ProjectImageManager
  from "./components/ProjectImageManager";

import MilestoneBoard
  from "./components/MilestoneBoard";

import TaskBoard
  from "./components/TaskBoard";

import TeamRadioAlert
  from "./components/TeamRadioAlert";

import DevelopmentUpdates
  from "./components/DevelopmentUpdates";

import TeamHealthCheckinForm
  from "./components/TeamHealthCheckInForm";

import TeamHealthSummaryPanel
  from "./TeamHealthSummaryPanel";

import PitWallForm
  from "./PitWallForm";


const MAX_DISPLAY_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 255;
const MAX_PASSWORD_BYTES = 72;


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


function getUtf8ByteLength(
  value
) {
  return new TextEncoder()
    .encode(
      String(
        value ||
        ""
      )
    )
    .length;
}


function getMentorProjectId(
  project
) {
  return (
    project?.projectId ||
    project?.project_id ||
    ""
  );
}


function getMentorProjectTitle(
  project
) {
  return (
    project?.title ||
    project?.projectTitle ||
    project?.project_title ||
    "Untitled Project"
  );
}


function getMentorProjectDescription(
  project
) {
  return (
    project?.description ||
    project?.projectDescription ||
    project?.project_description ||
    ""
  );
}


function getMentorProjectCategory(
  project
) {
  return (
    project?.category ||
    project?.projectCategory ||
    project?.project_category ||
    "Uncategorised"
  );
}


function getMentorAssignmentStatus(
  project
) {
  return String(
    project?.assignmentStatus ||
    project?.assignment_status ||
    project?.mentorAssignmentStatus ||
    project?.mentor_assignment_status ||
    project?.currentAssignmentStatus ||
    project?.current_assignment_status ||
    ""
  )
    .trim()
    .toUpperCase();
}


function Button({
  children,
  secondary = false,
  onClick,
  type = "button",
  disabled = false
}) {
  return (
    <button
      className={
        secondary
          ? "button button-secondary"
          : "button"
      }
      onClick={
        onClick
      }
      type={
        type
      }
      disabled={
        disabled
      }
    >
      {children}
    </button>
  );
}


function Header({
  page,
  setPage,
  logout,
  user,
  visitor = false
}) {
  const isMentor =
    user?.role ===
    "MENTOR";

  const isAdmin =
    user?.role ===
    "ADMIN";

  const canUsePitWall =
    user?.role ===
    "STUDENT";


  return (
    <header className="topbar">

      <button
        className="brand"
        onClick={() =>
          setPage(
            visitor
              ? "showcase"
              : isMentor
                ? "mentor"
                : isAdmin
                  ? "admin"
                  : "dashboard"
          )
        }
      >

        <span className="brand-mark">
          PF
        </span>

        <span>
          ProjectForge
        </span>

      </button>


      <nav className="nav">

        {!visitor && (
          <>

            <button
              className={
                page ===
                "dashboard"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "dashboard"
                )
              }
            >
              Dashboard
            </button>


            <button
              className={
                page ===
                "discover"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "discover"
                )
              }
            >
              Discover
            </button>


            <button
              className={
                page ===
                "create-project"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "create-project"
                )
              }
            >
              Create Project
            </button>


            <button
              className={
                page ===
                "applications"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "applications"
                )
              }
            >
              Applications
            </button>


            <button
              className={
                page ===
                "workspace"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "workspace"
                )
              }
            >
              Project
            </button>


            {canUsePitWall && (

              <button
                className={
                  page ===
                  "pitwall"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage(
                    "pitwall"
                  )
                }
              >
                Pit Wall
              </button>

            )}


            <button
              className={
                page ===
                "profile"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "profile"
                )
              }
            >
              Profile
            </button>

          </>
        )}


        <button
          className={
            page ===
            "showcase"
              ? "active"
              : ""
          }
          onClick={() =>
            setPage(
              "showcase"
            )
          }
        >
          Showcase
        </button>


        {!visitor &&
          isMentor && (

          <button
            className={
              page ===
              "mentor"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage(
                "mentor"
              )
            }
          >
            Mentor
          </button>

        )}


        {!visitor &&
          isAdmin && (

          <button
            className={
              page ===
              "admin"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage(
                "admin"
              )
            }
          >
            Admin
          </button>

        )}

      </nav>


      <Button
        secondary
        onClick={
          logout
        }
      >
        {
          visitor
            ? "Log In"
            : "Log Out"
        }
      </Button>

    </header>
  );
}


function Login({
  onShowcase,
  onSignup
}) {
  return (
    <main className="auth-page">

      <section className="auth-card">

        <div className="auth-brand">

          <span className="brand-mark large">
            PF
          </span>


          <div>

            <h1>
              ProjectForge
            </h1>

            <p>
              Student Project Collaboration Platform
            </p>

          </div>

        </div>


        <LoginForm />


        <p className="auth-link">

          Don't have an account?{" "}

          <button
            onClick={
              onSignup
            }
          >
            Sign Up
          </button>

        </p>


        <button
          className="text-button"
          onClick={
            onShowcase
          }
        >
          View Public Showcase
        </button>

      </section>

    </main>
  );
}


function Signup({
  onBack,
  onComplete
}) {
  const [
    fullName,
    setFullName
  ] = useState("");

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    requestedRole,
    setRequestedRole
  ] = useState(
    "STUDENT"
  );

  const [
    message,
    setMessage
  ] = useState("");

  const [
    error,
    setError
  ] = useState("");

  const [
    submitting,
    setSubmitting
  ] = useState(false);


  // SIGNUP_FEEDBACK_AUTO_DISMISS
  useAutoDismissFeedback(
    Boolean(
      error
    ),
    () => {
      setError("");
    }
  );


  async function submit(
    event
  ) {
    event.preventDefault();


    if (
      submitting
    ) {
      return;
    }


    setMessage("");
    setError("");


    const cleanFullName =
      fullName.trim();

    const cleanEmail =
      email.trim();


    const nameParts =
      cleanFullName
        .split(
          /\s+/
        )
        .filter(
          Boolean
        );


    if (
      nameParts.length <
      2
    ) {
      setError(
        "Please enter both your first name and last name."
      );

      return;
    }


    if (
      cleanFullName.length >
      MAX_DISPLAY_NAME_LENGTH
    ) {
      setError(
        `Maximum characters exceeded. Full name may not exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`
      );

      return;
    }


    if (
      !cleanEmail
    ) {
      setError(
        "Email is required."
      );

      return;
    }


    if (
      cleanEmail.length >
      MAX_EMAIL_LENGTH
    ) {
      setError(
        `Maximum characters exceeded. Email may not exceed ${MAX_EMAIL_LENGTH} characters.`
      );

      return;
    }


    if (
      password.startsWith(" ") ||
      password.endsWith(" ")
    ) {
      setError(
        "Password may not begin or end with spaces."
      );

      return;
    }


    if (
      password.length <
      8
    ) {
      setError(
        "Password must be at least 8 characters long."
      );

      return;
    }


    if (
      getUtf8ByteLength(
        password
      ) >
      MAX_PASSWORD_BYTES
    ) {
      setError(
        `Maximum characters exceeded. Password may not exceed ${MAX_PASSWORD_BYTES} UTF-8 bytes.`
      );

      return;
    }


    if (
      ![
        "STUDENT",
        "MENTOR"
      ].includes(
        requestedRole
      )
    ) {
      setError(
        "Please select a valid account role."
      );

      return;
    }


    const firstName =
      nameParts[0];


    const lastName =
      nameParts
        .slice(1)
        .join(" ");


    setSubmitting(
      true
    );


    try {

      const response =
        await fetch(
          "/api/auth/register",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                firstName,
                lastName,
                email:
                  cleanEmail,
                password,
                requestedRole
              })
          }
        );


      const data =
        await readResponseJson(
          response
        );


      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
          data.message ||
          "Registration failed. Please check your details and try again."
        );
      }


      if (
        requestedRole ===
        "MENTOR"
      ) {

        setMessage(
          data.message ||
          "Account created. Your Mentor application is awaiting administrator approval."
        );

      }
      else {

        setMessage(
          data.message ||
          "User registered successfully."
        );

      }


      window.setTimeout(
        onComplete,
        requestedRole ===
          "MENTOR"
          ? 1500
          : 700
      );

    }
    catch (
      requestError
    ) {

      setError(
        requestError.message ||
        "Registration failed. Please try again."
      );

    }
    finally {

      setSubmitting(
        false
      );

    }
  }


  return (
    <main className="auth-page">

      <section className="auth-card">

        <div className="auth-brand">

          <span className="brand-mark large">
            PF
          </span>


          <div>

            <h1>
              Create Account
            </h1>

            <p>
              Join ProjectForge
            </p>

          </div>

        </div>


        <form
          onSubmit={
            submit
          }
        >

          <label
            htmlFor="signup-full-name"
          >
            Full Name

            <input
              id="signup-full-name"
              required
              autoComplete="name"
              value={
                fullName
              }
              onChange={
                event => {
                  const value =
                    event.target.value;


                  if (
                    value.length >
                    MAX_DISPLAY_NAME_LENGTH
                  ) {
                    setError(
                      `Maximum characters exceeded. Full name may not exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`
                    );

                    return;
                  }


                  setError("");
                  setFullName(
                    value
                  );
                }
              }
              placeholder="First name and last name"
            />

          </label>


          <label
            htmlFor="signup-email"
          >
            Email

            <input
              id="signup-email"
              required
              type="email"
              autoComplete="email"
              value={
                email
              }
              onChange={
                event => {
                  const value =
                    event.target.value;


                  if (
                    value.length >
                    MAX_EMAIL_LENGTH
                  ) {
                    setError(
                      `Maximum characters exceeded. Email may not exceed ${MAX_EMAIL_LENGTH} characters.`
                    );

                    return;
                  }


                  setError("");
                  setEmail(
                    value
                  );
                }
              }
              placeholder="student@tuks.co.za"
            />

          </label>


          <label
            htmlFor="signup-password"
          >
            Password

            <input
              id="signup-password"
              required
              type="password"
              minLength={
                8
              }
              autoComplete="new-password"
              value={
                password
              }
              onChange={
                event => {
                  const value =
                    event.target.value;


                  if (
                    getUtf8ByteLength(
                      value
                    ) >
                    MAX_PASSWORD_BYTES
                  ) {
                    setError(
                      `Maximum characters exceeded. Password may not exceed ${MAX_PASSWORD_BYTES} UTF-8 bytes.`
                    );

                    return;
                  }


                  setError("");
                  setPassword(
                    value
                  );
                }
              }
              placeholder="8 to 72 UTF-8 bytes"
            />

          </label>


          <label
            htmlFor="signup-role"
          >
            Primary Role

            <select
              id="signup-role"
              value={
                requestedRole
              }
              onChange={
                event =>
                  setRequestedRole(
                    event
                      .target
                      .value
                  )
              }
            >

              <option
                value="STUDENT"
              >
                Student
              </option>

              <option
                value="MENTOR"
              >
                Mentor
              </option>

            </select>

          </label>


          {requestedRole ===
            "MENTOR" && (

            <p className="muted">
              Mentor accounts require administrator
              approval before Mentor privileges are enabled.
            </p>

          )}


          {error && (

            <p
              className="error"
              role="alert"
            >
              {error}
            </p>

          )}


          {message && (

            <p
              className="success"
              role="status"
            >
              {message}
            </p>

          )}


          <Button
            type="submit"
            disabled={
              submitting
            }
          >
            {
              submitting
                ? "Creating Account..."
                : "Sign Up"
            }
          </Button>

        </form>


        <p className="auth-link">

          Already have an account?{" "}

          <button
            onClick={
              onBack
            }
          >
            Log In
          </button>

        </p>

      </section>

    </main>
  );
}


function PageTitle({
  title,
  subtitle
}) {
  return (
    <div className="page-heading">

      <h1>
        {title}
      </h1>

      <p>
        {subtitle}
      </p>

    </div>
  );
}


function Panel({
  title,
  children,
  className = ""
}) {
  return (
    <section
      className={
        `panel ${className}`
      }
    >

      <h2>
        {title}
      </h2>

      {children}

    </section>
  );
}


function getArray(
  data,
  key
) {
  if (
    Array.isArray(
      data?.[key]
    )
  ) {
    return data[key];
  }


  if (
    Array.isArray(
      data
    )
  ) {
    return data;
  }


  return [];
}


function formatStatus(
  status
) {
  if (
    !status
  ) {
    return "Unknown";
  }


  const cleanStatus =
    String(
      status
    )
      .trim()
      .replace(
        /_/g,
        " "
      )
      .toLowerCase();


  return (
    cleanStatus
      .charAt(0)
      .toUpperCase() +
    cleanStatus
      .slice(1)
  );
}


function getCurrentTeamHealthPeriodStart() {
  const date =
    new Date();


  date.setHours(
    12,
    0,
    0,
    0
  );


  const day =
    date.getDay();


  const difference =
    day ===
      0
      ? -6
      : 1 - day;


  date.setDate(
    date.getDate() +
    difference
  );


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() +
      1
    )
      .padStart(
        2,
        "0"
      );


  const dayOfMonth =
    String(
      date.getDate()
    )
      .padStart(
        2,
        "0"
      );


  return (
    `${year}-${month}-${dayOfMonth}`
  );
}


function Dashboard({
  setPage,
  setSelectedProjectId
}) {
  const {
    token,
    user
  } =
    useAuth();


  const [
    projects,
    setProjects
  ] =
    useState([]);


  const [
    summary,
    setSummary
  ] =
    useState({
      activeProjects:
        0,

      openTasks:
        0,

      upcomingMilestones:
        0
    });


  const [
    loading,
    setLoading
  ] =
    useState(
      true
    );


  const [
    error,
    setError
  ] =
    useState("");


  useEffect(
    () => {

      let cancelled =
        false;


      async function loadDashboard() {

        if (
          !token
        ) {

          if (
            !cancelled
          ) {

            setProjects(
              []
            );


            setSummary({
              activeProjects:
                0,

              openTasks:
                0,

              upcomingMilestones:
                0
            });


            setError(
              "Authentication is required to load your projects."
            );


            setLoading(
              false
            );

          }


          return;
        }


        setLoading(
          true
        );

        setError("");


        try {

          const projectsResponse =
            await fetch(
              "/api/projects/mine",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );


          const projectsData =
            await readResponseJson(
              projectsResponse
            );


          if (
            !projectsResponse.ok
          ) {

            throw new Error(
              projectsData.error ||
              projectsData.message ||
              "Failed to load your projects."
            );

          }


          const loadedProjects =
            getArray(
              projectsData,
              "projects"
            );


          const activeProjects =
            loadedProjects.filter(
              project =>
                String(
                  project.status ||
                  ""
                )
                  .trim()
                  .toUpperCase() ===
                "ACTIVE"
            );


          if (
            cancelled
          ) {
            return;
          }


          setProjects(
            loadedProjects
          );


          setSelectedProjectId(
            currentProjectId => {

              if (
                loadedProjects.length ===
                0
              ) {
                return "";
              }


              const stillAvailable =
                loadedProjects.some(
                  project =>
                    project.projectId ===
                    currentProjectId
                );


              return (
                stillAvailable
                  ? currentProjectId
                  : loadedProjects[0]
                      .projectId
              );
            }
          );


          if (
            loadedProjects.length ===
            0
          ) {

            setSummary({
              activeProjects:
                0,

              openTasks:
                0,

              upcomingMilestones:
                0
            });


            return;
          }


          try {

            const projectSummaries =
              await Promise.all(
                activeProjects.map(
                  async project => {

                    const authHeaders = {
                      Authorization:
                        `Bearer ${token}`
                    };


                    const [
                      tasksResponse,
                      milestonesResponse
                    ] =
                      await Promise.all([

                        fetch(
                          `/api/projects/${project.projectId}/tasks`,
                          {
                            headers:
                              authHeaders
                          }
                        ),


                        fetch(
                          `/api/projects/${project.projectId}/milestones`,
                          {
                            headers:
                              authHeaders
                          }
                        )

                      ]);


                    const [
                      tasksData,
                      milestonesData
                    ] =
                      await Promise.all([

                        readResponseJson(
                          tasksResponse
                        ),


                        readResponseJson(
                          milestonesResponse
                        )

                      ]);


                    if (
                      !tasksResponse.ok
                    ) {

                      throw new Error(
                        tasksData.error ||
                        tasksData.message ||
                        "Failed to load project tasks."
                      );

                    }


                    if (
                      !milestonesResponse.ok
                    ) {

                      throw new Error(
                        milestonesData.error ||
                        milestonesData.message ||
                        "Failed to load project milestones."
                      );

                    }


                    const tasks =
                      getArray(
                        tasksData,
                        "tasks"
                      );


                    const milestones =
                      getArray(
                        milestonesData,
                        "milestones"
                      );


                    return {
                      openTasks:
                        tasks.filter(
                          task =>
                            task.status !==
                            "DONE"
                        ).length,

                      upcomingMilestones:
                        milestones.filter(
                          milestone =>
                            milestone.status ===
                            "OPEN"
                        ).length
                    };
                  }
                )
              );


            if (
              cancelled
            ) {
              return;
            }


            setSummary({
              activeProjects: activeProjects.length,

              openTasks:
                projectSummaries
                  .reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      item.openTasks,
                    0
                  ),

              upcomingMilestones:
                projectSummaries
                  .reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      item
                        .upcomingMilestones,
                    0
                  )
            });

          }
          catch (
            summaryError
          ) {

            if (
              !cancelled
            ) {

              setSummary({
                activeProjects: activeProjects.length,

                openTasks:
                  0,

                upcomingMilestones:
                  0
              });


              setError(
                summaryError.message ||
                "Projects loaded, but the activity summary could not be calculated."
              );

            }

          }

        }
        catch (
          requestError
        ) {

          if (
            !cancelled
          ) {

            setProjects(
              []
            );


            setSummary({
              activeProjects:
                0,

              openTasks:
                0,

              upcomingMilestones:
                0
            });


            setError(
              requestError.message ||
              "Failed to load your dashboard."
            );

          }

        }
        finally {

          if (
            !cancelled
          ) {

            setLoading(
              false
            );

          }

        }
      }


      loadDashboard();


      return () => {
        cancelled =
          true;
      };

    },
    [
      token,
      setSelectedProjectId
    ]
  );

  function openProject(
    projectId
  ) {
    if (
      !projectId
    ) {
      return;
    }


    sessionStorage.setItem(
      "projectforge-active-project-id",
      projectId
    );


    setSelectedProjectId(
      projectId
    );


    setPage(
      "workspace"
    );
  }


  return (
    <>

      <PageTitle
        title="Dashboard"
        subtitle="Your projects and current ProjectForge activity."
      />


      <div className="grid two">

        <Panel title="My Projects">

          {loading && (

            <p className="muted">
              Loading your projects...
            </p>

          )}


          {!loading &&
            projects.length ===
              0 && (

            <p className="muted">
              You are not currently a member of any projects.
            </p>

          )}


          {projects.map(
            project => (

              <div
                className="list-row"
                key={
                  project.projectId
                }
              >

                <div>

                  <strong>
                    {project.title}
                  </strong>

                  <span>

                    {
                      project.memberRole ===
                      "LEAD"
                        ? "Project Lead"
                        : "Team Member"
                    }

                    {" | "}

                    {
                      formatStatus(
                        project.status
                      )
                    }

                  </span>

                </div>


                <Button
                  onClick={() =>
                    openProject(
                      project.projectId
                    )
                  }
                >
                  Open
                </Button>

              </div>

            )
          )}

        </Panel>


        <Panel title="Quick Actions">

          <div className="button-stack">

            <Button
              onClick={() =>
                setPage(
                  "discover"
                )
              }
            >
              Find a Project
            </Button>


            <Button
              secondary
              onClick={() =>
                setPage(
                  "create-project"
                )
              }
            >
              Create a Project
            </Button>


            <Button
              secondary
              onClick={() =>
                setPage(
                  "applications"
                )
              }
            >
              Review Applications
            </Button>


            {user?.role ===
              "STUDENT" && (

              <Button
                secondary
                onClick={() =>
                  setPage(
                    "pitwall"
                  )
                }
              >
                Pit Wall Check-in
              </Button>

            )}


            {user?.role ===
              "MENTOR" && (

              <Button
                secondary
                onClick={() =>
                  setPage(
                    "mentor"
                  )
                }
              >
                Mentor Portal
              </Button>

            )}


            <Button
              secondary
              onClick={() =>
                setPage(
                  "showcase"
                )
              }
            >
              View Showcase
            </Button>

          </div>

        </Panel>

      </div>


      {error && (

        <p
          className="error"
          role="alert"
        >
          {error}
        </p>

      )}


      <Panel title="Project Summary">

        <div className="stats">

          <div>

            <strong>
              {
                summary
                  .activeProjects
              }
            </strong>

            <span>
              Active Projects
            </span>

          </div>


          <div>

            <strong>
              {
                summary
                  .openTasks
              }
            </strong>

            <span>
              Open Tasks
            </span>

          </div>


          <div>

            <strong>
              {
                summary
                  .upcomingMilestones
              }
            </strong>

            <span>
              Upcoming Milestones
            </span>

          </div>

        </div>

      </Panel>

    </>
  );
}


function Workspace({
  selectedProjectId,
  setPage
}) {
  const {
    token,
    user
  } =
    useAuth();


  const [
    project,
    setProject
  ] =
    useState(
      null
    );


  const [
    members,
    setMembers
  ] =
    useState([]);


  const [
    loading,
    setLoading
  ] =
    useState(
      Boolean(
        selectedProjectId
      )
    );


  const [
    error,
    setError
  ] =
    useState("");


  useEffect(
    () => {

      let cancelled =
        false;


      async function loadWorkspace() {

        if (
          !selectedProjectId
        ) {

          setProject(
            null
          );

          setMembers(
            []
          );

          setError("");

          setLoading(
            false
          );


          return;
        }


        if (
          !token
        ) {

          setProject(
            null
          );

          setMembers(
            []
          );


          setError(
            "Authentication is required to open a project workspace."
          );


          setLoading(
            false
          );


          return;
        }


        setLoading(
          true
        );

        setError("");


        try {

          const [
            projectResponse,
            membersResponse
          ] =
            await Promise.all([

              fetch(
                `/api/projects/${selectedProjectId}`
              ),


              fetch(
                `/api/projects/${selectedProjectId}/members`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`
                  }
                }
              )

            ]);


          const [
            projectData,
            membersData
          ] =
            await Promise.all([

              readResponseJson(
                projectResponse
              ),


              readResponseJson(
                membersResponse
              )

            ]);


          if (
            !projectResponse.ok
          ) {

            throw new Error(
              projectData.error ||
              projectData.message ||
              "Failed to load project details."
            );

          }


          if (
            !membersResponse.ok
          ) {

            throw new Error(
              membersData.error ||
              membersData.message ||
              "You are not authorised to open this project workspace."
            );

          }


          if (
            cancelled
          ) {
            return;
          }


          setProject(
            projectData.project ||
            null
          );


          setMembers(
            getArray(
              membersData,
              "members"
            )
          );

        }
        catch (
          requestError
        ) {

          if (
            !cancelled
          ) {

            setProject(
              null
            );

            setMembers(
              []
            );


            setError(
              requestError.message ||
              "Failed to load the project workspace."
            );

          }

        }
        finally {

          if (
            !cancelled
          ) {

            setLoading(
              false
            );

          }

        }
      }


      loadWorkspace();


      return () => {
        cancelled =
          true;
      };

    },
    [
      selectedProjectId,
      token
    ]
  );


  if (
    !selectedProjectId
  ) {
    return (
      <>

        <PageTitle
          title="Project Workspace"
          subtitle="Select one of your projects to open its workspace."
        />


        <Panel title="No Project Selected">

          <p className="muted">
            Choose a project from your Dashboard first.
          </p>


          <Button
            onClick={() =>
              setPage(
                "dashboard"
              )
            }
          >
            Go to Dashboard
          </Button>

        </Panel>

      </>
    );
  }


  if (
    loading
  ) {
    return (
      <Panel title="Project Workspace">

        <p className="muted">
          Loading project workspace...
        </p>

      </Panel>
    );
  }


  if (
    error ||
    !project
  ) {
    return (
      <>

        <PageTitle
          title="Project Workspace"
          subtitle="The selected project could not be opened."
        />


        <Panel title="Unable to Open Project">

          <p
            className="error"
            role="alert"
          >
            {
              error ||
              "Project details are unavailable."
            }
          </p>


          <Button
            onClick={() =>
              setPage(
                "dashboard"
              )
            }
          >
            Back to Dashboard
          </Button>

        </Panel>

      </>
    );
  }


  const leadMember =
    members.find(
      member =>
        String(
          member.memberRole ||
          member.member_role ||
          ""
        )
          .toUpperCase() ===
        "LEAD"
    );


  return (
    <>

      <ProjectWorkspaceHeader
        projectName={
          project.title
        }

        status={
          formatStatus(
            project.status
          )
        }

        lead={
          leadMember
            ?.displayName ||
          leadMember
            ?.display_name ||
          "Project Lead"
        }

        repository={
          project.repositoryUrl ||
          project.repository_url ||
          ""
        }

        teamSize={
          members.length
        }
      />


      <ProjectImageManager
        projectId={
          selectedProjectId
        }
      />


      <Panel title="Milestones">

        <MilestoneBoard
          projectId={
            selectedProjectId
          }
        />

      </Panel>


      <Panel title="Tasks">

        <TaskBoard
          projectId={
            selectedProjectId
          }
        />

      </Panel>


      <DevelopmentUpdates
        projectId={
          selectedProjectId
        }
      />


      <Panel title="Team Radio">

        <TeamRadioAlert
          projectId={
            selectedProjectId
          }
        />

      </Panel>


      {user?.role ===
        "STUDENT" && (

        <MentorGuidancePanel
          projectId={
            selectedProjectId
          }
          projectTitle={
            project.title
          }
        />

      )}

    </>
  );
}


function PitWall({
  selectedProjectId,
  setPage
}) {
  const {
    user
  } =
    useAuth();


  const [
    periodStart
  ] =
    useState(
      getCurrentTeamHealthPeriodStart
    );


  const [
    teamHealthRefreshKey,
    setTeamHealthRefreshKey
  ] =
    useState(
      0
    );


  if (
    user?.role !==
    "STUDENT"
  ) {
    return (
      <>

        <PageTitle
          title="Pit Wall"
          subtitle="Private workload check-in and anonymous team-health feedback."
        />


        <Panel title="Private Student Area">

          <p
            className="error"
            role="alert"
          >
            Pit Wall and Team Health are available only to student accounts.
          </p>


          <Button
            onClick={() =>
              setPage(
                user?.role ===
                  "MENTOR"
                  ? "mentor"
                  : "dashboard"
              )
            }
          >
            Back
          </Button>

        </Panel>

      </>
    );
  }


  return (
    <>

      <PageTitle
        title="Pit Wall"
        subtitle="Private workload check-in and anonymous team-health feedback."
      />


      {!selectedProjectId && (

        <Panel title="No Project Selected">

          <p className="muted">
            Your private check-in is still available, but a project must be selected before using Team Health.
          </p>


          <Button
            onClick={() =>
              setPage(
                "dashboard"
              )
            }
          >
            Choose a Project
          </Button>

        </Panel>

      )}


      <div className="grid two">

        <Panel title="My Private Check-in">

          <PitWallForm />

        </Panel>


        <Panel title="Team Health Check-in">

          <TeamHealthCheckinForm
            projectId={
              selectedProjectId
            }

            periodStart={
              periodStart
            }

            onSubmitted={() =>
              setTeamHealthRefreshKey(
                current =>
                  current +
                  1
              )
            }
          />

        </Panel>

      </div>


      <TeamHealthSummaryPanel
        projectId={
          selectedProjectId
        }

        periodStart={
          periodStart
        }

        refreshKey={
          teamHealthRefreshKey
        }
      />

    </>
  );
}


function Showcase() {
  return (
    <>

      <PageTitle
        title="Project Showcase"
        subtitle="Completed student projects published by ProjectForge teams."
      />


      <PublicShowcase />

    </>
  );
}


function Mentor() {
  const {
    user,
    token
  } =
    useAuth();


  const [
    projects,
    setProjects
  ] =
    useState([]);


  const [
    selectedProjectId,
    setSelectedProjectId
  ] =
    useState("");


  const [
    loading,
    setLoading
  ] =
    useState(
      false
    );


  const [
    busyProjectId,
    setBusyProjectId
  ] =
    useState("");


  const [
    error,
    setError
  ] =
    useState("");


  const [
    message,
    setMessage
  ] =
    useState("");


  const [
    mentorActionFeedbackActive,
    setMentorActionFeedbackActive
  ] = useState(false);


  // MENTOR_PORTAL_FEEDBACK_AUTO_DISMISS
  useAutoDismissFeedback(
    mentorActionFeedbackActive &&
      Boolean(
        error
      ),
    () => {
      setError("");
      setMentorActionFeedbackActive(
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


  const selectedProject =
    projects.find(
      project =>
        getMentorProjectId(
          project
        ) ===
        selectedProjectId
    ) ||
    null;


  const loadProjects =
    useCallback(
      async () => {

        // MENTOR_PORTAL_LOAD_FEEDBACK
        setMentorActionFeedbackActive(
          false
        );

        if (
          !token ||
          user?.role !==
            "MENTOR"
        ) {

          setProjects(
            []
          );

          setSelectedProjectId(
            ""
          );


          return;
        }


        setLoading(
          true
        );

        setError("");


        try {

          const response =
            await fetch(
              "/api/mentor/projects",
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


          if (
            !response.ok
          ) {

            throw new Error(
              data.error ||
              data.message ||
              "Unable to load Mentor projects."
            );

          }


          const loadedProjects =
            Array.isArray(
              data?.projects
            )
              ? data.projects
              : Array.isArray(
                  data
                    ?.eligibleProjects
                )
                ? data
                    .eligibleProjects
                : Array.isArray(
                    data
                      ?.eligible_projects
                  )
                  ? data
                      .eligible_projects
                  : Array.isArray(
                      data
                    )
                    ? data
                    : [];


          setProjects(
            loadedProjects
          );


          setSelectedProjectId(
            currentId => {

              const stillActive =
                loadedProjects.some(
                  project =>
                    getMentorProjectId(
                      project
                    ) ===
                      currentId &&
                    getMentorAssignmentStatus(
                      project
                    ) ===
                      "ACTIVE"
                );


              return (
                stillActive
                  ? currentId
                  : ""
              );
            }
          );

        }
        catch (
          requestError
        ) {

          setProjects(
            []
          );

          setSelectedProjectId(
            ""
          );


          setError(
            requestError.message ||
            "Unable to load Mentor projects."
          );

        }
        finally {

          setLoading(
            false
          );

        }
      },
      [
        token,
        user?.role
      ]
    );


  useEffect(
    () => {

      loadProjects();

    },
    [
      loadProjects
    ]
  );


  async function requestMentorAssignment(
    project
  ) {
    const projectId =
      getMentorProjectId(
        project
      );


    if (
      !projectId ||
      !token ||
      busyProjectId
    ) {
      return;
    }


    // MENTOR_PORTAL_REQUEST_FEEDBACK
    setMentorActionFeedbackActive(
      true
    );


    setBusyProjectId(
      projectId
    );

    setError("");
    setMessage("");


    try {

      const response =
        await fetch(
          `/api/mentor/projects/${projectId}/assignments`,
          {
            method:
              "POST",

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


      if (
        !response.ok
      ) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to request Mentor access."
        );

      }


      setMessage(
        data.message ||
        `Mentor request submitted for "${getMentorProjectTitle(project)}".`
      );


      await loadProjects();

    }
    catch (
      requestError
    ) {

      setError(
        requestError.message ||
        "Unable to request Mentor access."
      );

    }
    finally {

      setBusyProjectId(
        ""
      );

    }
  }


  if (
    user?.role !==
    "MENTOR"
  ) {
    return (
      <>

        <PageTitle
          title="Mentor Portal"
          subtitle="Browse participating projects and provide approved guidance."
        />


        <Panel title="Project Guidance">

          <p
            className="error"
            role="alert"
          >
            Approved Mentor access is required.
          </p>

        </Panel>

      </>
    );
  }


  return (
    <>

      <PageTitle
        title="Mentor Portal"
        subtitle="Browse projects that permit Mentor participation, request an assignment and provide guidance once approved."
      />


      {error && (

        <p
          className="error"
          role="alert"
        >
          {error}
        </p>

      )}


      {message && (

        <p
          className="success"
          role="status"
        >
          {message}
        </p>

      )}


      <Panel title="Projects Available for Mentor Support">

        {loading ? (

          <p className="muted">
            Loading Mentor projects...
          </p>

        ) : projects.length ===
          0 ? (

          <p className="muted">
            No active projects currently permit Mentor participation.
          </p>

        ) : (

          <div className="simple-table">

            {projects.map(
              project => {

                const projectId =
                  getMentorProjectId(
                    project
                  );


                const projectTitle =
                  getMentorProjectTitle(
                    project
                  );


                const projectDescription =
                  getMentorProjectDescription(
                    project
                  );


                const projectCategory =
                  getMentorProjectCategory(
                    project
                  );


                const assignmentStatus =
                  getMentorAssignmentStatus(
                    project
                  );


                const isBusy =
                  busyProjectId ===
                  projectId;


                return (
                  <div
                    key={
                      projectId
                    }
                  >

                    <div>

                      <strong>
                        {projectTitle}
                      </strong>


                      <p>
                        {projectDescription}
                      </p>


                      <span className="muted">
                        {projectCategory}
                      </span>


                      {assignmentStatus && (

                        <p className="muted">

                          Mentor request:{" "}

                          {
                            formatStatus(
                              assignmentStatus
                            )
                          }

                        </p>

                      )}

                    </div>


                    <div className="button-stack">

                      {assignmentStatus ===
                        "ACTIVE" ? (

                        <Button
                          onClick={() =>
                            setSelectedProjectId(
                              projectId
                            )
                          }
                        >
                          {
                            selectedProjectId ===
                            projectId
                              ? "Guidance Open"
                              : "Open Guidance"
                          }
                        </Button>

                      ) : assignmentStatus ===
                        "PENDING" ? (

                        <span className="muted">
                          Awaiting Project Lead approval
                        </span>

                      ) : (

                        <Button
                          secondary
                          disabled={
                            isBusy
                          }
                          onClick={() =>
                            requestMentorAssignment(
                              project
                            )
                          }
                        >
                          {
                            isBusy
                              ? "Requesting..."
                              : "Request Mentor Assignment"
                          }
                        </Button>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </Panel>


      <MentorGuidancePanel
        projectId={
          selectedProjectId
        }

        projectTitle={
          selectedProject
            ? getMentorProjectTitle(
                selectedProject
              )
            : "Selected Project"
        }
      />

    </>
  );
}


function AppContent({
  page,
  setPage,
  selectedProjectId,
  setSelectedProjectId
}) {
  const {
    user
  } =
    useAuth();


  if (
    page ===
    "discover"
  ) {
    return (
      <DiscoverProjects />
    );
  }


  if (
    page ===
    "create-project"
  ) {
    return (
      <ProjectForm
        onProjectCreated={() =>
          setPage(
            "discover"
          )
        }
      />
    );
  }


  if (
    page ===
    "applications"
  ) {
    return (
      <ApplicationReview />
    );
  }


  if (
    page ===
    "workspace"
  ) {
    return (
      <Workspace
        selectedProjectId={
          selectedProjectId
        }

        setPage={
          setPage
        }
      />
    );
  }


  if (
    page ===
    "pitwall"
  ) {

    if (
      user?.role !==
      "STUDENT"
    ) {
      return (
        <Panel title="Private Student Area">

          <p
            className="error"
            role="alert"
          >
            Pit Wall and Team Health are available only to student accounts.
          </p>

        </Panel>
      );
    }


    return (
      <PitWall
        selectedProjectId={
          selectedProjectId
        }

        setPage={
          setPage
        }
      />
    );
  }


  if (
    page ===
    "profile"
  ) {
    return (
      <ProfileEdit />
    );
  }


  if (
    page ===
    "showcase"
  ) {
    return (
      <Showcase />
    );
  }


  if (
    page ===
    "mentor"
  ) {
    return (
      <Mentor />
    );
  }


  if (
    page ===
    "admin"
  ) {
    return (
      <AdminDashboard />
    );
  }


  return (
    <Dashboard
      setPage={
        setPage
      }

      setSelectedProjectId={
        setSelectedProjectId
      }
    />
  );
}


export default function App() {
  const {
    user,
    isAuthenticated,
    logout
  } =
    useAuth();


  const [
    mode,
    setMode
  ] =
    useState(
      isAuthenticated
        ? "app"
        : "login"
    );


  const [
    page,
    setPage
  ] =
    useState(
      () => {

        const savedToken =
          sessionStorage.getItem(
            "token"
          );


        const savedPage =
          sessionStorage.getItem(
            "projectforge-active-page"
          );


        if (
          savedToken &&
          savedPage
        ) {
          return savedPage;
        }


        return "dashboard";
      }
    );


  const [
    selectedProjectId,
    setSelectedProjectId
  ] =
    useState(
      () => {

        const savedToken =
          sessionStorage.getItem(
            "token"
          );


        if (
          !savedToken
        ) {
          return "";
        }


        return (
          sessionStorage.getItem(
            "projectforge-active-project-id"
          ) ||
          ""
        );
      }
    );


  useEffect(
    () => {

      if (
        isAuthenticated
      ) {

        setMode(
          "app"
        );

        return;
      }


      if (
        mode ===
          "app"
      ) {

        sessionStorage.removeItem(
          "projectforge-active-page"
        );


        sessionStorage.removeItem(
          "projectforge-active-project-id"
        );


        setSelectedProjectId(
          ""
        );


        setPage(
          "dashboard"
        );


        setMode(
          "login"
        );
      }

    },
    [
      isAuthenticated,
      mode
    ]
  );


  useEffect(
    () => {

      if (
        !isAuthenticated ||
        mode !==
          "app"
      ) {
        return;
      }


      if (
        user?.role ===
          "MENTOR" &&
        page ===
          "pitwall"
      ) {

        setPage(
          "mentor"
        );

        return;
      }


      if (
        user?.role !==
          "MENTOR" &&
        page ===
          "mentor"
      ) {

        setPage(
          "dashboard"
        );

        return;
      }


      if (
        user?.role !==
          "ADMIN" &&
        page ===
          "admin"
      ) {

        setPage(
          "dashboard"
        );

      }

    },
    [
      isAuthenticated,
      mode,
      page,
      user?.role
    ]
  );


  useEffect(
    () => {

      if (
        isAuthenticated &&
        mode ===
          "app"
      ) {

        sessionStorage.setItem(
          "projectforge-active-page",
          page
        );

      }

    },
    [
      isAuthenticated,
      mode,
      page
    ]
  );


  useEffect(
    () => {

      if (
        isAuthenticated &&
        mode ===
          "app"
      ) {

        if (
          selectedProjectId
        ) {

          sessionStorage.setItem(
            "projectforge-active-project-id",
            selectedProjectId
          );

        }
        else {

          sessionStorage.removeItem(
            "projectforge-active-project-id"
          );

        }

      }

    },
    [
      isAuthenticated,
      mode,
      selectedProjectId
    ]
  );


  if (
    mode ===
    "login"
  ) {
    return (
      <Login
        onSignup={() =>
          setMode(
            "signup"
          )
        }

        onShowcase={() => {

          setMode(
            "visitor"
          );


          setPage(
            "showcase"
          );

        }}
      />
    );
  }


  if (
    mode ===
    "signup"
  ) {
    return (
      <Signup
        onBack={() =>
          setMode(
            "login"
          )
        }

        onComplete={() =>
          setMode(
            "login"
          )
        }
      />
    );
  }


  const visitor =
    mode ===
    "visitor";


  return (
    <div className="app">

      <Header
        page={
          page
        }

        setPage={
          setPage
        }

        user={
          user
        }

        visitor={
          visitor
        }

        logout={() => {

          if (
            !visitor
          ) {

            sessionStorage.removeItem(
              "projectforge-active-page"
            );


            sessionStorage.removeItem(
              "projectforge-active-project-id"
            );


            setSelectedProjectId(
              ""
            );


            logout();

          }


          setMode(
            "login"
          );


          setPage(
            "dashboard"
          );

        }}
      />


      <main className="content">

        {visitor ? (

          <Showcase />

        ) : (

          <AppContent
            page={
              page
            }

            setPage={
              setPage
            }

            selectedProjectId={
              selectedProjectId
            }

            setSelectedProjectId={
              setSelectedProjectId
            }
          />

        )}

      </main>


      <footer>
        ProjectForge | Student Project Collaboration Platform
      </footer>

    </div>
  );
}