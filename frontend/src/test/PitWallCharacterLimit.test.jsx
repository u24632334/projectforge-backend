import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../PitWallForm.jsx?raw";


describe(
  "Pit Wall character-limit UX regression",
  () => {

    it(
      "shows the live note character counter",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*note\.length\s*\}\s*\/\s*\{\s*MAX_PIT_WALL_NOTE_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Save check-in when the note exceeds the maximum",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,300}?note\.length\s*>\s*MAX_PIT_WALL_NOTE_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Pit Wall notes may not exceed"
        );
      }
    );

  }
);