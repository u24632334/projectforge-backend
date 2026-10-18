const express = require("express");
const request = require("supertest");


/**
 * PFG-86 - Automated API Integration Workflow
 *
 * Jira workflow:
 *
 * User Registration
 *      ↓
 * Project Creation
 *      ↓
 * Application
 *      ↓
 * Acceptance
 *      ↓
 * Task Assignment
 *
 * IMPORTANT:
 * This test harness uses controlled stubs because several feature-owner
 * APIs are not yet available in the merged ProjectForge application.
 *
 * The individual-demo specification explicitly permits stubs where
 * integration depends on another team member's unfinished component.
 *
 * The purpose of this suite is therefore to prove the expected API
 * contracts and complete workflow independently. During final system
 * integration, these stub endpoints can be replaced by the team's
 * actual routes without changing the intended workflow.
 */


/**
 * Creates an isolated Express application representing the API
 * contracts required by the PFG-86 integration workflow.
 *
 * Each test receives fresh in-memory data so tests do not depend
 * on one another or on a live PostgreSQL database.
 *
 * @returns {import("express").Express} isolated workflow application.
 */
function createWorkflowStubApp() {
  const app = express();

  app.use(express.json());


  /*
   * In-memory repositories act as controlled stubs for the
   * feature modules that are not yet fully integrated.
   */
  const users = new Map();
  const usersByEmail = new Map();
  const tokens = new Map();

  const projects = new Map();
  const applications = new Map();
  const memberships = new Map();
  const tasks = new Map();


  /*
   * Deterministic counters make generated identifiers predictable
   * and avoid random behaviour in automated tests.
   */
  const counters = {
    user: 0,
    project: 0,
    application: 0,
    membership: 0,
    task: 0,
  };


  function nextId(type) {
    counters[type] += 1;

    return `${type}-${counters[type]}`;
  }


  /**
   * Stub authentication middleware.
   *
   * It mirrors the expected ProjectForge Bearer-token contract:
   * protected routes reject missing or invalid authentication
   * before executing the requested action.
   */
  function requireAuth(req, res, next) {
    const authorization =
      req.get("Authorization") || "";

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        error:
          "Authentication required.",
      });
    }

    const token =
      authorization.substring(
        "Bearer ".length
      );

    const userId =
      tokens.get(token);

    const user =
      users.get(userId);

    if (!user) {
      return res.status(401).json({
        error:
          "Invalid authentication token.",
      });
    }

    req.user = user;

    return next();
  }


  // ============================================================
  // 1. USER REGISTRATION
  // ============================================================

  /**
   * Stub registration endpoint.
   *
   * Models the contract expected from the Identity feature:
   * valid unique users are created, while incomplete or duplicate
   * registrations are rejected.
   */
  app.post(
    "/api/auth/register",
    (req, res) => {

      const {
        email,
        password,
      } = req.body || {};


      if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        password.length < 8
      ) {
        return res.status(400).json({
          error:
            "Valid email and password are required.",
        });
      }


      const normalisedEmail =
        email
          .trim()
          .toLowerCase();


      if (
        usersByEmail.has(
          normalisedEmail
        )
      ) {
        return res.status(409).json({
          error:
            "Email already registered.",
        });
      }


      const user = {
        id:
          nextId("user"),

        email:
          normalisedEmail,

        role:
          "STUDENT",
      };


      users.set(
        user.id,
        user
      );

      usersByEmail.set(
        normalisedEmail,
        {
          ...user,
          password,
        }
      );


      return res
        .status(201)
        .json({
          user,
        });
    }
  );


  // ============================================================
  // LOGIN
  // ============================================================

  /**
   * Login is included because the remaining workflow uses
   * authenticated API requests.
   */
  app.post(
    "/api/auth/login",
    (req, res) => {

      const {
        email,
        password,
      } = req.body || {};


      const normalisedEmail =
        typeof email === "string"
          ? email
              .trim()
              .toLowerCase()
          : "";


      const storedUser =
        usersByEmail.get(
          normalisedEmail
        );


      if (
        !storedUser ||
        storedUser.password !== password
      ) {
        return res.status(401).json({
          error:
            "Invalid email or password.",
        });
      }


      const token =
        `token-${storedUser.id}`;


      tokens.set(
        token,
        storedUser.id
      );


      return res
        .status(200)
        .json({
          token,

          user: {
            id:
              storedUser.id,

            email:
              storedUser.email,

            role:
              storedUser.role,
          },
        });
    }
  );


  // ============================================================
  // 2. PROJECT CREATION
  // ============================================================

  /**
   * Stub project-creation endpoint.
   *
   * The authenticated creator becomes the Project Lead.
   */
  app.post(
    "/api/projects",
    requireAuth,
    (req, res) => {

      const {
        title,
        positionTitle,
      } = req.body || {};


      if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof positionTitle !==
          "string" ||
        !positionTitle.trim()
      ) {
        return res.status(400).json({
          error:
            "Project title and position are required.",
        });
      }


      const project = {
        projectId:
          nextId("project"),

        title:
          title.trim(),

        leadUserId:
          req.user.id,

        positionTitle:
          positionTitle.trim(),

        status:
          "ACTIVE",
      };


      projects.set(
        project.projectId,
        project
      );


      /*
       * Creating a project also establishes the creator's
       * Project Lead membership.
       */
      const membership = {
        membershipId:
          nextId("membership"),

        projectId:
          project.projectId,

        userId:
          req.user.id,

        role:
          "LEAD",

        active:
          true,
      };


      memberships.set(
        membership.membershipId,
        membership
      );


      return res
        .status(201)
        .json({
          project,
        });
    }
  );


  // ============================================================
  // 3. APPLICATION
  // ============================================================

  /**
   * Stub project-application endpoint.
   *
   * Prevents duplicate active applications from the same student
   * to the same project.
   */
  app.post(
    "/api/projects/:projectId/applications",
    requireAuth,
    (req, res) => {

      const project =
        projects.get(
          req.params.projectId
        );


      if (!project) {
        return res.status(404).json({
          error:
            "Project not found.",
        });
      }


      if (
        project.leadUserId ===
        req.user.id
      ) {
        return res.status(400).json({
          error:
            "Project Lead cannot apply to their own project.",
        });
      }


      const duplicate =
        Array.from(
          applications.values()
        ).find(
          (application) =>
            application.projectId ===
              project.projectId &&
            application.applicantUserId ===
              req.user.id &&
            application.status ===
              "PENDING"
        );


      if (duplicate) {
        return res.status(409).json({
          error:
            "A pending application already exists.",
        });
      }


      const application = {
        applicationId:
          nextId("application"),

        projectId:
          project.projectId,

        applicantUserId:
          req.user.id,

        status:
          "PENDING",
      };


      applications.set(
        application.applicationId,
        application
      );


      return res
        .status(201)
        .json({
          application,
        });
    }
  );


  // ============================================================
  // 4. APPLICATION ACCEPTANCE
  // ============================================================

  /**
   * Stub application-acceptance endpoint.
   *
   * Only the Project Lead may accept an application.
   * Successful acceptance creates an active project membership.
   */
  app.patch(
    "/api/applications/:applicationId/accept",
    requireAuth,
    (req, res) => {

      const application =
        applications.get(
          req.params.applicationId
        );


      if (!application) {
        return res.status(404).json({
          error:
            "Application not found.",
        });
      }


      const project =
        projects.get(
          application.projectId
        );


      if (
        project.leadUserId !==
        req.user.id
      ) {
        return res.status(403).json({
          error:
            "Only the Project Lead may accept applications.",
        });
      }


      if (
        application.status !==
        "PENDING"
      ) {
        return res.status(409).json({
          error:
            "Application has already been processed.",
        });
      }


      application.status =
        "ACCEPTED";


      const membership = {
        membershipId:
          nextId("membership"),

        projectId:
          project.projectId,

        userId:
          application.applicantUserId,

        role:
          "MEMBER",

        active:
          true,
      };


      memberships.set(
        membership.membershipId,
        membership
      );


      return res
        .status(200)
        .json({
          application,
          membership,
        });
    }
  );


  // ============================================================
  // 5. TASK ASSIGNMENT
  // ============================================================

  /**
   * Stub task-assignment endpoint.
   *
   * A task may only be assigned to an active member of the same
   * project, which proves that application acceptance successfully
   * feeds into the workspace stage of the workflow.
   */
  app.post(
    "/api/projects/:projectId/tasks",
    requireAuth,
    (req, res) => {

      const project =
        projects.get(
          req.params.projectId
        );


      if (!project) {
        return res.status(404).json({
          error:
            "Project not found.",
        });
      }


      if (
        project.leadUserId !==
        req.user.id
      ) {
        return res.status(403).json({
          error:
            "Only the Project Lead may assign tasks in this workflow.",
        });
      }


      const {
        title,
        assigneeUserId,
      } = req.body || {};


      if (
        typeof title !== "string" ||
        !title.trim() ||
        !assigneeUserId
      ) {
        return res.status(400).json({
          error:
            "Task title and assignee are required.",
        });
      }


      const membership =
        Array.from(
          memberships.values()
        ).find(
          (item) =>
            item.projectId ===
              project.projectId &&
            item.userId ===
              assigneeUserId &&
            item.active === true
        );


      if (!membership) {
        return res.status(400).json({
          error:
            "Task assignee must be an active project member.",
        });
      }


      const task = {
        taskId:
          nextId("task"),

        projectId:
          project.projectId,

        title:
          title.trim(),

        assigneeMembershipId:
          membership.membershipId,

        assigneeUserId,

        status:
          "TODO",
      };


      tasks.set(
        task.taskId,
        task
      );


      return res
        .status(201)
        .json({
          task,
        });
    }
  );


  return app;
}


