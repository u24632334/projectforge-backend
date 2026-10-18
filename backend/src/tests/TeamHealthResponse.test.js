const { TeamHealthResponse } = require('../models/TeamHealthResponse');

describe('TeamHealthResponse - ValidateScores', () => {
  // SRS Unit Test #70
  test('returns true when all values are within the permitted range', () => {
    const response = new TeamHealthResponse({
      projectId: 'p1', periodStart: '2026-09-21', workload: 3, communication: 4, blockerSeverity: 2,
    });
    expect(response.ValidateScores()).toBe(true);
  });

  // SRS Unit Test #71
  test('returns false when one score is outside the permitted range', () => {
    const response = new TeamHealthResponse({
      projectId: 'p1', periodStart: '2026-09-21', workload: 3, communication: 9, blockerSeverity: 2,
    });
    expect(response.ValidateScores()).toBe(false);
  });
});

describe('TeamHealthResponse - Anonymity', () => {
  // SRS Unit Test #72
  test('stored response data never includes a userId or membershipId', () => {
    const response = new TeamHealthResponse({
      projectId: 'p1', periodStart: '2026-09-21', workload: 3, communication: 4, blockerSeverity: 2,
    });
    expect(response).not.toHaveProperty('userId');
    expect(response).not.toHaveProperty('membershipId');
  });
});
