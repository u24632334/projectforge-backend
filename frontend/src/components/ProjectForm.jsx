import React, {
    useEffect,
    useState
} from "react";

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import {
    useAuth
} from "../context/AuthContext";


const MAX_PROJECT_TITLE_LENGTH = 120;
const MAX_PROJECT_DESCRIPTION_LENGTH = 1000;
const MAX_POSITION_TITLE_LENGTH = 120;
const MAX_SKILL_NAME_LENGTH = 120;
const MAX_REPOSITORY_URL_LENGTH = 2048;

const MAX_POSITIONS = 20;
const MAX_SKILLS_PER_POSITION = 20;

const MAX_SKILL_INPUT_LENGTH =
    (
        MAX_SKILL_NAME_LENGTH *
        MAX_SKILLS_PER_POSITION
    ) +
    MAX_SKILLS_PER_POSITION;


const PROJECT_CATEGORIES = [
    "Robotics",
    "Software Engineering",
    "Electronics",
    "Embedded Systems"
];


let nextPositionKey = 1;


function createEmptyPosition() {
    const position = {
        clientId:
            `position-${nextPositionKey}`,
        title:
            "",
        skills:
            ""
    };


    nextPositionKey += 1;


    return position;
}


function isValidRepositoryUrl(
    repositoryUrl
) {
    if (
        repositoryUrl ===
            undefined ||
        repositoryUrl ===
            null ||
        String(
            repositoryUrl
        ).trim() ===
            ""
    ) {
        return true;
    }


    const cleanUrl =
        String(
            repositoryUrl
        ).trim();


    if (
        cleanUrl.length >
        MAX_REPOSITORY_URL_LENGTH
    ) {
        return false;
    }


    try {
        const parsedUrl =
            new URL(
                cleanUrl
            );


        const hostname =
            parsedUrl.hostname
                .toLowerCase();


        return (
            parsedUrl.protocol ===
                "https:" &&
            (
                hostname ===
                    "github.com" ||
                hostname ===
                    "www.github.com" ||
                hostname ===
                    "gitlab.com" ||
                hostname ===
                    "www.gitlab.com"
            )
        );
    }
    catch {
        return false;
    }
}


function parseSkills(
    value
) {
    const rawSkills =
        String(
            value || ""
        )
            .split(",")
            .map(
                skill =>
                    skill.trim()
            )
            .filter(
                Boolean
            );


    const seen =
        new Set();


    const uniqueSkills =
        [];


    for (
        const skill
        of rawSkills
    ) {
        const normalized =
            skill.toLowerCase();


        if (
            seen.has(
                normalized
            )
        ) {
            continue;
        }


        seen.add(
            normalized
        );

        uniqueSkills.push(
            skill
        );
    }


    return uniqueSkills;
}


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


