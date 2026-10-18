import React from "react";

import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";

import userEvent
  from "@testing-library/user-event";

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
  "BUG-001: Auth Input Length Regression Tests",
  () => {

    beforeEach(
      () => {
        sessionStorage.clear();
      }
    );


    afterEach(
      () => {
        vi.restoreAllMocks();
      }
    );


    function renderProjectForge() {
      return render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );
    }


    async function openSignup() {
      const user =
        userEvent.setup();


      renderProjectForge();


      await screen.findByRole(
        "heading",
        {
          name:
            "ProjectForge"
        }
      );


      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Sign Up"
          }
        )
      );


      await screen.findByRole(
        "heading",
        {
          name:
            "Create Account"
        }
      );
    }


    test(
      "login email accepts exactly 255 characters",
      async () => {

        renderProjectForge();


        const email =
          await screen.findByRole(
            "textbox",
            {
              name:
                "Email"
            }
          );


        const value =
          `${"a".repeat(243)}@example.com`;


        expect(
          value.length
        ).toBe(
          255
        );


        fireEvent.change(
          email,
          {
            target: {
              value
            }
          }
        );


        expect(
          email
        ).toHaveValue(
          value
        );


        expect(
          screen.queryByText(
            /Maximum characters exceeded/i
          )
        ).not.toBeInTheDocument();
      }
    );


    test(
      "login email rejects 256 characters with a friendly error",
      async () => {

        renderProjectForge();


        const email =
          await screen.findByRole(
            "textbox",
            {
              name:
                "Email"
            }
          );


        const value =
          `${"a".repeat(244)}@example.com`;


        expect(
          value.length
        ).toBe(
          256
        );


        fireEvent.change(
          email,
          {
            target: {
              value
            }
          }
        );


        expect(
          email
        ).toHaveValue(
          ""
        );


        expect(
          screen.getByRole(
            "alert"
          )
        ).toHaveTextContent(
          "Maximum characters exceeded. Email may not exceed 255 characters."
        );
      }
    );


    test(
      "login safely rejects a 5000 character email value",
      async () => {

        renderProjectForge();


        const email =
          await screen.findByRole(
            "textbox",
            {
              name:
                "Email"
            }
          );


        const value =
          `${"a".repeat(4988)}@example.com`;


        expect(
          value.length
        ).toBe(
          5000
        );


        fireEvent.change(
          email,
          {
            target: {
              value
            }
          }
        );


        expect(
          email
        ).toHaveValue(
          ""
        );


        expect(
          screen.getByRole(
            "alert"
          )
        ).toHaveTextContent(
          "Maximum characters exceeded. Email may not exceed 255 characters."
        );
      }
    );


    test(
      "login password accepts 72 UTF-8 bytes and rejects 73",
      async () => {

        renderProjectForge();


        const password =
          await screen.findByLabelText(
            "Password"
          );


        const boundaryValue =
          "P".repeat(
            72
          );


        fireEvent.change(
          password,
          {
            target: {
              value:
                boundaryValue
            }
          }
        );


        expect(
          password
        ).toHaveValue(
          boundaryValue
        );


        fireEvent.change(
          password,
          {
            target: {
              value:
                "P".repeat(
                  73
                )
            }
          }
        );


        expect(
          password
        ).toHaveValue(
          boundaryValue
        );


        expect(
          screen.getByRole(
            "alert"
          )
        ).toHaveTextContent(
          "Maximum characters exceeded. Password may not exceed 72 UTF-8 bytes."
        );
      }
    );


    test(
      "signup full name accepts exactly 120 characters",
      async () => {

        await openSignup();


        const fullName =
          screen.getByRole(
            "textbox",
            {
              name:
                "Full Name"
            }
          );


        const value =
          "A".repeat(
            120
          );


        fireEvent.change(
          fullName,
          {
            target: {
              value
            }
          }
        );


        expect(
          fullName
        ).toHaveValue(
          value
        );


        expect(
          screen.queryByText(
            /Maximum characters exceeded/i
          )
        ).not.toBeInTheDocument();
      }
    );


    test(
      "signup full name rejects 121 characters with a friendly error",
      async () => {

        await openSignup();


        const fullName =
          screen.getByRole(
            "textbox",
            {
              name:
                "Full Name"
            }
          );


        fireEvent.change(
          fullName,
          {
            target: {
              value:
                "A".repeat(
                  121
                )
            }
          }
        );


        expect(
          fullName
        ).toHaveValue(
          ""
        );


        expect(
          screen.getByText(
            "Maximum characters exceeded. Full name may not exceed 120 characters."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "signup safely rejects a 5000 character full name",
      async () => {

        await openSignup();


        const fullName =
          screen.getByRole(
            "textbox",
            {
              name:
                "Full Name"
            }
          );


        fireEvent.change(
          fullName,
          {
            target: {
              value:
                "A".repeat(
                  5000
                )
            }
          }
        );


        expect(
          fullName
        ).toHaveValue(
          ""
        );


        expect(
          screen.getByText(
            "Maximum characters exceeded. Full name may not exceed 120 characters."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "signup password enforces the 72 UTF-8 byte boundary",
      async () => {

        await openSignup();


        const password =
          screen.getByLabelText(
            "Password"
          );


        const boundaryValue =
          "€".repeat(
            24
          );


        fireEvent.change(
          password,
          {
            target: {
              value:
                boundaryValue
            }
          }
        );


        expect(
          password
        ).toHaveValue(
          boundaryValue
        );


        fireEvent.change(
          password,
          {
            target: {
              value:
                "€".repeat(
                  25
                )
            }
          }
        );


        expect(
          password
        ).toHaveValue(
          boundaryValue
        );


        expect(
          screen.getByText(
            "Maximum characters exceeded. Password may not exceed 72 UTF-8 bytes."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "login rejects a password with a leading space",
      async () => {

        renderProjectForge();


        const email =
          await screen.findByRole(
            "textbox",
            {
              name:
                "Email"
            }
          );


        const password =
          screen.getByLabelText(
            "Password"
          );


        fireEvent.change(
          email,
          {
            target: {
              value:
                "student@up.ac.za"
            }
          }
        );


        fireEvent.change(
          password,
          {
            target: {
              value:
                " ProjectForge123!"
            }
          }
        );


        fireEvent.submit(
          password.closest(
            "form"
          )
        );


        expect(
          screen.getByRole(
            "alert"
          )
        ).toHaveTextContent(
          "Password may not begin or end with spaces."
        );
      }
    );


    test(
      "login rejects a password with a trailing space",
      async () => {

        renderProjectForge();


        const email =
          await screen.findByRole(
            "textbox",
            {
              name:
                "Email"
            }
          );


        const password =
          screen.getByLabelText(
            "Password"
          );


        fireEvent.change(
          email,
          {
            target: {
              value:
                "student@up.ac.za"
            }
          }
        );


        fireEvent.change(
          password,
          {
            target: {
              value:
                "ProjectForge123! "
            }
          }
        );


        fireEvent.submit(
          password.closest(
            "form"
          )
        );


        expect(
          screen.getByRole(
            "alert"
          )
        ).toHaveTextContent(
          "Password may not begin or end with spaces."
        );
      }
    );


    test(
      "signup rejects a password with leading or trailing spaces",
      async () => {

        await openSignup();


        const fullName =
          screen.getByRole(
            "textbox",
            {
              name:
                "Full Name"
            }
          );

        const email =
          screen.getByRole(
            "textbox",
            {
              name:
                "Email"
            }
          );

        const password =
          screen.getByLabelText(
            "Password"
          );


        fireEvent.change(
          fullName,
          {
            target: {
              value:
                "Alex Student"
            }
          }
        );

        fireEvent.change(
          email,
          {
            target: {
              value:
                "alex@test.com"
            }
          }
        );

        fireEvent.change(
          password,
          {
            target: {
              value:
                " ProjectForge123!"
            }
          }
        );


        fireEvent.submit(
          password.closest(
            "form"
          )
        );


        expect(
          screen.getByText(
            "Password may not begin or end with spaces."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "signup allows spaces inside a password",
      async () => {

        await openSignup();


        const password =
          screen.getByLabelText(
            "Password"
          );


        fireEvent.change(
          password,
          {
            target: {
              value:
                "Project Forge123!"
            }
          }
        );


        expect(
          password
        ).toHaveValue(
          "Project Forge123!"
        );


        expect(
          screen.queryByText(
            "Password may not begin or end with spaces."
          )
        ).not.toBeInTheDocument();
      }
    );

  }
);
