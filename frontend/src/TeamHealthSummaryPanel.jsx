import {
  useEffect,
  useState
} from "react";

import {
  useAuth
} from "./context/AuthContext";


/**
 * TeamHealthSummaryPanel
 *
 * Displays aggregated anonymous team-health indicators.
 * Results remain hidden until the backend publication
 * threshold has been reached.
 */
export default function TeamHealthSummaryPanel({
  projectId,
  periodStart,
  refreshKey = 0
}) {
  const {
    token
  } =
    useAuth();


  const [
    summary,
    setSummary
  ] =
    useState(null);


  const [
    status,
    setStatus
  ] =
    useState("idle");


  const [
    error,
    setError
  ] =
    useState("");


  useEffect(() => {
    let cancelled =
      false;


    async function load() {
      if (
        !projectId ||
        !periodStart
      ) {
        setSummary(null);
        setStatus("idle");
        setError("");

        return;
      }


      if (!token) {
        setSummary(null);
        setStatus("error");

        setError(
          "Authentication is required to view team health."
        );

        return;
      }


      setStatus(
        "loading"
      );

      setError("");


      try {
        const response =
          await fetch(
            `/api/projects/${projectId}/team-health/summary?periodStart=${encodeURIComponent(
              periodStart
            )}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );


        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.error ||
            data.message ||
            "Failed to fetch team-health summary."
          );
        }


        if (!cancelled) {
          setSummary(
            data
          );

          setStatus(
            "ready"
          );
        }
      }
      catch (
        requestError
      ) {
        if (!cancelled) {
          setSummary(null);

          setStatus(
            "error"
          );

          setError(
            requestError.message ||
            "Couldn't load team health."
          );
        }
      }
    }


    load();


    return () => {
      cancelled =
        true;
    };
  }, [
    projectId,
    periodStart,
    refreshKey,
    token
  ]);


  if (!projectId) {
    return (
      <div className="panel">

        <h2>
          Team Health Summary
        </h2>

        <p className="muted">
          Select a project from your Dashboard to view its team-health summary.
        </p>

      </div>
    );
  }


  if (
    status ===
    "loading"
  ) {
    return (
      <div className="panel">

        <h2>
          Team Health Summary
        </h2>

        <p
          className="muted"
          role="status"
        >
          Loading team health...
        </p>

      </div>
    );
  }


  if (
    status ===
    "error"
  ) {
    return (
      <div className="panel">

        <h2>
          Team Health Summary
        </h2>

        <p
          className="error"
          role="alert"
        >
          {error}
        </p>

      </div>
    );
  }


  if (!summary) {
    return (
      <div className="panel">

        <h2>
          Team Health Summary
        </h2>

        <p className="muted">
          No team-health data is available for this period.
        </p>

      </div>
    );
  }


  if (
    !summary.publishable
  ) {
    return (
      <div className="panel">

        <h2>
          Team Health Summary
        </h2>

        <p className="muted">
          {summary.message ||
            "Aggregated team indicators will be displayed once enough responses are available."}
        </p>


        <p className="muted">
          Responses received:{" "}

          <strong>
            {
              summary.responseCount ??
              0
            }
          </strong>
        </p>

      </div>
    );
  }


  return (
    <div className="panel">

      <h2>
        Team Health Summary
      </h2>


      <p
        className="muted"

        style={{
          marginBottom:
            "16px"
        }}
      >
        {
          summary.responseCount
        } anonymous responses this period
      </p>


      <div className="simple-table">

        <div>
          <span>
            Workload
          </span>

          <b>
            {
              Number(
                summary.avgWorkload
              ).toFixed(1)
            } / 5
          </b>
        </div>


        <div>
          <span>
            Communication
          </span>

          <b>
            {
              Number(
                summary.avgCommunication
              ).toFixed(1)
            } / 5
          </b>
        </div>


        <div>
          <span>
            Blocker severity
          </span>

          <b>
            {
              Number(
                summary.avgBlockerSeverity
              ).toFixed(1)
            } / 5
          </b>
        </div>

      </div>

    </div>
  );
}