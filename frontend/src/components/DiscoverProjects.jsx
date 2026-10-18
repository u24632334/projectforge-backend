import React, {
    useState,
    useEffect,
    useCallback
} from 'react';

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import {
    useAuth
} from "../context/AuthContext";


const MAX_APPLICATION_MESSAGE_LENGTH =
    1000;

const MAX_DISCOVER_SEARCH_LENGTH =
    120;

const MAX_DISCOVER_SKILL_LENGTH =
    120;

export default function DiscoverProjects({
    refreshTrigger
}) {

    const {
        logout
    } = useAuth();
    const [projects, setProjects] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [searchQuery, setSearchQuery] =
        useState('');

    const [category, setCategory] =
        useState('All');

    const [maxHours, setMaxHours] =
        useState('');

    const [skill, setSkill] =
        useState('');


    const [
        filterError,
        setFilterError
    ] = useState('');

    const [
        selectedPosition,
        setSelectedPosition
    ] = useState(null);

    const [
        applyMessage,
        setApplyMessage
    ] = useState('');

    const [
        applyError,
        setApplyError
    ] = useState('');

    const [
        applySuccess,
        setApplySuccess
    ] = useState('');

    const [
        submittingApply,
        setSubmittingApply
    ] = useState(false);


    useAutoDismissFeedback(
        Boolean(
            filterError
        ),
        () => {
            setFilterError('');
        }
    );


    useEffect(
        () => {
            if (
                searchQuery.length >
                MAX_DISCOVER_SEARCH_LENGTH
            ) {
                setFilterError(
                    `Maximum characters exceeded. Project search may not exceed ${MAX_DISCOVER_SEARCH_LENGTH} characters.`
                );

                return;
            }

            if (
                skill.length >
                MAX_DISCOVER_SKILL_LENGTH
            ) {
                setFilterError(
                    `Maximum characters exceeded. Skill filter may not exceed ${MAX_DISCOVER_SKILL_LENGTH} characters.`
                );
            }
        },
        [
            searchQuery,
            skill
        ]
    );


    // DISCOVER_APPLICATION_AUTO_DISMISS
    useAutoDismissFeedback(
        Boolean(
            applyError
        ),
        () => {
            setApplyError('');
        }
    );


    useAutoDismissFeedback(
        Boolean(
            applySuccess
        ),
        () => {
            setApplySuccess('');
            setApplyError('');
            setApplyMessage('');
            setSelectedPosition(null);
        }
    );


    useEffect(
        () => {
            if (
                applyMessage.length >
                MAX_APPLICATION_MESSAGE_LENGTH
            ) {
                setApplyError(
                    `Maximum characters exceeded. Application message may not exceed ${MAX_APPLICATION_MESSAGE_LENGTH} characters.`
                );

                setApplySuccess(
                    ''
                );
            }
        },
        [
            applyMessage
        ]
    );


    const handleMaxHoursChange = (
        event
    ) => {
        const value =
            event.target.value;

        if (
            value === '' ||
            (
                Number.isFinite(
                    Number(value)
                ) &&
                Number.isInteger(
                    Number(value)
                ) &&
                Number(value) >= 0
            )
        ) {
            setMaxHours(value);
        }
    };


    const fetchProjects =
        useCallback(async () => {
            if (
                searchQuery.length >
                    MAX_DISCOVER_SEARCH_LENGTH ||
                skill.length >
                    MAX_DISCOVER_SKILL_LENGTH
            ) {
                setLoading(
                    false
                );

                return;
            }

            setLoading(true);

            try {
                const params =
                    new URLSearchParams();


                if (
                    searchQuery.trim()
                ) {
                    params.append(
                        'search',
                        searchQuery.trim()
                    );
                }


                if (
                    category !== 'All'
                ) {
                    params.append(
                        'category',
                        category
                    );
                }


                if (
                    maxHours !== '' &&
                    Number.isFinite(
                        Number(maxHours)
                    ) &&
                    Number.isInteger(
                        Number(maxHours)
                    ) &&
                    Number(maxHours) >= 0
                ) {
                    params.append(
                        'maxHours',
                        maxHours
                    );
                }


                if (
                    skill.trim()
                ) {
                    params.append(
                        'skill',
                        skill.trim()
                    );
                }


                const queryString =
                    params.toString();


                const url =
                    queryString
                        ? `/api/projects?${queryString}`
                        : '/api/projects';


                const res =
                    await fetch(url);


                const data =
                    await res.json();


                if (!res.ok) {
                    throw new Error(
                        data.error ||
                        'Failed to load projects'
                    );
                }


                setProjects(
                    data.projects ||
                    []
                );

                setError('');
            }
            catch (err) {
                setError(
                    err.message ||
                    'Failed to load projects'
                );
            }
            finally {
                setLoading(false);
            }
        }, [
            searchQuery,
            category,
            maxHours,
            skill
        ]);


    useEffect(() => {
        const timer =
            setTimeout(() => {
                fetchProjects();
            }, 300);


        return () =>
            clearTimeout(timer);
    }, [
        fetchProjects,
        refreshTrigger
    ]);


    const openApplicationModal = (
        project,
        position
    ) => {
        setSelectedPosition({
            positionId:
                position.positionId,

            projectTitle:
                project.title,

            positionTitle:
                position.title
        });

        setApplyMessage('');
        setApplyError('');
        setApplySuccess('');
    };


    const closeApplicationModal = () => {
        if (
            submittingApply
        ) {
            return;
        }

        setSelectedPosition(null);
        setApplyMessage('');
        setApplyError('');
        setApplySuccess('');
    };


    const handleApplySubmit =
        async (event) => {
            event.preventDefault();

            if (
                applyMessage.length >
                MAX_APPLICATION_MESSAGE_LENGTH
            ) {
                setApplyError(
                    `Maximum characters exceeded. Application message may not exceed ${MAX_APPLICATION_MESSAGE_LENGTH} characters.`
                );

                setApplySuccess(
                    ''
                );

                return;
            }

            setApplyError('');
            setApplySuccess('');


            if (
                !selectedPosition
            ) {
                setApplyError(
                    'Please select a project position.'
                );

                return;
            }


            if (
                !applyMessage.trim()
            ) {
                setApplyError(
                    'Please enter a statement of interest.'
                );

                return;
            }


            const token =
                sessionStorage.getItem(
                    'token'
                );


            if (!token) {
                setApplyError(
                    'Please log in before applying for a project position.'
                );

                return;
            }


            setSubmittingApply(
                true
            );


            try {
                const res =
                    await fetch(
                        '/api/applications',
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    positionId:
                                        selectedPosition
                                            .positionId,

                                    message:
                                        applyMessage
                                            .trim()
                                })
                        }
                    );


                const data =
                    await res.json();


                if (res.ok) {
                    setApplySuccess(
                        'Application submitted successfully!'
                    );

                    setApplyMessage('');

                    return;
                }


                if (
                    res.status ===
                    401
                ) {
                    logout();

                    setApplyError(
                        'Your session has expired. Please log in again.'
                    );

                    return;
                }


                setApplyError(
                    data.error ||
                    'Failed to submit application.'
                );
            }
            catch {
                setApplyError(
                    'Network error submitting application.'
                );
            }
            finally {
                setSubmittingApply(
                    false
                );
            }
        };


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
                    Discover Projects
                </h2>


                <p
                    style={
                        subtitleStyle
                    }
                >
                    Browse engineering projects and find technical teams hiring your skill set.
                </p>

            </div>


            <div
                style={
                    filterBarStyle
                }
            >

                <input
                    type="text"
                    aria-label="Search projects"
                    placeholder="Search projects..."

                    style={{
                        ...inputStyle,
                        flex: 2
                    }}

                    value={
                        searchQuery
                    }

                    onChange={
                        event =>
                            setSearchQuery(
                                event.target
                                    .value
                            )
                    }
                />


                <select
                    aria-label="Project category"

                    style={{
                        ...inputStyle,
                        flex: 1
                    }}

                    value={
                        category
                    }

                    onChange={
                        event =>
                            setCategory(
                                event.target
                                    .value
                            )
                    }
                >

                    <option
                        value="All"
                    >
                        All Categories
                    </option>


                    <option
                        value="Software Engineering"
                    >
                        Software Engineering
                    </option>


                    <option
                        value="Robotics"
                    >
                        Robotics
                    </option>


                    <option
                        value="Electronics"
                    >
                        Electronics
                    </option>


                    <option
                        value="Embedded Systems"
                    >
                        Embedded Systems
                    </option>

                </select>


                <input
                    type="number"
                    min="0"
                    step="1"

                    aria-label="Maximum hours per week"

                    placeholder="Max Hours/wk"

                    style={{
                        ...inputStyle,
                        flex: 1
                    }}

                    value={
                        maxHours
                    }

                    onChange={
                        handleMaxHoursChange
                    }
                />


                <input
                    type="text"

                    aria-label="Required skill"

                    placeholder="Filter by Skill (e.g. React)"

                    style={{
                        ...inputStyle,
                        flex: 1
                    }}

                    value={
                        skill
                    }

                    onChange={
                        event =>
                            setSkill(
                                event.target
                                    .value
                            )
                    }
                />

            </div>


            {
                filterError && (
                    <div
                        style={{
                            ...errorStyle,

                            marginBottom:
                                '15px',

                            overflowWrap:
                                'anywhere',

                            wordBreak:
                                'break-word'
                        }}
                        role="alert"
                    >
                        {filterError}
                    </div>
                )
            }


            {loading ? (

                <div
                    style={
                        loadingStyle
                    }
                >
                    Loading projects...
                </div>

            ) : error ? (

                <div
                    style={
                        errorStyle
                    }
                >
                    {error}
                </div>

            ) : projects.length ===
                0 ? (

                <div
                    style={
                        emptyStyle
                    }
                >
                    No projects found matching your search criteria.
                </div>

            ) : (

                <div
                    style={
                        gridStyle
                    }
                >

                    {projects.map(
                        project => {

                            const openPositions =
                                (
                                    project.positions ||
                                    []
                                ).filter(
                                    position =>
                                        position.status ===
                                        'OPEN'
                                );


                            return (
                                <div
                                    key={
                                        project.projectId
                                    }

                                    style={
                                        cardStyle
                                    }
                                >

                                    <div>

                                        <div
                                            style={
                                                headerStyle
                                            }
                                        >

                                            <h3
                                                style={
                                                    projectTitleStyle
                                                }
                                            >
                                                {
                                                    project.title
                                                }
                                            </h3>


                                            <span
                                                style={
                                                    tagStyle
                                                }
                                            >
                                                {
                                                    project.category
                                                }
                                            </span>

                                        </div>


                                        <p
                                            style={
                                                descStyle
                                            }
                                        >
                                            {
                                                project.description
                                            }
                                        </p>


                                        <div
                                            style={
                                                metaStyle
                                            }
                                        >

                                            <span>
                                                <b>
                                                    Commitment:
                                                </b>{' '}

                                                {
                                                    project
                                                        .expectedHoursPerWeek
                                                }{' '}

                                                hrs/week
                                            </span>


                                            {project.repositoryUrl && (

                                                <a
                                                    href={
                                                        project
                                                            .repositoryUrl
                                                    }

                                                    target="_blank"

                                                    rel="noreferrer"

                                                    style={
                                                        linkStyle
                                                    }
                                                >
                                                    View Code Repo
                                                </a>

                                            )}

                                        </div>

                                    </div>


                                    <div
                                        style={
                                            positionsAreaStyle
                                        }
                                    >

                                        <div
                                            style={
                                                positionsHeadingStyle
                                            }
                                        >
                                            Open Positions:
                                        </div>


                                        {openPositions.length >
                                        0 ? (

                                            openPositions.map(
                                                position => (

                                                    <div
                                                        key={
                                                            position.positionId
                                                        }

                                                        style={
                                                            posBoxStyle
                                                        }
                                                    >

                                                        <div>

                                                            <div
                                                                style={
                                                                    positionTitleStyle
                                                                }
                                                            >
                                                                {
                                                                    position.title
                                                                }
                                                            </div>


                                                            {position.skills &&
                                                                position
                                                                    .skills
                                                                    .length >
                                                                    0 && (

                                                                <div
                                                                    style={
                                                                        skillsWrapStyle
                                                                    }
                                                                >

                                                                    {position.skills.map(
                                                                        skillName => (

                                                                            <span
                                                                                key={
                                                                                    skillName
                                                                                }

                                                                                style={
                                                                                    skillChipStyle
                                                                                }
                                                                            >
                                                                                {
                                                                                    skillName
                                                                                }
                                                                            </span>

                                                                        )
                                                                    )}

                                                                </div>

                                                            )}

                                                        </div>


                                                        <button
                                                            type="button"

                                                            style={
                                                                applyBtnStyle
                                                            }

                                                            onClick={() =>
                                                                openApplicationModal(
                                                                    project,
                                                                    position
                                                                )
                                                            }
                                                        >
                                                            Apply
                                                        </button>

                                                    </div>

                                                )
                                            )

                                        ) : (

                                            <span
                                                style={
                                                    noRolesStyle
                                                }
                                            >
                                                No active roles listed
                                            </span>

                                        )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            )}


            {selectedPosition && (

                <div
                    style={
                        modalOverlayStyle
                    }
                >

                    <div
                        style={
                            modalBoxStyle
                        }
                    >

                        <h3
                            style={
                                modalTitleStyle
                            }
                        >
                            Apply for Role
                        </h3>


                        <p
                            style={
                                modalDetailStyle
                            }
                        >

                            <strong
                                style={
                                    modalStrongStyle
                                }
                            >
                                Project:
                            </strong>{' '}

                            {
                                selectedPosition
                                    .projectTitle
                            }

                        </p>


                        <p
                            style={{
                                ...modalDetailStyle,

                                margin:
                                    '5px 0 15px 0'
                            }}
                        >

                            <strong
                                style={
                                    modalStrongStyle
                                }
                            >
                                Role:
                            </strong>{' '}

                            {
                                selectedPosition
                                    .positionTitle
                            }

                        </p>


                        {applyError && (

                            <div
                                style={{
                                    ...errorStyle,

                                    marginBottom:
                                        '15px'
                                }}
                            >
                                {applyError}
                            </div>

                        )}


                        {applySuccess && (
                            <div>
                                <div
                                    style={{
                                        ...successStyle,
                                        marginBottom:
                                            '15px'
                                    }}
                                >
                                    {applySuccess}
                                </div>

                                <button
                                    type="button"
                                    style={
                                        submitBtnStyle
                                    }
                                    onClick={
                                        closeApplicationModal
                                    }
                                >
                                    Done
                                </button>
                            </div>
                        )}


                        {!applySuccess && (
                        <form
                            onSubmit={
                                handleApplySubmit
                            }
                        >

                            <div
                                style={
                                    fieldGroupStyle
                                }
                            >

                                <label
                                    htmlFor="application-message"

                                    style={
                                        labelStyle
                                    }
                                >
                                    Statement of Interest / Cover Message *
                                </label>


                                <textarea
                                    id="application-message"

                                    required

                                    rows={4}

                                    placeholder="Describe your relevant experience..."

                                    style={{
                                        ...inputStyle,

                                        minHeight:
                                            '80px',

                                        resize:
                                            'vertical'
                                    }}

                                    value={
                                        applyMessage
                                    }

                                    onChange={
                                        event =>
                                            setApplyMessage(
                                                event.target
                                                    .value
                                            )
                                    }
                                />

                            </div>


                            <div
                                style={
                                    modalButtonRowStyle
                                }
                            >

                                <button
                                    type="button"

                                    style={
                                        cancelBtnStyle
                                    }

                                    disabled={
                                        submittingApply
                                    }

                                    onClick={
                                        closeApplicationModal
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"

                                    disabled={
                                        submittingApply
                                    }

                                    style={{
                                        ...submitBtnStyle,

                                        opacity:
                                            submittingApply
                                                ? 0.6
                                                : 1
                                    }}
                                >
                                    {
                                        submittingApply
                                            ? 'Submitting...'
                                            : 'Submit Application'
                                    }
                                </button>

                            </div>

                        </form>
                        )}

                    </div>

                </div>

            )}

        </div>
    );
}


const containerStyle = {
    maxWidth:
        '1100px',

    margin:
        '0 auto',

    padding:
        '20px 0 0'
};


const titleBlockStyle = {
    borderLeft:
        '4px solid #28b7ee',

    paddingLeft:
        '14px',

    marginBottom:
        '24px'
};


const titleStyle = {
    margin:
        0,

    color:
        '#ffffff',

    fontSize:
        '30px',

    fontWeight:
        850,

    letterSpacing:
        '-0.03em'
};


const subtitleStyle = {
    color:
        '#8fa1b7',

    margin:
        '7px 0 0',

    fontSize:
        '14px',

    lineHeight:
        1.55
};


const filterBarStyle = {
    display:
        'flex',

    gap:
        '10px',

    background:
        'linear-gradient(180deg, #111c30 0%, #0e1829 100%)',

    padding:
        '16px',

    border:
        '1px solid #273851',

    borderRadius:
        '12px',

    marginBottom:
        '25px',

    flexWrap:
        'wrap',

    boxShadow:
        '0 14px 35px rgba(0, 0, 0, 0.16)'
};


const inputStyle = {
    width:
        '100%',

    padding:
        '11px 12px',

    borderRadius:
        '8px',

    border:
        '1px solid #33445e',

    background:
        '#101a2b',

    color:
        '#f5f8fc',

    boxSizing:
        'border-box'
};


const loadingStyle = {
    color:
        '#8fa1b7',

    padding:
        '24px',

    border:
        '1px solid #273851',

    borderRadius:
        '12px',

    background:
        '#0f1829'
};


const emptyStyle = {
    color:
        '#8594a7',

    padding:
        '30px 0'
};


const gridStyle = {
    display:
        'grid',

    gridTemplateColumns:
        'repeat(auto-fill, minmax(300px, 1fr))',

    gap:
        '20px'
};


const cardStyle = {
    background:
        'linear-gradient(180deg, #111c30 0%, #0e1829 100%)',

    border:
        '1px solid #273851',

    borderRadius:
        '12px',

    padding:
        '20px',

    display:
        'flex',

    flexDirection:
        'column',

    justifyContent:
        'space-between',

    boxShadow:
        '0 14px 35px rgba(0, 0, 0, 0.16)'
};


const headerStyle = {
    display:
        'flex',

    justifyContent:
        'space-between',

    alignItems:
        'flex-start',

    marginBottom:
        '10px',

    gap:
        '10px'
};


const projectTitleStyle = {
    margin:
        0,

    color:
        '#ffffff',

    lineHeight:
        1.3
};


const tagStyle = {
    background:
        'rgba(40, 100, 237, 0.14)',

    color:
        '#68baff',

    border:
        '1px solid rgba(43, 143, 209, 0.35)',

    padding:
        '5px 8px',

    borderRadius:
        '999px',

    fontSize:
        '11px',

    fontWeight:
        '800',

    letterSpacing:
        '0.02em'
};


const descStyle = {
    color:
        '#c4cfdd',

    fontSize:
        '14px',

    lineHeight:
        '1.5',

    marginBottom:
        '15px'
};


const metaStyle = {
    display:
        'flex',

    justifyContent:
        'space-between',

    gap:
        '10px',

    fontSize:
        '12px',

    color:
        '#91a4bb',

    paddingBottom:
        '12px',

    borderBottom:
        '1px solid #27364c'
};


const linkStyle = {
    color:
        '#5ba8ff',

    textDecoration:
        'none',

    fontWeight:
        '700'
};


const positionsAreaStyle = {
    marginTop:
        '15px'
};


const positionsHeadingStyle = {
    fontSize:
        '13px',

    color:
        '#91a4bb',

    marginBottom:
        '8px',

    fontWeight:
        '700'
};


const posBoxStyle = {
    background:
        '#14213a',

    border:
        '1px solid #2a3d59',

    padding:
        '10px 12px',

    borderRadius:
        '8px',

    marginBottom:
        '8px',

    display:
        'flex',

    justifyContent:
        'space-between',

    alignItems:
        'center',

    gap:
        '10px'
};


const positionTitleStyle = {
    fontWeight:
        'bold',

    fontSize:
        '14px',

    color:
        '#ffffff'
};


const skillsWrapStyle = {
    display:
        'flex',

    gap:
        '5px',

    marginTop:
        '5px',

    flexWrap:
        'wrap'
};


const skillChipStyle = {
    background:
        'rgba(40, 100, 237, 0.15)',

    color:
        '#a9d5ff',

    border:
        '1px solid rgba(83, 150, 255, 0.2)',

    padding:
        '3px 7px',

    borderRadius:
        '999px',

    fontSize:
        '10px'
};


const applyBtnStyle = {
    background:
        'linear-gradient(135deg, #2f6df4, #2455d9)',

    color:
        '#ffffff',

    border:
        '1px solid #2864ed',

    padding:
        '7px 13px',

    borderRadius:
        '7px',

    cursor:
        'pointer',

    fontSize:
        '12px',

    fontWeight:
        '800',

    boxShadow:
        '0 7px 16px rgba(40, 100, 237, 0.20)'
};


const noRolesStyle = {
    fontSize:
        '12px',

    color:
        '#718198'
};


const fieldGroupStyle = {
    marginBottom:
        '15px'
};


const labelStyle = {
    display:
        'block',

    color:
        '#aebbd0',

    fontSize:
        '13px',

    fontWeight:
        '800',

    marginBottom:
        '6px'
};


const errorStyle = {
    background:
        'rgba(239, 91, 98, 0.12)',

    color:
        '#ff7b82',

    border:
        '1px solid rgba(239, 91, 98, 0.30)',

    padding:
        '10px',

    borderRadius:
        '8px'
};


const successStyle = {
    background:
        'rgba(40, 201, 139, 0.12)',

    color:
        '#49d69c',

    border:
        '1px solid rgba(40, 201, 139, 0.28)',

    padding:
        '10px',

    borderRadius:
        '8px'
};


const modalOverlayStyle = {
    position:
        'fixed',

    top:
        0,

    left:
        0,

    right:
        0,

    bottom:
        0,

    background:
        'rgba(2, 7, 16, 0.82)',

    backdropFilter:
        'blur(5px)',

    display:
        'flex',

    justifyContent:
        'center',

    alignItems:
        'center',

    zIndex:
        1000,

    padding:
        '20px'
};


const modalBoxStyle = {
    background:
        'linear-gradient(180deg, #111c30 0%, #0e1829 100%)',

    padding:
        '26px',

    borderRadius:
        '14px',

    border:
        '1px solid #334a6b',

    width:
        '90%',

    maxWidth:
        '500px',

    boxShadow:
        '0 30px 80px rgba(0, 0, 0, 0.48)'
};


const modalTitleStyle = {
    marginTop:
        0,

    color:
        '#ffffff'
};


const modalDetailStyle = {
    color:
        '#9fb0c4',

    fontSize:
        '14px',

    margin:
        '5px 0'
};


const modalStrongStyle = {
    color:
        '#ffffff'
};


const modalButtonRowStyle = {
    display:
        'flex',

    justifyContent:
        'flex-end',

    gap:
        '10px',

    marginTop:
        '20px'
};


const submitBtnStyle = {
    background:
        'linear-gradient(135deg, #2f6df4, #2455d9)',

    color:
        '#ffffff',

    border:
        '1px solid #2864ed',

    padding:
        '10px 20px',

    borderRadius:
        '7px',

    cursor:
        'pointer',

    fontWeight:
        '800',

    fontSize:
        '14px',

    boxShadow:
        '0 8px 18px rgba(40, 100, 237, 0.20)'
};


const cancelBtnStyle = {
    background:
        '#16233a',

    color:
        '#c8d4e2',

    border:
        '1px solid #3a4d69',

    padding:
        '10px 16px',

    borderRadius:
        '7px',

    cursor:
        'pointer',

    fontSize:
        '14px',

    fontWeight:
        '700'
};