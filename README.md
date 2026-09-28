# DOGFOOD — Self-Hostable Hackathon Platform

> **A reproducible, modular, local-first hackathon management and isolated evaluation platform built for laptop and bare-metal environments.**

---

## 1. Project Overview

**DOGFOOD** is an open-source, self-hostable platform designed for organizing, executing, and judging hackathons and engineering competitions. Unlike cloud-dependent SaaS solutions, DOGFOOD runs entirely locally or on a single VPS via Docker Compose without requiring external accounts (AWS, Supabase, Firebase, or external auth providers).

### Core Capabilities
* **Role-Based Access Control (RBAC):** VISITOR, PARTICIPANT, JUDGE, ORGANIZER, and ADMIN roles strictly enforced server-side.
* **Strict Judging Isolation:** Evaluators can exclusively access submissions assigned to them via server-validated assignments.
* **Rubric-Driven Evaluation:** Multi-criterion weighted scoring with real-time aggregate standings computation.
* **Community Choice Voting:** One-person-one-vote mechanics with live project gallery showcases.
* **Append-Only Audit Logging:** Immutable security trails tracking logins, team creation, submission states, scoring mutations, and results publishing.

---

## 2. Architecture

DOGFOOD follows a decoupled, three-tier architecture orchestrated via Nginx:

```text
                         USER
                          |
                          v
                    ┌───────────┐
                    │  Browser  │
                    └─────┬─────┘
                          | :8080
                          v
                    ┌───────────┐
                    │   NGINX   │
                    │  Reverse  │
                    │   Proxy   │
                    └─────┬─────┘
                          |
              ┌───────────┴───────────┐
              |                       |
              v                       v
       ┌─────────────┐         ┌─────────────┐
       │  Frontend   │         │   Backend   │
       │ React + TS  │         │ Express API │
       │  (Vite+TW)  │         │ (TypeScript)│
       └─────────────┘         └──────┬──────┘
                                      |
                                      v
                               ┌─────────────┐
                               │ PostgreSQL  │
                               │  (Internal) │
                               └─────────────┘
```

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide icons.
* **Backend:** Node.js, Express, TypeScript, Zod, Bcrypt, JWT.
* **Database:** PostgreSQL 16 (internal network, never directly exposed).
* **Reverse Proxy:** Nginx 1.25 routing `/api/` to Backend, `/` to Frontend, and forwarding `/health` and `/ready`.

---

## 3. Requirements

* **Docker & Docker Compose:** Docker Engine 24+ & Docker Compose v2+.
* **Local Development (Optional):**
  * Node.js v20+ (LTS)
  * npm v10+
  * PostgreSQL 15+ (if running without Docker)

---

## 4. Installation

Clone the repository and prepare the configuration:

```bash
git clone https://github.com/Ruban-srijith/dogFoodHackathon.git
cd dogFoodHackathon
cp .env.example .env
```

---

## 5. Docker Setup (Startup Contract)

To launch the complete application stack locally:

```bash
docker compose up --build
```

Once running:
* **Application URL:** `http://localhost:8080`
* **API Health Check:** `http://localhost:8080/health`
* **API Readiness Check:** `http://localhost:8080/ready`
* **API Base:** `http://localhost:8080/api/v1`

---

## 6. Environment Variables

All settings are configured through `.env`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment (`development` / `production`) | `production` |
| `PORT` | Backend service internal port | `3000` |
| `PUBLIC_PORT` | Host port exposed via NGINX reverse proxy | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret key used for signing authentication tokens | *Change in prod* |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `SESSION_SECRET` | Secret key for cookies and session hashes | *Change in prod* |
| `BOOTSTRAP_ADMIN_EMAIL` | Initial root administrator account | `admin@dogfood.local` |
| `BOOTSTRAP_ADMIN_PASSWORD`| Initial root administrator password | `DogfoodAdmin123!` |

---

## 7. Database Setup & Migrations

All schemas are version-controlled under `database/migrations/`:

```text
001_users.sql
002_events.sql
003_tracks.sql
004_teams.sql
005_team_members.sql
006_submissions.sql
007_rubrics.sql
008_rubric_criteria.sql
009_judge_assignments.sql
010_scores.sql
011_votes.sql
012_comments.sql
013_audit_logs.sql
```

To run migrations manually:

```bash
npm run migrate
# Or via Makefile:
make migrate
```

---

## 8. Seed Data

DOGFOOD provides a deterministic seed dataset populated with users, active hackathons, teams, project submissions, judge assignments, and evaluation rubrics.

```bash
npm run seed
# Or via Makefile:
make seed
```

