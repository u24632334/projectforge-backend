import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/TaskBoard.jsx?raw";


describe(
  "Task Board character-limit UX regression",
  () => {

    it(
      "shows live title and description counters",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*title\.length\s*\}\s*\/\s*\{\s*MAX_TASK_TITLE_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*description\.length\s*\}\s*\/\s*\{\s*MAX_TASK_DESCRIPTION_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Deploy Task when title or description is oversized",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,350}?title\.length\s*>\s*MAX_TASK_TITLE_LENGTH[\s\S]{0,200}?description\.length\s*>\s*MAX_TASK_DESCRIPTION_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Task title may not exceed"
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Task description may not exceed"
        );
      }
    );

  }
);