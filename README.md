# Group 9 - ProjectForge

ProjectForge is the EPE 321 Group 9 software engineering project.

The system is intended to provide a platform where students can create, discover and manage engineering projects, form teams, track project progress and communicate with team members.

Additional functionality includes project mentoring, project showcases, team-health monitoring through the Pit Wall system, moderation and administrative tools.

---

## Team Responsibilities

Each team member is responsible for a major functional area of ProjectForge while contributing to integration and testing across the system.

| Team Member | Role / Area | Responsibilities |
|---|---|---|
| **Keira** | Group Leader / Architecture and Integration | Coordinate the team and overall system architecture. Maintain repository conventions, shared API contracts, database migration coordination, cross-module integration, Jira planning, merge reviews, CI/testing integration and final system integration. |
| **Kamesh** | Identity, Authentication and Profiles | Implement user registration, login, logout, password hashing, JWT authentication, profile management, skills, interests, availability, input validation and authentication-related tests. |
| **Viresh** | Projects, Discovery and Team Formation | Implement project creation and editing, project positions, project discovery and filtering, applications, application review, acceptance/rejection logic, team memberships and project roles. |
| **Zaid** | Project Workspace and Delivery | Implement milestones, tasks, task assignment, development updates, project progress, Team Radio blocker requests, repository links and workspace access control. |
| **Mehmet** | Pit Wall, Team Health and Privacy | Implement private Pit Wall check-ins, anonymous team-health responses, duplicate-submission prevention, minimum-response aggregation, team-health summaries, support resources and privacy testing. |
| **Emil** | Mentoring, Showcase, Moderation and Audit | Implement mentor approval and guidance, project completion and showcase publication, user/content reports, administrator moderation, account suspension, content removal and audit logging. |

---

## Sprint 1 Responsibilities

### 1 September - 14 September 2026

The goal of Sprint 1 is to complete approximately 50% of the required project functionality.

| Team Member | Sprint 1 Responsibilities |
|---|---|
| **Keira** | PostgreSQL/database baseline, migrations, Express server setup, common error handling, unit-test framework and seed data |
| **Kamesh** | User, Profile, Skill/UserSkill, registration/login basics, password and JWT logic, including unit tests |
| **Viresh** | Project and ProjectPosition CRUD, required skills, basic application submit/accept/reject functionality and unit tests |
| **Zaid** | Milestone and Task creation, assignment and status updates, including unit tests |
| **Mehmet** | Private PitWallCheckIn functionality, validation/privacy rules and beginning of Team Health response logic, including unit tests |
| **Emil** | MentorAssignment and guidance or basic Report/moderation flow, including unit tests |

---

## Project Structure

The project consists of a frontend, backend and PostgreSQL database.

The planned project structure is:

```text
group-9/
│
├── frontend/
│   └── User interface and client-side functionality
│
├── backend/
│   └── Express server, API routes and application logic
│
├── database/
│   └── Database configuration, migrations and seed data
│
└── README.md