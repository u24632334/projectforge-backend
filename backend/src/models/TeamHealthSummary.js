/**
 * TeamHealthSummary
 * The aggregated, anonymous view over a project's team-health responses
 * for a single check-in period. Matches the TeamHealthSummary class in
 * your UML diagram (Fig 13).
 */
class TeamHealthSummary {
  // PF-PIT-09: results are withheld until at least this many responses
  // exist for the period, so individual answers can't be inferred even
  // in a small team.
  static MIN_RESPONSES_TO_PUBLISH = 3;

  constructor({ projectId, periodStart, responseCount, avgWorkload, avgCommunication, avgBlockerSeverity }) {
    this.projectId = projectId;
    this.periodStart = periodStart;
    this.responseCount = responseCount;
    this.avgWorkload = avgWorkload;
    this.avgCommunication = avgCommunication;
    this.avgBlockerSeverity = avgBlockerSeverity;
  }

  /**
   * IsPublishable
   * @param {number} responseCount
   * @returns {boolean} true once responseCount meets the minimum threshold.
   */
  static IsPublishable(responseCount) {
    return (
      typeof responseCount === 'number' &&
      Number.isFinite(responseCount) &&
      responseCount >= TeamHealthSummary.MIN_RESPONSES_TO_PUBLISH
    );
  }
}

module.exports = TeamHealthSummary;
