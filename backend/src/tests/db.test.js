const mockQuery =
  jest.fn();

const mockRelease =
  jest.fn();

const mockConnect =
  jest.fn();

const mockPool = {
  connect: mockConnect,
};


/*
 * Stub PostgreSQL itself.
 *
 * These are unit tests of our connection-management code, not tests of
 * PostgreSQL. Using this stub allows success and failure conditions to be
 * reproduced deterministically without relying on an external server.
 */
jest.mock("pg", () => ({
  Pool: jest.fn(() => mockPool),
}));


const {
  testDatabaseConnection,
} = require("../config/db");


describe(
  "ProjectForge PostgreSQL connection",
  () => {

    beforeEach(() => {
      jest.clearAllMocks();
    });


    /**
     * Happy path:
     * connection obtained -> query succeeds -> connection released.
     */
    test(
      "returns true when the database connection succeeds",
      async () => {

        mockConnect.mockResolvedValue({
          query: mockQuery,
          release: mockRelease,
        });

        mockQuery.mockResolvedValue({
          rows: [{ "?column?": 1 }],
        });

        await expect(
          testDatabaseConnection()
        ).resolves.toBe(true);

        expect(mockConnect)
          .toHaveBeenCalledTimes(1);

        expect(mockQuery)
          .toHaveBeenCalledWith(
            "SELECT 1"
          );

        expect(mockRelease)
          .toHaveBeenCalledTimes(1);
      }
    );


    /**
     * Edge case:
     * PostgreSQL accepts the connection but the verification query fails.
     *
     * The important behaviour is that the client is still released.
     */
    test(
      "rejects and releases the client when the database query fails",
      async () => {

        const queryError =
          new Error(
            "Database query failed"
          );

        mockConnect.mockResolvedValue({
          query: mockQuery,
          release: mockRelease,
        });

        mockQuery.mockRejectedValue(
          queryError
        );

        await expect(
          testDatabaseConnection()
        ).rejects.toThrow(
          "Database query failed"
        );

        expect(mockRelease)
          .toHaveBeenCalledTimes(1);
      }
    );


    /**
     * Edge case:
     * No database connection can be obtained at all.
     *
     * In this condition no client exists to release and the connection
     * failure must propagate to the server startup code.
     */
    test(
      "rejects when PostgreSQL cannot provide a connection",
      async () => {

        const connectionError =
          new Error(
            "PostgreSQL unavailable"
          );

        mockConnect.mockRejectedValue(
          connectionError
        );

        await expect(
          testDatabaseConnection()
        ).rejects.toThrow(
          "PostgreSQL unavailable"
        );

        expect(mockQuery)
          .not.toHaveBeenCalled();

        expect(mockRelease)
          .not.toHaveBeenCalled();
      }
    );

  }
);