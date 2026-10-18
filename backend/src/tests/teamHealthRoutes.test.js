const express = require("express");
const request = require("supertest");
const buildTeamHealthRouter =
  require("../routes/teamHealth");


function fakeAuthenticateAs(
  userId,
  role = "STUDENT"
) {
  return (
    req,
    res,
    next
  ) => {
    req.user = {
      id: userId,
      role,
    };

    next();
  };
}


function fakeAllowProjectAccess() {
  return (
    req,
    res,
    next
  ) => {
    req.membership = {
      membershipId:
        "membership-1",

      projectId:
        req.params.projectId,

      userId:
        req.user.id,

      memberRole:
        "MEMBER",

      active:
        true,
    };

    next();
  };
}


function buildApp(
  repository,
  {
    userId = "u1",
    role = "STUDENT",
  } = {}
) {
  const app =
    express();


  app.use(
    express.json()
  );


  app.use(
    "/api",
    buildTeamHealthRouter(
      repository,

      fakeAuthenticateAs(
        userId,
        role
      ),

      fakeAllowProjectAccess()
    )
  );


  return app;
}


describe(
  "GET /api/projects/:projectId/team-health/summary",
  () => {

    test(
      "requires a periodStart query parameter",
      async () => {

        const repository = {
          getAggregate:
            jest.fn(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .get(
              "/api/projects/p1/team-health/summary"
            );


        expect(
          res.status
        ).toBe(400);


        expect(
          repository.getAggregate
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects an invalid periodStart date",
      async () => {

        const repository = {
          getAggregate:
            jest.fn(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .get(
              "/api/projects/p1/team-health/summary?periodStart=2026-02-31"
            );


        expect(
          res.status
        ).toBe(400);


        expect(
          res.body
        ).toEqual({
          error:
            "periodStart must be a valid date in YYYY-MM-DD format.",
        });


        expect(
          repository.getAggregate
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "returns publishable:false when fewer than 3 responses exist",
      async () => {

        const repository = {
          getAggregate:
            jest
              .fn()
              .mockResolvedValue({
                response_count:
                  2,
              }),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .get(
              "/api/projects/p1/team-health/summary?periodStart=2026-09-07"
            );


        expect(
          res.status
        ).toBe(200);


        expect(
          res.body.publishable
        ).toBe(false);


        expect(
          res.body.responseCount
        ).toBe(2);


        expect(
          repository.getAggregate
        ).toHaveBeenCalledWith(
          "p1",
          "2026-09-07"
        );
      }
    );


    test(
      "returns aggregated indicators once 3 or more responses exist",
      async () => {

        const repository = {
          getAggregate:
            jest
              .fn()
              .mockResolvedValue({
                response_count:
                  4,

                avg_workload:
                  3.5,

                avg_communication:
                  4,

                avg_blocker_severity:
                  2,
              }),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .get(
              "/api/projects/p1/team-health/summary?periodStart=2026-09-07"
            );


        expect(
          res.status
        ).toBe(200);


        expect(
          res.body.publishable
        ).toBe(true);


        expect(
          res.body.responseCount
        ).toBe(4);


        expect(
          res.body.avgWorkload
        ).toBe(3.5);


        expect(
          res.body.avgCommunication
        ).toBe(4);


        expect(
          res.body.avgBlockerSeverity
        ).toBe(2);
      }
    );


    test(
      "treats no rows at all as zero responses, not an error",
      async () => {

        const repository = {
          getAggregate:
            jest
              .fn()
              .mockResolvedValue(
                undefined
              ),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .get(
              "/api/projects/p1/team-health/summary?periodStart=2026-09-07"
            );


        expect(
          res.status
        ).toBe(200);


        expect(
          res.body.publishable
        ).toBe(false);


        expect(
          res.body.responseCount
        ).toBe(0);
      }
    );


    test(
      "rejects Mentor accounts from viewing Team Health summaries",
      async () => {

        const repository = {
          getAggregate:
            jest.fn(),
        };


        const app =
          buildApp(
            repository,
            {
              userId:
                "mentor-1",

              role:
                "MENTOR",
            }
          );


        const res =
          await request(app)
            .get(
              "/api/projects/p1/team-health/summary?periodStart=2026-09-07"
            );


        expect(
          res.status
        ).toBe(403);


        expect(
          res.body
        ).toEqual({
          success:
            false,

          error:
            "Student access required.",
        });


        expect(
          repository.getAggregate
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects Administrator accounts from viewing Team Health summaries",
      async () => {

        const repository = {
          getAggregate:
            jest.fn(),
        };


        const app =
          buildApp(
            repository,
            {
              userId:
                "admin-1",

              role:
                "ADMIN",
            }
          );


        const res =
          await request(app)
            .get(
              "/api/projects/p1/team-health/summary?periodStart=2026-09-07"
            );


        expect(
          res.status
        ).toBe(403);


        expect(
          res.body
        ).toEqual({
          success:
            false,

          error:
            "Student access required.",
        });


        expect(
          repository.getAggregate
        ).not.toHaveBeenCalled();
      }
    );

  }
);