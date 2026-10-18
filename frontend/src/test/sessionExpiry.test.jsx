import React from "react";

import {
  render,
  screen,
  waitFor
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from "vitest";

import App from "../App.jsx";

import {
  AuthProvider
} from "../context/AuthContext.jsx";


describe(
  "POLISH-001: Expired Session Handling",
  () => {

    beforeEach(
      () => {
        sessionStorage.clear();
      }
    );


    afterEach(
      () => {
        vi.restoreAllMocks();
        sessionStorage.clear();
      }
    );


    test(
      "401 on a protected page clears the session and returns the user to Login",
      async () => {

        sessionStorage.setItem(
          "token",
          "expired-test-token"
        );

        sessionStorage.setItem(
          "user",
          JSON.stringify({
            id:
              "expired-session-user",

            email:
              "student@projectforge.local",

            role:
              "STUDENT"
          })
        );

        sessionStorage.setItem(
          "projectforge-active-page",
          "applications"
        );

        sessionStorage.setItem(
          "projectforge-active-project-id",
          "expired-project"
        );


        vi.spyOn(
          global,
          "fetch"
        ).mockResolvedValue({
          ok:
            false,

          status:
            401,

          json:
            async () => ({
              error:
                "Unauthorized"
            })
        });


        render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );


        await waitFor(
          () => {
            expect(
              sessionStorage.getItem(
                "token"
              )
            ).toBeNull();

            expect(
              sessionStorage.getItem(
                "user"
              )
            ).toBeNull();
          }
        );


        await screen.findByRole(
          "textbox",
          {
            name:
              "Email"
          }
        );


        expect(
          sessionStorage.getItem(
            "projectforge-active-page"
          )
        ).toBeNull();


        expect(
          sessionStorage.getItem(
            "projectforge-active-project-id"
          )
        ).toBeNull();


        expect(
          global.fetch
        ).toHaveBeenCalledWith(
          "/api/applications",
          expect.objectContaining({
            headers:
              expect.objectContaining({
                Authorization:
                  "Bearer expired-test-token"
              })
          })
        );
      }
    );

  }
);
