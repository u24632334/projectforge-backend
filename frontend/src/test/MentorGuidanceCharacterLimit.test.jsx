import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/MentorGuidancePanel.jsx?raw";


describe(
  "Mentor Guidance character-limit UX regression",
  () => {

    it(
      "shows live counters for new and edited guidance",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*guidance\.length\s*\}\s*\/\s*\{\s*MAX_GUIDANCE_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*editGuidance\.length\s*\}\s*\/\s*\{\s*MAX_GUIDANCE_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Submit Guidance and Save Guidance above the maximum",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,300}?guidance\.length\s*>\s*MAX_GUIDANCE_LENGTH/
        );

        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,300}?editGuidance\.length\s*>\s*MAX_GUIDANCE_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Guidance may not exceed"
        );
      }
    );

  }
);