/**
 * Registers and authenticates a test student.
 *
 * This helper keeps individual scenarios focused on the behaviour
 * being tested rather than repeating registration/login setup.
 */
async function registerAndLogin(
  app,
  email
) {
  const password =
    "ProjectForge123!";


  const registration =
    await request(app)
      .post(
        "/api/auth/register"
      )
      .send({
        email,
        password,
      });


  expect(
    registration.statusCode
  ).toBe(201);


  const login =
    await request(app)
      .post(
        "/api/auth/login"
      )
      .send({
        email,
        password,
      });


  expect(
    login.statusCode
  ).toBe(200);


  return {
    user:
      login.body.user,

    token:
      login.body.token,
  };
}


describe(
  "PFG-86 automated API integration workflow",
  () => {

    /**
     * Main Jira workflow:
     *
     * Registration
     * -> Project Creation
     * -> Application
     * -> Acceptance
     * -> Task Assignment
     */
    test(
      "completes the full user-to-task workflow successfully",
      async () => {

        const app =
          createWorkflowStubApp();


        // --------------------------------------------------------
        // Register/authenticate the Project Lead.
        // --------------------------------------------------------

        const lead =
          await registerAndLogin(
            app,
            "lead@projectforge.test"
          );


        // --------------------------------------------------------
        // Register/authenticate the applicant.
        // --------------------------------------------------------

        const applicant =
          await registerAndLogin(
            app,
            "applicant@projectforge.test"
          );


        // --------------------------------------------------------
        // Project creation.
        // --------------------------------------------------------

        const projectResponse =
          await request(app)
            .post(
              "/api/projects"
            )
            .set(
              "Authorization",
              `Bearer ${lead.token}`
            )
            .send({
              title:
                "Autonomous Rover",

              positionTitle:
                "Software Developer",
            });


        expect(
          projectResponse.statusCode
        ).toBe(201);


        const project =
          projectResponse.body.project;


        expect(
          project.leadUserId
        ).toBe(
          lead.user.id
        );


        // --------------------------------------------------------
        // Applicant applies to the project.
        // --------------------------------------------------------

        const applicationResponse =
          await request(app)
            .post(
              `/api/projects/${project.projectId}/applications`
            )
            .set(
              "Authorization",
              `Bearer ${applicant.token}`
            )
            .send({});


        expect(
          applicationResponse.statusCode
        ).toBe(201);


        const application =
          applicationResponse
            .body
            .application;


        expect(
          application.status
        ).toBe(
          "PENDING"
        );


        // --------------------------------------------------------
        // Project Lead accepts the application.
        // --------------------------------------------------------

        const acceptanceResponse =
          await request(app)
            .patch(
              `/api/applications/${application.applicationId}/accept`
            )
            .set(
              "Authorization",
              `Bearer ${lead.token}`
            );


        expect(
          acceptanceResponse.statusCode
        ).toBe(200);


        expect(
          acceptanceResponse
            .body
            .application
            .status
        ).toBe(
          "ACCEPTED"
        );


        expect(
          acceptanceResponse
            .body
            .membership
            .userId
        ).toBe(
          applicant.user.id
        );


        // --------------------------------------------------------
        // Accepted applicant can now receive a project task.
        // --------------------------------------------------------

        const taskResponse =
          await request(app)
            .post(
              `/api/projects/${project.projectId}/tasks`
            )
            .set(
              "Authorization",
              `Bearer ${lead.token}`
            )
            .send({
              title:
                "Build telemetry API",

              assigneeUserId:
                applicant.user.id,
            });


        expect(
          taskResponse.statusCode
        ).toBe(201);


        expect(
          taskResponse
            .body
            .task
            .assigneeUserId
        ).toBe(
          applicant.user.id
        );


        expect(
          taskResponse
            .body
            .task
            .status
        ).toBe(
          "TODO"
        );
      }
    );


    /**
     * Edge case:
     * registration must reject an email already registered.
     */
    test(
      "rejects duplicate user registration",
      async () => {

        const app =
          createWorkflowStubApp();


        await registerAndLogin(
          app,
          "duplicate@projectforge.test"
        );


        const response =
          await request(app)
            .post(
              "/api/auth/register"
            )
            .send({
              email:
                "DUPLICATE@projectforge.test",

              password:
                "AnotherPassword123!",
            });


        expect(
          response.statusCode
        ).toBe(409);
      }
    );


    /**
     * Edge case:
     * project creation is a protected operation.
     */
    test(
      "rejects project creation without authentication",
      async () => {

        const app =
          createWorkflowStubApp();


        const response =
          await request(app)
            .post(
              "/api/projects"
            )
            .send({
              title:
                "Unauthorised Project",

              positionTitle:
                "Developer",
            });


        expect(
          response.statusCode
        ).toBe(401);
      }
    );


    /**
     * Edge case:
     * a student may not create multiple pending applications
     * for the same project.
     */
    test(
      "rejects a duplicate pending application",
      async () => {

        const app =
          createWorkflowStubApp();


        const lead =
          await registerAndLogin(
            app,
            "lead2@projectforge.test"
          );


        const applicant =
          await registerAndLogin(
            app,
            "applicant2@projectforge.test"
          );


        const projectResponse =
          await request(app)
            .post(
              "/api/projects"
            )
            .set(
              "Authorization",
              `Bearer ${lead.token}`
            )
            .send({
              title:
                "Smart Greenhouse",

              positionTitle:
                "Embedded Engineer",
            });


        const projectId =
          projectResponse
            .body
            .project
            .projectId;


        const firstApplication =
          await request(app)
            .post(
              `/api/projects/${projectId}/applications`
            )
            .set(
              "Authorization",
              `Bearer ${applicant.token}`
            )
            .send({});


        expect(
          firstApplication.statusCode
        ).toBe(201);


        const duplicateApplication =
          await request(app)
            .post(
              `/api/projects/${projectId}/applications`
            )
            .set(
              "Authorization",
              `Bearer ${applicant.token}`
            )
            .send({});


        expect(
          duplicateApplication.statusCode
        ).toBe(409);
      }
    );


    /**
     * Edge case:
     * an applicant cannot approve their own application.
     */
    test(
      "prevents a non-lead user from accepting an application",
      async () => {

        const app =
          createWorkflowStubApp();


        const lead =
          await registerAndLogin(
            app,
            "lead3@projectforge.test"
          );


        const applicant =
          await registerAndLogin(
            app,
            "applicant3@projectforge.test"
          );


        const projectResponse =
          await request(app)
            .post(
              "/api/projects"
            )
            .set(
              "Authorization",
              `Bearer ${lead.token}`
            )
            .send({
              title:
                "Energy Monitor",

              positionTitle:
                "Backend Developer",
            });


        const projectId =
          projectResponse
            .body
            .project
            .projectId;


        const applicationResponse =
          await request(app)
            .post(
              `/api/projects/${projectId}/applications`
            )
            .set(
              "Authorization",
              `Bearer ${applicant.token}`
            )
            .send({});


        const applicationId =
          applicationResponse
            .body
            .application
            .applicationId;


        const response =
          await request(app)
            .patch(
              `/api/applications/${applicationId}/accept`
            )
            .set(
              "Authorization",
              `Bearer ${applicant.token}`
            );


        expect(
          response.statusCode
        ).toBe(403);
      }
    );


    /**
     * Edge case:
     * task assignment must fail until the applicant has actually
     * been accepted and has an active project membership.
     */
    test(
      "rejects task assignment to a student who is not yet a project member",
      async () => {

        const app =
          createWorkflowStubApp();


        const lead =
          await registerAndLogin(
            app,
            "lead4@projectforge.test"
          );


        const applicant =
          await registerAndLogin(
            app,
            "applicant4@projectforge.test"
          );


        const projectResponse =
          await request(app)
            .post(
              "/api/projects"
            )
            .set(
              "Authorization",
              `Bearer ${lead.token}`
            )
            .send({
              title:
                "Sensor Platform",

              positionTitle:
                "Software Engineer",
            });


        const projectId =
          projectResponse
            .body
            .project
            .projectId;


        /*
         * Applicant exists but has NOT yet been accepted into
         * the project, so no active membership exists.
         */
        const response =
          await request(app)
            .post(
              `/api/projects/${projectId}/tasks`
            )
            .set(
              "Authorization",
              `Bearer ${lead.token}`
            )
            .send({
              title:
                "Implement sensor service",

              assigneeUserId:
                applicant.user.id,
            });


        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.error
        ).toBe(
          "Task assignee must be an active project member."
        );
      }
    );

  }
);