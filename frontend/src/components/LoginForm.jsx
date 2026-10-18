import React, { useState } from 'react';
import { useAuth } from "../context/AuthContext";
import useAutoDismissFeedback from "../hooks/useAutoDismissFeedback";
import './LoginForm.css';


const MAX_EMAIL_LENGTH = 255;
const MAX_PASSWORD_BYTES = 72;


function getUtf8ByteLength(value) {
    return new TextEncoder()
        .encode(value)
        .length;
}


/**
 * LoginForm Component
 * Handles user authentication against the backend API and persists sessions.
 */
export const LoginForm = ({ onLogin }) => {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');


    useAutoDismissFeedback(
        Boolean(
            errorMessage
        ),
        () => {
            setErrorMessage('');
        }
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!email.trim() || !password.trim()) {
            setErrorMessage('Email and password are required.');
            return;
        }

        if (
            password.startsWith(' ') ||
            password.endsWith(' ')
        ) {
            setErrorMessage(
                'Password may not begin or end with spaces.'
            );
            return;
        }

        if (email.trim().length > MAX_EMAIL_LENGTH) {
            setErrorMessage(
                `Maximum characters exceeded. Email may not exceed ${MAX_EMAIL_LENGTH} characters.`
            );
            return;
        }

        if (getUtf8ByteLength(password) > MAX_PASSWORD_BYTES) {
            setErrorMessage(
                `Maximum characters exceeded. Password may not exceed ${MAX_PASSWORD_BYTES} UTF-8 bytes.`
            );
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Authentication failed. Please check your credentials.');
            }

            login(data.token, data.user);
            if (onLogin) onLogin();

        } catch (err) {
            setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                {/* Aero Header: ProjectForge 3-Stripe Wing */}
                <div className="aero-brand-header">
                    <svg 
                        className="aero-wing-svg" 
                        viewBox="0 0 36 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <rect y="0" width="36" height="4.5" rx="2.25" fill="#38bdf8" />
                        <rect y="9.5" width="27" height="4.5" rx="2.25" fill="#2563eb" />
                        <rect y="19" width="18" height="4.5" rx="2.25" fill="#1d4ed8" />
                    </svg>
                    <div className="brand-text">
                        <span className="brand-title">PROJECTFORGE</span>
                        <span className="brand-sub">STUDENT PLATFORM</span>
                    </div>
                </div>

                <h2>Sign In</h2>

                {/* Exact error banner structure expected by unit tests */}
                {errorMessage && (
                    <div className="error-banner" role="alert">
                        {errorMessage}
                    </div>
                )}

                {/* Exact email placeholder expected by unit tests */}
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (value.length > MAX_EMAIL_LENGTH) {
                                setErrorMessage(
                                    `Maximum characters exceeded. Email may not exceed ${MAX_EMAIL_LENGTH} characters.`
                                );
                                return;
                            }

                            setErrorMessage('');
                            setEmail(value);
                        }}
                        placeholder="e.g. u12345678@tuks.co.za"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Exact password placeholder expected by unit tests */}
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (
                                getUtf8ByteLength(value) >
                                MAX_PASSWORD_BYTES
                            ) {
                                setErrorMessage(
                                    `Maximum characters exceeded. Password may not exceed ${MAX_PASSWORD_BYTES} UTF-8 bytes.`
                                );
                                return;
                            }

                            setErrorMessage('');
                            setPassword(value);
                        }}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Exact button text expected by unit tests */}
                <button 
                    type="submit" 
                    className="submit-btn" 
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;