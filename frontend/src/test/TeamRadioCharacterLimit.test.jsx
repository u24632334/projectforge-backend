import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/TeamRadioAlert.jsx?raw";


describe(
  "Team Radio character-limit UX regression",
  () => {

    it(
      "shows the live assistance-message counter",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*message\.length\s*\}\s*\/\s*\{\s*MAX_TEAM_RADIO_MESSAGE_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Send Request when the message exceeds the maximum",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,300}?message\.length\s*>\s*MAX_TEAM_RADIO_MESSAGE_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Assistance request message may not exceed"
        );
      }
    );

  }
);