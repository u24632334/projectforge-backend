const TeamHealthSubmissionRepository =
  require("../db/teamHealthSubmissionRepository");


describe(
  "TeamHealthSubmissionRepository",
  () => {

    test(
      "hasSubmitted returns true when a receipt row exists",
      async () => {

        const pool = {
          query:
            jest
              .fn()
              .mockResolvedValue({
                rows: [
                  {
                    "?column?":
                      1,
                  },
                ],
              }),
        };


        const repository =
          new TeamHealthSubmissionRepository(
            pool
          );


        const result =
          await repository
            .hasSubmitted(
              "m1",
              "2026-09-21"
            );


        expect(
          pool.query
        ).toHaveBeenCalledWith(
          expect.any(String),
          [
            "m1",
            "2026-09-21",
          ]
        );


        expect(
          result
        ).toBe(true);
      }
    );


    test(
      "hasSubmitted returns false when no receipt row exists",
      async () => {

        const pool = {
          query:
            jest
              .fn()
              .mockResolvedValue({
                rows: [],
              }),
        };


        const repository =
          new TeamHealthSubmissionRepository(
            pool
          );


        const result =
          await repository
            .hasSubmitted(
              "m1",
              "2026-09-21"
            );


        expect(
          result
        ).toBe(false);
      }
    );


    test(
      "insertResponse sends an INSERT into team_health_responses",
      async () => {

        const fakeRow = {
          response_id:
            "r1",
        };


        const pool = {
          query:
            jest
              .fn()
              .mockResolvedValue({
                rows: [
                  fakeRow,
                ],
              }),
        };


        const repository =
          new TeamHealthSubmissionRepository(
            pool
          );


        const createdAt =
          new Date(
            "2026-09-21T10:00:00.000Z"
          );


        const result =
          await repository
            .insertResponse({
              responseId:
                "r1",

              projectId:
                "p1",

              periodStart:
                "2026-09-21",

              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,

              createdAt,
            });


        expect(
          pool.query.mock
            .calls[0][0]
        ).toMatch(
          /INSERT INTO team_health_responses/i
        );


        expect(
          pool.query.mock
            .calls[0][1]
        ).toEqual([
          "r1",
          "p1",
          "2026-09-21",
          3,
          4,
          2,
          createdAt,
        ]);


        expect(
          result
        ).toEqual(
          fakeRow
        );
      }
    );


    test(
      "insertReceipt sends an INSERT into team_health_submission_receipts",
      async () => {

        const pool = {
          query:
            jest
              .fn()
              .mockResolvedValue({
                rows: [],
              }),
        };


        const repository =
          new TeamHealthSubmissionRepository(
            pool
          );


        const submittedAt =
          new Date(
            "2026-09-21T10:05:00.000Z"
          );


        await repository
          .insertReceipt({
            receiptId:
              "rc1",

            membershipId:
              "m1",

            periodStart:
              "2026-09-21",

            submittedAt,
          });


        expect(
          pool.query.mock
            .calls[0][0]
        ).toMatch(
          /INSERT INTO team_health_submission_receipts/i
        );


        expect(
          pool.query.mock
            .calls[0][1]
        ).toEqual([
          "rc1",
          "m1",
          "2026-09-21",
          submittedAt,
        ]);
      }
    );


    test(
      "submit stores the anonymous response and receipt in one transaction and commits",
      async () => {

        const responseRow = {
          response_id:
            "r1",

          project_id:
            "p1",
        };


        const client = {
          query:
            jest.fn(),

          release:
            jest.fn(),
        };


        client.query
          .mockImplementation(
            async (
              query
            ) => {

              if (
                query ===
                "BEGIN"
              ) {
                return {
                  rows: [],
                };
              }


              if (
                query ===
                "COMMIT"
              ) {
                return {
                  rows: [],
                };
              }


              if (
                String(
                  query
                ).includes(
                  "INSERT INTO team_health_responses"
                )
              ) {
                return {
                  rows: [
                    responseRow,
                  ],
                };
              }


              if (
                String(
                  query
                ).includes(
                  "INSERT INTO team_health_submission_receipts"
                )
              ) {
                return {
                  rows: [],
                };
              }


              throw new Error(
                "Unexpected query in test."
              );
            }
          );


        const pool = {
          connect:
            jest
              .fn()
              .mockResolvedValue(
                client
              ),
        };


        const repository =
          new TeamHealthSubmissionRepository(
            pool
          );


        const createdAt =
          new Date(
            "2026-09-21T10:00:00.000Z"
          );


        const submittedAt =
          new Date(
            "2026-09-21T10:05:00.000Z"
          );


        const response = {
          responseId:
            "r1",

          projectId:
            "p1",

          periodStart:
            "2026-09-21",

          workload:
            3,

          communication:
            4,

          blockerSeverity:
            2,

          createdAt,
        };


        const receipt = {
          receiptId:
            "rc1",

          membershipId:
            "m1",

          periodStart:
            "2026-09-21",

          submittedAt,
        };


        const result =
          await repository
            .submit(
              response,
              receipt
            );


        expect(
          pool.connect
        ).toHaveBeenCalledTimes(
          1
        );


        expect(
          client.query
        ).toHaveBeenNthCalledWith(
          1,
          "BEGIN"
        );


        expect(
          client.query.mock
            .calls[1][0]
        ).toMatch(
          /INSERT INTO team_health_responses/i
        );


        expect(
          client.query.mock
            .calls[1][1]
        ).toEqual([
          "r1",
          "p1",
          "2026-09-21",
          3,
          4,
          2,
          createdAt,
        ]);


        expect(
          client.query.mock
            .calls[2][0]
        ).toMatch(
          /INSERT INTO team_health_submission_receipts/i
        );


        expect(
          client.query.mock
            .calls[2][1]
        ).toEqual([
          "rc1",
          "m1",
          "2026-09-21",
          submittedAt,
        ]);


        expect(
          client.query
        ).toHaveBeenNthCalledWith(
          4,
          "COMMIT"
        );


        expect(
          client.query
        ).not.toHaveBeenCalledWith(
          "ROLLBACK"
        );


        expect(
          client.release
        ).toHaveBeenCalledTimes(
          1
        );


        expect(
          result
        ).toEqual(
          responseRow
        );
      }
    );


    test(
      "submit rolls back the anonymous response when the receipt insert fails",
      async () => {

        const receiptError =
          new Error(
            "duplicate receipt"
          );


        const client = {
          query:
            jest.fn(),

          release:
            jest.fn(),
        };


        client.query
          .mockImplementation(
            async (
              query
            ) => {

              if (
                query ===
                "BEGIN"
              ) {
                return {
                  rows: [],
                };
              }


              if (
                query ===
                "ROLLBACK"
              ) {
                return {
                  rows: [],
                };
              }


              if (
                String(
                  query
                ).includes(
                  "INSERT INTO team_health_responses"
                )
              ) {
                return {
                  rows: [
                    {
                      response_id:
                        "r1",
                    },
                  ],
                };
              }


              if (
                String(
                  query
                ).includes(
                  "INSERT INTO team_health_submission_receipts"
                )
              ) {
                throw receiptError;
              }


              throw new Error(
                "Unexpected query in test."
              );
            }
          );


        const pool = {
          connect:
            jest
              .fn()
              .mockResolvedValue(
                client
              ),
        };


        const repository =
          new TeamHealthSubmissionRepository(
            pool
          );


        const response = {
          responseId:
            "r1",

          projectId:
            "p1",

          periodStart:
            "2026-09-21",

          workload:
            3,

          communication:
            4,

          blockerSeverity:
            2,

          createdAt:
            new Date(
              "2026-09-21T10:00:00.000Z"
            ),
        };


        const receipt = {
          receiptId:
            "rc1",

          membershipId:
            "m1",

          periodStart:
            "2026-09-21",

          submittedAt:
            new Date(
              "2026-09-21T10:05:00.000Z"
            ),
        };


        await expect(
          repository.submit(
            response,
            receipt
          )
        ).rejects.toBe(
          receiptError
        );


        expect(
          client.query
        ).toHaveBeenNthCalledWith(
          1,
          "BEGIN"
        );


        expect(
          client.query.mock
            .calls[1][0]
        ).toMatch(
          /INSERT INTO team_health_responses/i
        );


        expect(
          client.query.mock
            .calls[2][0]
        ).toMatch(
          /INSERT INTO team_health_submission_receipts/i
        );


        expect(
          client.query
        ).toHaveBeenCalledWith(
          "ROLLBACK"
        );


        expect(
          client.query
        ).not.toHaveBeenCalledWith(
          "COMMIT"
        );


        expect(
          client.release
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    test(
      "submit always releases the database client when the response insert fails",
      async () => {

        const responseError =
          new Error(
            "response insert failed"
          );


        const client = {
          query:
            jest.fn(),

          release:
            jest.fn(),
        };


        client.query
          .mockImplementation(
            async (
              query
            ) => {

              if (
                query ===
                "BEGIN"
              ) {
                return {
                  rows: [],
                };
              }


              if (
                query ===
                "ROLLBACK"
              ) {
                return {
                  rows: [],
                };
              }


              if (
                String(
                  query
                ).includes(
                  "INSERT INTO team_health_responses"
                )
              ) {
                throw responseError;
              }


              throw new Error(
                "Unexpected query in test."
              );
            }
          );


        const pool = {
          connect:
            jest
              .fn()
              .mockResolvedValue(
                client
              ),
        };


        const repository =
          new TeamHealthSubmissionRepository(
            pool
          );


        await expect(
          repository.submit(
            {
              responseId:
                "r1",

              projectId:
                "p1",

              periodStart:
                "2026-09-21",

              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,

              createdAt:
                new Date(),
            },

            {
              receiptId:
                "rc1",

              membershipId:
                "m1",

              periodStart:
                "2026-09-21",

              submittedAt:
                new Date(),
            }
          )
        ).rejects.toBe(
          responseError
        );


        expect(
          client.query
        ).toHaveBeenCalledWith(
          "ROLLBACK"
        );


        expect(
          client.query
        ).not.toHaveBeenCalledWith(
          "COMMIT"
        );


        expect(
          client.release
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

  }
);