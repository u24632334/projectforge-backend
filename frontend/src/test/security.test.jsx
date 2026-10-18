import React from "react";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import App from "../App.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";


/**
 * PFG-88 / Frontend XSS Security Audit
 *
 * These tests verify how ProjectForge behaves when user-controlled
 * text contains common cross-site scripting payloads.
 *
 * The objective is not only to search the source code for unsafe
 * rendering APIs, but also to prove at runtime that hostile text
 * cannot create executable script or HTML elements in the DOM.
 *
 * API-dependent screens use controlled responses so these security
 * tests can run independently from the backend.
 */
describe(
  "ProjectForge frontend XSS protection",
  () => {

    /**
     * Start every test with an isolated authentication state.
     * This prevents data stored by one scenario from affecting another.
     */
    beforeEach(() => {
      sessionStorage.clear();

      vi.restoreAllMocks();
    });


    /**
     * Restore mocked browser/API functions after each scenario.
     */
    afterEach(() => {
      vi.restoreAllMocks();
    });


    /**
     * Creates the student authentication state required to open
     * authenticated ProjectForge pages.
     */
    function setAuthenticatedStudent() {
      sessionStorage.setItem(
        "token",
        "security-test-token"
      );

      sessionStorage.setItem(
        "user",
        JSON.stringify({
          id:
            "security-test-user",

          email:
            "student@projectforge.local",

          role:
            "STUDENT",
        })
      );
    }


    /**
     * Creates an administrator authentication state so the
     * moderation dashboard can be security-tested independently.
     */
    function setAuthenticatedAdmin() {
      sessionStorage.setItem(
        "token",
        "security-admin-token"
      );

      sessionStorage.setItem(
        "user",
        JSON.stringify({
          id:
            "security-admin-user",

          email:
            "admin@projectforge.local",

          role:
            "ADMIN",
        })
      );
    }


    /**
     * Render ProjectForge with the same AuthProvider used by
     * the real frontend.
     */
    function renderProjectForge() {
      return render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );
    }


    /**
     * A malicious project description must remain inert text.
     *
     * In particular, a value containing an image with an onerror
     * handler must never cause an actual injected <img> element
     * to appear in the rendered ProjectForge document.
     */
    test(
      "malicious project description cannot inject executable HTML",
      async () => {

        setAuthenticatedStudent();


        const maliciousDescription =
          '<img src="x" onerror="alert(1)">Malicious Project';


        /*
         * Both Dashboard and Discover load project information.
         *
         * Use the current camelCase API fields required by Dashboard,
         * while still returning deliberately hostile text so the
         * rendering boundary is tested.
         */
        vi.spyOn(
          global,
          "fetch"
        ).mockImplementation(
          async request => {

            const url =
              String(request);


            if (
              url ===
              "/api/projects/mine"
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    projects: [
                      {
                        projectId:
                          "security-project-1",

                        title:
                          "Security Test Project",

                        description:
                          maliciousDescription,

                        category:
                          "Security",

                        status:
                          "ACTIVE",

                        expectedHoursPerWeek:
                          5,

                        memberRole:
                          "MEMBER",
                      },
                    ],
                  }),
              };
            }


            if (
              url.startsWith(
                "/api/projects/security-project-1/tasks"
              )
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    tasks: [],
                  }),
              };
            }


            if (
              url.startsWith(
                "/api/projects/security-project-1/milestones"
              )
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    milestones: [],
                  }),
              };
            }


            if (
              url.startsWith(
                "/api/projects"
              )
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    projects: [
                      {
                        projectId:
                          "security-project-1",

                        project_id:
                          "security-project-1",

                        title:
                          "Security Test Project",

                        description:
                          maliciousDescription,

                        category:
                          "Security",

                        status:
                          "ACTIVE",

                        expectedHoursPerWeek:
                          5,

                        expected_hours_per_week:
                          5,

                        positions: [],
                      },
                    ],
                  }),
              };
            }


            return {
              ok:
                true,

              json:
                async () => ({}),
            };
          }
        );


        const {
          container
        } =
          renderProjectForge();


        await screen.findByRole(
          "heading",
          {
            name:
              "Dashboard",
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Discover",
            }
          )
        );


        await screen.findByRole(
          "heading",
          {
            name:
              "Discover Projects",
          }
        );


        await waitFor(() => {

          /*
           * If hostile text had been inserted as executable HTML,
           * an IMG element would exist in the document.
           */
          expect(
            container.querySelector(
              "img[src='x']"
            )
          ).toBeNull();

        });


        /*
         * The application must also never insert a script element
         * originating from API-provided project content.
         */
        expect(
          container.querySelector(
            "script"
          )
        ).toBeNull();
      }
    );


    /**
     * Profile data comes from users and is therefore untrusted.
     *
     * This scenario checks multiple hostile profile fields at once,
     * including script and event-handler payloads returned by the API.
     */
    test(
      "malicious profile data cannot create script or injected HTML elements",
      async () => {

        setAuthenticatedStudent();


        vi.spyOn(
          global,
          "fetch"
        ).mockResolvedValue({
          ok:
            true,

          json:
            async () => ({
              data: {
                display_name:
                  '<script>alert("name")</script>Test Student',

                bio:
                  '<img src="x" onerror="alert(2)">Engineering student',

                interests: [
                  '<script>alert("interest")</script>Software',
                  "Robotics",
                ],

                availability_hours_per_week:
                  8,

                skills: [
                  {
                    /*
                     * ProfileEdit uses skill_id as the React list key.
                     * Include a realistic identifier so the security
                     * fixture matches the normal API data structure.
                     */
                    skill_id:
                      "security-skill-1",

                    name:
                      '<img src="x" onerror="alert(3)">JavaScript',

                    proficiency:
                      '<script>alert("skill")</script>ADVANCED',
                  },
                ],
              },
            }),
        });


        const {
          container
        } =
          renderProjectForge();


        await screen.findByRole(
          "heading",
          {
            name:
              "Dashboard",
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Profile",
            }
          )
        );


        await screen.findByRole(
          "heading",
          {
            name:
              "Student Profile & Skills Management",
          }
        );


        /*
         * Hostile values returned by the API must not become
         * executable DOM nodes.
         */
        expect(
          container.querySelector(
            "script"
          )
        ).toBeNull();


        expect(
          container.querySelector(
            "img[src='x']"
          )
        ).toBeNull();
      }
    );


    /**
     * Moderation reports contain user-submitted reason text.
     *
     * This is especially important because administrators may review
     * content submitted by other users, making the moderation screen
     * a potential stored-XSS target if hostile report content were
     * rendered unsafely.
     */
    test(
      "malicious moderation reason cannot inject executable HTML",
      async () => {

        setAuthenticatedAdmin();


        const maliciousReason =
          '<img src="x" onerror="alert(4)"><script>alert("report")</script>Report reason';


        /*
         * AdminDashboard currently loads three independent queues:
         * reports, Showcase submissions and Mentor applications.
         */
        vi.spyOn(
          global,
          "fetch"
        ).mockImplementation(
          async request => {

            const url =
              String(request);


            if (
              url ===
              "/api/projects/mine"
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    projects: [],
                  }),
              };
            }


            if (
              url ===
              "/api/admin/reports"
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    reports: [
                      {
                        report_id:
                          "security-report-1",

                        status:
                          "PENDING",

                        reporter_user_id:
                          "reporter-1",

                        reported_user_id:
                          "reported-user-1",

                        reported_project_id:
                          null,

                        reason:
                          maliciousReason,

                        created_at:
                          "2026-09-26T10:00:00.000Z",
                      },
                    ],
                  }),
              };
            }


            if (
              url ===
              "/api/showcase/admin/pending"
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    submissions: [],
                  }),
              };
            }


            if (
              url ===
              "/api/admin/mentor-applications"
            ) {
              return {
                ok:
                  true,

                json:
                  async () => ({
                    applications: [],
                  }),
              };
            }


            return {
              ok:
                true,

              json:
                async () => ({}),
            };
          }
        );


        const {
          container
        } =
          renderProjectForge();


        await screen.findByRole(
          "heading",
          {
            name:
              "Dashboard",
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Admin",
            }
          )
        );


        await screen.findByRole(
          "heading",
          {
            name:
              "Administration",
          }
        );


        await screen.findByText(
          /Report reason/i
        );


        /*
         * A stored report is untrusted user content.
         * Neither of the hostile tags may become live DOM elements.
         */
        expect(
          container.querySelector(
            "script"
          )
        ).toBeNull();


        expect(
          container.querySelector(
            "img[src='x']"
          )
        ).toBeNull();
      }
    );


    /**
     * The profile form is also an input boundary.
     *
     * This scenario verifies that hostile user-entered text does not
     * create executable DOM content while the form is being edited.
     */
    test(
      "hostile text entered into the profile form remains inert",
      async () => {

        setAuthenticatedStudent();


        vi.spyOn(
          global,
          "fetch"
        ).mockResolvedValue({
          ok:
            true,

          json:
            async () => ({
              data: {
                display_name:
                  "Test Student",

                bio:
                  "Engineering student",

                interests:
                  [],

                availability_hours_per_week:
                  8,

                skills:
                  [],
              },
            }),
        });


        const {
          container
        } =
          renderProjectForge();


        await screen.findByRole(
          "heading",
          {
            name:
              "Dashboard",
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Profile",
            }
          )
        );


        await screen.findByRole(
          "heading",
          {
            name:
              "Student Profile & Skills Management",
          }
        );


        const maliciousValue =
          '<img src="x" onerror="alert(5)">';


        /*
         * Locate the profile bio textarea and enter exactly the type
         * of hostile text a user could submit through the browser.
         */
        const textareas =
          screen.getAllByRole(
            "textbox"
          );


        const bioField =
          textareas.find(
            element =>
              element.tagName ===
              "TEXTAREA"
          );


        expect(
          bioField
        ).toBeDefined();


        fireEvent.change(
          bioField,
          {
            target: {
              value:
                maliciousValue,
            },
          }
        );


        /*
         * User input may exist as a string inside the form control,
         * but it must never become executable HTML in the page.
         */
        expect(
          container.querySelector(
            "img[src='x']"
          )
        ).toBeNull();


        expect(
          container.querySelector(
            "script"
          )
        ).toBeNull();
      }
    );

  }
);