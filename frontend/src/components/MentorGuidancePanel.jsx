import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useAuth
} from "../context/AuthContext";

import useAutoDismissFeedback
  from "../hooks/useAutoDismissFeedback";


const MAX_GUIDANCE_LENGTH = 1000;


/**
 * Reads a JSON response safely.
 *
 * This prevents the component from crashing if the server ever
 * returns an empty or non-JSON error response.
 */
async function readResponseJson(response) {
  try {
    return await response.json();
  }
  catch {
    return {};
  }
}


/**
 * The backend now uses camelCase response fields, but these
 * helpers also understand the old snake_case format so that
 * previously mocked frontend tests and migrated data cannot
 * cause rendering errors.
 */
function getGuidanceId(entry) {
  return (
    entry?.guidanceId ||
    entry?.guidance_id ||
    ""
  );
}


function getMentorUserId(entry) {
  return (
    entry?.mentorUserId ||
    entry?.mentor_user_id ||
    ""
  );
}


function getMentorName(entry) {
  return (
    entry?.mentorName ||
    entry?.mentor_name ||
    "Mentor"
  );
}


function getCreatedAt(entry) {
  return (
    entry?.createdAt ||
    entry?.created_at ||
    null
  );
}


function getAssignmentStatus(entry) {
  return String(
    entry?.assignmentStatus ||
    entry?.assignment_status ||
    ""
  )
    .trim()
    .toUpperCase();
}


/**
 * PFG-75: Mentor Guidance Panel
 *
 * Project members may read Mentor guidance.
 *
 * Approved Mentors may submit guidance only when the backend
 * confirms that they have an ACTIVE Mentor assignment.
 *
 * A Mentor may edit only their own guidance while that
 * assignment remains ACTIVE.
 */
