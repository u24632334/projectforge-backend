const PitWallRepository = require('../db/pitWallRepository');

describe('PitWallRepository', () => {
  test('insert sends an INSERT query and returns the stored row', async () => {
    const fakeRow = { check_in_id: '1', user_id: 'u1', workload: 3 };
    const pool = { query: jest.fn().mockResolvedValue({ rows: [fakeRow] }) };
    const repository = new PitWallRepository(pool);

    const result = await repository.insert({
      checkInId: '1',
      userId: 'u1',
      workload: 3,
      motivation: 4,
      capacity: 2,
      privateNote: null,
      createdAt: new Date(),
    });

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][0]).toMatch(/INSERT INTO pit_wall_checkins/i);
    expect(result).toEqual(fakeRow);
  });

  test('findByUser queries only by the given userId', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const repository = new PitWallRepository(pool);

    await repository.findByUser('u1');

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['u1']);
  });
});
