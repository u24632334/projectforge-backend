const { randomUUID } = require('crypto');

/**
 * TeamHealthSubmissionReceipt
 * Records that a project member has already submitted a team-health
 * check-in for a given period, WITHOUT linking to which TeamHealthResponse
 * row is theirs. This is how duplicate submissions are blocked (PFG-64/65
 * "duplicate-submission prevention") while keeping the actual answers
 * anonymous (PF-PIT-08).
 */
class TeamHealthSubmissionReceipt {
  constructor({ membershipId, periodStart }) {
    this.receiptId = randomUUID();
    this.membershipId = membershipId;
    this.periodStart = periodStart;
    this.submittedAt = new Date();
  }

  /**
   * Matches
   * @param {string} membershipId
   * @param {string} periodStart
   * @returns {boolean} true if this receipt is for the given member/period.
   */
  Matches(membershipId, periodStart) {
    return this.membershipId === membershipId && this.periodStart === periodStart;
  }
}

module.exports = TeamHealthSubmissionReceipt;
