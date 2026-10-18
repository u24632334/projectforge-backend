/**
 * TeamHealthRepository
 * Data-access layer for aggregating team_health_responses (PFG-69).
 * Takes a `pool` in its constructor so it can be unit-tested with a fake
 * pool instead of a live database.
 */
class TeamHealthRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * getAggregate
   * Returns the response count and average scores for a project/period.
   * If there are zero responses, response_count comes back as 0 and the
   * averages come back as null — the caller (the route) is responsible
   * for turning that into a "not enough responses yet" result.
   * @param {string} projectId
   * @param {string} periodStart - ISO date string, e.g. '2026-09-07'
   */
  async getAggregate(projectId, periodStart) {
    const { rows } = await this.pool.query(
      `SELECT
         COUNT(*)::int AS response_count,
         AVG(workload)::float AS avg_workload,
         AVG(communication)::float AS avg_communication,
         AVG(blocker_severity)::float AS avg_blocker_severity
       FROM team_health_responses
       WHERE project_id = $1 AND period_start = $2`,
      [projectId, periodStart]
    );
    return rows[0];
  }
}

module.exports = TeamHealthRepository;
