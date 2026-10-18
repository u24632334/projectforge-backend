const { PitWallCheckIn } = require('../models/PitWallCheckIn');
const PitWallService = require('../services/PitWallService');

describe('PitWallCheckIn - ValidateScores', () => {
  // SRS Unit Test #66
  test('returns true for valid workload, motivation and capacity scores', () => {
    const checkIn = new PitWallCheckIn({
      userId: 'user-1',
      workload: 3,
      motivation: 4,
      capacity: 2,
    });
    expect(checkIn.ValidateScores()).toBe(true);
  });

  // SRS Unit Test #67
  test('returns false when one score is outside the permitted range', () => {
    const checkIn = new PitWallCheckIn({
      userId: 'user-1',
      workload: 3,
      motivation: 9, // out of range
      capacity: 2,
    });
    expect(checkIn.ValidateScores()).toBe(false);
  });
});

describe('PitWallCheckIn - UpdateNote', () => {
  // SRS Unit Test #68
  test('updates the note when given valid content', () => {
    const checkIn = new PitWallCheckIn({
      userId: 'user-1',
      workload: 3,
      motivation: 4,
      capacity: 2,
    });
    const result = checkIn.UpdateNote('Feeling stretched thin this week.');
    expect(result).toBe(true);
    expect(checkIn.privateNote).toBe('Feeling stretched thin this week.');
  });

  test('rejects a blank note and leaves the existing note unchanged', () => {
    const checkIn = new PitWallCheckIn({
      userId: 'user-1',
      workload: 3,
      motivation: 4,
      capacity: 2,
    });
    const result = checkIn.UpdateNote('   ');
    expect(result).toBe(false);
    expect(checkIn.privateNote).toBeNull();
  });
});

describe('PitWallService - access control', () => {
  // SRS Unit Test #69
  test('another user requesting the entry is denied access', () => {
    const service = new PitWallService();
    const checkIn = new PitWallCheckIn({
      userId: 'user-1',
      workload: 3,
      motivation: 4,
      capacity: 2,
    });
    service.create(checkIn);

    const ownerResult = service.getCheckIn(checkIn.checkInId, 'user-1');
    const strangerResult = service.getCheckIn(checkIn.checkInId, 'user-2');

    expect(ownerResult).toBe(checkIn);
    expect(strangerResult).toBeNull();
  });
});
