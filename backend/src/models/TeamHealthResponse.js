const { randomUUID } = require('crypto');

const SCORE_MIN = 1;
const SCORE_MAX = 5;

/**
 * TeamHealthResponse
 * A single anonymous team-health answer for a project/period.
 * Deliberately has NO userId or membershipId field — PF-PIT-08 requires
 * that individual responses can never be traced back to a person, not
 * even by an administrator. See TeamHealthSubmissionReceipt for how
 * duplicate submissions are prevented without breaking that anonymity.
 */
class TeamHealthResponse {
  constructor({ projectId, periodStart, workload, communication, blockerSeverity }) {
    this.responseId = randomUUID();
    this.projectId = projectId;
    this.periodStart = periodStart;
    this.workload = workload;
    this.communication = communication;
    this.blockerSeverity = blockerSeverity;
    this.createdAt = new Date();
  }

  /**
   * ValidateScores
   * Confirms workload, communication and blockerSeverity are all whole
   * numbers within the permitted range.
   * @returns {boolean}
   */
  ValidateScores() {
    const scores = [this.workload, this.communication, this.blockerSeverity];
    return scores.every(
      (score) =>
        typeof score === 'number' &&
        Number.isInteger(score) &&
        score >= SCORE_MIN &&
        score <= SCORE_MAX
    );
  }
}

module.exports = { TeamHealthResponse, SCORE_MIN, SCORE_MAX };
