const mockServer = {
  close: jest.fn(),
};

const mockListen =
  jest.fn(
    (port, callback) => {
      if (callback) {
        callback();
      }

      return mockServer;
    }
  );

const mockDatabaseCheck =
  jest.fn();


/*
 * Stub the two dependencies used by server.js.
 *
 * We do not need a real HTTP socket or PostgreSQL instance to verify
 * startup sequencing.
 */
jest.mock(
  "../app",
  () => ({
    listen: mockListen,
  })
);

jest.mock(
  "../config/db",
  () => ({
    testDatabaseConnection:
      mockDatabaseCheck,
  })
);


const {
  startServer,
} = require("../server");


describe(
  "ProjectForge server startup",
  () => {

    beforeEach(() => {
      jest.clearAllMocks();
    });


    /**
     * Normal startup:
     * database verification succeeds before the API begins listening.
     */
    test(
      "starts listening after the database check succeeds",
      async () => {

        mockDatabaseCheck
          .mockResolvedValue(true);

        const result =
          await startServer(4321);

        expect(
          mockDatabaseCheck
        ).toHaveBeenCalledTimes(1);

        expect(
          mockListen
        ).toHaveBeenCalledWith(
          4321,
          expect.any(Function)
        );

        expect(result)
          .toBe(mockServer);

        /*
         * Prove ordering rather than merely proving that both functions
         * happened at some point.
         */
        expect(
          mockDatabaseCheck
            .mock
            .invocationCallOrder[0]
        ).toBeLessThan(
          mockListen
            .mock
            .invocationCallOrder[0]
        );
      }
    );


    /**
     * Failure edge case:
     * ProjectForge must not accept HTTP traffic when its required database
     * is unavailable.
     */
    test(
      "does not start listening when the database check fails",
      async () => {

        mockDatabaseCheck
          .mockRejectedValue(
            new Error(
              "PostgreSQL unavailable"
            )
          );

        await expect(
          startServer(4321)
        ).rejects.toThrow(
          "PostgreSQL unavailable"
        );

        expect(
          mockListen
        ).not.toHaveBeenCalled();
      }
    );

  }
);