const express = require("express");
const request = require("supertest");
const buildPitWallRouter = require("../routes/pitwall");


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


function buildApp(
  repository,
  userId = "u1",
  role = "STUDENT"
) {
  const app =
    express();


  app.use(
    express.json()
  );


  app.use(
    "/api/pitwall",
    buildPitWallRouter(
      repository,
      fakeAuthenticateAs(
        userId,
        role
      )
    )
  );


  return app;
}


describe(
  "POST /api/pitwall/checkins",
  () => {

    test(
      "saves a valid student check-in and returns 201",
      async () => {

        const repository = {
          insert:
            jest
              .fn()
              .mockResolvedValue({
                check_in_id:
                  "1",
              }),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .post(
              "/api/pitwall/checkins"
            )
            .send({
              workload:
                3,

              motivation:
                4,

              capacity:
                2,
            });


        expect(
          res.status
        ).toBe(201);


        expect(
          repository.insert
        ).toHaveBeenCalledTimes(
          1
        );


        const savedCheckIn =
          repository.insert
            .mock.calls[0][0];


        expect(
          savedCheckIn.userId
        ).toBe("u1");
      }
    );


    test(
      "rejects invalid scores with 400 and does not touch the repository",
      async () => {

        const repository = {
          insert:
            jest.fn(),
        };


        const app =
          buildApp(
            repository
          );


        const res =
          await request(app)
            .post(
              "/api/pitwall/checkins"
            )
            .send({
              workload:
                9,

              motivation:
                4,

              capacity:
                2,
            });


        expect(
          res.status
        ).toBe(400);


        expect(
          repository.insert
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects Mentor accounts with 403 and does not save private Pit Wall data",
      async () => {

        const repository = {
          insert:
            jest.fn(),
        };


        const app =
          buildApp(
            repository,
            "mentor-1",
            "MENTOR"
          );


        const res =
          await request(app)
            .post(
              "/api/pitwall/checkins"
            )
            .send({
              workload:
                3,

              motivation:
                4,

              capacity:
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
          repository.insert
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects Administrator accounts with 403 and does not save private Pit Wall data",
      async () => {

        const repository = {
          insert:
            jest.fn(),
        };


        const app =
          buildApp(
            repository,
            "admin-1",
            "ADMIN"
          );


        const res =
          await request(app)
            .post(
              "/api/pitwall/checkins"
            )
            .send({
              workload:
                3,

              motivation:
                4,

              capacity:
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
          repository.insert
        ).not.toHaveBeenCalled();
      }
    );

  }
);


describe(
  "GET /api/pitwall/checkins/me",
  () => {

    test(
      "returns only the authenticated student's own check-ins",
      async () => {

        const repository = {
          findByUser:
            jest
              .fn()
              .mockResolvedValue([
                {
                  user_id:
                    "u1",
                },
              ]),
        };


        const app =
          buildApp(
            repository,
            "u1",
            "STUDENT"
          );


        const res =
          await request(app)
            .get(
              "/api/pitwall/checkins/me"
            );


        expect(
          res.status
        ).toBe(200);


        expect(
          repository.findByUser
        ).toHaveBeenCalledWith(
          "u1"
        );


        expect(
          res.body
        ).toEqual([
          {
            user_id:
              "u1",
          },
        ]);
      }
    );


    test(
      "rejects Mentor accounts from reading private Pit Wall check-ins",
      async () => {

        const repository = {
          findByUser:
            jest.fn(),
        };


        const app =
          buildApp(
            repository,
            "mentor-1",
            "MENTOR"
          );


        const res =
          await request(app)
            .get(
              "/api/pitwall/checkins/me"
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
          repository.findByUser
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "rejects Administrator accounts from reading private Pit Wall check-ins",
      async () => {

        const repository = {
          findByUser:
            jest.fn(),
        };


        const app =
          buildApp(
            repository,
            "admin-1",
            "ADMIN"
          );


        const res =
          await request(app)
            .get(
              "/api/pitwall/checkins/me"
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
          repository.findByUser
        ).not.toHaveBeenCalled();
      }
    );

  }
);