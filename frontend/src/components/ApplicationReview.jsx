import React, {
    useCallback,
    useEffect,
    useState
} from 'react';

import useAutoDismissFeedback
    from "../hooks/useAutoDismissFeedback";

import {
    useAuth
} from "../context/AuthContext";


export default function ApplicationReview() {

    const {
        logout
    } = useAuth();
    const [
        applications,
        setApplications
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        error,
        setError
    ] = useState('');

    const [
        message,
        setMessage
    ] = useState('');


    const [
        actionFeedbackActive,
        setActionFeedbackActive
    ] = useState(false);


    // APPLICATION_REVIEW_FEEDBACK_SPLIT
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

    const [
        processingId,
        setProcessingId
    ] = useState(null);


    const loadApplications =
        useCallback(async () => {
            // APPLICATION_REVIEW_LOAD_FEEDBACK
            setActionFeedbackActive(
                false
            );
            const token =
                sessionStorage.getItem(
                    'token'
                );

            if (!token) {
                setError(
                    'Please log in to review applications.'
                );

                setLoading(false);

                return;
            }

            setLoading(true);
            setError('');

            try {
                const response =
                    await fetch(
                        '/api/applications',
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
                    if (
                        response.status ===
                        401
                    ) {
                        logout();

                        throw new Error(
                            'Your session has expired. Please log in again.'
                        );
                    }

                    throw new Error(
                        data.error ||
                        'Failed to load applications.'
                    );
                }

                setApplications(
                    data.applications || []
                );

            } catch (
                requestError
            ) {
                setError(
                    requestError.message ||
                    'Failed to load applications.'
                );

            } finally {
                setLoading(false);
            }
        }, [logout]);


    useEffect(() => {
        loadApplications();
    }, [loadApplications]);


    const updateStatus = async (
        applicationId,
        status
    ) => {

        setActionFeedbackActive(true);
        const token =
            sessionStorage.getItem(
                'token'
            );

        if (!token) {
            setError(
                'Please log in to review applications.'
            );

            return;
        }

        setProcessingId(
            applicationId
        );

        setError('');
        setMessage('');

        try {
            const response =
                await fetch(
                    `/api/applications/${applicationId}/status`,
                    {
                        method: 'PATCH',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                status
                            })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                if (
                    response.status ===
                    401
                ) {
                    logout();

                    throw new Error(
                        'Your session has expired. Please log in again.'
                    );
                }

                if (
                    response.status ===
                    403
                ) {
                    throw new Error(
                        'Project Lead access is required to process this application.'
                    );
                }

                throw new Error(
                    data.error ||
                    'Failed to update application.'
                );
            }

            setMessage(
                status === 'ACCEPTED'
                    ? 'Application accepted successfully.'
                    : 'Application rejected successfully.'
            );

            await loadApplications();

        } catch (
            requestError
        ) {
            setError(
                requestError.message ||
                'Failed to update application.'
            );

        } finally {
            setProcessingId(null);
        }
    };


    return (
        <div style={containerStyle}>

            <div style={titleBlockStyle}>

                <h2 style={titleStyle}>
                    Project Applications
                </h2>

                <p style={subtitleStyle}>
                    Review applications
                    for projects where you
                    are the Project Lead.
                </p>

            </div>


            {error && (

                <div
                    role="alert"
                    style={
                        errorStyle
                    }
                >
                    {error}
                </div>

            )}


            {message && (

                <div
                    role="status"
                    style={
                        successStyle
                    }
                >
                    {message}
                </div>

            )}


            {loading ? (

                <div
                    style={
                        emptyStyle
                    }
                >
                    Loading applications...
                </div>

            ) : applications.length ===
                0 ? (

                <div
                    style={
                        emptyStyle
                    }
                >
                    No project
                    applications are
                    currently available
                    for you to review.
                </div>

            ) : (

                <div style={listStyle}>

                    {applications.map(
                        (
                            application
                        ) => {

                            const pending =
                                application
                                    .status ===
                                'PENDING';

                            const processing =
                                processingId ===
                                application
                                    .applicationId;


                            return (
                                <article
                                    key={
                                        application
                                            .applicationId
                                    }
                                    style={
                                        cardStyle
                                    }
                                >

                                    <div
                                        style={
                                            cardAccentStyle
                                        }
                                    />


                                    <div
                                        style={
                                            headingRowStyle
                                        }
                                    >

                                        <div>

                                            <div
                                                style={
                                                    applicationLabelStyle
                                                }
                                            >
                                                APPLICATION
                                            </div>


                                            <h3
                                                style={
                                                    projectTitleStyle
                                                }
                                            >
                                                {
                                                    application
                                                        .projectTitle
                                                }
                                            </h3>


                                            <div
                                                style={
                                                    positionStyle
                                                }
                                            >
                                                {
                                                    application
                                                        .positionTitle
                                                }
                                            </div>

                                        </div>


                                        <span
                                            style={
                                                getStatusStyle(
                                                    application
                                                        .status
                                                )
                                            }
                                        >
                                            {
                                                application
                                                    .status
                                            }
                                        </span>

                                    </div>


                                    <div
                                        style={
                                            detailsStyle
                                        }
                                    >

                                        <div
                                            style={
                                                detailItemStyle
                                            }
                                        >

                                            <strong
                                                style={
                                                    detailLabelStyle
                                                }
                                            >
                                                Applicant
                                            </strong>

                                            <span>
                                                {
                                                    application
                                                        .applicantName
                                                }
                                            </span>

                                        </div>


                                        <div
                                            style={
                                                detailItemStyle
                                            }
                                        >

                                            <strong
                                                style={
                                                    detailLabelStyle
                                                }
                                            >
                                                Email
                                            </strong>

                                            <span>
                                                {
                                                    application
                                                        .applicantEmail
                                                }
                                            </span>

                                        </div>


                                        <div
                                            style={
                                                detailItemStyle
                                            }
                                        >

                                            <strong
                                                style={
                                                    detailLabelStyle
                                                }
                                            >
                                                Category
                                            </strong>

                                            <span>
                                                {
                                                    application
                                                        .projectCategory
                                                }
                                            </span>

                                        </div>


                                        <div
                                            style={
                                                detailItemStyle
                                            }
                                        >

                                            <strong
                                                style={
                                                    detailLabelStyle
                                                }
                                            >
                                                Submitted
                                            </strong>

                                            <span>
                                                {
                                                    application
                                                        .submittedAt
                                                        ? new Date(
                                                            application
                                                                .submittedAt
                                                        )
                                                            .toLocaleString()
                                                        : '—'
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <div
                                        style={
                                            messageBoxStyle
                                        }
                                    >

                                        <div
                                            style={
                                                messageLabelStyle
                                            }
                                        >
                                            STATEMENT OF INTEREST
                                        </div>

                                        <p
                                            style={
                                                messageTextStyle
                                            }
                                        >
                                            {
                                                application
                                                    .message
                                            }
                                        </p>

                                    </div>


                                    {pending && (

                                        <div
                                            style={
                                                actionRowStyle
                                            }
                                        >

                                            <button
                                                type="button"
                                                disabled={
                                                    processing
                                                }
                                                style={{
                                                    ...rejectButtonStyle,

                                                    opacity:
                                                        processing
                                                            ? 0.6
                                                            : 1
                                                }}
                                                onClick={() =>
                                                    updateStatus(
                                                        application
                                                            .applicationId,
                                                        'REJECTED'
                                                    )
                                                }
                                            >
                                                {
                                                    processing
                                                        ? 'Processing...'
                                                        : 'Reject'
                                                }
                                            </button>


                                            <button
                                                type="button"
                                                disabled={
                                                    processing
                                                }
                                                style={{
                                                    ...acceptButtonStyle,

                                                    opacity:
                                                        processing
                                                            ? 0.6
                                                            : 1
                                                }}
                                                onClick={() =>
                                                    updateStatus(
                                                        application
                                                            .applicationId,
                                                        'ACCEPTED'
                                                    )
                                                }
                                            >
                                                {
                                                    processing
                                                        ? 'Processing...'
                                                        : 'Accept'
                                                }
                                            </button>

                                        </div>

                                    )}

                                </article>
                            );
                        }
                    )}

                </div>

            )}

        </div>
    );
}