export default function MentorGuidancePanel({
  projectId,
  projectTitle = "Selected Project"
}) {
  const {
    token,
    user
  } = useAuth();


  const [
    entries,
    setEntries
  ] = useState([]);


  const [
    guidance,
    setGuidance
  ] = useState("");


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    submitting,
    setSubmitting
  ] = useState(false);


  const [
    editingGuidanceId,
    setEditingGuidanceId
  ] = useState("");


  const [
    editGuidance,
    setEditGuidance
  ] = useState("");


  const [
    savingEdit,
    setSavingEdit
  ] = useState(false);


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


  // MENTOR_GUIDANCE_FEEDBACK_SPLIT
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


  useEffect(
    () => {
      if (
        guidance.length >
        MAX_GUIDANCE_LENGTH
      ) {
        setError(
          `Maximum characters exceeded. Guidance may not exceed ${MAX_GUIDANCE_LENGTH} characters.`
        );

        setMessage("");

        setActionFeedbackActive(
          true
        );

        return;
      }

      if (
        editGuidance.length >
        MAX_GUIDANCE_LENGTH
      ) {
        setError(
          `Maximum characters exceeded. Guidance may not exceed ${MAX_GUIDANCE_LENGTH} characters.`
        );

        setMessage("");

        setActionFeedbackActive(
          true
        );
      }
    },
    [
      guidance,
      editGuidance
    ]
  );


  const isMentor =
    user?.role === "MENTOR";


  /**
   * Load guidance for the selected project.
   *
   * Access control is enforced by the backend:
   * - active project members may read guidance;
   * - the active assigned Mentor may read guidance;
   * - unrelated authenticated users receive 403.
   */
  const loadGuidance =
    useCallback(
      async () => {

        // MENTOR_GUIDANCE_LOAD_FEEDBACK
        setActionFeedbackActive(
          false
        );

        if (
          !token ||
          !projectId
        ) {
          setEntries([]);
          setLoading(false);

          return;
        }


        setLoading(true);
        setError("");
        setEntries([]);


        try {

          const response =
            await fetch(
              `/api/projects/${projectId}/guidance`,
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
              "Could not load Mentor guidance."
            );
          }


          setEntries(
            Array.isArray(
              data.guidance
            )
              ? data.guidance
              : []
          );
        }
        catch (
          loadError
        ) {

          setError(
            loadError.message ||
            "Could not load Mentor guidance."
          );

          setEntries([]);
        }
        finally {

          setLoading(false);
        }
      },
      [
        token,
        projectId
      ]
    );


  useEffect(() => {

    setGuidance("");
    setEditingGuidanceId("");
    setEditGuidance("");
    setMessage("");
    setError("");


    loadGuidance();

  }, [
    loadGuidance
  ]);


  /**
   * Submit a new Mentor guidance entry.
   *
   * The backend performs the final ACTIVE-assignment check.
   */
  async function submitGuidance(
    event
  ) {

    setActionFeedbackActive(true);
    event.preventDefault();


    if (
      !token ||
      !projectId ||
      !isMentor ||
      submitting
    ) {
      return;
    }


    const trimmedGuidance =
      guidance.trim();


    if (!trimmedGuidance) {

      setError(
        "Guidance text is required."
      );

      return;
    }


    if (
      trimmedGuidance.length >
      MAX_GUIDANCE_LENGTH
    ) {

      setError(
        `Maximum characters exceeded. Guidance may not exceed ${MAX_GUIDANCE_LENGTH} characters.`
      );

      return;
    }


    setSubmitting(true);
    setError("");
    setMessage("");


    try {

      const response =
        await fetch(
          `/api/projects/${projectId}/guidance`,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                guidance:
                  trimmedGuidance
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
          "Could not submit Mentor guidance."
        );
      }


      setGuidance("");

      setMessage(
        data.message ||
        "Guidance submitted successfully."
      );


      /*
       * Reload from the API instead of manually inserting the
       * POST response into state. This ensures the displayed
       * entry uses the exact canonical server representation.
       */
      await loadGuidance();
    }
    catch (
      submitError
    ) {

      setError(
        submitError.message ||
        "Could not submit Mentor guidance."
      );
    }
    finally {

      setSubmitting(false);
    }
  }


  function beginEdit(
    entry
  ) {
    const guidanceId =
      getGuidanceId(
        entry
      );


    if (!guidanceId) {
      return;
    }


    setEditingGuidanceId(
      guidanceId
    );

    setEditGuidance(
      entry?.guidance ||
      ""
    );

    setError("");
    setMessage("");
  }


  function cancelEdit() {

    if (savingEdit) {
      return;
    }


    setEditingGuidanceId("");
    setEditGuidance("");
    setError("");
  }


  /**
   * Update an existing guidance entry.
   *
   * Backend rules still enforce:
   * - the authenticated Mentor owns the guidance;
   * - the guidance belongs to this project;
   * - the Mentor assignment is still ACTIVE.
   */
  async function saveGuidanceEdit(
    event
  ) {

    setActionFeedbackActive(true);
    event.preventDefault();


    if (
      !token ||
      !projectId ||
      !editingGuidanceId ||
      !isMentor ||
      savingEdit
    ) {
      return;
    }


    const trimmedGuidance =
      editGuidance.trim();


    if (!trimmedGuidance) {

      setError(
        "Guidance text is required."
      );

      return;
    }


    if (
      trimmedGuidance.length >
      MAX_GUIDANCE_LENGTH
    ) {

      setError(
        `Maximum characters exceeded. Guidance may not exceed ${MAX_GUIDANCE_LENGTH} characters.`
      );

      return;
    }


    setSavingEdit(true);
    setError("");
    setMessage("");


    try {

      const response =
        await fetch(
          `/api/projects/${projectId}/guidance/${editingGuidanceId}`,
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
                guidance:
                  trimmedGuidance
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
          "Could not update Mentor guidance."
        );
      }


      setEditingGuidanceId("");
      setEditGuidance("");

      setMessage(
        data.message ||
        "Guidance updated successfully."
      );


      await loadGuidance();
    }
    catch (
      editError
    ) {

      setError(
        editError.message ||
        "Could not update Mentor guidance."
      );
    }
    finally {

      setSavingEdit(false);
    }
  }


  if (!token) {

    return (
      <section
        className="panel"
        aria-label="Mentor Guidance"
      >

        <h2>
          Mentor Guidance
        </h2>

        <p className="error">
          You must be signed in to view Mentor guidance.
        </p>

      </section>
    );
  }


  if (!projectId) {

    return (
      <section
        className="panel"
        aria-label="Mentor Guidance"
      >

        <h2>
          Mentor Guidance
        </h2>

        <p className="muted">
          Select a project to view Mentor guidance.
        </p>

      </section>
    );
  }


  return (
    <section
      className="panel"
      aria-label="Mentor Guidance"
    >

      <h2>
        Mentor Guidance — {projectTitle}
      </h2>


      {/*
       * Only Mentor accounts see the submission form.
       *
       * The Mentor Portal will later ensure this panel is opened
       * for an ACTIVE assignment. The backend remains the final
       * authorization layer.
       */}
      {isMentor && (

        <form
          onSubmit={
            submitGuidance
          }
        >

          <label
            htmlFor="mentor-guidance-text"
          >

            New Guidance

            <textarea
              id="mentor-guidance-text"
              value={
                guidance
              }
              onChange={
                event =>
                  setGuidance(
                    event.target.value
                  )
              }
              placeholder="Enter project guidance..."
              rows={5}
              disabled={
                submitting
              }
            />

          </label>


          <p className="muted">
            {guidance.length}
            /
            {MAX_GUIDANCE_LENGTH}
            {" "}characters
          </p>


          <button
            className="button"
            type="submit"
            disabled={
              submitting ||
              !guidance.trim() ||
              guidance.length >
                MAX_GUIDANCE_LENGTH
            }
          >
            {
              submitting
                ? "Submitting..."
                : "Submit Guidance"
            }
          </button>

        </form>

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


      <h3>
        Feedback Entries
      </h3>


      {loading ? (

        <p className="muted">
          Loading guidance...
        </p>

      ) : entries.length === 0 ? (

        <p className="muted">
          No guidance has been submitted yet.
        </p>

      ) : (

        <div className="simple-table">

          {entries.map(
            (
              entry,
              index
            ) => {

              const guidanceId =
                getGuidanceId(
                  entry
                );


              const mentorUserId =
                getMentorUserId(
                  entry
                );


              const assignmentStatus =
                getAssignmentStatus(
                  entry
                );


              const createdAt =
                getCreatedAt(
                  entry
                );


              const ownsEntry =
                Boolean(
                  user?.id &&
                  mentorUserId &&
                  user.id ===
                    mentorUserId
                );


              const canEdit =
                isMentor &&
                ownsEntry &&
                assignmentStatus ===
                  "ACTIVE";


              const isEditing =
                guidanceId &&
                editingGuidanceId ===
                  guidanceId;


              return (
                <div
                  key={
                    guidanceId ||
                    `${createdAt || "guidance"}-${index}`
                  }
                >

                  <div>

                    <strong>
                      {
                        getMentorName(
                          entry
                        )
                      }
                    </strong>


                    {isEditing ? (

                      <form
                        onSubmit={
                          saveGuidanceEdit
                        }
                      >

                        <label
                          htmlFor={
                            `edit-guidance-${guidanceId}`
                          }
                        >

                          Edit Guidance

                          <textarea
                            id={
                              `edit-guidance-${guidanceId}`
                            }
                            value={
                              editGuidance
                            }
                            onChange={
                              event =>
                                setEditGuidance(
                                  event
                                    .target
                                    .value
                                )
                            }
                            rows={5}
                            disabled={
                              savingEdit
                            }
                          />

                        </label>


                        <p className="muted">
                          {
                            editGuidance.length
                          }
                          /
                          {
                            MAX_GUIDANCE_LENGTH
                          }
                          {" "}characters
                        </p>


                        <div>

                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={
                              cancelEdit
                            }
                            disabled={
                              savingEdit
                            }
                          >
                            Cancel
                          </button>


                          <button
                            type="submit"
                            className="button"
                            disabled={
                              savingEdit ||
                              !editGuidance.trim() ||
                              editGuidance.length >
                                MAX_GUIDANCE_LENGTH
                            }
                          >
                            {
                              savingEdit
                                ? "Saving..."
                                : "Save Guidance"
                            }
                          </button>

                        </div>

                      </form>

                    ) : (

                      <>

                        <p>
                          {
                            entry?.guidance ||
                            ""
                          }
                        </p>


                        {createdAt && (

                          <span className="muted">
                            {
                              new Date(
                                createdAt
                              )
                                .toLocaleString()
                            }
                          </span>

                        )}


                        {canEdit && (

                          <div>

                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() =>
                                beginEdit(
                                  entry
                                )
                              }
                            >
                              Edit Guidance
                            </button>

                          </div>

                        )}

                      </>

                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

      )}

    </section>
  );
}
