const express = require("express");
const TeamHealthSummary =
  require("../models/TeamHealthSummary");


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
 * buildTeamHealthRouter
 *
 * Returns aggregated Team Health information.
 *
 * Access is limited to authenticated STUDENTS who
 * are active members of the requested project.
 *
 * Mentors and administrators must not receive
 * wellbeing/team-health information.
 */
function buildTeamHealthRouter(
  repository,
  authenticate,
  authorizeProjectMember
) {
  const router =
    express.Router();


  router.get(
    "/projects/:projectId/team-health/summary",

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
          periodStart
        } =
          req.query;


        if (
          !periodStart
        ) {
          return res
            .status(400)
            .json({
              error:
                "periodStart query parameter is required.",
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


        const aggregate =
          await repository
            .getAggregate(
              projectId,
              periodStart.trim()
            );


        const responseCount =
          Number(
            aggregate
              ?.response_count ??
            0
          );


        if (
          !Number.isInteger(
            responseCount
          ) ||
          responseCount <
            0
        ) {
          return res
            .status(500)
            .json({
              error:
                "Could not load team-health summary.",
            });
        }


        if (
          !TeamHealthSummary
            .IsPublishable(
              responseCount
            )
        ) {
          return res
            .status(200)
            .json({
              publishable:
                false,

              responseCount,

              message:
                "Not enough responses yet to show team-health results for this period.",
            });
        }


        return res
          .status(200)
          .json({
            publishable:
              true,

            responseCount,

            avgWorkload:
              aggregate
                .avg_workload,

            avgCommunication:
              aggregate
                .avg_communication,

            avgBlockerSeverity:
              aggregate
                .avg_blocker_severity,
          });
      }
      catch {
        return res
          .status(500)
          .json({
            error:
              "Could not load team-health summary.",
          });
      }
    }
  );


  return router;
}


module.exports =
  buildTeamHealthRouter;