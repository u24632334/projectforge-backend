import React from "react";

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
  it,
  vi
} from "vitest";

import MentorGuidancePanel
  from "./MentorGuidancePanel";


let authValue;


vi.mock(
  "../context/AuthContext",
  () => ({
    useAuth: () =>
      authValue
  })
);


describe(
  "MentorGuidancePanel",
  () => {

    beforeEach(() => {

      authValue = {
        token:
          "mentor-token",

        user: {
          id:
            "mentor-1",

          role:
            "MENTOR"
        }
      };


      global.fetch =
        vi.fn();
    });


    it(
      "loads and displays existing Mentor guidance",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            true,

          json:
            async () => ({
              guidance: [
                {
                  guidanceId:
                    "guidance-1",

                  guidance:
                    "Add another integration test.",

                  mentorName:
                    "Dr Mentor",

                  mentorUserId:
                    "mentor-2",

                  assignmentStatus:
                    "ACTIVE",

                  createdAt:
                    "2026-10-08T10:00:00.000Z"
                }
              ]
            })
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
            projectTitle="Autonomous Rover"
          />
        );


        expect(
          await screen.findByText(
            "Add another integration test."
          )
        ).toBeInTheDocument();


        expect(
          screen.getByText(
            "Dr Mentor"
          )
        ).toBeInTheDocument();


        expect(
          screen.getByText(
            /Mentor Guidance — Autonomous Rover/i
          )
        ).toBeInTheDocument();


        expect(
          fetch
        ).toHaveBeenCalledWith(
          "/api/projects/project-1/guidance",
          {
            headers: {
              Authorization:
                "Bearer mentor-token"
            }
          }
        );
      }
    );


    it(
      "supports legacy snake_case guidance response fields",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            true,

          json:
            async () => ({
              guidance: [
                {
                  guidance_id:
                    "guidance-legacy",

                  guidance:
                    "Legacy guidance remains visible.",

                  mentor_name:
                    "Legacy Mentor",

                  mentor_user_id:
                    "mentor-2",

                  assignment_status:
                    "ENDED",

                  created_at:
                    "2026-10-07T10:00:00.000Z"
                }
              ]
            })
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          await screen.findByText(
            "Legacy guidance remains visible."
          )
        ).toBeInTheDocument();


        expect(
          screen.getByText(
            "Legacy Mentor"
          )
        ).toBeInTheDocument();
      }
    );


    it(
      "submits new guidance and reloads the canonical server list",
      async () => {

        fetch
          .mockResolvedValueOnce({
            ok:
              true,

            json:
              async () => ({
                guidance: []
              })
          })

          .mockResolvedValueOnce({
            ok:
              true,

            json:
              async () => ({
                message:
                  "Guidance submitted successfully.",

                guidance: {
                  guidanceId:
                    "guidance-2",

                  guidance:
                    "Review the sensor calibration."
                }
              })
          })

          .mockResolvedValueOnce({
            ok:
              true,

            json:
              async () => ({
                guidance: [
                  {
                    guidanceId:
                      "guidance-2",

                    guidance:
                      "Review the sensor calibration.",

                    mentorName:
                      "Mentor",

                    mentorUserId:
                      "mentor-1",

                    assignmentStatus:
                      "ACTIVE"
                  }
                ]
              })
          });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        await waitFor(
          () =>
            expect(
              fetch
            ).toHaveBeenCalledTimes(
              1
            )
        );


        fireEvent.change(
          screen.getByLabelText(
            "New Guidance"
          ),
          {
            target: {
              value:
                "  Review the sensor calibration.  "
            }
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Submit Guidance"
            }
          )
        );


        await waitFor(
          () =>
            expect(
              fetch
            ).toHaveBeenCalledTimes(
              3
            )
        );


        expect(
          fetch.mock.calls[1]
        ).toEqual([
          "/api/projects/project-1/guidance",
          {
            method:
              "POST",

            headers: {
              Authorization:
                "Bearer mentor-token",

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                guidance:
                  "Review the sensor calibration."
              })
          }
        ]);


        expect(
          fetch.mock.calls[2]
        ).toEqual([
          "/api/projects/project-1/guidance",
          {
            headers: {
              Authorization:
                "Bearer mentor-token"
            }
          }
        ]);


        expect(
          await screen.findByText(
            "Review the sensor calibration."
          )
        ).toBeInTheDocument();


        expect(
          screen.getByText(
            "Guidance submitted successfully."
          )
        ).toBeInTheDocument();


        expect(
          screen.getByLabelText(
            "New Guidance"
          )
        ).toHaveValue("");
      }
    );


    it(
      "prevents blank guidance from being submitted",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            true,

          json:
            async () => ({
              guidance: []
            })
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        await waitFor(
          () =>
            expect(
              fetch
            ).toHaveBeenCalledTimes(
              1
            )
        );


        const submitButton =
          screen.getByRole(
            "button",
            {
              name:
                "Submit Guidance"
            }
          );


        expect(
          submitButton
        ).toBeDisabled();


        fireEvent.change(
          screen.getByLabelText(
            "New Guidance"
          ),
          {
            target: {
              value:
                "   "
            }
          }
        );


        expect(
          submitButton
        ).toBeDisabled();


        fireEvent.click(
          submitButton
        );


        expect(
          fetch
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    it(
      "retains oversized guidance, shows an error and blocks submission",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            true,

          json:
            async () => ({
              guidance: []
            })
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        await waitFor(
          () =>
            expect(
              fetch
            ).toHaveBeenCalledTimes(
              1
            )
        );


        const textarea =
          screen.getByLabelText(
            "New Guidance"
          );


        const oversizedGuidance =
          "A".repeat(
            1001
          );


        fireEvent.change(
          textarea,
          {
            target: {
              value:
                oversizedGuidance
            }
          }
        );


        expect(
          textarea
        ).toHaveValue(
          oversizedGuidance
        );


        expect(
          textarea
        ).not.toHaveAttribute(
          "maxLength"
        );


        expect(
          await screen.findByText(
            "Maximum characters exceeded. Guidance may not exceed 1000 characters."
          )
        ).toBeInTheDocument();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Submit Guidance"
            }
          )
        );


        await waitFor(
          () =>
            expect(
              fetch
            ).toHaveBeenCalledTimes(
              1
            )
        );


        expect(
          textarea
        ).toHaveValue(
          oversizedGuidance
        );
      }
    );


    it(
      "shows an API loading error",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            false,

          json:
            async () => ({
              error:
                "Project not found."
            })
        });


        render(
          <MentorGuidancePanel
            projectId="missing-project"
          />
        );


        expect(
          await screen.findByText(
            "Project not found."
          )
        ).toBeInTheDocument();


        expect(
          screen.getByRole(
            "alert"
          )
        ).toBeInTheDocument();
      }
    );


    it(
      "handles a non-JSON server error without crashing",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            false,

          json:
            async () => {
              throw new Error(
                "Invalid JSON"
              );
            }
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          await screen.findByText(
            "Could not load Mentor guidance."
          )
        ).toBeInTheDocument();
      }
    );


    it(
      "allows a Student project member to read guidance but hides Mentor controls",
      async () => {

        authValue = {
          token:
            "student-token",

          user: {
            id:
              "student-1",

            role:
              "STUDENT"
          }
        };


        fetch.mockResolvedValueOnce({
          ok:
            true,

          json:
            async () => ({
              guidance: [
                {
                  guidanceId:
                    "guidance-1",

                  guidance:
                    "Please review the final design.",

                  mentorName:
                    "Dr Mentor",

                  mentorUserId:
                    "mentor-1",

                  assignmentStatus:
                    "ACTIVE"
                }
              ]
            })
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          await screen.findByText(
            "Please review the final design."
          )
        ).toBeInTheDocument();


        expect(
          fetch
        ).toHaveBeenCalledWith(
          "/api/projects/project-1/guidance",
          {
            headers: {
              Authorization:
                "Bearer student-token"
            }
          }
        );


        expect(
          screen.queryByLabelText(
            "New Guidance"
          )
        ).not.toBeInTheDocument();


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Submit Guidance"
            }
          )
        ).not.toBeInTheDocument();


        expect(
          screen.queryByRole(
            "button",
            {
              name:
                "Edit Guidance"
            }
          )
        ).not.toBeInTheDocument();
      }
    );


    it(
      "shows Edit Guidance only for the owning Mentor with an ACTIVE assignment",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            true,

          json:
            async () => ({
              guidance: [
                {
                  guidanceId:
                    "guidance-own",

                  guidance:
                    "My current guidance.",

                  mentorName:
                    "Current Mentor",

                  mentorUserId:
                    "mentor-1",

                  assignmentStatus:
                    "ACTIVE"
                },

                {
                  guidanceId:
                    "guidance-other",

                  guidance:
                    "Another Mentor's guidance.",

                  mentorName:
                    "Other Mentor",

                  mentorUserId:
                    "mentor-2",

                  assignmentStatus:
                    "ACTIVE"
                },

                {
                  guidanceId:
                    "guidance-ended",

                  guidance:
                    "Historical guidance.",

                  mentorName:
                    "Current Mentor",

                  mentorUserId:
                    "mentor-1",

                  assignmentStatus:
                    "ENDED"
                }
              ]
            })
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          await screen.findByText(
            "My current guidance."
          )
        ).toBeInTheDocument();


        expect(
          screen.getAllByRole(
            "button",
            {
              name:
                "Edit Guidance"
            }
          )
        ).toHaveLength(
          1
        );
      }
    );


    it(
      "edits owned guidance and reloads the guidance list",
      async () => {

        fetch
          .mockResolvedValueOnce({
            ok:
              true,

            json:
              async () => ({
                guidance: [
                  {
                    guidanceId:
                      "guidance-1",

                    guidance:
                      "Original guidance.",

                    mentorName:
                      "Current Mentor",

                    mentorUserId:
                      "mentor-1",

                    assignmentStatus:
                      "ACTIVE"
                  }
                ]
              })
          })

          .mockResolvedValueOnce({
            ok:
              true,

            json:
              async () => ({
                message:
                  "Guidance updated successfully.",

                guidance: {
                  guidanceId:
                    "guidance-1",

                  guidance:
                    "Updated guidance."
                }
              })
          })

          .mockResolvedValueOnce({
            ok:
              true,

            json:
              async () => ({
                guidance: [
                  {
                    guidanceId:
                      "guidance-1",

                    guidance:
                      "Updated guidance.",

                    mentorName:
                      "Current Mentor",

                    mentorUserId:
                      "mentor-1",

                    assignmentStatus:
                      "ACTIVE"
                  }
                ]
              })
          });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          await screen.findByText(
            "Original guidance."
          )
        ).toBeInTheDocument();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Edit Guidance"
            }
          )
        );


        const editTextarea =
          screen.getByLabelText(
            "Edit Guidance"
          );


        expect(
          editTextarea
        ).toHaveValue(
          "Original guidance."
        );


        fireEvent.change(
          editTextarea,
          {
            target: {
              value:
                "  Updated guidance.  "
            }
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Save Guidance"
            }
          )
        );


        await waitFor(
          () =>
            expect(
              fetch
            ).toHaveBeenCalledTimes(
              3
            )
        );


        expect(
          fetch.mock.calls[1]
        ).toEqual([
          "/api/projects/project-1/guidance/guidance-1",
          {
            method:
              "PATCH",

            headers: {
              Authorization:
                "Bearer mentor-token",

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                guidance:
                  "Updated guidance."
              })
          }
        ]);


        expect(
          await screen.findByText(
            "Updated guidance."
          )
        ).toBeInTheDocument();


        expect(
          screen.getByText(
            "Guidance updated successfully."
          )
        ).toBeInTheDocument();
      }
    );


    it(
      "cancels an edit without sending a PATCH request",
      async () => {

        fetch.mockResolvedValueOnce({
          ok:
            true,

          json:
            async () => ({
              guidance: [
                {
                  guidanceId:
                    "guidance-1",

                  guidance:
                    "Original guidance.",

                  mentorName:
                    "Current Mentor",

                  mentorUserId:
                    "mentor-1",

                  assignmentStatus:
                    "ACTIVE"
                }
              ]
            })
        });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          await screen.findByText(
            "Original guidance."
          )
        ).toBeInTheDocument();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Edit Guidance"
            }
          )
        );


        fireEvent.change(
          screen.getByLabelText(
            "Edit Guidance"
          ),
          {
            target: {
              value:
                "Changed locally."
            }
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Cancel"
            }
          )
        );


        expect(
          screen.queryByLabelText(
            "Edit Guidance"
          )
        ).not.toBeInTheDocument();


        expect(
          screen.getByText(
            "Original guidance."
          )
        ).toBeInTheDocument();


        expect(
          fetch
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    it(
      "shows an edit API error without replacing the existing guidance",
      async () => {

        fetch
          .mockResolvedValueOnce({
            ok:
              true,

            json:
              async () => ({
                guidance: [
                  {
                    guidanceId:
                      "guidance-1",

                    guidance:
                      "Original guidance.",

                    mentorName:
                      "Current Mentor",

                    mentorUserId:
                      "mentor-1",

                    assignmentStatus:
                      "ACTIVE"
                  }
                ]
              })
          })

          .mockResolvedValueOnce({
            ok:
              false,

            json:
              async () => ({
                error:
                  "Guidance can only be edited while the Mentor assignment is active."
              })
          });


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          await screen.findByText(
            "Original guidance."
          )
        ).toBeInTheDocument();


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Edit Guidance"
            }
          )
        );


        fireEvent.change(
          screen.getByLabelText(
            "Edit Guidance"
          ),
          {
            target: {
              value:
                "Updated text."
            }
          }
        );


        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Save Guidance"
            }
          )
        );


        expect(
          await screen.findByText(
            "Guidance can only be edited while the Mentor assignment is active."
          )
        ).toBeInTheDocument();


        expect(
          fetch
        ).toHaveBeenCalledTimes(
          2
        );
      }
    );


    it(
      "does not load guidance when no project is selected",
      () => {

        render(
          <MentorGuidancePanel
            projectId=""
          />
        );


        expect(
          screen.getByText(
            "Select a project to view Mentor guidance."
          )
        ).toBeInTheDocument();


        expect(
          fetch
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "requires authentication before guidance can be loaded",
      () => {

        authValue = {
          token:
            null,

          user:
            null
        };


        render(
          <MentorGuidancePanel
            projectId="project-1"
          />
        );


        expect(
          screen.getByText(
            "You must be signed in to view Mentor guidance."
          )
        ).toBeInTheDocument();


        expect(
          fetch
        ).not.toHaveBeenCalled();
      }
    );
  }
);