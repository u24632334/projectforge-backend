const express = require("express");
const {
  PitWallCheckIn,
} = require("../models/PitWallCheckIn");


/**
 * Student-only authorisation guard for Pit Wall.
 *
 * authGuard/authenticate must run before this middleware
 * and populate req.user from the verified JWT.
 *
 * Mentors and administrators are deliberately blocked
 * from private Pit Wall information.
 */
function requireStudent(req, res, next) {
  if (
    !req.user
  ) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }


  const role =
    String(
      req.user.role ||
      ""
    )
      .trim()
      .toUpperCase();


  if (
    role !==
    "STUDENT"
  ) {
    return res.status(403).json({
      success: false,
      error: "Student access required.",
    });
  }


  return next();
}


/**
 * buildPitWallRouter
 *
 * PFG-60:
 * Private POST and GET operations for Pit Wall check-ins.
 *
 * The router remains a factory so it can be tested with
 * an injected repository and authentication middleware.
 */
function buildPitWallRouter(
  repository,
  authenticate
) {
  const router =
    express.Router();


  /**
   * PF-PIT-01 / PF-PIT-02
   *
   * An authenticated STUDENT submits a private check-in.
   *
   * The authenticated user ID always comes from req.user.
   * A userId supplied in the body is ignored.
   */
  router.post(
    "/checkins",
    authenticate,
    requireStudent,
    async (
      req,
      res
    ) => {
      try {
        const {
          workload,
          motivation,
          capacity,
          privateNote,
        } =
          req.body ||
          {};


        const checkIn =
          new PitWallCheckIn({
            userId:
              req.user.id,

            workload,

            motivation,

            capacity,

            privateNote,
          });


        if (
          !checkIn.ValidateScores()
        ) {
          return res
            .status(400)
            .json({
              error:
                "Workload, motivation and capacity must each be a whole number between 1 and 5.",
            });
        }


        if (
          !checkIn.ValidateNote()
        ) {
          return res
            .status(400)
            .json({
              error:
                "Maximum characters exceeded. Pit Wall notes may not exceed 1000 characters.",
            });
        }


        const saved =
          await repository.insert(
            checkIn
          );


        return res
          .status(201)
          .json(
            saved
          );
      }
      catch {
        return res
          .status(500)
          .json({
            error:
              "Could not save check-in.",
          });
      }
    }
  );


  /**
   * PF-PIT-03 / PF-SHOW-04
   *
   * A STUDENT may only read their own private check-ins.
   *
   * Mentors and administrators receive 403 even if they
   * possess a valid authenticated session.
   */
  router.get(
    "/checkins/me",
    authenticate,
    requireStudent,
    async (
      req,
      res
    ) => {
      try {
        const checkIns =
          await repository.findByUser(
            req.user.id
          );


        return res
          .status(200)
          .json(
            checkIns
          );
      }
      catch {
        return res
          .status(500)
          .json({
            error:
              "Could not load check-ins.",
          });
      }
    }
  );


  return router;
}


module.exports =
  buildPitWallRouter;