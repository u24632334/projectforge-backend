const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dotenv = require("dotenv");

// Load the local backend database settings.
// The .env file is not committed to Git.
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

jest.setTimeout(30000);

// Paths to the SQL files developed for PFG-8 and PFG-10.
const migrationPath = path.resolve(
  __dirname,
  "../../migrations/001_create_core_tables.sql"
);

const seedPath = path.resolve(
  __dirname,
  "../../seeds/001_seed_development_data.sql"
);

// Read the SQL scripts exactly as PostgreSQL will receive them.
const migrationSql = fs.readFileSync(migrationPath, "utf8");
const seedSql = fs.readFileSync(seedPath, "utf8");

// Only run these integration tests when local database
// configuration is available.
const databaseConfigured = [
  process.env.DB_HOST,
  process.env.DB_PORT,
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
].every(Boolean);

const databaseDescribe = databaseConfigured
  ? describe
  : describe.skip;

databaseDescribe(
  "PFG-7 PostgreSQL migration and seed validation",
  () => {
    let client;

    // A unique schema keeps these tests completely separate
    // from the normal ProjectForge development tables.
    const testSchema =
      `pfg7_validation_${process.pid}_${Date.now()}`;

    const expectedTables = [
      "development_updates",
      "milestones",
      "position_skills",
      "profiles",
      "project_applications",
      "project_memberships",
      "project_positions",
      "projects",
      "skills",
      "tasks",
      "team_radio_requests",
      "user_skills",
      "users",
    ];

    const expectedSeedCounts = {
      users: 3,
      profiles: 3,
      projects: 2,
      project_memberships: 5,
      milestones: 3,
      tasks: 6,
    };

    /**
     * Returns the row counts for the tables populated by the
     * PFG-10 development seed script.
     */
    async function getSeedCounts() {
      const counts = {};

      for (const tableName of Object.keys(expectedSeedCounts)) {
        const result = await client.query(
          `SELECT COUNT(*)::INTEGER AS count
           FROM ${tableName}`
        );

        counts[tableName] = result.rows[0].count;
      }

      return counts;
    }

    beforeAll(async () => {
      client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

      await client.connect();

      // pgcrypto supplies gen_random_uuid(), crypt() and
      // gen_salt() used by the migration and seed scripts.
      await client.query(
        "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public"
      );

      // Create an isolated namespace for the automated test.
      await client.query(
        `CREATE SCHEMA ${testSchema}`
      );

      await client.query(
        `SET search_path TO ${testSchema}, public`
      );

      // Execute the actual PFG-8 migration.
      await client.query(migrationSql);

      // Execute the actual PFG-10 development seed.
      await client.query(seedSql);
    });

    afterAll(async () => {
      if (!client) {
        return;
      }

      try {
        // Leave the temporary schema before removing it.
        await client.query(
          "SET search_path TO public"
        );

        await client.query(
          `DROP SCHEMA IF EXISTS ${testSchema} CASCADE`
        );
      } finally {
        await client.end();
      }
    });

    /**
     * PFG-8 validation:
     * Confirms that the migration creates the expected core
     * ProjectForge tables and important database constraints.
     */
    test(
      "creates the expected core schema with keys and constraints",
      async () => {
        const tableResult = await client.query(
          `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = $1
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
          `,
          [testSchema]
        );

        const actualTables = tableResult.rows.map(
          (row) => row.table_name
        );

        expect(actualTables).toEqual(
          expectedTables
        );

        // Verify the users table contains its primary key
        // and case-insensitive unique email index.
        const userIndexResult = await client.query(
          `
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = $1
              AND tablename = 'users'
          `,
          [testSchema]
        );

        const userIndexes = userIndexResult.rows.map(
          (row) => row.indexname
        );

        expect(userIndexes).toEqual(
          expect.arrayContaining([
            "users_pkey",
            "uq_users_email",
          ])
        );

        // Verify tasks preserve the required foreign-key
        // relationships to milestones and memberships.
        const taskForeignKeyResult = await client.query(
          `
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_schema = $1
              AND table_name = 'tasks'
              AND constraint_type = 'FOREIGN KEY'
          `,
          [testSchema]
        );

        const taskForeignKeys =
          taskForeignKeyResult.rows.map(
            (row) => row.constraint_name
          );

        expect(taskForeignKeys).toEqual(
          expect.arrayContaining([
            "fk_tasks_milestone",
            "fk_tasks_assignee",
          ])
        );

        // Verify the task status validation rule exists.
        const taskCheckResult = await client.query(
          `
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t
              ON c.conrelid = t.oid
            JOIN pg_namespace n
              ON t.relnamespace = n.oid
            WHERE n.nspname = $1
              AND t.relname = 'tasks'
              AND c.contype = 'c'
          `,
          [testSchema]
        );

        const taskChecks = taskCheckResult.rows.map(
          (row) => row.conname
        );

        expect(taskChecks).toContain(
          "chk_tasks_status"
        );
      }
    );

    /**
     * PFG-10 validation:
     * Confirms that the seed script creates the exact sample
     * development data required for local testing.
     */
    test(
      "creates the expected development seed data",
      async () => {
        const counts = await getSeedCounts();

        expect(counts).toEqual(
          expectedSeedCounts
        );

        // Verify that seeded tasks are connected through the
        // expected project -> milestone -> task -> assignee
        // relationships.
        const relationshipResult = await client.query(
          `
            SELECT
              p.title AS project,
              m.title AS milestone,
              t.title AS task,
              t.status,
              pr.display_name AS assignee
            FROM tasks t
            JOIN milestones m
              ON t.milestone_id = m.milestone_id
            JOIN projects p
              ON m.project_id = p.project_id
            LEFT JOIN project_memberships pm
              ON t.assignee_membership_id =
                 pm.membership_id
            LEFT JOIN profiles pr
              ON pm.user_id = pr.user_id
            ORDER BY
              p.title,
              m.title,
              t.title
          `
        );

        expect(
          relationshipResult.rows
        ).toHaveLength(6);

        for (const row of relationshipResult.rows) {
          expect(row.project).toBeTruthy();
          expect(row.milestone).toBeTruthy();
          expect(row.task).toBeTruthy();
          expect(row.status).toBeTruthy();
          expect(row.assignee).toBeTruthy();
        }
      }
    );

    /**
     * PFG-10 validation:
     * Confirms that rerunning the seed script does not create
     * duplicate development records.
     */
    test(
      "can rerun the development seed without duplicating records",
      async () => {
        const countsBefore =
          await getSeedCounts();

        await client.query(seedSql);

        const countsAfter =
          await getSeedCounts();

        expect(countsAfter).toEqual(
          countsBefore
        );

        expect(countsAfter).toEqual(
          expectedSeedCounts
        );
      }
    );
  }
);