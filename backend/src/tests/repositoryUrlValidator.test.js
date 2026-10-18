const {
    IsValidRepositoryUrl
} = require("../utils/repositoryUrlValidator");

describe("Repository URL Validator", () => {

    test("accepts a valid GitHub repository URL", () => {
        expect(
            IsValidRepositoryUrl("https://github.com/user/project")
        ).toBe(true);
    });

    test("accepts a valid GitLab repository URL", () => {
        expect(
            IsValidRepositoryUrl("https://gitlab.com/user/project")
        ).toBe(true);
    });

    test("accepts GitLab nested group repository URLs", () => {
        expect(
            IsValidRepositoryUrl("https://gitlab.com/group/subgroup/project")
        ).toBe(true);
    });

    test("rejects non-HTTPS repository URLs", () => {
        expect(
            IsValidRepositoryUrl("http://github.com/user/project")
        ).toBe(false);
    });

    test("rejects unsupported repository hosts", () => {
        expect(
            IsValidRepositoryUrl("https://bitbucket.org/user/project")
        ).toBe(false);
    });

    test("rejects a GitHub URL without a repository", () => {
        expect(
            IsValidRepositoryUrl("https://github.com/user")
        ).toBe(false);
    });

    test("rejects an invalid URL", () => {
        expect(
            IsValidRepositoryUrl("not-a-url")
        ).toBe(false);
    });

    test("rejects an empty URL", () => {
        expect(
            IsValidRepositoryUrl("")
        ).toBe(false);
    });

    test("rejects null", () => {
        expect(
            IsValidRepositoryUrl(null)
        ).toBe(false);
    });
});