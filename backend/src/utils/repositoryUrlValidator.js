/**
 * Repository URL Validator
 * Validates external GitHub and GitLab repository links (PFG-55).
 *
 * Only repository URLs hosted on github.com or gitlab.com are accepted.
 */

function IsValidRepositoryUrl(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return false;
    }

    try {
        const url = new URL(value.trim());

        // Repository links must use HTTPS.
        if (url.protocol !== "https:") {
            return false;
        }

        // Only GitHub and GitLab repository hosts are allowed.
        const allowedHosts = [
            "github.com",
            "www.github.com",
            "gitlab.com",
            "www.gitlab.com"
        ];

        if (!allowedHosts.includes(url.hostname.toLowerCase())) {
            return false;
        }

        // A repository must contain at least owner/group + repository name.
        const pathParts = url.pathname
            .split("/")
            .filter(part => part.length > 0);

        if (pathParts.length < 2) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

module.exports = { IsValidRepositoryUrl };