import {
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  test,
  vi
} from "vitest";


vi.mock(
  "../context/AuthContext",
  () => ({
    useAuth:
      vi.fn()
  })
);


import {
  useAuth
} from "../context/AuthContext";

import PublicShowcase from "./PublicShowcase";


const SHOWCASE_PROJECT = {
  showcase_id:
    "showcase-1",

  project_id:
    "project-1",

  title:
    "Solar Tracker",

  description:
    "A completed solar tracking platform.",

  category:
    "Control",

  participants: [
    {
      userId:
        "student-2",

      name:
        "Alex Student"
    },

    {
      userId:
        "student-3",

      name:
        "Sam Student"
    }
  ]
};


function successfulJsonResponse(
  data
) {
  return {
    ok:
      true,

    json:
      async () =>
        data
  };
}


function authenticateStudent(
  userId = "student-1"
) {
  useAuth.mockReturnValue({
    user: {
      id:
        userId,

      email:
        "student@test.com",

      role:
        "STUDENT"
    },

    token:
      "student-token"
  });
}


describe(
  "PublicShowcase",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();


      useAuth.mockReturnValue({
        user:
          null,

        token:
          null
      });


      global.fetch =
        vi.fn();
    });


    test(
      "loads public projects without an authentication header",
      async () => {
        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              SHOWCASE_PROJECT
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        expect(
          screen.getByText(
            "Loading showcase..."
          )
        ).toBeInTheDocument();


        expect(
          await screen.findByText(
            "Solar Tracker"
          )
        ).toBeInTheDocument();


        expect(
          fetch
        ).toHaveBeenCalledWith(
          "/api/showcase"
        );
      }
    );


    test(
      "shows project descriptions and participant lists",
      async () => {
        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              SHOWCASE_PROJECT
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        expect(
          await screen.findByText(
            "A completed solar tracking platform."
          )
        ).toBeInTheDocument();


        expect(
          screen.getByText(
            "Alex Student"
          )
        ).toBeInTheDocument();


        expect(
          screen.getByText(
            "Sam Student"
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "continues to display legacy string participant values",
      async () => {
        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              {
                ...SHOWCASE_PROJECT,

                participants: [
                  "Legacy Student"
                ]
              }
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        expect(
          await screen.findByText(
            "Legacy Student"
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "shows the empty state when no projects are published",
      async () => {
        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: []
          })
        );


        render(
          <PublicShowcase />
        );


        expect(
          await screen.findByText(
            "No completed projects have been published yet."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "shows a public API loading error",
      async () => {
        fetch.mockResolvedValueOnce({
          ok:
            false,

          json:
            async () => ({
              error:
                "Showcase temporarily unavailable."
            })
        });


        render(
          <PublicShowcase />
        );


        expect(
          await screen.findByRole(
            "alert"
          )
        ).toHaveTextContent(
          "Showcase temporarily unavailable."
        );
      }
    );


    test(
      "renders user-controlled project and participant text as sanitised text",
      async () => {
        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              {
                ...SHOWCASE_PROJECT,

                title:
                  "<script>alert('x')</script>Safe Project",

                description:
                  "<b>Completed</b> description",

                participants: [
                  {
                    userId:
                      "student-2",

                    name:
                      "<script>alert('participant')</script>Safe Student"
                  }
                ]
              }
            ]
          })
        );


        const {
          container
        } =
          render(
            <PublicShowcase />
          );


        await waitFor(() => {
          expect(
            screen.getByText(
              "Safe Project"
            )
          ).toBeInTheDocument();
        });


        expect(
          screen.getByText(
            "Safe Student"
          )
        ).toBeInTheDocument();


        expect(
          container.querySelector(
            "script"
          )
        ).toBeNull();


        expect(
          container.querySelector(
            "b"
          )
        ).toBeNull();
      }
    );


    test(
      "does not show report controls to logged-out visitors",
      async () => {
        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              SHOWCASE_PROJECT
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        await screen.findByText(
          "Solar Tracker"
        );


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Report Project"
            }
          )
        ).not.toBeInTheDocument();


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Report Alex Student from Solar Tracker"
            }
          )
        ).not.toBeInTheDocument();
      }
    );


    test(
      "shows project and user report controls to authenticated users",
      async () => {
        authenticateStudent();


        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              SHOWCASE_PROJECT
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        expect(
          await screen.findByRole(
            "button",
            {
              name:
                "Report Project"
            }
          )
        ).toBeInTheDocument();


        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Report Alex Student from Solar Tracker"
            }
          )
        ).toBeInTheDocument();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Report Project"
            }
          )
        );


        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Report Solar Tracker"
            }
          )
        ).toBeInTheDocument();


        expect(
          screen.getByLabelText(
            "Reason"
          )
        ).toBeInTheDocument();


        expect(
          screen.getByLabelText(
            "Supporting information"
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "does not allow a logged-in user to report themselves",
      async () => {
        authenticateStudent(
          "student-2"
        );


        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              SHOWCASE_PROJECT
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        await screen.findByText(
          "Alex Student"
        );


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Report Alex Student from Solar Tracker"
            }
          )
        ).not.toBeInTheDocument();


        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Report Sam Student from Solar Tracker"
            }
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "submits a project report through the moderation API",
      async () => {
        authenticateStudent();


        fetch.mockImplementation(
          async (
            url,
            options = {}
          ) => {
            if (
              url ===
              "/api/showcase"
            ) {
              return successfulJsonResponse({
                projects: [
                  SHOWCASE_PROJECT
                ]
              });
            }


            if (
              url ===
                "/api/reports" &&
              options.method ===
                "POST"
            ) {
              return successfulJsonResponse({
                message:
                  "Report submitted successfully.",

                report: {
                  report_id:
                    "report-1",

                  reported_project_id:
                    "project-1",

                  status:
                    "PENDING"
                }
              });
            }


            throw new Error(
              `Unexpected request: ${url}`
            );
          }
        );


        render(
          <PublicShowcase />
        );


        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "Report Project"
            }
          )
        );


        fireEvent.change(
          screen.getByLabelText(
            "Reason"
          ),
          {
            target: {
              value:
                "Misleading content"
            }
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "Supporting information"
          ),
          {
            target: {
              value:
                "Browser moderation test."
            }
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Submit Report"
            }
          )
        );


        await waitFor(() => {
          expect(
            fetch
          ).toHaveBeenCalledWith(
            "/api/reports",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  "Bearer student-token"
              },

              body:
                JSON.stringify({
                  reportedProjectId:
                    "project-1",

                  reason:
                    "Misleading content: Browser moderation test."
                })
            }
          );
        });


        expect(
          await screen.findByRole(
            "status"
          )
        ).toHaveTextContent(
          "Report submitted successfully."
        );
      }
    );


    test(
      "submits a user report through the moderation API",
      async () => {
        authenticateStudent();


        fetch.mockImplementation(
          async (
            url,
            options = {}
          ) => {
            if (
              url ===
              "/api/showcase"
            ) {
              return successfulJsonResponse({
                projects: [
                  SHOWCASE_PROJECT
                ]
              });
            }


            if (
              url ===
                "/api/reports" &&
              options.method ===
                "POST"
            ) {
              return successfulJsonResponse({
                message:
                  "Report submitted successfully.",

                report: {
                  report_id:
                    "report-user-1",

                  reported_user_id:
                    "student-2",

                  reported_project_id:
                    null,

                  status:
                    "PENDING"
                }
              });
            }


            throw new Error(
              `Unexpected request: ${url}`
            );
          }
        );


        render(
          <PublicShowcase />
        );


        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "Report Alex Student from Solar Tracker"
            }
          )
        );


        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Report Alex Student"
            }
          )
        ).toBeInTheDocument();


        fireEvent.change(
          screen.getByLabelText(
            "Reason"
          ),
          {
            target: {
              value:
                "Harassment or abuse"
            }
          }
        );


        fireEvent.change(
          screen.getByLabelText(
            "Supporting information"
          ),
          {
            target: {
              value:
                "Demo user moderation test."
            }
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Submit Report"
            }
          )
        );


        await waitFor(() => {
          expect(
            fetch
          ).toHaveBeenCalledWith(
            "/api/reports",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  "Bearer student-token"
              },

              body:
                JSON.stringify({
                  reportedUserId:
                    "student-2",

                  reason:
                    "Harassment or abuse: Demo user moderation test."
                })
            }
          );
        });


        expect(
          await screen.findByRole(
            "status"
          )
        ).toHaveTextContent(
          "Report submitted successfully."
        );
      }
    );


    test(
      "does not submit a report without supporting information",
      async () => {
        authenticateStudent();


        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              SHOWCASE_PROJECT
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name:
                "Report Project"
            }
          )
        );


        fireEvent.submit(
          screen
            .getByRole(
              "button",
              {
                name:
                  "Submit Report"
              }
            )
            .closest(
              "form"
            )
        );


        expect(
          await screen.findByRole(
            "alert"
          )
        ).toHaveTextContent(
          "Please provide supporting information."
        );


        expect(
          fetch
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    test(
      "opens a repeated participant report on only the selected project card",
      async () => {
        authenticateStudent();


        const repeatedParticipant = {
          userId:
            "student-2",

          name:
            "Final Test User"
        };


        fetch.mockResolvedValueOnce(
          successfulJsonResponse({
            projects: [
              {
                ...SHOWCASE_PROJECT,

                project_id:
                  "project-1",

                title:
                  "Updated",

                participants: [
                  repeatedParticipant
                ]
              },

              {
                ...SHOWCASE_PROJECT,

                showcase_id:
                  "showcase-2",

                project_id:
                  "project-2",

                title:
                  "Completion Browser Test",

                participants: [
                  repeatedParticipant
                ]
              }
            ]
          })
        );


        render(
          <PublicShowcase />
        );


        const firstReportButton =
          await screen.findByRole(
            "button",
            {
              name:
                "Report Final Test User from Updated"
            }
          );


        fireEvent.click(
          firstReportButton
        );


        expect(
          screen.getAllByRole(
            "heading",
            {
              name:
                "Report Final Test User"
            }
          )
        ).toHaveLength(
          1
        );


        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Report Final Test User from Completion Browser Test"
            }
          )
        ).toHaveTextContent(
          "Report User"
        );


        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Report Final Test User from Updated"
            }
          )
        ).toHaveTextContent(
          "Cancel Report"
        );
      }
    );
  }
);