function getStatusStyle(
    status
) {
    const base = {
        padding:
            '6px 10px',

        borderRadius:
            '999px',

        fontSize:
            '10px',

        fontWeight:
            '900',

        letterSpacing:
            '0.055em',

        border:
            '1px solid transparent'
    };


    if (
        status === 'ACCEPTED'
    ) {
        return {
            ...base,

            color: '#49d69c',

            background:
                'rgba(40, 201, 139, 0.12)',

            border:
                '1px solid rgba(40, 201, 139, 0.28)'
        };
    }


    if (
        status === 'REJECTED'
    ) {
        return {
            ...base,

            color: '#ff7b82',

            background:
                'rgba(239, 91, 98, 0.12)',

            border:
                '1px solid rgba(239, 91, 98, 0.28)'
        };
    }


    return {
        ...base,

        color: '#f6c85f',

        background:
            'rgba(244, 183, 64, 0.12)',

        border:
            '1px solid rgba(244, 183, 64, 0.28)'
    };
}


const containerStyle = {
    maxWidth: '1000px',

    margin: '0 auto',

    padding: '20px 0 0'
};


const titleBlockStyle = {
    borderLeft:
        '4px solid #28b7ee',

    paddingLeft: '14px',

    marginBottom: '24px'
};


const titleStyle = {
    margin: 0,

    color: '#ffffff',

    fontSize: '30px',

    fontWeight: 850,

    letterSpacing:
        '-0.03em'
};


