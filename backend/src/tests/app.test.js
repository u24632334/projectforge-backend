const request =
  require("supertest");

const app =
  require("../app");

const { pool } =
  require("../config/db");


describe(
  "ProjectForge Express application",
  () => {

    /**
     * Confirms that the shared API entry point is alive and returns the
     * agreed ProjectForge health-check contract.
     */
    test(
      "GET /api/health returns 200 and API status",
      async () => {

        const response =
          await request(app)
            .get("/api/health");

        expect(response.statusCode)
          .toBe(200);

        expect(response.body)
          .toEqual({
            status: "OK",
            service:
              "ProjectForge API",
          });

        expect(
          response.headers[
            "content-type"
          ]
        ).toMatch(/json/);
      }
    );


    /**
     * Query-string values must not change the health endpoint's route
     * matching or response contract.
     */
    test(
      "GET /api/health still succeeds when a query string is supplied",
      async () => {

        const response =
          await request(app)
            .get(
              "/api/health?source=individual-demo"
            );

        expect(response.statusCode)
          .toBe(200);

        expect(response.body)
          .toEqual({
            status: "OK",
            service:
              "ProjectForge API",
          });
      }
    );


    /**
     * Unknown GET requests must reach the application's final 404 handler
     * rather than hanging or returning an HTML Express error page.
     */
    test(
      "unknown GET route returns the standard JSON 404 response",
      async () => {

        const response =
          await request(app)
            .get(
              "/api/route-that-does-not-exist"
            );

        expect(response.statusCode)
          .toBe(404);

        expect(response.body)
          .toEqual({
            error:
              "Route not found",
          });
      }
    );


    /**
     * Route handling must remain consistent for other HTTP methods as well.
     * A nonexistent POST endpoint must not accidentally be accepted.
     */
    test(
      "unknown POST route also returns the standard JSON 404 response",
      async () => {

        const response =
          await request(app)
            .post(
              "/api/route-that-does-not-exist"
            )
            .send({
              example: "data",
            });

        expect(response.statusCode)
          .toBe(404);

        expect(response.body)
          .toEqual({
            error:
              "Route not found",
          });
      }
    );

  }
);


afterAll(async () => {
  await pool.end();
});