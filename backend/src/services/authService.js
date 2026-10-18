const bcrypt =
    require("bcrypt");

const jwt =
    require("jsonwebtoken");


const TEST_JWT_SECRET =
    "projectforge-test-secret-only";


const JWT_SECRET =
    process.env.JWT_SECRET ||
    (
        process.env.NODE_ENV ===
        "test"
            ? TEST_JWT_SECRET
            : null
    );


const SALT_ROUNDS = 10;


const MAX_EMAIL_LENGTH = 255;
const MAX_DISPLAY_NAME_LENGTH = 120;


/*
 * bcrypt only uses the first 72 bytes of a password.
 *
 * This is intentionally measured in UTF-8 bytes rather
 * than JavaScript characters because some characters
 * occupy more than one byte.
 */
const MAX_PASSWORD_BYTES = 72;


/*
 * Kept as an exported compatibility constant for existing
 * code/tests which may import MAX_PASSWORD_LENGTH.
 *
 * The effective password maximum is now 72 UTF-8 bytes.
 */
const MAX_PASSWORD_LENGTH =
    MAX_PASSWORD_BYTES;


const ALLOWED_REGISTRATION_ROLES = [
    "STUDENT",
    "MENTOR"
];


function getPasswordByteLength(
    password
) {
    if (
        typeof password !==
        "string"
    ) {
        return 0;
    }


    return Buffer.byteLength(
        password,
        "utf8"
    );
}


/**
 * Normalise a requested registration role.
 *
 * Registration may request STUDENT or MENTOR.
 * ADMIN accounts may never be created through public signup.
 *
 * Missing role remains backwards-compatible with the
 * existing registration flow and defaults to STUDENT.
 */
function normaliseRegistrationRole(
    role
) {
    if (
        role === undefined ||
        role === null ||
        String(role).trim() === ""
    ) {
        return "STUDENT";
    }


    return String(role)
        .trim()
        .toUpperCase();
}


/**
 * Validate a normal email address.
 */
