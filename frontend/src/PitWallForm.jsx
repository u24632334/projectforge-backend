import {
  useEffect,
  useState
} from "react";

import { useAuth } from "./context/AuthContext";
import { sanitizeText } from "./utils/sanitize.js";

import useAutoDismissFeedback
  from "./hooks/useAutoDismissFeedback";


const MAX_PIT_WALL_NOTE_LENGTH =
  1000;

const WORKLOAD_OPTIONS = [
  "Very light",
  "Light",
  "Manageable",
  "Heavy",
  "Overwhelming"
];

const MOTIVATION_OPTIONS = [
  "Very low",
  "Low",
  "Okay",
  "Good",
  "Excellent"
];

const CAPACITY_OPTIONS = [
  "None left",
  "A little",
  "Some",
  "Good amount",
  "Plenty"
];


function toScore(
  options,
  label
) {
  return (
    options.indexOf(label) + 1
  );
}


function fromScore(
  options,
  score
) {
  const numericScore =
    Number(score);

  if (
    !Number.isInteger(
      numericScore
    ) ||
    numericScore < 1 ||
    numericScore > options.length
  ) {
    return options[2];
  }

  return options[
    numericScore - 1
  ];
}


function formatSavedAt(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString();
}


/**
 * PitWallForm
 *
 * Private Pit Wall check-in.
 *
 * The authenticated user can:
 * - load their own previous check-ins;
 * - see their latest saved values after refresh;
 * - submit a new private check-in.
 *
 * The backend keeps check-in history. This form therefore loads
 * the newest record returned by GET /api/pitwall/checkins/me.
 */
