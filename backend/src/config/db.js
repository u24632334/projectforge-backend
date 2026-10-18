const { Pool } = require("pg");
require("dotenv").config();


/**
 * Shared PostgreSQL connection pool for ProjectForge.
 *
 * A pool is used rather than opening a new database connection for every
 * request. All backend feature modules can therefore reuse managed database
 * connections while PostgreSQL/pg controls connection allocation.
 *
 * Sensitive database configuration is read from environment variables and
 * is not hard-coded into the repository.
 */
const pool = new Pool({
  host: process.env.DB_HOST,

  port: Number(
    process.env.DB_PORT || 5432
  ),

  database: process.env.DB_NAME,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,
});


/**
 * Verifies that ProjectForge can obtain a PostgreSQL connection and execute
 * a simple query before the API begins accepting requests.
 *
 * The borrowed client is always released in the finally block, including
 * when the test query fails. This prevents failed startup checks from
 * leaking pooled connections.
 *
 * @returns {Promise<boolean>} true when PostgreSQL can be queried.
 * @throws {Error} Propagates connection/query failures to the server startup
 *                 logic so the API does not report itself as available when
 *                 persistence is unavailable.
 */
async function testDatabaseConnection() {
  const client =
    await pool.connect();

  try {
    await client.query("SELECT 1");

    return true;
  } finally {
    client.release();
  }
}


module.exports = {
  pool,
  testDatabaseConnection,
};