function validateEmail(
    email
) {
    if (
        !email ||
        typeof email !==
            "string"
    ) {
        return false;
    }


    const cleanEmail =
        email
            .trim()
            .toLowerCase();


    if (
        cleanEmail.length === 0 ||
        cleanEmail.length >
            MAX_EMAIL_LENGTH
    ) {
        return false;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emailPattern.test(
        cleanEmail
    );
}


/**
 * Validate registration data.
 */
function validateRegistrationInput(
    data
) {
    if (
        !data ||
        typeof data !==
            "object" ||
        Array.isArray(
            data
        )
    ) {
        return {
            isValid:
                false,

            error:
                "Invalid registration data."
        };
    }


    const {
        email,
        password,
        firstName,
        lastName,
        role,
        requestedRole
    } = data;


    if (
        typeof email !==
            "string" ||
        typeof password !==
            "string" ||
        typeof firstName !==
            "string" ||
        typeof lastName !==
            "string"
    ) {
        return {
            isValid:
                false,

            error:
                "All fields are mandatory."
        };
    }


    const cleanEmail =
        email.trim();


    const cleanFirstName =
        firstName.trim();


    const cleanLastName =
        lastName.trim();


    if (
        !cleanEmail ||
        !password ||
        !cleanFirstName ||
        !cleanLastName
    ) {
        return {
            isValid:
                false,

            error:
                "All fields are mandatory."
        };
    }


    if (
        cleanEmail.length >
        MAX_EMAIL_LENGTH
    ) {
        return {
            isValid:
                false,

            error:
                `Email address must be ${MAX_EMAIL_LENGTH} characters or fewer.`
        };
    }


    if (
        !validateEmail(
            cleanEmail
        )
    ) {
        return {
            isValid:
                false,

            error:
                "Invalid email address."
        };
    }


    const displayName =
        `${cleanFirstName} ${cleanLastName}`;


    if (
        displayName.length >
        MAX_DISPLAY_NAME_LENGTH
    ) {
        return {
            isValid:
                false,

            error:
                `Full name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`
        };
    }


    if (
        password.startsWith(" ") ||
        password.endsWith(" ")
    ) {
        return {
            isValid:
                false,

            error:
                "Password may not begin or end with spaces."
        };
    }


    if (
        password.length <
        8
    ) {
        return {
            isValid:
                false,

            error:
                "Password must be at least 8 characters long."
        };
    }


    if (
        getPasswordByteLength(
            password
        ) >
        MAX_PASSWORD_BYTES
    ) {
        return {
            isValid:
                false,

            error:
                `Password must be ${MAX_PASSWORD_BYTES} UTF-8 bytes or fewer.`
        };
    }


    const registrationRole =
        normaliseRegistrationRole(
            requestedRole ??
            role
        );


    if (
        !ALLOWED_REGISTRATION_ROLES
            .includes(
                registrationRole
            )
    ) {
        return {
            isValid:
                false,

            error:
                "Registration role must be STUDENT or MENTOR."
        };
    }


    return {
        isValid:
            true,

        error:
            null,

        role:
            registrationRole
    };
}


/**
 * Hash a password before it is stored.
 */
async function hashPassword(
    plainPassword
) {
    if (
        typeof plainPassword !==
            "string" ||
        plainPassword.length <
            8
    ) {
        throw new Error(
            "Password must be at least 8 characters long."
        );
    }


    if (
        plainPassword.startsWith(" ") ||
        plainPassword.endsWith(" ")
    ) {
        throw new Error(
            "Password may not begin or end with spaces."
        );
    }


    if (
        getPasswordByteLength(
            plainPassword
        ) >
        MAX_PASSWORD_BYTES
    ) {
        throw new Error(
            `Password must be ${MAX_PASSWORD_BYTES} UTF-8 bytes or fewer.`
        );
    }


    return bcrypt.hash(
        plainPassword,
        SALT_ROUNDS
    );
}


/**
 * Compare a supplied password with its stored bcrypt hash.
 */
async function verifyPassword(
    plainPassword,
    storedHash
) {
    if (
        typeof plainPassword !==
            "string" ||
        !plainPassword ||
        typeof storedHash !==
            "string" ||
        !storedHash
    ) {
        return false;
    }


    if (
        plainPassword.startsWith(" ") ||
        plainPassword.endsWith(" ")
    ) {
        return false;
    }


    if (
        getPasswordByteLength(
            plainPassword
        ) >
        MAX_PASSWORD_BYTES
    ) {
        return false;
    }


    return bcrypt.compare(
        plainPassword,
        storedHash
    );
}


/**
 * Validate login input.
 */
function validateLoginInput(
    data
) {
    if (
        !data ||
        typeof data !==
            "object" ||
        Array.isArray(
            data
        )
    ) {
        return {
            isValid:
                false,

            error:
                "Invalid input data."
        };
    }


    const {
        email,
        password
    } = data;


    if (
        typeof email !==
            "string" ||
        !email.trim()
    ) {
        return {
            isValid:
                false,

            error:
                "Email is required."
        };
    }


    if (
        email.trim().length >
        MAX_EMAIL_LENGTH
    ) {
        return {
            isValid:
                false,

            error:
                `Email address must be ${MAX_EMAIL_LENGTH} characters or fewer.`
        };
    }


    if (
        !validateEmail(
            email
        )
    ) {
        return {
            isValid:
                false,

            error:
                "Invalid email address."
        };
    }


    if (
        typeof password !==
            "string" ||
        password.length ===
            0
    ) {
        return {
            isValid:
                false,

            error:
                "Password is required."
        };
    }


    if (
        password.startsWith(" ") ||
        password.endsWith(" ")
    ) {
        return {
            isValid:
                false,

            error:
                "Password may not begin or end with spaces."
        };
    }


    if (
        getPasswordByteLength(
            password
        ) >
        MAX_PASSWORD_BYTES
    ) {
        return {
            isValid:
                false,

            error:
                `Password must be ${MAX_PASSWORD_BYTES} UTF-8 bytes or fewer.`
        };
    }


    return {
        isValid:
            true,

        error:
            null
    };
}


/**
 * Generate an authenticated JWT.
 */
function generateToken(
    user
) {
    if (
        !user ||
        !user.id ||
        !user.email
    ) {
        throw new Error(
            "User id and email is required to generate a token."
        );
    }


    if (
        !JWT_SECRET
    ) {
        throw new Error(
            "JWT_SECRET environment variable is required."
        );
    }


    const payload = {
        id:
            user.id,

        email:
            user.email,

        role:
            user.role ||
            "STUDENT"
    };


    return jwt.sign(
        payload,
        JWT_SECRET,
        {
            expiresIn:
                "24h"
        }
    );
}


module.exports = {
    validateEmail,
    validateRegistrationInput,
    normaliseRegistrationRole,
    getPasswordByteLength,
    hashPassword,
    verifyPassword,
    validateLoginInput,
    generateToken,

    JWT_SECRET,

    MAX_EMAIL_LENGTH,
    MAX_DISPLAY_NAME_LENGTH,
    MAX_PASSWORD_LENGTH,
    MAX_PASSWORD_BYTES,

    ALLOWED_REGISTRATION_ROLES
};