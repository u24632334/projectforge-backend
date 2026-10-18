import {
  useEffect,
  useState
} from "react";

import {
  useAuth
} from "../context/AuthContext";

import useAutoDismissFeedback
  from "../hooks/useAutoDismissFeedback";


const WORKLOAD_OPTIONS = [
  "Very light",
  "Light",
  "Balanced",
  "Heavy",
  "Overwhelming"
];

const COMMUNICATION_OPTIONS = [
  "Very poor",
  "Poor",
  "Okay",
  "Good",
  "Excellent"
];

const BLOCKER_SEVERITY_OPTIONS = [
  "None",
  "Minor",
  "Moderate",
  "Significant",
  "Blocking"
];


function toScore(
  options,
  label
) {
  return (
    options.indexOf(label) + 1
  );
}


/**
 * TeamHealthCheckinForm
 *
 * Anonymous team-health survey.
 * Submits to:
 *
 * POST /api/projects/:projectId/team-health/checkins
 */
export default function TeamHealthCheckinForm({
  projectId,
  periodStart,
  onSubmitted
}) {
  const {
    token
  } =
    useAuth();


  const [
    workload,
    setWorkload
  ] =
    useState(
      WORKLOAD_OPTIONS[2]
    );


  const [
    communication,
    setCommunication
  ] =
    useState(
      COMMUNICATION_OPTIONS[2]
    );


  const [
    blockerSeverity,
    setBlockerSeverity
  ] =
    useState(
      BLOCKER_SEVERITY_OPTIONS[0]
    );


  const [
    status,
    setStatus
  ] =
    useState("idle");


  const [
    message,
    setMessage
  ] =
    useState("");


  useEffect(() => {
    setWorkload(
      WORKLOAD_OPTIONS[2]
    );

    setCommunication(
      COMMUNICATION_OPTIONS[2]
    );

    setBlockerSeverity(
      BLOCKER_SEVERITY_OPTIONS[0]
    );

    setStatus("idle");
    setMessage("");
  }, [
    projectId,
    periodStart
  ]);
  useAutoDismissFeedback(
    status === "saved" ||
    status === "duplicate" ||
    status === "error",
    () => {
      setStatus("idle");
      setMessage("");
    }
  );


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (!projectId) {
      setStatus("error");

      setMessage(
        "Select a project before submitting team-health feedback."
      );

      return;
    }


    if (!periodStart) {
      setStatus("error");

      setMessage(
        "The team-health period could not be determined."
      );

      return;
    }


    if (!token) {
      setStatus("error");

      setMessage(
        "Authentication is required to submit team-health feedback."
      );

      return;
    }


    setStatus("saving");
    setMessage("");


    try {
      const response =
        await fetch(
          `/api/projects/${projectId}/team-health/checkins`,
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
                periodStart,

                workload:
                  toScore(
                    WORKLOAD_OPTIONS,
                    workload
                  ),

                communication:
                  toScore(
                    COMMUNICATION_OPTIONS,
                    communication
                  ),

                blockerSeverity:
                  toScore(
                    BLOCKER_SEVERITY_OPTIONS,
                    blockerSeverity
                  )
              })
          }
        );


      const data =
        await response.json();


      if (
        response.status ===
        409
      ) {
        setStatus(
          "duplicate"
        );

        setMessage(
          data.error ||
          "You've already checked in for this period."
        );

        return;
      }


      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Could not submit team-health feedback."
        );
      }


      setStatus(
        "saved"
      );

      setMessage(
        "Submitted anonymously — thanks."
      );


      if (
        typeof onSubmitted ===
        "function"
      ) {
        onSubmitted();
      }
    }
    catch (
      requestError
    ) {
      setStatus(
        "error"
      );

      setMessage(
        requestError.message ||
        "Something went wrong — try again."
      );
    }
  }


  if (!projectId) {
    return (
      <p className="muted">
        Select a project from your Dashboard before completing a team-health check-in.
      </p>
    );
  }


  if (
    status ===
      "duplicate" ||
    status ===
      "saved"
  ) {
    return (
      <div>

        <p
          className={
            status ===
            "saved"
              ? "success"
              : "muted"
          }

          role="status"
        >
          {message}
        </p>

      </div>
    );
  }


  return (
    <form
      onSubmit={
        handleSubmit
      }
    >

      <p
        className="muted"

        style={{
          margin:
            "-10px 0 10px 0"
        }}
      >
        Anonymous — only combined team results are shown once enough responses are available.
      </p>


      <p className="muted">
        Period beginning:{" "}

        <strong>
          {periodStart}
        </strong>
      </p>


      <label
        htmlFor="team-health-workload"
      >
        Team workload

        <select
          id="team-health-workload"

          value={
            workload
          }

          disabled={
            status ===
            "saving"
          }

          onChange={
            event =>
              setWorkload(
                event.target.value
              )
          }
        >
          {WORKLOAD_OPTIONS.map(
            option => (
              <option
                key={
                  option
                }

                value={
                  option
                }
              >
                {option}
              </option>
            )
          )}
        </select>

      </label>


      <label
        htmlFor="team-health-communication"
      >
        Communication

        <select
          id="team-health-communication"

          value={
            communication
          }

          disabled={
            status ===
            "saving"
          }

          onChange={
            event =>
              setCommunication(
                event.target.value
              )
          }
        >
          {COMMUNICATION_OPTIONS.map(
            option => (
              <option
                key={
                  option
                }

                value={
                  option
                }
              >
                {option}
              </option>
            )
          )}
        </select>

      </label>


      <label
        htmlFor="team-health-blocker-severity"
      >
        Current blocker severity

        <select
          id="team-health-blocker-severity"

          value={
            blockerSeverity
          }

          disabled={
            status ===
            "saving"
          }

          onChange={
            event =>
              setBlockerSeverity(
                event.target.value
              )
          }
        >
          {BLOCKER_SEVERITY_OPTIONS.map(
            option => (
              <option
                key={
                  option
                }

                value={
                  option
                }
              >
                {option}
              </option>
            )
          )}
        </select>

      </label>


      <button
        type="submit"

        className="button"

        disabled={
          status ===
          "saving"
        }
      >
        {status ===
        "saving"
          ? "Submitting..."
          : "Submit Anonymous Check-in"}
      </button>


      {status ===
        "error" && (
        <p
          className="error"
          role="alert"
        >
          {message}
        </p>
      )}

    </form>
  );
}