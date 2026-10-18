import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

/**
 * Adds the jest-axe accessibility matcher to Vitest.
 * This allows accessibility tests to fail when axe finds violations.
 */
expect.extend(toHaveNoViolations);