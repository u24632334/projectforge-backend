const TeamHealthRepository = require('../db/teamHealthRepository');

describe('TeamHealthRepository.getAggregate', () => {
  test('queries by projectId and periodStart', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [{ response_count: 4, avg_workload: 3.5, avg_communication: 4, avg_blocker_severity: 2 }],
      }),
    };
    const repository = new TeamHealthRepository(pool);

    const result = await repository.getAggregate('project-1', '2026-09-07');

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['project-1', '2026-09-07']);
    expect(result.response_count).toBe(4);
  });

  test('returns a zero count row when there are no responses yet', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [{ response_count: 0, avg_workload: null, avg_communication: null, avg_blocker_severity: null }],
      }),
    };
    const repository = new TeamHealthRepository(pool);

    const result = await repository.getAggregate('project-1', '2026-09-07');

    expect(result.response_count).toBe(0);
  });
});
