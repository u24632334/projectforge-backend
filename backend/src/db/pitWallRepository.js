/**
 * PitWallRepository
 * Data-access layer for pit_wall_checkins (PFG-59).
 *
 * Takes a `pool` in its constructor rather than importing a hard-coded
 * path, so it can be unit-tested with a fake pool. In your real app,
 * wire it up wherever routes are assembled:
 *
 *   const pool = require('../db/pool');       // your team's shared pg Pool
 *   const PitWallRepository = require('./pitWallRepository');
 *   const repository = new PitWallRepository(pool);
 */
class PitWallRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * insert
   * Persists a validated PitWallCheckIn and returns the stored row.
   * @param {import('../models/PitWallCheckIn').PitWallCheckIn} checkIn
   */
  async insert(checkIn) {
    const { rows } = await this.pool.query(
      `INSERT INTO pit_wall_checkins
        (check_in_id, user_id, workload, motivation, capacity, private_note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        checkIn.checkInId,
        checkIn.userId,
        checkIn.workload,
        checkIn.motivation,
        checkIn.capacity,
        checkIn.privateNote,
        checkIn.createdAt,
      ]
    );
    return rows[0];
  }

  /**
   * findByUser
   * Returns all check-ins for a single user, most recent first.
   * PF-PIT-03 is enforced by always querying on a single user_id — the
   * route layer is responsible for only ever passing the caller's own id.
   * @param {string} userId
   */
  async findByUser(userId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM pit_wall_checkins WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = PitWallRepository;
