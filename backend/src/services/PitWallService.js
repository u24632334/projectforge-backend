/**
 * PitWallService
 * In-memory store for PitWallCheckIn records. Once your teammates' DB
 * layer (PostgreSQL) is ready, swap the Map for real queries — the
 * access-control rule (PF-PIT-03) stays the same either way, which is
 * exactly why it's tested independently of the database here.
 */
class PitWallService {
  constructor() {
    this.checkIns = new Map(); // checkInId -> PitWallCheckIn
  }

  /**
   * create
   * Stores a check-in after validating its scores.
   * @param {PitWallCheckIn} checkIn
   * @returns {PitWallCheckIn}
   */
  create(checkIn) {
    if (!checkIn.ValidateScores()) {
      throw new Error('Cannot save a check-in with invalid scores');
    }
    this.checkIns.set(checkIn.checkInId, checkIn);
    return checkIn;
  }

  /**
   * getCheckIn
   * Returns a check-in only if the requesting user is its owner.
   * Enforces PF-PIT-03: individual Pit Wall entries are visible only to
   * the student who created them.
   * @param {string} checkInId
   * @param {string} requestingUserId
   * @returns {PitWallCheckIn|null}
   */
  getCheckIn(checkInId, requestingUserId) {
    const checkIn = this.checkIns.get(checkInId);
    if (!checkIn) return null;
    if (checkIn.userId !== requestingUserId) {
      return null; // access denied - not the owner
    }
    return checkIn;
  }
}

module.exports = PitWallService;
