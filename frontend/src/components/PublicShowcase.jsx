import {
  useEffect,
  useState
} from "react";

import useAutoDismissFeedback
  from "../hooks/useAutoDismissFeedback";

import {
  useAuth
} from "../context/AuthContext";

import {
  sanitizeText
} from "../utils/sanitize.js";


import ProjectImageGallery
    from "./ProjectImageGallery";

const REPORT_REASONS = [
  "Inappropriate content",
  "Harassment or abuse",
  "Misleading content",
  "Spam",
  "Other"
];


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


function normaliseParticipant(
  participant
) {
  if (
    typeof participant ===
    "string"
  ) {
    return {
      userId:
        "",

      name:
        participant
    };
  }


  if (
    !participant ||
    typeof participant !==
      "object"
  ) {
    return {
      userId:
        "",

      name:
        "Participant"
    };
  }


  return {
    userId:
      participant.userId ||
      participant.user_id ||
      "",

    name:
      participant.name ||
      participant.displayName ||
      participant.display_name ||
      participant.email ||
      "Participant"
  };
}


/**
 * PFG-80: Public Project Showcase.
 *
 * Visitors may view approved completed projects without
 * authentication.
 *
 * Authenticated users may report either:
 * - a public Showcase project; or
 * - a public participant attached to that project.
 */
const MAX_REPORT_DETAILS_LENGTH =
  1000;

