const TeamHealthSubmissionReceipt = require('../models/TeamHealthSubmissionReceipt');

describe('TeamHealthSubmissionReceipt - Matches', () => {
  // SRS Unit Test #73
  test('returns true for the same membership ID and period', () => {
    const receipt = new TeamHealthSubmissionReceipt({ membershipId: 'm1', periodStart: '2026-09-21' });
    expect(receipt.Matches('m1', '2026-09-21')).toBe(true);
  });

  // SRS Unit Test #74
  test('returns false for a different membership ID', () => {
    const receipt = new TeamHealthSubmissionReceipt({ membershipId: 'm1', periodStart: '2026-09-21' });
    expect(receipt.Matches('m2', '2026-09-21')).toBe(false);
  });

  // SRS Unit Test #75
  test('returns false for a different period', () => {
    const receipt = new TeamHealthSubmissionReceipt({ membershipId: 'm1', periodStart: '2026-09-21' });
    expect(receipt.Matches('m1', '2026-09-28')).toBe(false);
  });
});
