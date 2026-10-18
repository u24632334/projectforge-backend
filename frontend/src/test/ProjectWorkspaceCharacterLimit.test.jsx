import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/ProjectWorkspaceHeader.jsx?raw";


describe(
  "Project Workspace character-limit UX regression",
  () => {

    it(
      "shows live counters for editable project text fields",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*editTitle\.length\s*\}\s*\/\s*\{\s*MAX_PROJECT_TITLE_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*editDescription\.length\s*\}\s*\/\s*\{\s*MAX_PROJECT_DESCRIPTION_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*editRepository\.length\s*\}\s*\/\s*\{\s*MAX_REPOSITORY_URL_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Save when any editable text value exceeds its maximum",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,500}?editTitle\.length\s*>\s*MAX_PROJECT_TITLE_LENGTH[\s\S]{0,200}?editDescription\.length\s*>\s*MAX_PROJECT_DESCRIPTION_LENGTH[\s\S]{0,200}?editRepository\.length\s*>\s*MAX_REPOSITORY_URL_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Project description may not exceed"
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Repository URL may not exceed"
        );
      }
    );

  }
);