const subtitleStyle = {
    color: '#8fa1b7',

    margin:
        '7px 0 0',

    fontSize: '14px',

    lineHeight: 1.55
};


const listStyle = {
    display: 'flex',

    flexDirection:
        'column',

    gap: '16px'
};


const cardStyle = {
    position: 'relative',

    overflow: 'hidden',

    background:
        'linear-gradient(180deg, #111c30 0%, #0e1829 100%)',

    border:
        '1px solid #273851',

    borderRadius:
        '12px',

    padding: '22px',

    boxShadow:
        '0 14px 35px rgba(0, 0, 0, 0.16)'
};


const cardAccentStyle = {
    position:
        'absolute',

    top: 0,

    left: 0,

    width: '34%',

    height: '3px',

    background:
        'linear-gradient(90deg, #28b7ee, #2864ed, transparent)'
};


const headingRowStyle = {
    display: 'flex',

    justifyContent:
        'space-between',

    alignItems:
        'flex-start',

    gap: '15px',

    marginBottom:
        '18px'
};


const applicationLabelStyle = {
    marginBottom:
        '6px',

    color: '#5ab8ff',

    fontSize:
        '10px',

    fontWeight:
        '900',

    letterSpacing:
        '0.12em'
};


const projectTitleStyle = {
    margin:
        '0 0 5px 0',

    color:
        '#ffffff',

    fontSize:
        '19px'
};


const positionStyle = {
    color: '#68baff',

    fontSize: '13px',

    fontWeight: '800'
};


const detailsStyle = {
    display: 'grid',

    gridTemplateColumns:
        'repeat(auto-fit, minmax(180px, 1fr))',

    gap: '10px',

    marginBottom:
        '18px',

    color: '#d5deea',

    fontSize: '13px'
};


const detailItemStyle = {
    display: 'flex',

    flexDirection:
        'column',

    gap: '5px',

    padding:
        '11px 12px',

    border:
        '1px solid #293b56',

    borderRadius:
        '8px',

    background:
        '#14213a'
};


const detailLabelStyle = {
    color: '#7fbfff',

    fontSize: '10px',

    textTransform:
        'uppercase',

    letterSpacing:
        '0.055em'
};


const messageBoxStyle = {
    background:
        '#101a2b',

    border:
        '1px solid #2a3d59',

    borderRadius:
        '9px',

    padding:
        '15px',

    color: '#d5deea',

    fontSize:
        '14px',

    lineHeight: 1.5
};


const messageLabelStyle = {
    color: '#5ab8ff',

    fontSize: '10px',

    fontWeight: '900',

    letterSpacing:
        '0.1em'
};


const messageTextStyle = {
    margin:
        '8px 0 0 0',

    color: '#d4deea'
};


const actionRowStyle = {
    display: 'flex',

    justifyContent:
        'flex-end',

    gap: '10px',

    marginTop:
        '18px'
};


const acceptButtonStyle = {
    background:
        'linear-gradient(135deg, #2f6df4, #2455d9)',

    color: '#ffffff',

    border:
        '1px solid #2864ed',

    padding:
        '9px 18px',

    borderRadius:
        '7px',

    cursor: 'pointer',

    fontWeight: '800',

    boxShadow:
        '0 8px 18px rgba(40, 100, 237, 0.20)'
};


const rejectButtonStyle = {
    background:
        'rgba(239, 91, 98, 0.08)',

    color: '#ff7b82',

    border:
        '1px solid rgba(239, 91, 98, 0.32)',

    padding:
        '9px 18px',

    borderRadius:
        '7px',

    cursor: 'pointer',

    fontWeight: '800'
};


const errorStyle = {
    background:
        'rgba(239, 91, 98, 0.12)',

    color: '#ff7b82',

    border:
        '1px solid rgba(239, 91, 98, 0.30)',

    padding:
        '11px 12px',

    borderRadius:
        '8px',

    marginBottom:
        '15px'
};


const successStyle = {
    background:
        'rgba(40, 201, 139, 0.12)',

    color: '#49d69c',

    border:
        '1px solid rgba(40, 201, 139, 0.28)',

    padding:
        '11px 12px',

    borderRadius:
        '8px',

    marginBottom:
        '15px'
};


const emptyStyle = {
    background:
        'linear-gradient(180deg, #111c30 0%, #0e1829 100%)',

    border:
        '1px solid #273851',

    borderRadius:
        '12px',

    padding:
        '30px',

    color: '#8fa1b7',

    textAlign:
        'center'
};