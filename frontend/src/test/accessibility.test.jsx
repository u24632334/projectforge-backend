import React from "react";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { vi } from "vitest";

import App from "../App.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";


/**
 * PFG-89 Accessibility Audit
 *
 * These tests run axe against the real ProjectForge screens.
 * Different user states and pages are checked so the audit is
 * not limited to only the first screen that loads.
 *
 * Pages that normally depend on the backend use controlled test
 * responses so the accessibility tests can run independently.
 */
describe("ProjectForge accessibility audit", () => {

  /**
   * Clear saved login information before each test.
   * This keeps each test independent from the previous one.
   */
  beforeEach(() => {
    sessionStorage.clear();
  });


  /**
   * Restore mocked functions after every test so a mocked API
   * response cannot accidentally affect another screen.
   */
  afterEach(() => {
    vi.restoreAllMocks();
  });


  /**
   * Save a test student so AuthProvider loads ProjectForge
   * as an authenticated student.
   */
  function setAuthenticatedStudent() {
    sessionStorage.setItem(
      "token",
      "accessibility-test-token"
    );

    sessionStorage.setItem(
      "user",
      JSON.stringify({
        id: "accessibility-test-user",
        email: "student@projectforge.local",
        role: "STUDENT",
      })
    );
  }


  /**
   * Save an approved test Mentor.
   *
   * The MENTOR role is required for the Mentor navigation option
   * and Mentor Portal to become available.
   */
  function setAuthenticatedMentor() {
    sessionStorage.setItem(
      "token",
      "accessibility-mentor-token"
    );

    sessionStorage.setItem(
      "user",
      JSON.stringify({
        id: "accessibility-mentor-user",
        email: "mentor@projectforge.local",
        role: "MENTOR",
      })
    );
  }


  /**
   * Save a test administrator.
   * The ADMIN role is needed for the Admin navigation option
   * and moderation page to become available.
   */
  function setAuthenticatedAdmin() {
    sessionStorage.setItem(
      "token",
      "accessibility-admin-token"
    );

    sessionStorage.setItem(
      "user",
      JSON.stringify({
        id: "accessibility-admin-user",
        email: "admin@projectforge.local",
        role: "ADMIN",
      })
    );
  }


  /**
   * Render the application using the same AuthProvider
   * that is used by the real frontend.
   */
  function renderProjectForge() {
    return render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  }


  /**
   * Check the first screen shown to a user who is not logged in.
   */
  test(
    "logged-out login screen has no detectable accessibility violations",
    async () => {
      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "ProjectForge",
      });

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check the account creation screen reached from the login page.
   */
  test(
    "sign-up screen has no detectable accessibility violations",
    async () => {
      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "ProjectForge",
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Sign Up",
        })
      );

      await screen.findByRole("heading", {
        name: "Create Account",
      });

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Axe checks the page structure, but keyboard order also needs
   * to be tested by actually tabbing through the controls.
   */
  test(
    "sign-up form follows a logical keyboard focus order",
    async () => {
      const user =
        userEvent.setup();

      renderProjectForge();

      await screen.findByRole("heading", {
        name: "ProjectForge",
      });

      await user.click(
        screen.getByRole("button", {
          name: "Sign Up",
        })
      );

      await screen.findByRole("heading", {
        name: "Create Account",
      });

      const fullName =
        screen.getByRole("textbox", {
          name: "Full Name",
        });

      const email =
        screen.getByRole("textbox", {
          name: "Email",
        });

      const password =
        screen.getByLabelText("Password");

      const primaryRole =
        screen.getByRole("combobox", {
          name: "Primary Role",
        });

      const signUpButton =
        screen.getByRole("button", {
          name: "Sign Up",
        });

      const loginButton =
        screen.getByRole("button", {
          name: "Log In",
        });

      await user.tab();
      expect(fullName).toHaveFocus();

      await user.tab();
      expect(email).toHaveFocus();

      await user.tab();
      expect(password).toHaveFocus();

      await user.tab();
      expect(primaryRole).toHaveFocus();

      await user.tab();
      expect(signUpButton).toHaveFocus();

      await user.tab();
      expect(loginButton).toHaveFocus();
    }
  );


  /**
   * Check the dashboard shown after a student logs in.
   */
  test(
    "authenticated dashboard has no detectable accessibility violations",
    async () => {
      setAuthenticatedStudent();

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "Dashboard",
      });

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check the page used to search and browse projects.
   */
  test(
    "discover projects page has no detectable accessibility violations",
    async () => {
      setAuthenticatedStudent();

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "Dashboard",
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Discover",
        })
      );

      await screen.findByRole("heading", {
        name: "Discover Projects",
      });

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check that the Discover search controls can be reached
   * in the same logical order in which they appear on screen.
   */
  test(
    "discover search controls follow a logical keyboard focus order",
    async () => {
      const user =
        userEvent.setup();

      setAuthenticatedStudent();

      renderProjectForge();

      await screen.findByRole("heading", {
        name: "Dashboard",
      });

      await user.click(
        screen.getByRole("button", {
          name: "Discover",
        })
      );

      await screen.findByRole("heading", {
        name: "Discover Projects",
      });

      const searchInput =
        screen.getByRole("textbox", {
          name: "Search projects",
        });

      const categoryFilter =
        screen.getByRole("combobox", {
          name: "Project category",
        });

      const maxHoursInput =
        screen.getByRole("spinbutton", {
          name: "Maximum hours per week",
        });

      const skillInput =
        screen.getByRole("textbox", {
          name: "Required skill",
        });

      searchInput.focus();
      expect(searchInput).toHaveFocus();

      await user.tab();
      expect(categoryFilter).toHaveFocus();

      await user.tab();
      expect(maxHoursInput).toHaveFocus();

      await user.tab();
      expect(skillInput).toHaveFocus();
    }
  );


  /**
   * Check the main project workspace used by the project team.
   *
   * The workspace loads milestones, tasks, project members,
   * development updates and Team Radio requests from the backend.
   * Controlled empty responses keep this accessibility test
   * independent from the API server.
   */
  test(
    "project workspace has no detectable accessibility violations",
    async () => {
      setAuthenticatedStudent();

      sessionStorage.setItem(
        "projectforge-active-page",
        "workspace"
      );

      sessionStorage.setItem(
        "projectforge-active-project-id",
        "accessibility-project-1"
      );

      vi.spyOn(global, "fetch")
        .mockImplementation(
          async request => {
            const url =
              String(request);

            if (
              url ===
              "/api/projects/accessibility-project-1"
            ) {
              return {
                ok: true,

                json: async () => ({
                  project: {
                    projectId:
                      "accessibility-project-1",

                    title:
                      "Accessibility Test Project",

                    status:
                      "ACTIVE",

                    category:
                      "Software",

                    expectedHoursPerWeek:
                      8,

                    repositoryUrl:
                      null,
                  },
                }),
              };
            }

            if (
              url.includes(
                "/development-updates"
              )
            ) {
              return {
                ok: true,

                json: async () => ({
                  success: true,
                  updates: [],
                }),
              };
            }

            if (
              url.includes(
                "/assistance-requests"
              )
            ) {
              return {
                ok: true,

                json: async () => ({
                  success: true,
                  requests: [],
                }),
              };
            }

            if (
              url.endsWith(
                "/members"
              )
            ) {
              return {
                ok: true,

                json: async () => ({
                  success: true,

                  members: [
                    {
                      membershipId:
                        "accessibility-membership-1",

                      userId:
                        "accessibility-test-user",

                      displayName:
                        "Test Student",

                      memberRole:
                        "LEAD",

                      positionTitle:
                        null,
                    },
                  ],
                }),
              };
            }

            if (
              url.includes(
                "/tasks"
              )
            ) {
              return {
                ok: true,

                json: async () => ({
                  success: true,
                  tasks: [],
                }),
              };
            }

            if (
              url.includes(
                "/milestones"
              )
            ) {
              return {
                ok: true,

                json: async () => ({
                  success: true,
                  milestones: [],
                }),
              };
            }

            return {
              ok: true,

              json: async () => ({}),
            };
          }
        );

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name:
          "Accessibility Test Project",
      });

      await screen.findByText(
        "No milestones have been created for this project yet."
      );

      await screen.findByText(
        "Create a milestone before adding project tasks."
      );

      await screen.findByText(
        "No development updates have been posted yet."
      );

      await screen.findByText(
        "No open assistance requests."
      );

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check the Pit Wall workload and team-health feedback page.
   */
  test(
    "Pit Wall page has no detectable accessibility violations",
    async () => {
      setAuthenticatedStudent();

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "Dashboard",
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Pit Wall",
        })
      );

      await screen.findByRole("heading", {
        name: "Pit Wall",
      });

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check the public project showcase while the user is logged in.
   */
  test(
    "project showcase has no detectable accessibility violations",
    async () => {
      setAuthenticatedStudent();

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "Dashboard",
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Showcase",
        })
      );

      await screen.findByRole("heading", {
        name: "Project Showcase",
      });

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check the Mentor Portal using an approved Mentor account.
   *
   * The Portal normally loads eligible Mentor projects from the
   * backend. An empty controlled response keeps the accessibility
   * audit independent from the API server.
   */
  test(
    "mentor portal has no detectable accessibility violations",
    async () => {
      setAuthenticatedMentor();

      sessionStorage.setItem(
        "projectforge-active-page",
        "mentor"
      );

      vi.spyOn(global, "fetch")
        .mockImplementation(
          async request => {
            const url =
              String(request);

            if (
              url ===
              "/api/mentor/projects"
            ) {
              return {
                ok: true,

                json: async () => ({
                  projects: [],
                }),
              };
            }

            return {
              ok: true,

              json: async () => ({}),
            };
          }
        );

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "Mentor Portal",
      });

      expect(
        screen.getByRole("button", {
          name: "Mentor",
        })
      ).toBeInTheDocument();

      /*
       * This also guards PF-SHOW-04 at the navigation layer:
       * approved Mentors must not receive the Pit Wall control.
       */
      expect(
        screen.queryByRole("button", {
          name: "Pit Wall",
        })
      ).not.toBeInTheDocument();

      await screen.findByText(
        "No active projects currently permit Mentor participation."
      );

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check the student profile page.
   *
   * ProfileEdit normally gets its data from the backend.
   * A controlled response is used so this test does not
   * depend on the API server being available.
   */
  test(
    "student profile page has no detectable accessibility violations",
    async () => {
      setAuthenticatedStudent();

      vi.spyOn(global, "fetch")
        .mockResolvedValue({
          ok: true,

          json: async () => ({
            data: {
              display_name:
                "Test Student",

              bio:
                "Engineering student",

              interests: [
                "Software",
                "Robotics",
              ],

              availability_hours_per_week:
                8,

              skills: [],
            },
          }),
        });

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "Dashboard",
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Profile",
        })
      );

      await screen.findByRole("heading", {
        name:
          "Student Profile & Skills Management",
      });

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );


  /**
   * Check the administrator moderation page.
   *
   * AdminDashboard normally loads its moderation,
   * Showcase and Mentor-application queues from the backend.
   * Controlled empty responses allow the loaded Admin screen
   * to be checked without requiring the API server.
   */
  test(
    "admin dashboard has no detectable accessibility violations",
    async () => {
      setAuthenticatedAdmin();

      vi.spyOn(global, "fetch")
        .mockImplementation(
          async request => {
            const url =
              String(request);

            if (
              url ===
              "/api/admin/reports"
            ) {
              return {
                ok: true,

                json: async () => ({
                  reports: [],
                }),
              };
            }

            if (
              url ===
              "/api/showcase/admin/pending"
            ) {
              return {
                ok: true,

                json: async () => ({
                  submissions: [],
                }),
              };
            }

            if (
              url ===
              "/api/admin/mentor-applications"
            ) {
              return {
                ok: true,

                json: async () => ({
                  applications: [],
                }),
              };
            }

            return {
              ok: true,

              json: async () => ({}),
            };
          }
        );

      const { container } =
        renderProjectForge();

      await screen.findByRole("heading", {
        name: "Dashboard",
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Admin",
        })
      );

      await screen.findByRole("heading", {
        name: "Administration",
      });

      await screen.findByText(
        "No active reports."
      );

      await screen.findByText(
        "No showcase submissions awaiting approval."
      );

      await screen.findByText(
        "No Mentor applications awaiting approval."
      );

      const results =
        await axe(container);

      expect(results).toHaveNoViolations();
    }
  );

});