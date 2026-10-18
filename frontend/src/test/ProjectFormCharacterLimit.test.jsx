import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/ProjectForm.jsx?raw";


describe(
  "Project Form character-limit UX regression",
  () => {

    it(
      "shows live usage for project, repository and role text inputs",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*title\.length\s*\}\s*\/\s*\{\s*MAX_PROJECT_TITLE_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*description\.length\s*\}\s*\/\s*\{\s*MAX_PROJECT_DESCRIPTION_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*repositoryUrl\.length\s*\}\s*\/\s*\{\s*MAX_REPOSITORY_URL_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*position\s*\.title\s*\.length\s*\}\s*\/\s*\{\s*MAX_POSITION_TITLE_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*position\s*\.skills\s*\.length\s*\}\s*\/\s*\{\s*MAX_SKILL_INPUT_LENGTH\s*\}/
        );
      }
    );


    it(
      "uses the shared length guard to disable Publish Project Listing",
      () => {
        expect(
          source
        ).toMatch(
          /const hasLengthError\s*=/
        );

        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,150}?submitting\s*\|\|[\s\S]{0,80}?hasLengthError/
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