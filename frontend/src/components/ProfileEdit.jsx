import React, {
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

import "./ProfileEdit.css";


const PROFICIENCY_OPTIONS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED"
];


const MAX_DISPLAY_NAME_LENGTH =
  120;

const MAX_BIO_LENGTH =
  1000;

const MAX_INTERESTS_LENGTH =
  1000;


const MAX_SKILL_NAME_LENGTH =
  120;

const MAX_SKILL_CATEGORY_LENGTH =
  120;


function getSafeRepositoryUrl(
  value
) {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return null;
  }


  try {
    const url =
      new URL(
        value.trim()
      );


    const validHost =
      url.hostname ===
        "github.com" ||
      url.hostname ===
        "www.github.com" ||
      url.hostname ===
        "gitlab.com" ||
      url.hostname ===
        "www.gitlab.com";


    if (
      url.protocol !==
        "https:" ||
      !validHost
    ) {
      return null;
    }


    return url.href;
  }
  catch {
    return null;
  }
}


export default function ProfileEdit() {

  const {
    user,
    token
  } = useAuth();


  const [
    displayName,
    setDisplayName
  ] = useState("");


  const [
    bio,
    setBio
  ] = useState("");


  const [
    interests,
    setInterests
  ] = useState("");


  const [
    availabilityHours,
    setAvailabilityHours
  ] = useState(0);


  const [
    skills,
    setSkills
  ] = useState([]);


  const [
    approvedCompletedProjects,
    setApprovedCompletedProjects
  ] = useState([]);


  const [
    newSkillName,
    setNewSkillName
  ] = useState("");


  const [
    newSkillCategory,
    setNewSkillCategory
  ] = useState("");


  const [
    newSkillProficiency,
    setNewSkillProficiency
  ] = useState(
    "BEGINNER"
  );


  const [
    isLoading,
    setIsLoading
  ] = useState(true);


  const [
    isSaving,
    setIsSaving
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage
  ] = useState("");


  const [
    skillErrorMessage,
    setSkillErrorMessage
  ] = useState("");


  const [
    actionFeedbackActive,
    setActionFeedbackActive
  ] = useState(false);


  // PROFILE_EDIT_FEEDBACK_SPLIT
  useAutoDismissFeedback(
    actionFeedbackActive &&
      Boolean(
        errorMessage
      ),
    () => {
      setErrorMessage("");
      setActionFeedbackActive(
        false
      );
    }
  );


  useAutoDismissFeedback(
    Boolean(
      successMessage
    ),
    () => {
      setSuccessMessage("");
    }
  );


  useAutoDismissFeedback(
    Boolean(
      skillErrorMessage
    ),
    () => {
      setSkillErrorMessage("");
    }
  );


  useEffect(
    () => {
      let lengthError =
        "";

      if (
        displayName.length >
        MAX_DISPLAY_NAME_LENGTH
      ) {
        lengthError =
          `Maximum characters exceeded. Display name may not exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`;
      }
      else if (
        bio.length >
        MAX_BIO_LENGTH
      ) {
        lengthError =
          `Maximum characters exceeded. Bio may not exceed ${MAX_BIO_LENGTH} characters.`;
      }
      else if (
        interests.length >
        MAX_INTERESTS_LENGTH
      ) {
        lengthError =
          `Maximum characters exceeded. Interests may not exceed ${MAX_INTERESTS_LENGTH} characters.`;
      }

      if (
        lengthError
      ) {
        setActionFeedbackActive(
          true
        );

        setSuccessMessage(
          ""
        );

        setErrorMessage(
          lengthError
        );
      }
    },
    [
      displayName,
      bio,
      interests
    ]
  );


  useEffect(
    () => {

      let cancelled =
        false;


      async function loadProfile() {
        // PROFILE_EDIT_LOAD_FEEDBACK
        setActionFeedbackActive(
          false
        );

        if (
          !user ||
          !user.id
        ) {
          setIsLoading(
            false
          );

          return;
        }


        try {
          setIsLoading(
            true
          );

          setErrorMessage(
            ""
          );


          const response =
            await fetch(
              `/api/profiles/${user.id}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );


          const resData =
            await response.json();


          if (
            !response.ok
          ) {
            throw new Error(
              resData.error ||
              "Unable to load profile data from the server."
            );
          }


          if (
            !resData.data ||
            cancelled
          ) {
            return;
          }


          const profile =
            resData.data;


          setDisplayName(
            sanitizeText(
              profile.display_name ||
              ""
            )
          );


          setBio(
            sanitizeText(
              profile.bio ||
              ""
            )
          );


          setInterests(
            Array.isArray(
              profile.interests
            )
              ? profile.interests
                  .map(
                    (item) =>
                      sanitizeText(
                        item
                      )
                  )
                  .join(
                    ", "
                  )
              : ""
          );


          setAvailabilityHours(
            profile
              .availability_hours_per_week ??
            0
          );


          setSkills(
            Array.isArray(
              profile.skills
            )
              ? profile.skills.map(
                  (skill) => ({
                    ...skill,

                    name:
                      sanitizeText(
                        skill.name ||
                        ""
                      ),

                    category:
                      sanitizeText(
                        skill.category ||
                        ""
                      ),

                    proficiency:
                      sanitizeText(
                        skill.proficiency ||
                        "BEGINNER"
                      )
                  })
                )
              : []
          );


          setApprovedCompletedProjects(
            Array.isArray(
              profile
                .approved_completed_projects
            )
              ? profile
                  .approved_completed_projects
                  .map(
                    (project) => ({
                      ...project,

                      title:
                        sanitizeText(
                          project.title ||
                          ""
                        ),

                      description:
                        sanitizeText(
                          project.description ||
                          ""
                        ),

                      category:
                        sanitizeText(
                          project.category ||
                          ""
                        )
                    })
                  )
              : []
          );

        }
        catch (
          error
        ) {

          if (
            !cancelled
          ) {
            setErrorMessage(
              error.message ||
              "Unable to load profile data from the server."
            );
          }

        }
        finally {

          if (
            !cancelled
          ) {
            setIsLoading(
              false
            );
          }

        }
      }


      loadProfile();


      return () => {

        cancelled =
          true;

      };

    },
    [
      user,
      token
    ]
  );


  function handleBoundedPaste(
    event,
    currentValue,
    maximumLength,
    fieldLabel
  ) {
    const pastedText =
      event.clipboardData
        ?.getData(
          "text"
        ) || "";


    const target =
      event.currentTarget;


    const selectionStart =
      target.selectionStart ??
      currentValue.length;


    const selectionEnd =
      target.selectionEnd ??
      selectionStart;


    const nextLength =
      currentValue.length -
      (
        selectionEnd -
        selectionStart
      ) +
      pastedText.length;


    if (
      nextLength <=
      maximumLength
    ) {
      return;
    }


    event.preventDefault();


    setActionFeedbackActive(
      true
    );

    setSuccessMessage(
      ""
    );

    setErrorMessage(
      ""
    );

    setSkillErrorMessage(
      `Maximum characters exceeded. ${fieldLabel} may not exceed ${maximumLength} characters.`
    );
  }


  function handleAddSkill() {

    setActionFeedbackActive(true);

    setErrorMessage(
      ""
    );

    setSkillErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    const cleanName =
      sanitizeText(
        newSkillName.trim()
      );


    const cleanCategory =
      sanitizeText(
        newSkillCategory.trim()
      );


    if (
      !cleanName
    ) {
      setSkillErrorMessage(
        "Please enter a skill name."
      );

      return;
    }


    if (
      !cleanCategory
    ) {
      setSkillErrorMessage(
        "Please enter a skill category."
      );

      return;
    }


    if (
      cleanName.length >
      MAX_SKILL_NAME_LENGTH
    ) {
      setSkillErrorMessage(
        `Maximum characters exceeded. Skill name may not exceed ${MAX_SKILL_NAME_LENGTH} characters.`
      );

      return;
    }


    if (
      cleanCategory.length >
      MAX_SKILL_CATEGORY_LENGTH
    ) {
      setSkillErrorMessage(
        `Maximum characters exceeded. Skill category may not exceed ${MAX_SKILL_CATEGORY_LENGTH} characters.`
      );

      return;
    }


    const duplicate =
      skills.some(
        (skill) =>
          skill.name
            .trim()
            .toLowerCase() ===
          cleanName
            .toLowerCase()
      );


    if (
      duplicate
    ) {
      setSkillErrorMessage(
        "That skill is already registered."
      );

      return;
    }


    // PROFILE_EDIT_ADD_SKILL_SUCCESS
    setActionFeedbackActive(
      false
    );


    setSkills(
      (currentSkills) => [
        ...currentSkills,
        {
          skill_id:
            null,

          name:
            cleanName,

          category:
            cleanCategory,

          proficiency:
            newSkillProficiency
        }
      ]
    );


    setNewSkillName("");

    setNewSkillCategory("");

    setNewSkillProficiency(
      "BEGINNER"
    );
  }


  function handleRemoveSkill(
    index
  ) {

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    setSkills(
      (currentSkills) =>
        currentSkills.filter(
          (
            _skill,
            skillIndex
          ) =>
            skillIndex !==
            index
        )
    );
  }


  function handleProficiencyChange(
    index,
    proficiency
  ) {

    setSkills(
      (currentSkills) =>
        currentSkills.map(
          (
            skill,
            skillIndex
          ) =>
            skillIndex ===
            index
              ? {
                  ...skill,
                  proficiency
                }
              : skill
        )
    );
  }


  const handleSubmit =
    async (
      event
    ) => {

      setActionFeedbackActive(true);

      event.preventDefault();


      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );


      if (
        displayName.length >
        MAX_DISPLAY_NAME_LENGTH
      ) {
        setErrorMessage(
          `Maximum characters exceeded. Display name may not exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`
        );

        return;
      }


      if (
        bio.length >
        MAX_BIO_LENGTH
      ) {
        setErrorMessage(
          `Maximum characters exceeded. Bio may not exceed ${MAX_BIO_LENGTH} characters.`
        );

        return;
      }


      if (
        interests.length >
        MAX_INTERESTS_LENGTH
      ) {
        setErrorMessage(
          `Maximum characters exceeded. Interests may not exceed ${MAX_INTERESTS_LENGTH} characters.`
        );

        return;
      }


      if (
        !displayName.trim()
      ) {
        setErrorMessage(
          "Display name cannot be blank."
        );

        return;
      }


      const hoursNum =
        Number(
          availabilityHours
        );


      if (
        !Number.isFinite(
          hoursNum
        ) ||
        hoursNum < 0 ||
        hoursNum > 168
      ) {
        setErrorMessage(
          "Availability hours must be between 0 and 168."
        );

        return;
      }


      if (
        !Number.isInteger(
          hoursNum
        )
      ) {
        setErrorMessage(
          "Availability hours must be a whole number."
        );

        return;
      }


      const cleanedInterests =
        interests
          .split(",")
          .map(
            (item) =>
              sanitizeText(
                item.trim()
              )
          )
          .filter(
            (item) =>
              item.length >
              0
          );


      const cleanedSkills =
        skills.map(
          (skill) => ({
            name:
              sanitizeText(
                skill.name
                  .trim()
              ),

            category:
              sanitizeText(
                skill.category
                  .trim()
              ),

            proficiency:
              String(
                skill.proficiency
              ).toUpperCase()
          })
        );


      const invalidSkill =
        cleanedSkills.find(
          (skill) =>
            !skill.name ||
            !skill.category ||
            !PROFICIENCY_OPTIONS
              .includes(
                skill.proficiency
              )
        );


      if (
        invalidSkill
      ) {
        setErrorMessage(
          "Every skill must have a name, category and valid proficiency."
        );

        return;
      }


      const oversizedSkillName =
        cleanedSkills.find(
          (skill) =>
            skill.name.length >
            MAX_SKILL_NAME_LENGTH
        );


      if (
        oversizedSkillName
      ) {
        setErrorMessage(
          `Maximum characters exceeded. Skill name may not exceed ${MAX_SKILL_NAME_LENGTH} characters.`
        );

        return;
      }


      const oversizedSkillCategory =
        cleanedSkills.find(
          (skill) =>
            skill.category.length >
            MAX_SKILL_CATEGORY_LENGTH
        );


      if (
        oversizedSkillCategory
      ) {
        setErrorMessage(
          `Maximum characters exceeded. Skill category may not exceed ${MAX_SKILL_CATEGORY_LENGTH} characters.`
        );

        return;
      }


      try {
        setIsSaving(
          true
        );


        const response =
          await fetch(
            "/api/profiles/me",
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`
              },

              body:
                JSON.stringify({
                  displayName:
                    sanitizeText(
                      displayName
                        .trim()
                    ),

                  bio:
                    sanitizeText(
                      bio
                    ),

                  interests:
                    cleanedInterests,

                  availabilityHoursPerWeek:
                    hoursNum,

                  skills:
                    cleanedSkills
                })
            }
          );


        const resData =
          await response.json();


        if (
          !response.ok
        ) {
          throw new Error(
            resData.error ||
            "Failed to update profile."
          );
        }


        // PROFILE_EDIT_SAVE_SUCCESS
        setActionFeedbackActive(
          false
        );


        setSuccessMessage(
          "Profile updated successfully!"
        );

      }
      catch (
        error
      ) {

        setErrorMessage(
          error.message ||
          "An unexpected error occurred."
        );

      }
      finally {

        setIsSaving(
          false
        );

      }
    };


  if (
    isLoading
  ) {

    return (
      <div className="page-wrap profile-view-wrap">

        <div className="page">

          <div className="profile-container loading">
            Loading profile telemetry...
          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="page-wrap profile-view-wrap">

      <div className="page">

        <div className="race-strip profile-race-strip">

          <div className="strip-left">

            <span className="strip-kicker">
              FIA PADDOCK PASS
            </span>

            <strong>
              // DRIVER ID
            </strong>

          </div>


          <div className="strip-center">

            <span>
              PASSPORT &amp; CONTRACT SPECS
            </span>

          </div>


          <div className="strip-right">

            <span className="superlicense-chip">

              <i className="superlicense-dot"></i>

              {" "}

              SUPERLICENSE: VALID

            </span>

          </div>

        </div>


        <div className="profile-container">

          <div className="profile-header-meta">

            <div>

              <span className="eyebrow">
                IDENTITY &amp; ROSTER
              </span>


              <h2>
                Student Profile &amp; Skills Management
              </h2>


              <p className="profile-subtitle">
                Update your personal details,
                availability and technical
                competencies.
              </p>

            </div>


            <div className="profile-user-badge">

              <div className="profile-badge-avatar">

                {
                  displayName
                    ? displayName
                        .charAt(0)
                        .toUpperCase()
                    : "S"
                }

              </div>


              <div className="profile-badge-info">

                <strong>
                  {
                    displayName ||
                    "Student"
                  }
                </strong>


                <span>

                  <i className="status-dot"></i>

                  {" "}

                  Verified Student

                </span>

              </div>

            </div>

          </div>


          {errorMessage &&
            !errorMessage.startsWith(
              "Maximum characters exceeded."
            ) && (

            <div
              className="alert-box error"
              role="alert"
            >
              {errorMessage}
            </div>

          )}


          {successMessage && (

            <div
              className="alert-box success"
              role="status"
            >
              {successMessage}
            </div>

          )}


          <form
            onSubmit={
              handleSubmit
            }
            className="profile-form"
          >

            <div className="form-group readonly">

              <label htmlFor="accountEmail">
                Account Email
              </label>


              <input
                id="accountEmail"
                type="text"
                value={
                  user?.email ||
                  ""
                }
                disabled
              />

            </div>


            <div className="form-group">

              <label htmlFor="displayName">
                Display Name *
              </label>


              <input
                id="displayName"
                type="text"
                value={
                  displayName
                }
                onChange={
                  (event) =>
                    setDisplayName(
                      event.target
                        .value
                    )
                }
                placeholder="e.g. Alex Morgan"
                required
              />


              <small className="help-text">
                {displayName.length}/
                {MAX_DISPLAY_NAME_LENGTH}
                {" "}characters
              </small>

            </div>


            <div className="form-group">

              <label htmlFor="availability">

                Availability
                {" "}
                (Hours / Week) *

              </label>


              <input
                id="availability"
                type="number"
                min="0"
                max="168"
                step="1"
                value={
                  availabilityHours
                }
                onChange={
                  (event) =>
                    setAvailabilityHours(
                      event.target
                        .value
                    )
                }
                required
              />


              <small className="help-text">
                Must be a whole number between
                {" "}
                0 and 168 hours.
              </small>

            </div>


            <div className="form-group">

              <label htmlFor="bio">
                Bio
              </label>


              <textarea
                id="bio"
                rows="3"
                value={
                  bio
                }
                onChange={
                  (event) =>
                    setBio(
                      event.target
                        .value
                    )
                }
                placeholder="Introduce yourself to prospective team leads..."
              />


              <small className="help-text">
                {bio.length}/
                {MAX_BIO_LENGTH}
                {" "}characters
              </small>

            </div>


            <div className="form-group">

              <label htmlFor="interests">

                Interests
                {" "}
                (comma-separated)

              </label>


              <input
                id="interests"
                type="text"
                value={
                  interests
                }
                onChange={
                  (event) =>
                    setInterests(
                      event.target
                        .value
                    )
                }
                placeholder="e.g. Embedded Systems, React, Robotics"
              />


              <small className="help-text">
                {interests.length}/
                {MAX_INTERESTS_LENGTH}
                {" "}characters
              </small>

            </div>


            <div className="skills-section">

              <div className="skills-heading-wrap">

                <h3>
                  Your Current Skills
                </h3>


                <span className="skills-count">

                  {skills.length}

                  {" "}

                  Registered

                </span>

              </div>


              <div
                style={
                  skillAddPanelStyle
                }
              >

                <div
                  style={
                    skillAddGridStyle
                  }
                >

                  <div className="form-group">

                    <label htmlFor="newSkillName">
                      Skill Name
                    </label>


                    <input
                      id="newSkillName"
                      type="text"
                      value={
                        newSkillName
                      }
                      onChange={
                        (event) => {
                          const value =
                            event.target.value;


                          if (
                            value.length >
                            MAX_SKILL_NAME_LENGTH
                          ) {
                            setActionFeedbackActive(
                              true
                            );

                            setSuccessMessage(
                              ""
                            );

                            setSkillErrorMessage(
                              `Maximum characters exceeded. Skill name may not exceed ${MAX_SKILL_NAME_LENGTH} characters.`
                            );

                            return;
                          }


                          setSkillErrorMessage(
                            ""
                          );

                          setNewSkillName(
                            value
                          );
                        }
                      }
                      onPaste={
                        (event) =>
                          handleBoundedPaste(
                            event,
                            newSkillName,
                            MAX_SKILL_NAME_LENGTH,
                            "Skill name"
                          )
                      }
                      placeholder="e.g. React"
                    />


                    <small className="help-text">
                      {newSkillName.length}/
                      {MAX_SKILL_NAME_LENGTH}
                      {" "}characters
                    </small>

                  </div>


                  <div className="form-group">

                    <label htmlFor="newSkillCategory">
                      Category
                    </label>


                    <input
                      id="newSkillCategory"
                      type="text"
                      value={
                        newSkillCategory
                      }
                      onChange={
                        (event) => {
                          const value =
                            event.target.value;


                          if (
                            value.length >
                            MAX_SKILL_CATEGORY_LENGTH
                          ) {
                            setActionFeedbackActive(
                              true
                            );

                            setSuccessMessage(
                              ""
                            );

                            setSkillErrorMessage(
                              `Maximum characters exceeded. Skill category may not exceed ${MAX_SKILL_CATEGORY_LENGTH} characters.`
                            );

                            return;
                          }


                          setSkillErrorMessage(
                            ""
                          );

                          setNewSkillCategory(
                            value
                          );
                        }
                      }
                      onPaste={
                        (event) =>
                          handleBoundedPaste(
                            event,
                            newSkillCategory,
                            MAX_SKILL_CATEGORY_LENGTH,
                            "Skill category"
                          )
                      }
                      placeholder="e.g. Frontend"
                    />


                    <small className="help-text">
                      {newSkillCategory.length}/
                      {MAX_SKILL_CATEGORY_LENGTH}
                      {" "}characters
                    </small>

                  </div>


                  <div className="form-group">

                    <label htmlFor="newSkillProficiency">
                      Proficiency
                    </label>


                    <select
                      id="newSkillProficiency"
                      value={
                        newSkillProficiency
                      }
                      onChange={
                        (event) =>
                          setNewSkillProficiency(
                            event.target
                              .value
                          )
                      }
                    >

                      <option value="BEGINNER">
                        Beginner
                      </option>

                      <option value="INTERMEDIATE">
                        Intermediate
                      </option>

                      <option value="ADVANCED">
                        Advanced
                      </option>

                    </select>

                  </div>

                </div>


                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    handleAddSkill
                  }
                  disabled={
                    !newSkillName.trim() ||
                    !newSkillCategory.trim() ||
                    newSkillName.length >
                      MAX_SKILL_NAME_LENGTH ||
                    newSkillCategory.length >
                      MAX_SKILL_CATEGORY_LENGTH
                  }
                >
                  Add Skill
                </button>


                {skillErrorMessage && (

                  <div
                    className="alert-box error"
                    role="alert"
                    style={{
                      marginTop:
                        "12px"
                    }}
                  >
                    {skillErrorMessage}
                  </div>

                )}

              </div>


              {skills.length ===
              0 ? (

                <p className="no-skills">
                  No skills added yet.
                </p>

              ) : (

                <div
                  style={
                    skillEditorListStyle
                  }
                >

                  {skills.map(
                    (
                      skill,
                      index
                    ) => (

                      <div
                        key={
                          skill.skill_id ||
                          `${skill.name}-${index}`
                        }
                        style={
                          skillEditorRowStyle
                        }
                      >

                        <div
                          style={
                            skillDetailsStyle
                          }
                        >

                          <strong className="skill-name">
                            {skill.name}
                          </strong>


                          <span
                            style={
                              skillCategoryStyle
                            }
                          >
                            {skill.category}
                          </span>

                        </div>


                        <select
                          aria-label={
                            `Proficiency for ${skill.name}`
                          }
                          value={
                            skill.proficiency
                          }
                          onChange={
                            (event) =>
                              handleProficiencyChange(
                                index,
                                event.target
                                  .value
                              )
                          }
                          style={
                            proficiencySelectStyle
                          }
                        >

                          <option value="BEGINNER">
                            Beginner
                          </option>

                          <option value="INTERMEDIATE">
                            Intermediate
                          </option>

                          <option value="ADVANCED">
                            Advanced
                          </option>

                        </select>


                        <button
                          type="button"
                          aria-label={
                            `Remove ${skill.name}`
                          }
                          onClick={
                            () =>
                              handleRemoveSkill(
                                index
                              )
                          }
                          style={
                            removeSkillButtonStyle
                          }
                        >
                          Remove
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}


              <small className="help-text">
                Skill changes are saved
                when you click Save Profile.
              </small>

            </div>


            <div
              style={
                completedProjectsSectionStyle
              }
            >

              <div
                style={
                  completedProjectsHeadingStyle
                }
              >

                <div>

                  <h3
                    style={{
                      margin:
                        0
                    }}
                  >
                    Approved Completed Projects
                  </h3>


                  <p
                    className="help-text"
                    style={{
                      margin:
                        "5px 0 0"
                    }}
                  >
                    Completed projects you participated
                    in appear here after Showcase approval.
                  </p>

                </div>


                <span className="skills-count">

                  {
                    approvedCompletedProjects
                      .length
                  }

                  {" "}

                  Approved

                </span>

              </div>


              {approvedCompletedProjects
                .length ===
              0 ? (

                <p className="no-skills">
                  No approved completed projects yet.
                </p>

              ) : (

                <div
                  style={
                    completedProjectsListStyle
                  }
                >

                  {approvedCompletedProjects.map(
                    (
                      project
                    ) => {

                      const repositoryUrl =
                        getSafeRepositoryUrl(
                          project.repository_url
                        );


                      return (

                        <article
                          key={
                            project.project_id
                          }
                          style={
                            completedProjectCardStyle
                          }
                        >

                          <div
                            style={
                              completedProjectTopStyle
                            }
                          >

                            <div>

                              <strong
                                style={
                                  completedProjectTitleStyle
                                }
                              >
                                {
                                  project.title
                                }
                              </strong>


                              <span
                                style={
                                  completedProjectCategoryStyle
                                }
                              >
                                {
                                  project.category ||
                                  "Project"
                                }
                              </span>

                            </div>


                            <span
                              style={
                                approvedBadgeStyle
                              }
                            >
                              ✓ Approved
                            </span>

                          </div>


                          {project.description && (

                            <p
                              style={
                                completedProjectDescriptionStyle
                              }
                            >
                              {
                                project.description
                              }
                            </p>

                          )}


                          {repositoryUrl && (

                            <a
                              href={
                                repositoryUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Repository
                            </a>

                          )}

                        </article>

                      );

                    }
                  )}

                </div>

              )}

            </div>


            {
              displayName.length >
              MAX_DISPLAY_NAME_LENGTH ? (

                <div
                  className="alert-box error"
                  role="alert"
                >
                  {`Maximum characters exceeded. Display name may not exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`}
                </div>

              ) :
              bio.length >
              MAX_BIO_LENGTH ? (

                <div
                  className="alert-box error"
                  role="alert"
                >
                  {`Maximum characters exceeded. Bio may not exceed ${MAX_BIO_LENGTH} characters.`}
                </div>

              ) :
              interests.length >
              MAX_INTERESTS_LENGTH ? (

                <div
                  className="alert-box error"
                  role="alert"
                >
                  {`Maximum characters exceeded. Interests may not exceed ${MAX_INTERESTS_LENGTH} characters.`}
                </div>

              ) :
              skills.some(
                (skill) =>
                  String(
                    skill?.name ||
                    ""
                  ).length >
                    MAX_SKILL_NAME_LENGTH
              ) ? (

                <div
                  className="alert-box error"
                  role="alert"
                >
                  {`Maximum characters exceeded. Skill name may not exceed ${MAX_SKILL_NAME_LENGTH} characters.`}
                </div>

              ) :
              skills.some(
                (skill) =>
                  String(
                    skill?.category ||
                    ""
                  ).length >
                    MAX_SKILL_CATEGORY_LENGTH
              ) ? (

                <div
                  className="alert-box error"
                  role="alert"
                >
                  {`Maximum characters exceeded. Skill category may not exceed ${MAX_SKILL_CATEGORY_LENGTH} characters.`}
                </div>

              ) :
              null
            }


            <div className="profile-actions">

              <button
                type="submit"
                className="primary-button submit-btn"
                disabled={
                  isSaving ||
                  displayName.length >
                    MAX_DISPLAY_NAME_LENGTH ||
                  bio.length >
                    MAX_BIO_LENGTH ||
                  interests.length >
                    MAX_INTERESTS_LENGTH ||
                  skills.some(
                    (skill) =>
                      String(
                        skill?.name ||
                        ""
                      ).length >
                        MAX_SKILL_NAME_LENGTH ||
                      String(
                        skill?.category ||
                        ""
                      ).length >
                        MAX_SKILL_CATEGORY_LENGTH
                  )
                }
              >
                {
                  isSaving
                    ? "Saving..."
                    : "Save Profile"
                }
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}


const skillAddPanelStyle = {
  marginTop:
    "14px",

  marginBottom:
    "18px",

  padding:
    "16px",

  border:
    "1px solid rgba(255,255,255,0.10)",

  borderRadius:
    "10px",

  background:
    "rgba(255,255,255,0.025)"
};


const skillAddGridStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",

  gap:
    "12px",

  alignItems:
    "end"
};


const skillEditorListStyle = {
  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "10px",

  marginBottom:
    "12px"
};


const skillEditorRowStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "minmax(160px, 1fr) 170px auto",

  gap:
    "12px",

  alignItems:
    "center",

  padding:
    "12px",

  border:
    "1px solid rgba(255,255,255,0.10)",

  borderRadius:
    "9px",

  background:
    "rgba(255,255,255,0.025)"
};


const skillDetailsStyle = {
  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "4px",

  minWidth:
    "0"
};


const skillCategoryStyle = {
  fontSize:
    "12px",

  opacity:
    0.7,

  display:
    "block",

  maxWidth:
    "100%",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap"
};


const proficiencySelectStyle = {
  width:
    "100%"
};


const removeSkillButtonStyle = {
  padding:
    "9px 12px",

  borderRadius:
    "7px",

  border:
    "1px solid rgba(255, 90, 90, 0.4)",

  background:
    "rgba(255, 90, 90, 0.08)",

  color:
    "inherit",

  cursor:
    "pointer"
};


const completedProjectsSectionStyle = {
  marginTop:
    "22px",

  paddingTop:
    "20px",

  borderTop:
    "1px solid rgba(255,255,255,0.10)"
};


const completedProjectsHeadingStyle = {
  display:
    "flex",

  justifyContent:
    "space-between",

  alignItems:
    "flex-start",

  gap:
    "14px",

  marginBottom:
    "14px",

  flexWrap:
    "wrap"
};


const completedProjectsListStyle = {
  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "12px"
};


const completedProjectCardStyle = {
  padding:
    "16px",

  border:
    "1px solid rgba(255,255,255,0.10)",

  borderRadius:
    "10px",

  background:
    "rgba(255,255,255,0.025)"
};


const completedProjectTopStyle = {
  display:
    "flex",

  justifyContent:
    "space-between",

  alignItems:
    "flex-start",

  gap:
    "12px",

  flexWrap:
    "wrap"
};


const completedProjectTitleStyle = {
  display:
    "block",

  fontSize:
    "15px"
};


const completedProjectCategoryStyle = {
  display:
    "block",

  marginTop:
    "4px",

  fontSize:
    "12px",

  opacity:
    0.7
};


const approvedBadgeStyle = {
  display:
    "inline-flex",

  alignItems:
    "center",

  padding:
    "5px 9px",

  borderRadius:
    "999px",

  border:
    "1px solid rgba(255,255,255,0.14)",

  fontSize:
    "12px",

  fontWeight:
    700
};


const completedProjectDescriptionStyle = {
  margin:
    "12px 0",

  lineHeight:
    1.55,

  opacity:
    0.85
};
