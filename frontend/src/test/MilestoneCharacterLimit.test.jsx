import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/MilestoneBoard.jsx?raw";


describe(
  "Milestone character-limit UX regression",
  () => {

    it(
      "shows live title and description counters",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*title\.length\s*\}\s*\/\s*\{\s*MAX_MILESTONE_TITLE_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*description\.length\s*\}\s*\/\s*\{\s*MAX_MILESTONE_DESCRIPTION_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Create Milestone when title or description is oversized",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,350}?title\.length\s*>\s*MAX_MILESTONE_TITLE_LENGTH[\s\S]{0,200}?description\.length\s*>\s*MAX_MILESTONE_DESCRIPTION_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Milestone title may not exceed"
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Milestone description may not exceed"
        );
      }
    );

  }
);