export default function PublicShowcase() {
  const {
    user,
    token
  } = useAuth();


  const [
    projects,
    setProjects
  ] =
    useState([]);


  const [
    loading,
    setLoading
  ] =
    useState(true);


  const [
    error,
    setError
  ] =
    useState("");


  const [
    reportTarget,
    setReportTarget
  ] =
    useState(null);


  const [
    reportReason,
    setReportReason
  ] =
    useState(
      REPORT_REASONS[0]
    );


  const [
    reportDetails,
    setReportDetails
  ] =
    useState("");


  const [
    submittingReport,
    setSubmittingReport
  ] =
    useState(false);


  const [
    reportError,
    setReportError
  ] =
    useState("");


  const [
    reportSuccess,
    setReportSuccess
  ] =
    useState("");


  useEffect(
    () => {
      if (
        reportDetails.length >
        MAX_REPORT_DETAILS_LENGTH
      ) {
        setReportError(
          `Maximum characters exceeded. Report details may not exceed ${MAX_REPORT_DETAILS_LENGTH} characters.`
        );

        setReportSuccess(
          ""
        );
      }
    },
    [
      reportDetails
    ]
  );


  // PUBLIC_SHOWCASE_REPORT_AUTO_DISMISS
  useAutoDismissFeedback(
    Boolean(
      reportError ||
      reportSuccess
    ),
    () => {
      setReportError(
        ""
      );

      setReportSuccess(
        ""
      );
    }
  );


  useEffect(
    () => {
      let active =
        true;


      async function loadShowcase() {
        setLoading(
          true
        );

        setError(
          ""
        );


        try {
          const response =
            await fetch(
              "/api/showcase"
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
              "Could not load the project showcase."
            );
          }


          if (active) {
            setProjects(
              Array.isArray(
                data.projects
              )
                ? data.projects
                : []
            );
          }
        }
        catch (
          loadError
        ) {
          if (active) {
            setError(
              loadError.message ||
              "Could not load the project showcase."
            );

            setProjects(
              []
            );
          }
        }
        finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      }


      loadShowcase();


      return () => {
        active =
          false;
      };
    },
    []
  );


  function clearReportMessages() {
    setReportError(
      ""
    );

    setReportSuccess(
      ""
    );
  }


  function closeReportForm() {
    setReportTarget(
      null
    );

    setReportReason(
      REPORT_REASONS[0]
    );

    setReportDetails(
      ""
    );

    clearReportMessages();
  }


  function openProjectReport(
    project
  ) {
    const projectId =
      project?.project_id;


    if (
      !projectId
    ) {
      return;
    }


    setReportTarget({
      type:
        "PROJECT",

      id:
        projectId,

      projectId,

      label:
        sanitizeText(
          project.title
        ) ||
        "Project"
    });


    setReportReason(
      REPORT_REASONS[0]
    );

    setReportDetails(
      ""
    );

    clearReportMessages();
  }


  function openUserReport(
    participant,
    projectId
  ) {
    const normalised =
      normaliseParticipant(
        participant
      );


    if (
      !normalised.userId ||
      !projectId
    ) {
      return;
    }


    setReportTarget({
      type:
        "USER",

      id:
        normalised.userId,

      projectId,

      label:
        sanitizeText(
          normalised.name
        ) ||
        "User"
    });


    setReportReason(
      REPORT_REASONS[0]
    );

    setReportDetails(
      ""
    );

    clearReportMessages();
  }


  async function submitReport(
    event
  ) {
    event.preventDefault();

    if (
      reportDetails.length >
      MAX_REPORT_DETAILS_LENGTH
    ) {
      setReportError(
        `Maximum characters exceeded. Report details may not exceed ${MAX_REPORT_DETAILS_LENGTH} characters.`
      );

      setReportSuccess(
        ""
      );

      return;
    }


    if (
      !token ||
      !user ||
      !reportTarget ||
      submittingReport
    ) {
      return;
    }


    const cleanDetails =
      reportDetails.trim();


    if (
      !cleanDetails
    ) {
      setReportError(
        "Please provide supporting information."
      );

      setReportSuccess(
        ""
      );

      return;
    }


    setSubmittingReport(
      true
    );

    setReportError(
      ""
    );

    setReportSuccess(
      ""
    );


    const reason =
      `${reportReason}: ${cleanDetails}`;


    const body =
      reportTarget.type ===
        "USER"
        ? {
            reportedUserId:
              reportTarget.id,

            reason
          }
        : {
            reportedProjectId:
              reportTarget.id,

            reason
          };


    try {
      const response =
        await fetch(
          "/api/reports",
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
              JSON.stringify(
                body
              )
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
          "Unable to submit report."
        );
      }


      setReportSuccess(
        data.message ||
        "Report submitted successfully."
      );


      setReportTarget(
        null
      );

      setReportReason(
        REPORT_REASONS[0]
      );

      setReportDetails(
        ""
      );
    }
    catch (
      submitError
    ) {
      setReportError(
        submitError.message ||
        "Unable to submit report."
      );
    }
    finally {
      setSubmittingReport(
        false
      );
    }
  }


  if (loading) {
    return (
      <section
        className="panel"
        aria-label="Completed Projects"
      >
        <h2>
          Completed Projects
        </h2>

        <p className="muted">
          Loading showcase...
        </p>
      </section>
    );
  }


  if (error) {
    return (
      <section
        className="panel"
        aria-label="Completed Projects"
      >
        <h2>
          Completed Projects
        </h2>

        <p
          className="error"
          role="alert"
        >
          {error}
        </p>
      </section>
    );
  }


  if (
    projects.length ===
    0
  ) {
    return (
      <section
        className="panel"
        aria-label="Completed Projects"
      >
        <h2>
          Completed Projects
        </h2>

        <p className="muted">
          No completed projects have been
          published yet.
        </p>
      </section>
    );
  }


  return (
    <section
      aria-label="Completed Projects"
    >
      <h2>
        Completed Projects
      </h2>


      {
        reportSuccess && (
          <p
            className="success"
            role="status"
          >
            {reportSuccess}
          </p>
        )
      }


      {
        reportError &&
        !reportTarget && (
          <p
            className="error"
            role="alert"
          >
            {reportError}
          </p>
        )
      }


      <div className="grid two">
        {
          projects.map(
            project => {
              const projectId =
                project.project_id;


              const safeTitle =
                sanitizeText(
                  project.title
                ) ||
                "Project";


              const participants =
                Array.isArray(
                  project.participants
                )
                  ? project.participants
                      .map(
                        normaliseParticipant
                      )
                  : [];


              const canReportProject =
                Boolean(
                  user &&
                  token &&
                  projectId
                );


              const isProjectTarget =
                reportTarget?.type ===
                  "PROJECT" &&
                reportTarget?.id ===
                  projectId;


              return (
                <article
                  className="panel"
                  key={
                    project.showcase_id ||
                    projectId
                  }
                >
                  <h3>
    {safeTitle}
</h3>


<ProjectImageGallery
    images={
        project.images
    }
    label={
        `${safeTitle} project images`
    }
/>


                  <p>
                    {
                      sanitizeText(
                        project.description
                      )
                    }
                  </p>


                  {
                    project.category && (
                      <p className="muted">
                        {
                          sanitizeText(
                            project.category
                          )
                        }
                      </p>
                    )
                  }


                  <h4>
                    Participants
                  </h4>


                  {
                    participants.length ===
                    0
                      ? (
                        <p className="muted">
                          No participants listed.
                        </p>
                      )
                      : (
                        <ul>
                          {
                            participants.map(
                              (
                                participant,
                                index
                              ) => {
                                const safeParticipantName =
                                  sanitizeText(
                                    participant.name
                                  ) ||
                                  "Participant";


                                const canReportUser =
                                  Boolean(
                                    user &&
                                    token &&
                                    participant.userId &&
                                    participant.userId !==
                                      user.id
                                  );


                                const isUserTarget =
                                  reportTarget?.type ===
                                    "USER" &&
                                  reportTarget?.id ===
                                    participant.userId &&
                                  reportTarget?.projectId ===
                                    projectId;


                                return (
                                  <li
                                    key={
                                      participant.userId ||
                                      `${projectId}-${index}`
                                    }
                                  >
                                    <span>
                                      {
                                        safeParticipantName
                                      }
                                    </span>


                                    {
                                      canReportUser && (
                                        <>
                                          {" "}

                                          <button
                                            type="button"
                                            className={
                                              "button button-secondary"
                                            }
                                            aria-label={
                                              `Report ${safeParticipantName} from ${safeTitle}`
                                            }
                                            onClick={
                                              () => {
                                                if (
                                                  isUserTarget
                                                ) {
                                                  closeReportForm();
                                                }
                                                else {
                                                  openUserReport(
                                                    participant,
                                                    projectId
                                                  );
                                                }
                                              }
                                            }
                                            disabled={
                                              submittingReport
                                            }
                                          >
                                            {
                                              isUserTarget
                                                ? "Cancel Report"
                                                : "Report User"
                                            }
                                          </button>
                                        </>
                                      )
                                    }
                                  </li>
                                );
                              }
                            )
                          }
                        </ul>
                      )
                  }


                  {
                    canReportProject && (
                      <button
                        type="button"
                        className={
                          "button button-secondary"
                        }
                        onClick={
                          () => {
                            if (
                              isProjectTarget
                            ) {
                              closeReportForm();
                            }
                            else {
                              openProjectReport(
                                project
                              );
                            }
                          }
                        }
                        disabled={
                          submittingReport
                        }
                      >
                        {
                          isProjectTarget
                            ? "Cancel Report"
                            : "Report Project"
                        }
                      </button>
                    )
                  }


                  {
                    reportTarget &&
                    reportTarget.projectId ===
                      projectId &&
                    (
                      (
                        reportTarget.type ===
                          "PROJECT" &&
                        reportTarget.id ===
                          projectId
                      ) ||
                      (
                        reportTarget.type ===
                          "USER" &&
                        participants.some(
                          participant =>
                            participant.userId ===
                            reportTarget.id
                        )
                      )
                    ) && (
                      <form
                        onSubmit={
                          submitReport
                        }
                      >
                        <h4>
                          Report {
                            reportTarget.label
                          }
                        </h4>


                        <label
                          htmlFor={
                            `report-reason-${reportTarget.type}-${projectId}-${reportTarget.id}`
                          }
                        >
                          Reason
                        </label>


                        <select
                          id={
                            `report-reason-${reportTarget.type}-${projectId}-${reportTarget.id}`
                          }
                          value={
                            reportReason
                          }
                          onChange={
                            event =>
                              setReportReason(
                                event.target.value
                              )
                          }
                          required
                        >
                          {
                            REPORT_REASONS.map(
                              reason => (
                                <option
                                  value={reason}
                                  key={reason}
                                >
                                  {reason}
                                </option>
                              )
                            )
                          }
                        </select>


                        <label
                          htmlFor={
                            `report-details-${reportTarget.type}-${projectId}-${reportTarget.id}`
                          }
                        >
                          Supporting information
                        </label>


                        <textarea
                          id={
                            `report-details-${reportTarget.type}-${projectId}-${reportTarget.id}`
                          }
                          rows="4"
                          value={
                            reportDetails
                          }
                          onChange={
                            event =>
                              setReportDetails(
                                event.target.value
                              )
                          }
                          placeholder={
                            reportTarget.type ===
                              "USER"
                              ? "Briefly explain why this user should be reviewed..."
                              : "Briefly explain why this public project should be reviewed..."
                          }
                          required
                        />


                        <p className="muted">
                          {reportDetails.length}/
                          {MAX_REPORT_DETAILS_LENGTH}
                          {" "}characters
                        </p>


                        {
                          reportError && (
                            <p
                              className="error"
                              role="alert"
                            >
                              {reportError}
                            </p>
                          )
                        }


                        <button
                          type="submit"
                          className="button"
                          disabled={
                            submittingReport ||
                            reportDetails.length >
                              MAX_REPORT_DETAILS_LENGTH
                          }
                        >
                          {
                            submittingReport
                              ? "Submitting..."
                              : "Submit Report"
                          }
                        </button>
                      </form>
                    )
                  }
                </article>
              );
            }
          )
        }
      </div>
    </section>
  );
}
