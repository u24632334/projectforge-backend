const app =
  require("./app");

const {
  testDatabaseConnection,
} = require("./config/db");


const DEFAULT_PORT =
  Number(process.env.PORT) || 3000;


/**
 * Starts the ProjectForge API only after PostgreSQL has been verified.
 *
 * Keeping startup logic in a function makes it possible to test the
 * behaviour independently using stubs. It also prevents the application
 * from listening for HTTP requests while its required persistence layer
 * is unavailable.
 *
 * @param {number} port HTTP port on which the API should listen.
 * @returns {Promise<import("http").Server>} running HTTP server.
 * @throws {Error} if the initial PostgreSQL verification fails.
 */
async function startServer(
  port = DEFAULT_PORT
) {
  await testDatabaseConnection();

  return app.listen(
    port,
    () => {
      console.log(
        `ProjectForge API running on port ${port}`
      );
    }
  );
}


/*
 * Start automatically only when this file is executed directly.
 *
 * During Jest tests the module is imported instead, allowing startServer()
 * to be exercised with stubbed dependencies without opening a real port.
 */
if (require.main === module) {
  startServer().catch(
    (error) => {
      console.error(
        "ProjectForge startup failed:",
        error
      );

      process.exit(1);
    }
  );
}


module.exports = {
  startServer,
};