export default function ProjectForm({
    onProjectCreated
}) {
    const {
        token,
        logout
    } = useAuth();


    const [
        title,
        setTitle
    ] = useState("");


    const [
        description,
        setDescription
    ] = useState("");


    const [
        category,
        setCategory
    ] = useState(
        "Robotics"
    );


    const [
        expectedHoursPerWeek,
        setExpectedHoursPerWeek
    ] = useState(8);


    const [
        repositoryUrl,
        setRepositoryUrl
    ] = useState("");


    const [
        allowMentorSupport,
        setAllowMentorSupport
    ] = useState(false);


    const [
        positions,
        setPositions
    ] = useState([
        createEmptyPosition()
    ]);


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    const [
        formError,
        setFormError
    ] = useState("");


    const [
        formSuccess,
        setFormSuccess
    ] = useState("");


    useAutoDismissFeedback(
        Boolean(
            formError ||
            formSuccess
        ),
        () => {
            setFormError("");
            setFormSuccess("");
        }
    );


    useEffect(
        () => {
            let lengthError =
                "";

            if (
                title.length >
                MAX_PROJECT_TITLE_LENGTH
            ) {
                lengthError =
                    `Maximum characters exceeded. Project title may not exceed ${MAX_PROJECT_TITLE_LENGTH} characters.`;
            }
            else if (
                description.length >
                MAX_PROJECT_DESCRIPTION_LENGTH
            ) {
                lengthError =
                    `Maximum characters exceeded. Project description may not exceed ${MAX_PROJECT_DESCRIPTION_LENGTH} characters.`;
            }
            else {
                for (
                    let index = 0;
                    index <
                        positions.length;
                    index += 1
                ) {
                    const position =
                        positions[index];

                    if (
                        typeof position?.title ===
                            "string" &&
                        position.title.length >
                            MAX_POSITION_TITLE_LENGTH
                    ) {
                        lengthError =
                            `Maximum characters exceeded. Role title may not exceed ${MAX_POSITION_TITLE_LENGTH} characters.`;

                        break;
                    }

                    if (
                        typeof position?.skills ===
                            "string"
                    ) {
                        if (
                            position.skills.length >
                                MAX_SKILL_INPUT_LENGTH
                        ) {
                            lengthError =
                                `Maximum characters exceeded. Role ${index + 1} contains too much skill information.`;

                            break;
                        }

                        const oversizedSkill =
                            parseSkills(
                                position.skills
                            ).find(
                                skillName =>
                                    skillName.length >
                                    MAX_SKILL_NAME_LENGTH
                            );

                        if (
                            oversizedSkill
                        ) {
                            lengthError =
                                `Maximum characters exceeded. Each skill may not exceed ${MAX_SKILL_NAME_LENGTH} characters.`;

                            break;
                        }
                    }
                }
            }

            if (
                lengthError
            ) {
                setFormError(
                    lengthError
                );

                setFormSuccess(
                    ""
                );
            }
        },
        [
            title,
            description,
            positions
        ]
    );


    const handlePositionChange = (
        index,
        field,
        value
    ) => {
        setPositions(
            currentPositions =>
                currentPositions.map(
                    (
                        position,
                        positionIndex
                    ) => {

                        if (
                            positionIndex !==
                            index
                        ) {
                            return position;
                        }


                        return {
                            ...position,
                            [field]:
                                value
                        };
                    }
                )
        );
    };


    const addPosition = () => {
        setFormError("");
        setFormSuccess("");


        if (
            positions.length >=
            MAX_POSITIONS
        ) {
            setFormError(
                `A project may contain a maximum of ${MAX_POSITIONS} open roles.`
            );

            return;
        }


        setPositions(
            currentPositions => [
                ...currentPositions,
                createEmptyPosition()
            ]
        );
    };


    const removePosition = (
        index
    ) => {
        if (
            positions.length ===
            1
        ) {
            return;
        }


        setPositions(
            currentPositions =>
                currentPositions.filter(
                    (
                        _,
                        positionIndex
                    ) =>
                        positionIndex !==
                        index
                )
        );


        setFormError("");
        setFormSuccess("");
    };


    const resetForm = () => {
        setTitle("");
        setDescription("");
        setCategory(
            "Robotics"
        );

        setExpectedHoursPerWeek(
            8
        );

        setRepositoryUrl("");

        setAllowMentorSupport(
            false
        );

        setPositions([
            createEmptyPosition()
        ]);
    };


    const validateForm = () => {
        const cleanTitle =
            title.trim();


        const cleanDescription =
            description.trim();


        const cleanRepositoryUrl =
            repositoryUrl.trim();


        const hours =
            Number(
                expectedHoursPerWeek
            );


        if (
            !cleanTitle
        ) {
            return (
                "Project title is required."
            );
        }


        if (
            cleanTitle.length >
            MAX_PROJECT_TITLE_LENGTH
        ) {
            return (
                `Maximum characters exceeded. Project title may not exceed ${MAX_PROJECT_TITLE_LENGTH} characters.`
            );
        }


        if (
            !cleanDescription
        ) {
            return (
                "Project description is required."
            );
        }


        if (
            cleanDescription.length >
            MAX_PROJECT_DESCRIPTION_LENGTH
        ) {
            return (
                `Maximum characters exceeded. Project description may not exceed ${MAX_PROJECT_DESCRIPTION_LENGTH} characters.`
            );
        }


        if (
            !PROJECT_CATEGORIES.includes(
                category
            )
        ) {
            return (
                "Please select a valid project category."
            );
        }


        if (
            !Number.isFinite(
                hours
            ) ||
            !Number.isInteger(
                hours
            ) ||
            hours < 1 ||
            hours > 168
        ) {
            return (
                "Expected commitment must be a whole number between 1 and 168 hours."
            );
        }


        if (
            cleanRepositoryUrl.length >
            MAX_REPOSITORY_URL_LENGTH
        ) {
            return (
                `Maximum characters exceeded. Repository URL may not exceed ${MAX_REPOSITORY_URL_LENGTH} characters.`
            );
        }


        if (
            !isValidRepositoryUrl(
                cleanRepositoryUrl
            )
        ) {
            return (
                "Repository URL must be a valid GitHub or GitLab HTTPS URL."
            );
        }


        if (
            !Array.isArray(
                positions
            ) ||
            positions.length ===
                0
        ) {
            return (
                "A project must have at least one open position/role."
            );
        }


        if (
            positions.length >
            MAX_POSITIONS
        ) {
            return (
                `A project may contain a maximum of ${MAX_POSITIONS} open roles.`
            );
        }


        for (
            let index = 0;
            index <
                positions.length;
            index += 1
        ) {
            const position =
                positions[index];


            const cleanPositionTitle =
                typeof position?.title ===
                    "string"
                    ? position.title.trim()
                    : "";


            if (
                !cleanPositionTitle
            ) {
                return (
                    `Role ${index + 1} requires a title.`
                );
            }


            if (
                cleanPositionTitle.length >
                MAX_POSITION_TITLE_LENGTH
            ) {
                return (
                    `Maximum characters exceeded. Role title may not exceed ${MAX_POSITION_TITLE_LENGTH} characters.`
                );
            }


            if (
                typeof position?.skills !==
                "string"
            ) {
                return (
                    `Role ${index + 1} contains invalid skill data.`
                );
            }


            if (
                position.skills.length >
                MAX_SKILL_INPUT_LENGTH
            ) {
                return (
                    `Maximum characters exceeded. Role ${index + 1} contains too much skill information.`
                );
            }


            const skillNames =
                parseSkills(
                    position.skills
                );


            if (
                skillNames.length >
                MAX_SKILLS_PER_POSITION
            ) {
                return (
                    `Role ${index + 1} may contain a maximum of ${MAX_SKILLS_PER_POSITION} required skills.`
                );
            }


            for (
                const skillName
                of skillNames
            ) {
                if (
                    skillName.length >
                    MAX_SKILL_NAME_LENGTH
                ) {
                    return (
                        `Maximum characters exceeded. Each skill may not exceed ${MAX_SKILL_NAME_LENGTH} characters.`
                    );
                }
            }
        }


        return null;
    };


    const handleSubmit =
        async (
            event
        ) => {
            event.preventDefault();


            if (
                submitting
            ) {
                return;
            }


            setFormError("");
            setFormSuccess("");


            const validationError =
                validateForm();


            if (
                validationError
            ) {
                setFormError(
                    validationError
                );

                return;
            }


            if (
                !token
            ) {
                setFormError(
                    "Please log in before creating a project."
                );

                return;
            }


            setSubmitting(
                true
            );


            try {
                const formattedPositions =
                    positions.map(
                        position => ({
                            title:
                                position
                                    .title
                                    .trim(),

                            description:
                                position
                                    .title
                                    .trim(),

                            skills:
                                parseSkills(
                                    position
                                        .skills
                                )
                        })
                    );


                const payload = {
                    title:
                        title.trim(),

                    description:
                        description.trim(),

                    category,

                    expectedHoursPerWeek:
                        Number(
                            expectedHoursPerWeek
                        ),

                    repositoryUrl:
                        repositoryUrl
                            .trim() ||
                        undefined,

                    allowMentorSupport:
                        Boolean(
                            allowMentorSupport
                        ),

                    positions:
                        formattedPositions
                };


                const response =
                    await fetch(
                        "/api/projects",
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
                                    payload
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
                    if (
                        response.status ===
                        401
                    ) {
                        logout();

                        throw new Error(
                            "Your session has expired. Please log in again."
                        );
                    }


                    throw new Error(
                        data.error ||
                        data.message ||
                        "Failed to create project."
                    );
                }


                setFormSuccess(
                    "Project published successfully!"
                );


                resetForm();


                if (
                    typeof onProjectCreated ===
                    "function"
                ) {
                    onProjectCreated(
                        data.project
                    );
                }
            }
            catch (
                error
            ) {
                setFormError(
                    error.message ||
                    "Failed to create project."
                );
            }
            finally {
                setSubmitting(
                    false
                );
            }
        };


    const hasLengthError =
        title.length >
            MAX_PROJECT_TITLE_LENGTH ||
        description.length >
            MAX_PROJECT_DESCRIPTION_LENGTH ||
        repositoryUrl.length >
            MAX_REPOSITORY_URL_LENGTH ||
        positions.some(
            position =>
                (
                    typeof position?.title ===
                        "string" &&
                    position.title.length >
                        MAX_POSITION_TITLE_LENGTH
                ) ||
                (
                    typeof position?.skills ===
                        "string" &&
                    (
                        position.skills.length >
                            MAX_SKILL_INPUT_LENGTH ||
                        parseSkills(
                            position.skills
                        ).some(
                            skillName =>
                                skillName.length >
                                    MAX_SKILL_NAME_LENGTH
                        )
                    )
                )
        );


    return (
        <div
            style={
                containerStyle
            }
        >

            <div
                style={
                    titleBlockStyle
                }
            >

                <h2
                    style={
                        titleStyle
                    }
                >
                    Create New Project
                </h2>


                <p
                    style={
                        subtitleStyle
                    }
                >
                    Post a new project
                    listing and define open
                    roles to recruit
                    teammates.
                </p>

            </div>


            {formError &&
                !formError.startsWith(
                    "Maximum characters exceeded."
                ) && (

                <div
                    role="alert"
                    style={{
                        ...errorStyle,
                        marginBottom:
                            "20px"
                    }}
                >
                    {formError}
                </div>

            )}


            {formSuccess && (

                <div
                    role="status"
                    style={{
                        ...successStyle,
                        marginBottom:
                            "20px"
                    }}
                >
                    {formSuccess}
                </div>

            )}


            <form
                onSubmit={
                    handleSubmit
                }
                style={
                    formBoxStyle
                }
            >

                <div
                    style={
                        sectionHeadingStyle
                    }
                >
                    PROJECT DETAILS
                </div>


                <div
                    style={
                        fieldGroupStyle
                    }
                >

                    <label
                        htmlFor="project-title"
                        style={
                            labelStyle
                        }
                    >
                        Project Title *
                    </label>


                    <input
                        id="project-title"
                        type="text"
                        required
                        style={
                            inputStyle
                        }
                        placeholder="e.g. Autonomous Submarine"
                        value={
                            title
                        }
                        onChange={
                            event =>
                                setTitle(
                                    event
                                        .target
                                        .value
                                )
                        }
                    />


                    <span
                        style={
                            helperTextStyle
                        }
                    >
                        {title.length}/
                        {
                            MAX_PROJECT_TITLE_LENGTH
                        }
                    </span>

                </div>


                <div
                    style={
                        fieldGroupStyle
                    }
                >

                    <label
                        htmlFor="project-description"
                        style={
                            labelStyle
                        }
                    >
                        Description *
                    </label>


                    <textarea
                        id="project-description"
                        required
                        style={{
                            ...inputStyle,
                            minHeight:
                                "100px",
                            resize:
                                "vertical"
                        }}
                        placeholder="Describe the scope and vision of your project..."
                        value={
                            description
                        }
                        onChange={
                            event =>
                                setDescription(
                                    event
                                        .target
                                        .value
                                )
                        }
                    />


                    <span
                        style={
                            helperTextStyle
                        }
                    >
                        {
                            description.length
                        }/
                        {
                            MAX_PROJECT_DESCRIPTION_LENGTH
                        }
                    </span>

                </div>


                <div
                    style={
                        splitRowStyle
                    }
                >

                    <div
                        style={{
                            ...fieldGroupStyle,
                            flex: 1
                        }}
                    >

                        <label
                            htmlFor="project-category"
                            style={
                                labelStyle
                            }
                        >
                            Category *
                        </label>


                        <select
                            id="project-category"
                            required
                            style={
                                inputStyle
                            }
                            value={
                                category
                            }
                            onChange={
                                event =>
                                    setCategory(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        >

                            {
                                PROJECT_CATEGORIES.map(
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
                                )
                            }

                        </select>

                    </div>


                    <div
                        style={{
                            ...fieldGroupStyle,
                            flex: 1
                        }}
                    >

                        <label
                            htmlFor="project-hours"
                            style={
                                labelStyle
                            }
                        >
                            Expected Hours/Week *
                        </label>


                        <input
                            id="project-hours"
                            type="number"
                            min="1"
                            max="168"
                            step="1"
                            required
                            style={
                                inputStyle
                            }
                            value={
                                expectedHoursPerWeek
                            }
                            onChange={
                                event =>
                                    setExpectedHoursPerWeek(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        />

                    </div>

                </div>


                <div
                    style={
                        fieldGroupStyle
                    }
                >

                    <label
                        htmlFor="repository-url"
                        style={
                            labelStyle
                        }
                    >
                        Repository URL
                        {" "}
                        (Optional)
                    </label>


                    <input
                        id="repository-url"
                        type="url"
                        inputMode="url"
                        maxLength={
                            MAX_REPOSITORY_URL_LENGTH
                        }
                        style={
                            inputStyle
                        }
                        placeholder="https://github.com/your-org/your-repo"
                        value={
                            repositoryUrl
                        }
                        onChange={
                            event =>
                                setRepositoryUrl(
                                    event
                                        .target
                                        .value
                                )
                        }
                    />


                    <span
                        style={
                            helperTextStyle
                        }
                    >
                        {repositoryUrl.length}/
                        {
                            MAX_REPOSITORY_URL_LENGTH
                        } characters. GitHub or GitLab
                        HTTPS links only.
                    </span>

                </div>


                <div
                    style={
                        mentorSectionStyle
                    }
                >

                    <div
                        style={
                            sectionHeadingStyle
                        }
                    >
                        MENTOR SUPPORT
                    </div>


                    <label
                        htmlFor="allow-mentor-support"
                        style={
                            mentorOptionStyle
                        }
                    >

                        <input
                            id="allow-mentor-support"
                            type="checkbox"
                            checked={
                                allowMentorSupport
                            }
                            onChange={
                                event =>
                                    setAllowMentorSupport(
                                        event
                                            .target
                                            .checked
                                    )
                            }
                            style={
                                checkboxStyle
                            }
                        />


                        <span>

                            <strong
                                style={
                                    mentorOptionTitleStyle
                                }
                            >
                                Allow approved Mentors
                                to support this project
                            </strong>


                            <span
                                style={
                                    mentorOptionTextStyle
                                }
                            >
                                Approved ProjectForge
                                Mentors will be able to
                                discover this project
                                and request to provide
                                guidance. You remain in
                                control of project
                                membership and private
                                team information.
                            </span>

                        </span>

                    </label>

                </div>


                <div
                    style={
                        rolesSectionStyle
                    }
                >

                    <div
                        style={
                            rolesHeaderStyle
                        }
                    >

                        <div>

                            <div
                                style={
                                    sectionHeadingStyle
                                }
                            >
                                TEAM RECRUITMENT
                            </div>


                            <span
                                style={{
                                    ...labelStyle,
                                    fontSize:
                                        "15px",
                                    marginBottom:
                                        0
                                }}
                            >
                                Open Positions / Roles *
                            </span>


                            <div
                                style={
                                    helperTextStyle
                                }
                            >
                                {
                                    positions.length
                                }/
                                {
                                    MAX_POSITIONS
                                } roles
                            </div>

                        </div>


                        <button
                            type="button"
                            onClick={
                                addPosition
                            }
                            disabled={
                                positions.length >=
                                MAX_POSITIONS
                            }
                            style={{
                                ...addBtnStyle,
                                opacity:
                                    positions.length >=
                                    MAX_POSITIONS
                                        ? 0.5
                                        : 1,

                                cursor:
                                    positions.length >=
                                    MAX_POSITIONS
                                        ? "not-allowed"
                                        : "pointer"
                            }}
                        >
                            + Add Another Role
                        </button>

                    </div>


                    {
                        positions.map(
                            (
                                position,
                                index
                            ) => (

                                <div
                                    key={
                                        position.clientId
                                    }
                                    style={
                                        positionCardStyle
                                    }
                                >

                                    <div
                                        style={
                                            roleNumberStyle
                                        }
                                    >
                                        ROLE{" "}
                                        {
                                            index +
                                            1
                                        }
                                    </div>


                                    <div
                                        style={
                                            positionRowStyle
                                        }
                                    >

                                        <div
                                            style={{
                                                flex: 1
                                            }}
                                        >

                                            <label
                                                htmlFor={
                                                    `role-title-${position.clientId}`
                                                }
                                                style={
                                                    smallLabelStyle
                                                }
                                            >
                                                Role Title
                                            </label>


                                            <input
                                                id={
                                                    `role-title-${position.clientId}`
                                                }
                                                type="text"
                                                required
                                                placeholder="e.g. Control Engineer"
                                                style={
                                                    inputStyle
                                                }
                                                value={
                                                    position
                                                        .title
                                                }
                                                onChange={
                                                    event =>
                                                        handlePositionChange(
                                                            index,
                                                            "title",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                }
                                            />


                                            <span
                                                style={
                                                    helperTextStyle
                                                }
                                            >
                                                {
                                                    position
                                                        .title
                                                        .length
                                                }/
                                                {
                                                    MAX_POSITION_TITLE_LENGTH
                                                }
                                            </span>

                                        </div>


                                        <div
                                            style={{
                                                flex: 1
                                            }}
                                        >

                                            <label
                                                htmlFor={
                                                    `role-skills-${position.clientId}`
                                                }
                                                style={
                                                    smallLabelStyle
                                                }
                                            >
                                                Required Skills
                                            </label>


                                            <input
                                                id={
                                                    `role-skills-${position.clientId}`
                                                }
                                                type="text"
                                                placeholder="e.g. C++, ROS"
                                                style={
                                                    inputStyle
                                                }
                                                value={
                                                    position
                                                        .skills
                                                }
                                                onChange={
                                                    event =>
                                                        handlePositionChange(
                                                            index,
                                                            "skills",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                }
                                            />


                                            <span
                                                style={
                                                    helperTextStyle
                                                }
                                            >
                                                {
                                                    position
                                                        .skills
                                                        .length
                                                }/
                                                {
                                                    MAX_SKILL_INPUT_LENGTH
                                                } input characters.
                                                Separate skills with commas.
                                                Maximum{" "}
                                                {
                                                    MAX_SKILLS_PER_POSITION
                                                } skills per role;
                                                each skill may contain
                                                up to{" "}
                                                {
                                                    MAX_SKILL_NAME_LENGTH
                                                } characters.
                                            </span>

                                        </div>


                                        {
                                            positions.length >
                                            1 && (

                                                <button
                                                    type="button"
                                                    aria-label={
                                                        `Remove role ${index + 1}`
                                                    }
                                                    title="Remove role"
                                                    onClick={() =>
                                                        removePosition(
                                                            index
                                                        )
                                                    }
                                                    style={
                                                        removeBtnStyle
                                                    }
                                                >
                                                    ×
                                                </button>

                                            )
                                        }

                                    </div>

                                </div>

                            )
                        )
                    }

                </div>


                <button
                    type="submit"
                    disabled={
                        submitting ||
                        hasLengthError
                    }
                    style={{
                        ...submitBtnStyle,

                        opacity:
                            submitting ||
                            hasLengthError
                                ? 0.6
                                : 1,

                        cursor:
                            submitting ||
                            hasLengthError
                                ? "not-allowed"
                                : "pointer"
                    }}
                >
                    {
                        submitting
                            ? "Publishing Project..."
                            : "Publish Project Listing"
                    }
                </button>


                {hasLengthError &&
                    formError.startsWith(
                        "Maximum characters exceeded."
                    ) && (

                    <div
                        role="alert"
                        style={{
                            ...errorStyle,
                            marginTop:
                                "12px"
                        }}
                    >
                        {formError}
                    </div>

                )}

            </form>

        </div>
    );
}


const containerStyle = {
    maxWidth:
        "1000px",

    margin:
        "0 auto",

    padding:
        "20px 0 0"
};


const titleBlockStyle = {
    borderLeft:
        "4px solid #28b7ee",

    paddingLeft:
        "14px",

    marginBottom:
        "24px"
};


const titleStyle = {
    margin:
        0,

    color:
        "#ffffff",

    fontSize:
        "30px",

    fontWeight:
        850,

    letterSpacing:
        "-0.03em"
};


const subtitleStyle = {
    color:
        "#8fa1b7",

    margin:
        "7px 0 0",

    fontSize:
        "14px",

    lineHeight:
        1.55
};


const formBoxStyle = {
    position:
        "relative",

    overflow:
        "hidden",

    background:
        "linear-gradient(180deg, #111c30 0%, #0e1829 100%)",

    padding:
        "26px",

    borderRadius:
        "12px",

    border:
        "1px solid #273851",

    boxShadow:
        "0 14px 35px rgba(0, 0, 0, 0.18)"
};


const sectionHeadingStyle = {
    color:
        "#5ab8ff",

    fontSize:
        "10px",

    fontWeight:
        "900",

    letterSpacing:
        "0.13em",

    marginBottom:
        "12px"
};


const fieldGroupStyle = {
    marginBottom:
        "18px",

    display:
        "flex",

    flexDirection:
        "column"
};


const labelStyle = {
    color:
        "#c4cfdd",

    fontSize:
        "13px",

    fontWeight:
        "800",

    marginBottom:
        "7px",

    letterSpacing:
        "0.015em"
};


const smallLabelStyle = {
    color:
        "#91a4bb",

    fontSize:
        "11px",

    fontWeight:
        "800",

    marginBottom:
        "6px",

    display:
        "block",

    textTransform:
        "uppercase",

    letterSpacing:
        "0.045em"
};


const inputStyle = {
    width:
        "100%",

    padding:
        "11px 12px",

    borderRadius:
        "8px",

    border:
        "1px solid #33445e",

    background:
        "#101a2b",

    color:
        "#f5f8fc",

    boxSizing:
        "border-box",

    outline:
        "none"
};


const helperTextStyle = {
    color:
        "#74879f",

    fontSize:
        "11px",

    lineHeight:
        1.45,

    marginTop:
        "5px"
};


const splitRowStyle = {
    display:
        "flex",

    gap:
        "15px",

    flexWrap:
        "wrap"
};


const mentorSectionStyle = {
    marginTop:
        "8px",

    marginBottom:
        "4px",

    padding:
        "16px",

    background:
        "rgba(40, 183, 238, 0.055)",

    border:
        "1px solid rgba(90, 184, 255, 0.20)",

    borderRadius:
        "9px"
};


const mentorOptionStyle = {
    display:
        "flex",

    alignItems:
        "flex-start",

    gap:
        "11px",

    cursor:
        "pointer"
};


const checkboxStyle = {
    marginTop:
        "3px",

    width:
        "17px",

    height:
        "17px",

    flexShrink:
        0,

    cursor:
        "pointer"
};


const mentorOptionTitleStyle = {
    display:
        "block",

    color:
        "#d8e5f3",

    fontSize:
        "13px",

    marginBottom:
        "5px"
};


const mentorOptionTextStyle = {
    display:
        "block",

    color:
        "#8fa1b7",

    fontSize:
        "12px",

    lineHeight:
        1.55
};


const rolesSectionStyle = {
    marginTop:
        "24px",

    borderTop:
        "1px solid #2a3a52",

    paddingTop:
        "22px"
};


const rolesHeaderStyle = {
    display:
        "flex",

    justifyContent:
        "space-between",

    alignItems:
        "center",

    marginBottom:
        "14px",

    gap:
        "14px",

    flexWrap:
        "wrap"
};


const positionCardStyle = {
    marginBottom:
        "12px",

    padding:
        "14px",

    background:
        "#14213a",

    border:
        "1px solid #2a3d59",

    borderRadius:
        "9px"
};


const roleNumberStyle = {
    marginBottom:
        "9px",

    color:
        "#5ab8ff",

    fontSize:
        "10px",

    fontWeight:
        "900",

    letterSpacing:
        "0.11em"
};


const positionRowStyle = {
    display:
        "flex",

    gap:
        "10px",

    alignItems:
        "flex-end",

    flexWrap:
        "wrap"
};


const addBtnStyle = {
    background:
        "rgba(40, 100, 237, 0.12)",

    color:
        "#68baff",

    border:
        "1px solid rgba(83, 150, 255, 0.32)",

    padding:
        "8px 12px",

    borderRadius:
        "7px",

    cursor:
        "pointer",

    fontSize:
        "12px",

    fontWeight:
        "800"
};


const removeBtnStyle = {
    minWidth:
        "38px",

    height:
        "38px",

    display:
        "grid",

    placeItems:
        "center",

    background:
        "rgba(239, 91, 98, 0.10)",

    color:
        "#ff7b82",

    border:
        "1px solid rgba(239, 91, 98, 0.25)",

    borderRadius:
        "7px",

    cursor:
        "pointer",

    fontSize:
        "21px",

    lineHeight:
        1,

    padding:
        0
};


const submitBtnStyle = {
    width:
        "100%",

    marginTop:
        "22px",

    padding:
        "13px 16px",

    border:
        "1px solid #2864ed",

    borderRadius:
        "8px",

    background:
        "linear-gradient(135deg, #2f6df4, #2455d9)",

    color:
        "#ffffff",

    cursor:
        "pointer",

    fontWeight:
        "850",

    fontSize:
        "15px",

    boxShadow:
        "0 10px 24px rgba(40, 100, 237, 0.22)"
};


const errorStyle = {
    background:
        "rgba(239, 91, 98, 0.12)",

    color:
        "#ff7b82",

    border:
        "1px solid rgba(239, 91, 98, 0.30)",

    padding:
        "11px 12px",

    borderRadius:
        "8px"
};


const successStyle = {
    background:
        "rgba(40, 201, 139, 0.12)",

    color:
        "#49d69c",

    border:
        "1px solid rgba(40, 201, 139, 0.28)",

    padding:
        "11px 12px",

    borderRadius:
        "8px"
};
