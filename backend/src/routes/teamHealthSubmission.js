const express = require("express");

const {
  TeamHealthResponse,
} =
  require("../models/TeamHealthResponse");

const TeamHealthSubmissionReceipt =
  require(
    "../models/TeamHealthSubmissionReceipt"
  );


function requireStudent(
  req,
  res,
  next
) {
  if (!req.user) {
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


function isValidPeriodStart(
  value
) {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  const cleanValue =
    value.trim();


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      cleanValue
    )
  ) {
    return false;
  }


  const [
    yearText,
    monthText,
    dayText
  ] =
    cleanValue.split("-");


  const year =
    Number(yearText);

  const month =
    Number(monthText);

  const day =
    Number(dayText);


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  );
}


/**
 * buildTeamHealthSubmissionRouter
 *
 * Anonymous Team Health submissions are available only
 * to authenticated STUDENTS who hold an active membership
 * in the requested project.
 *
 * The response itself deliberately contains no user or
 * membership identifier. A separate receipt is used only
 * to prevent duplicate submissions.
 */
function buildTeamHealthSubmissionRouter(
  repository,
  authenticate,
  authorizeProjectMember
) {
  const router =
    express.Router();


  router.post(
    "/projects/:projectId/team-health/checkins",

    authenticate,

    requireStudent,

    authorizeProjectMember,

    async (
      req,
      res
    ) => {
      try {
        const {
          projectId
        } =
          req.params;


        const {
          workload,
          communication,
          blockerSeverity,
          periodStart,
        } =
          req.body ||
          {};


        if (
          !periodStart
        ) {
          return res
            .status(400)
            .json({
              error:
                "periodStart is required.",
            });
        }


        if (
          !isValidPeriodStart(
            periodStart
          )
        ) {
          return res
            .status(400)
            .json({
              error:
                "periodStart must be a valid date in YYYY-MM-DD format.",
            });
        }


        /*
         * Different membership middleware versions used by
         * ProjectForge have attached the verified membership
         * either to req.membership or req.user.
         *
         * Support both trusted middleware locations, but never
         * read a membership ID from the request body.
         */
        const membershipId =
          req.membership
            ?.membershipId ||
          req.membership
            ?.membership_id ||
          req.user
            ?.membershipId ||
          req.user
            ?.membership_id ||
          null;


        if (
          !membershipId
        ) {
          return res
            .status(403)
            .json({
              error:
                "Active project membership is required.",
            });
        }


        const cleanPeriodStart =
          periodStart.trim();


        const alreadySubmitted =
          await repository
            .hasSubmitted(
              membershipId,
              cleanPeriodStart
            );


        if (
          alreadySubmitted
        ) {
          return res
            .status(409)
            .json({
              error:
                "You have already submitted a team-health check-in for this period.",
            });
        }


        const response =
          new TeamHealthResponse({
            projectId,

            periodStart:
              cleanPeriodStart,

            workload,

            communication,

            blockerSeverity,
          });


        if (
          !response.ValidateScores()
        ) {
          return res
            .status(400)
            .json({
              error:
                "Workload, communication and blocker severity must each be a whole number between 1 and 5.",
            });
        }


        await repository
          .insertResponse(
            response
          );


        const receipt =
          new TeamHealthSubmissionReceipt({
            membershipId,

            periodStart:
              cleanPeriodStart,
          });


        await repository
          .insertReceipt(
            receipt
          );


        /*
         * Never return the anonymous survey values,
         * membership ID or saved database row.
         */
        return res
          .status(201)
          .json({
            submitted:
              true,
          });
      }
      catch {
        return res
          .status(500)
          .json({
            error:
              "Could not submit check-in.",
          });
      }
    }
  );


  return router;
}


module.exports =
  buildTeamHealthSubmissionRouter;