To reset the database, drop schemas, re-run all migrations, and re-seed:

```bash
npm run reset
# Or via Makefile:
make reset
```

---

## 9. Test Commands

Run the test suite across unit, security, and acceptance layers:

```bash
# Run Unit and Security test suites (Jest + Supertest)
npm test

# Run End-to-End Acceptance test suite against running platform
npm run test:acceptance

# Lint and typecheck both frontend and backend
npm run lint

# Or via Makefile
make test
make acceptance
make lint
```

---

## 10. Default Seed Users

The seed runner injects default accounts with pre-hashed credentials:

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@dogfood.local` | `DogfoodAdmin123!` | User management, audit logs, system stats |
| **ORGANIZER** | `organizer@dogfood.local` | `DogfoodOrg123!` | Create hackathons, assign judges, view scores |
| **JUDGE** | `judge1@dogfood.local` | `DogfoodJudge123!` | Evaluate assigned submissions (Queue #1) |
| **JUDGE** | `judge2@dogfood.local` | `DogfoodJudge123!` | Evaluate assigned submissions (Queue #2) |
| **PARTICIPANT** | `alice@dogfood.local` | `DogfoodUser123!` | Team Antigravity Leader, project submitter |
| **PARTICIPANT** | `bob@dogfood.local` | `DogfoodUser123!` | Team ByteForge Leader |
| **PARTICIPANT** | `charlie@dogfood.local` | `DogfoodUser123!` | Team NeuralFlow Leader |
| **VISITOR** | `visitor@dogfood.local` | `DogfoodUser123!` | Public observer, gallery voter |

*Note: The frontend login screen includes one-click quick login buttons to switch between these roles instantly.*

---

## 11. Role Information & Permissions Matrix

All access rules are enforced strictly by the backend authorization middleware:

| Feature / Action | VISITOR | PARTICIPANT | JUDGE | ORGANIZER | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Browse Public Events | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Project Gallery | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Team | ✗ | ✓ | ✗ | ✓ | ✓ |
| Submit Project | ✗ | ✓ | ✗ | ✓ | ✓ |
| Cast Community Vote | ✓ | ✓ | ✓ | ✓ | ✓ |
| Judge Assigned Project | ✗ | ✗ | ✓ | ✗ | ✓ |
| View Own Scores | ✗ | ✗ | ✓ | ✓ | ✓ |
| View Aggregate Scores | ✗ | ✗ | ✗ | ✓ | ✓ |
| Assign Judges | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage Event Lifecycle | ✗ | ✗ | ✗ | ✓ | ✓ |
| Audit Trail Inspection | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 12. API Overview

All routes follow the `/api/v1/` prefix with standardized JSON envelopes:

### Success Response:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

### Endpoint Reference:
* `POST /api/v1/auth/register` — User registration
* `POST /api/v1/auth/login` — Authentication and JWT issuance
* `GET  /api/v1/auth/me` — Inspect authenticated user profile
* `GET  /api/v1/events` — List published hackathons
* `POST /api/v1/events` — Create hackathon (Organizer/Admin)
* `POST /api/v1/teams` — Create team and generate invite code
* `POST /api/v1/teams/join` — Join team using invite code
* `GET  /api/v1/submissions/gallery/:eventId` — Public project showcase
* `POST /api/v1/submissions` — Create draft or final submission
* `GET  /api/v1/judges/assignments` — Judge evaluation queue (Judge only)
* `GET  /api/v1/judges/submissions/:id` — Assigned submission detail (Enforces isolation)
* `POST /api/v1/scores/submission/:id` — Submit criterion score (Judge only)
* `GET  /api/v1/scores/event/:id/results` — Weighted aggregate results (Organizer/Admin)
* `POST /api/v1/votes` — Cast community vote (1 vote per user per event)
* `GET  /api/v1/admin/audit` — Inspect append-only audit logs (Admin only)
* `GET  /health` — Service liveness check (200 OK)
* `GET  /ready` — Service readiness check (PostgreSQL verified)

---

## 13. Troubleshooting

### Port 8080 or 5432 already in use
If another service binds port 8080, specify an alternative port in your `.env` file:
```env
PUBLIC_PORT=8888
```
Then access the platform at `http://localhost:8888`.

### Database Connection Retries
On a cold machine boot, PostgreSQL may take 5–10 seconds to initialize its cluster. The backend Docker container automatically performs connection retries with exponential backoff and Docker Compose service healthchecks.

### Clean Docker Reset
To wipe existing container volumes and re-create a clean slate:
```bash
docker compose down -v
docker compose up --build
```
