import { describe, expect, test } from "vitest";

import { sanitizeText } from "./sanitize.js";


/**
 * PFG-90 XSS Security Audit
 *
 * These tests check that user-controlled text cannot keep HTML,
 * scripts or browser event handlers before ProjectForge displays it.
 */
describe("sanitizeText", () => {

  test("keeps normal plain text unchanged", () => {
    expect(
      sanitizeText("Campus energy monitoring project")
    ).toBe(
      "Campus energy monitoring project"
    );
  });


  test("removes HTML tags but keeps safe text", () => {
    expect(
      sanitizeText("<b>Important project note</b>")
    ).toBe(
      "Important project note"
    );
  });


  test("removes script content from an XSS payload", () => {
    expect(
      sanitizeText(
        '<script>alert("XSS")</script>Safe description'
      )
    ).toBe(
      "Safe description"
    );
  });


  test("removes image event-handler XSS payloads", () => {
    expect(
      sanitizeText(
        '<img src="x" onerror="alert(1)">Project note'
      )
    ).toBe(
      "Project note"
    );
  });


  test("removes unsafe links while keeping their visible text", () => {
    expect(
      sanitizeText(
        '<a href="javascript:alert(1)">Open project</a>'
      )
    ).toBe(
      "Open project"
    );
  });


  test("returns an empty string for non-string input", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(123)).toBe("");
  });
});