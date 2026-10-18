const { Pool } = require("pg");
require("dotenv").config();

/**
 * Shared PostgreSQL connection pool for ProjectForge.
 * Supports single DATABASE_URL (production / Render) or individual DB_* variables (local).
 */
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

/**
 * Verifies that ProjectForge can obtain a PostgreSQL connection and execute
 * a simple query before the API begins accepting requests.
 */
async function testDatabaseConnection() {
  const client = await pool.connect();

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