import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/DevelopmentUpdates.jsx?raw";


describe(
  "Development Updates character-limit UX regression",
  () => {

    it(
      "shows live counters for new and edited updates",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*content\.length\s*\}\s*\/\s*\{\s*MAX_DEVELOPMENT_UPDATE_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*editContent\.length\s*\}\s*\/\s*\{\s*MAX_DEVELOPMENT_UPDATE_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Post Update and Save when their text exceeds the maximum",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,300}?content\.length\s*>\s*MAX_DEVELOPMENT_UPDATE_LENGTH/
        );

        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,300}?editContent\.length\s*>\s*MAX_DEVELOPMENT_UPDATE_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Development update may not exceed"
        );
      }
    );

  }
);