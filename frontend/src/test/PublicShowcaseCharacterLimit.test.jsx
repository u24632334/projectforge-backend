import {
  describe,
  expect,
  it
} from "vitest";

import source
  from "../components/PublicShowcase.jsx?raw";


describe(
  "Public Showcase report character-limit UX regression",
  () => {

    it(
      "shows the live report-details counter",
      () => {
        expect(
          source
        ).toMatch(
          /\{\s*reportDetails\.length\s*\}\s*\/\s*\{\s*MAX_REPORT_DETAILS_LENGTH\s*\}/
        );
      }
    );


    it(
      "disables Submit Report when report details exceed the maximum",
      () => {
        expect(
          source
        ).toMatch(
          /disabled=\{[\s\S]{0,250}?submittingReport\s*\|\|[\s\S]{0,120}?reportDetails\.length\s*>\s*MAX_REPORT_DETAILS_LENGTH/
        );

        expect(
          source
        ).toContain(
          "Maximum characters exceeded. Report details may not exceed"
        );
      }
    );

  }
);