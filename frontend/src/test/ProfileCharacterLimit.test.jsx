import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/ProfileEdit.jsx?raw";


describe(
  "Profile character-limit UX regression",
  () => {

    it(
      "shows live counters for every bounded editable profile field",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*displayName\.length\s*\}\s*\/\s*\{\s*MAX_DISPLAY_NAME_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*bio\.length\s*\}\s*\/\s*\{\s*MAX_BIO_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*interests\.length\s*\}\s*\/\s*\{\s*MAX_INTERESTS_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*newSkillName\.length\s*\}\s*\/\s*\{\s*MAX_SKILL_NAME_LENGTH\s*\}/
        );

        expect(
          source
        ).toMatch(
          /\{\s*newSkillCategory\.length\s*\}\s*\/\s*\{\s*MAX_SKILL_CATEGORY_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables the relevant profile actions when a maximum is exceeded",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,350}?newSkillName\.length\s*>\s*MAX_SKILL_NAME_LENGTH[\s\S]{0,200}?newSkillCategory\.length\s*>\s*MAX_SKILL_CATEGORY_LENGTH/
        );

        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,700}?displayName\.length\s*>\s*MAX_DISPLAY_NAME_LENGTH[\s\S]{0,200}?bio\.length\s*>\s*MAX_BIO_LENGTH[\s\S]{0,200}?interests\.length\s*>\s*MAX_INTERESTS_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Bio may not exceed"
        );
      }
    );

  }
);