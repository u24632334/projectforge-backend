const TeamHealthSummary = require('../models/TeamHealthSummary');

describe('TeamHealthSummary.IsPublishable', () => {
  test('returns true when response count is exactly at the minimum threshold (3)', () => {
    expect(TeamHealthSummary.IsPublishable(3)).toBe(true);
  });

  test('returns false when response count is below the threshold (2)', () => {
    expect(TeamHealthSummary.IsPublishable(2)).toBe(false);
  });

  test('returns true when response count is well above the threshold (5)', () => {
    expect(TeamHealthSummary.IsPublishable(5)).toBe(true);
  });

  test('returns false for zero responses', () => {
    expect(TeamHealthSummary.IsPublishable(0)).toBe(false);
  });
});