export default function PitWallForm() {
  const { token } =
    useAuth();


  const [
    workload,
    setWorkload
  ] =
    useState(
      WORKLOAD_OPTIONS[2]
    );


  const [
    motivation,
    setMotivation
  ] =
    useState(
      MOTIVATION_OPTIONS[2]
    );


  const [
    capacity,
    setCapacity
  ] =
    useState(
      CAPACITY_OPTIONS[2]
    );


  const [
    note,
    setNote
  ] =
    useState("");


  const [
    status,
    setStatus
  ] =
    useState("loading");


  const [
    errorMessage,
    setErrorMessage
  ] =
    useState("");


  const [
    actionFeedbackActive,
    setActionFeedbackActive
  ] =
    useState(false);


  const [
    lastSavedAt,
    setLastSavedAt
  ] =
    useState("");


  const [
    hasPreviousCheckIn,
    setHasPreviousCheckIn
  ] =
    useState(false);
  useAutoDismissFeedback(
    actionFeedbackActive &&
      (
        status === "saved" ||
        status === "error"
      ),
    () => {
      setStatus("idle");
      setErrorMessage("");
      setActionFeedbackActive(false);
    }
  );


  useEffect(
    () => {
      if (
        note.length >
        MAX_PIT_WALL_NOTE_LENGTH
      ) {
        setStatus(
          "error"
        );

        setErrorMessage(
          `Maximum characters exceeded. Pit Wall notes may not exceed ${MAX_PIT_WALL_NOTE_LENGTH} characters.`
        );

        setActionFeedbackActive(
          true
        );
      }
    },
    [
      note
    ]
  );


  useEffect(() => {
    let cancelled = false;


    async function loadLatestCheckIn() {
      if (!token) {
        if (!cancelled) {
          setStatus("error");

          setErrorMessage(
            "Authentication is required to load your private check-in."
          );
        }

        return;
      }


      setStatus("loading");
      setErrorMessage("");


      try {
        const response =
          await fetch(
            "/api/pitwall/checkins/me",
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
            data?.error ||
            "Could not load your previous check-in."
          );
        }


        if (cancelled) {
          return;
        }


        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          const latest =
            data[0];


          setWorkload(
            fromScore(
              WORKLOAD_OPTIONS,
              latest.workload
            )
          );


          setMotivation(
            fromScore(
              MOTIVATION_OPTIONS,
              latest.motivation
            )
          );


          setCapacity(
            fromScore(
              CAPACITY_OPTIONS,
              latest.capacity
            )
          );


          setNote(
            latest.private_note ??
            latest.privateNote ??
            ""
          );


          setLastSavedAt(
            latest.created_at ??
            latest.createdAt ??
            ""
          );


          setHasPreviousCheckIn(
            true
          );
        }
        else {
          setHasPreviousCheckIn(
            false
          );

          setLastSavedAt("");
        }


        setStatus("idle");
      }
      catch (error) {
        if (!cancelled) {
          setStatus("error");

          setErrorMessage(
            error.message ||
            "Could not load your previous check-in."
          );
        }
      }
    }


    loadLatestCheckIn();


    return () => {
      cancelled = true;
    };
  }, [
    token
  ]);


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      note.length >
      MAX_PIT_WALL_NOTE_LENGTH
    ) {
      setStatus(
        "error"
      );

      setErrorMessage(
        `Maximum characters exceeded. Pit Wall notes may not exceed ${MAX_PIT_WALL_NOTE_LENGTH} characters.`
      );

      setActionFeedbackActive(
        true
      );

      return;
    }


    if (!token) {
      setStatus("error");

      setErrorMessage(
        "Authentication is required to save your check-in."
      );

      return;
    }


    setStatus("saving");
    setErrorMessage("");


    try {
      const response =
        await fetch(
          "/api/pitwall/checkins",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:
              JSON.stringify({
                workload:
                  toScore(
                    WORKLOAD_OPTIONS,
                    workload
                  ),

                motivation:
                  toScore(
                    MOTIVATION_OPTIONS,
                    motivation
                  ),

                capacity:
                  toScore(
                    CAPACITY_OPTIONS,
                    capacity
                  ),

                privateNote:
                  note.trim() === ""
                    ? null
                    : sanitizeText(
                        note.trim()
                      )
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Could not save your check-in."
        );
      }


      setStatus("saved");

      setHasPreviousCheckIn(
        true
      );


      setLastSavedAt(
        data?.created_at ??
        data?.createdAt ??
        new Date().toISOString()
      );
    }
    catch (error) {
      setStatus("error");

      setErrorMessage(
        error.message ||
        "Could not save your check-in."
      );
    }
  }


  const formattedSavedAt =
    formatSavedAt(
      lastSavedAt
    );


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
        Only visible to you.
      </p>


      {status ===
        "loading" && (
        <p
          className="muted"
          role="status"
        >
          Loading your latest check-in...
        </p>
      )}


      {hasPreviousCheckIn &&
        status !==
          "loading" && (
        <p
          className="muted"
          role="status"
        >
          Latest saved check-in loaded
          {formattedSavedAt
            ? ` • ${formattedSavedAt}`
            : ""}
        </p>
      )}


      <label
        htmlFor="pitwall-workload"
      >
        Workload

        <select
          id="pitwall-workload"

          value={
            workload
          }

          disabled={
            status ===
            "loading"
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
        htmlFor="pitwall-motivation"
      >
        Motivation

        <select
          id="pitwall-motivation"

          value={
            motivation
          }

          disabled={
            status ===
            "loading"
          }

          onChange={
            event =>
              setMotivation(
                event.target.value
              )
          }
        >
          {MOTIVATION_OPTIONS.map(
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
        htmlFor="pitwall-capacity"
      >
        Available capacity

        <select
          id="pitwall-capacity"

          value={
            capacity
          }

          disabled={
            status ===
            "loading"
          }

          onChange={
            event =>
              setCapacity(
                event.target.value
              )
          }
        >
          {CAPACITY_OPTIONS.map(
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
        htmlFor="pitwall-notes"
      >
        Notes

        <textarea
          id="pitwall-notes"

          value={
            note
          }

          disabled={
            status ===
            "loading"
          }

          onChange={
            event =>
              setNote(
                event.target.value
              )
          }

          placeholder="Private notes..."
        />


        <span className="muted">
          {note.length}/
          {MAX_PIT_WALL_NOTE_LENGTH}
          {" "}characters
        </span>

      </label>


      <button
        type="submit"

        className="button"

        disabled={
          status ===
            "saving" ||
          status ===
            "loading" ||
          note.length >
            MAX_PIT_WALL_NOTE_LENGTH
        }
      >
        {status ===
        "saving"
          ? "Saving..."
          : "Save check-in"}
      </button>


      {status ===
        "saved" && (
        <p
          className="success"
          role="status"
        >
          Saved successfully.
        </p>
      )}


      {status ===
        "error" && (
        <p
          className="error"
          role="alert"
        >
          {errorMessage ||
            "Couldn't save that — try again."}
        </p>
      )}

    </form>
  );
}
