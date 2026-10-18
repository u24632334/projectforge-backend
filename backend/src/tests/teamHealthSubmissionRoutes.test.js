const express = require("express");
const request = require("supertest");

const buildTeamHealthSubmissionRouter =
  require("../routes/teamHealthSubmission");


/**
 * Stand-in for the real authentication middleware.
 *
 * Authentication establishes the user's identity and system role.
 * Project membership is deliberately handled separately below.
 */
function fakeAuthenticateAs(
  userId = "u1",
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


/**
 * Stand-in for the real project-membership middleware.
 *
 * A verified membership is attached to req.membership rather
 * than trusting anything supplied in the request body.
 */
function fakeAllowProjectAccess(
  membershipId = "m1"
) {
  return (
    req,
    res,
    next
  ) => {
    req.membership = {
      membershipId,

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
    membershipId = "m1",
  } = {}
) {
  const app =
    express();


  app.use(
    express.json()
  );


  app.use(
    "/api",

    buildTeamHealthSubmissionRouter(
      repository,

      fakeAuthenticateAs(
        userId,
        role
      ),

      fakeAllowProjectAccess(
        membershipId
      )
    )
  );


  return app;
}


describe(
  "POST /api/projects/:projectId/team-health/checkins",
  () => {

    test(
      "saves a valid first-time Student check-in and returns 201",
      async () => {

        const repository = {
          hasSubmitted:
            jest
              .fn()
              .mockResolvedValue(
                false
              ),

          insertResponse:
            jest
              .fn()
              .mockResolvedValue(
                {}
              ),

          insertReceipt:
            jest
              .fn()
              .mockResolvedValue(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .post(
              "/api/projects/p1/team-health/checkins"
            )
            .send({
              periodStart:
                "2026-09-21",

              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,
            });


        expect(
          res.status
        ).toBe(201);


        expect(
          res.body
        ).toEqual({
          submitted:
            true,
        });


        expect(
          repository.hasSubmitted
        ).toHaveBeenCalledWith(
          "m1",
          "2026-09-21"
        );


        expect(
          repository.insertResponse
        ).toHaveBeenCalledTimes(
          1
        );


        expect(
          repository.insertReceipt
        ).toHaveBeenCalledTimes(
          1
        );


        /*
         * The response must not reveal the anonymous
         * survey values or the member's identity.
         */
        expect(
          res.body.membershipId
        ).toBeUndefined();


        expect(
          res.body.workload
        ).toBeUndefined();


        expect(
          res.body.communication
        ).toBeUndefined();


        expect(
          res.body.blockerSeverity
        ).toBeUndefined();
      }
    );


    /**
     * SRS / Group Design duplicate-submission rule.
     */
    test(
      "rejects a second submission for the same period with 409",
      async () => {

        const repository = {
          hasSubmitted:
            jest
              .fn()
              .mockResolvedValue(
                true
              ),

          insertResponse:
            jest.fn(),

          insertReceipt:
            jest.fn(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .post(
              "/api/projects/p1/team-health/checkins"
            )
            .send({
              periodStart:
                "2026-09-21",

              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,
            });


        expect(
          res.status
        ).toBe(409);


        expect(
          repository.hasSubmitted
        ).toHaveBeenCalledWith(
          "m1",
          "2026-09-21"
        );


        expect(
          repository.insertResponse
        ).not.toHaveBeenCalled();


        expect(
          repository.insertReceipt
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects invalid scores with 400 and does not touch repository writes",
      async () => {

        const repository = {
          hasSubmitted:
            jest
              .fn()
              .mockResolvedValue(
                false
              ),

          insertResponse:
            jest.fn(),

          insertReceipt:
            jest.fn(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .post(
              "/api/projects/p1/team-health/checkins"
            )
            .send({
              periodStart:
                "2026-09-21",

              workload:
                9,

              communication:
                4,

              blockerSeverity:
                2,
            });


        expect(
          res.status
        ).toBe(400);


        expect(
          repository.insertResponse
        ).not.toHaveBeenCalled();


        expect(
          repository.insertReceipt
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "requires periodStart before checking for duplicates",
      async () => {

        const repository = {
          hasSubmitted:
            jest.fn(),

          insertResponse:
            jest.fn(),

          insertReceipt:
            jest.fn(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .post(
              "/api/projects/p1/team-health/checkins"
            )
            .send({
              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,
            });


        expect(
          res.status
        ).toBe(400);


        expect(
          repository.hasSubmitted
        ).not.toHaveBeenCalled();


        expect(
          repository.insertResponse
        ).not.toHaveBeenCalled();


        expect(
          repository.insertReceipt
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects an invalid periodStart date",
      async () => {

        const repository = {
          hasSubmitted:
            jest.fn(),

          insertResponse:
            jest.fn(),

          insertReceipt:
            jest.fn(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .post(
              "/api/projects/p1/team-health/checkins"
            )
            .send({
              periodStart:
                "2026-02-31",

              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,
            });


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
          repository.hasSubmitted
        ).not.toHaveBeenCalled();


        expect(
          repository.insertResponse
        ).not.toHaveBeenCalled();


        expect(
          repository.insertReceipt
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects Mentor accounts from submitting Team Health check-ins",
      async () => {

        const repository = {
          hasSubmitted:
            jest.fn(),

          insertResponse:
            jest.fn(),

          insertReceipt:
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

              membershipId:
                "mentor-membership-1",
            }
          );


        const res =
          await request(app)
            .post(
              "/api/projects/p1/team-health/checkins"
            )
            .send({
              periodStart:
                "2026-09-21",

              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,
            });


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
          repository.hasSubmitted
        ).not.toHaveBeenCalled();


        expect(
          repository.insertResponse
        ).not.toHaveBeenCalled();


        expect(
          repository.insertReceipt
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects Administrator accounts from submitting Team Health check-ins",
      async () => {

        const repository = {
          hasSubmitted:
            jest.fn(),

          insertResponse:
            jest.fn(),

          insertReceipt:
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

              membershipId:
                "admin-membership-1",
            }
          );


        const res =
          await request(app)
            .post(
              "/api/projects/p1/team-health/checkins"
            )
            .send({
              periodStart:
                "2026-09-21",

              workload:
                3,

              communication:
                4,

              blockerSeverity:
                2,
            });


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
          repository.hasSubmitted
        ).not.toHaveBeenCalled();


        expect(
          repository.insertResponse
        ).not.toHaveBeenCalled();


        expect(
          repository.insertReceipt
        ).not.toHaveBeenCalled();
      }
    );

  }
);