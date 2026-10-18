const { randomUUID } = require('crypto');

// Permitted range for workload / motivation / capacity scores.
// Adjust to match whatever scale your group agreed on for the GUI (e.g. a 1-5 slider).
const SCORE_MIN = 1;
const SCORE_MAX = 5;

const MAX_PIT_WALL_NOTE_LENGTH =
    1000;

/**
 * PitWallCheckIn
 * Represents a single private workload/wellbeing check-in submitted by a
 * student. Corresponds to PF-PIT-01 to PF-PIT-05 in the ProjectForge SRS:
 * private, owned only by the creator, never used for team selection or
 * ranking.
 */
class PitWallCheckIn {
  constructor({ userId, workload, motivation, capacity, privateNote = null }) {
    this.checkInId = randomUUID();
    this.userId = userId;
    this.workload = workload;
    this.motivation = motivation;
    this.capacity = capacity;
    this.privateNote = privateNote;
    this.createdAt = new Date();
  }

  /**
   * ValidateScores
   * Confirms workload, motivation and capacity are all whole numbers
   * within the permitted range (SCORE_MIN - SCORE_MAX).
   * @returns {boolean} true if all three scores are valid.
   */
  ValidateScores() {
    const scores = [this.workload, this.motivation, this.capacity];
    return scores.every(
      (score) =>
        typeof score === 'number' &&
        Number.isInteger(score) &&
        score >= SCORE_MIN &&
        score <= SCORE_MAX
    );
  }

  /**
   * ValidateNote
   * Optional notes may be blank/null, but when supplied they
   * may not exceed the configured character limit.
   */
  ValidateNote() {
    if (
      this.privateNote === null ||
      this.privateNote === undefined
    ) {
      return true;
    }

    return (
      typeof this.privateNote ===
        'string' &&
      this.privateNote.length <=
        MAX_PIT_WALL_NOTE_LENGTH
    );
  }

  /**
   * UpdateNote
   * Updates the private note attached to this check-in. Blank or
   * whitespace-only notes are rejected so the field can't be "cleared"
   * silently.
   * @param {string} note
   * @returns {boolean} true if the note was updated, false if rejected.
   */
  UpdateNote(note) {
    if (
      typeof note !== 'string' ||
      note.trim().length === 0 ||
      note.length >
        MAX_PIT_WALL_NOTE_LENGTH
    ) {
      return false;
    }
    this.privateNote = note.trim();
    return true;
  }
}

module.exports = {
  PitWallCheckIn,
  SCORE_MIN,
  SCORE_MAX,
  MAX_PIT_WALL_NOTE_LENGTH
};
