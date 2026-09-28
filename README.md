# Three-Tier Microservices Platform

A local-first, offline-ready microservices architecture composed of 3 isolated services orchestrated via Docker Compose:
- **Frontend**: React + Vite (Served via Nginx)
- **Backend**: Node.js + Express (JWT + Cookie Auth & Role-Based Access Control)
- **Database**: MongoDB 6.0

---

## Quick Start (Run Command)

Start the entire stack with no manual configuration:

```bash
docker compose up --build
```

Everything starts automatically in dependency order:
1. `database` (MongoDB) initializes and reports healthy via `mongosh ping`.
2. `backend` waits for MongoDB connection, automatically seeds the database (if empty), prints test credentials to the console, and exposes `GET /api/health` and the auth/RBAC endpoints.
3. `frontend` starts up and displays the live health response, seeded database metrics, and an interactive RBAC middleware tester on the web page.

To run in the background (detached mode):
```bash
docker compose up -d --build
```

To view backend logs including test credentials:
```bash
docker compose logs -f backend
```

To stop all services:
```bash
docker compose down
```

---

## Running Automated Tests

Run the complete backend test suite (testing register, login, logout, 401 unauthorized, and 403 forbidden for all roles):

```bash
npm test
```

---

## Service Endpoints & Authentication API

| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | **Public** | Healthcheck returning `{"status":"ok"}` |
| `POST` | `/api/auth/register` | **Public** | Register user (hashes password with bcrypt, sets session cookie) |
| `POST` | `/api/auth/login` | **Public** | Login with email & password (returns JWT & session cookie) |
| `POST` | `/api/auth/logout` | **Public** | Clears session cookie |
| `GET` | `/api/auth/me` | **Authenticated** | Returns current user profile (401 if unauthenticated) |
| `GET` | `/api/participant/dashboard` | **PARTICIPANT, ADMIN** | 401 if not logged in, 403 if wrong role |
| `GET` | `/api/judge/evaluations` | **JUDGE, ADMIN** | 401 if not logged in, 403 if wrong role |
| `GET` | `/api/organizer/events` | **ORGANIZER, ADMIN** | 401 if not logged in, 403 if wrong role |
| `GET` | `/api/admin/system` | **ADMIN exclusively** | 401 if not logged in, 403 if wrong role |
| `GET` | `/api/overview` | **Public** | Returns database counts and test credentials |

---

## Role-Based Access Control (RBAC) Middleware

The backend enforces strict server-side authorization through two composable middlewares in [`backend/src/auth.js`](file:///Users/rubansrijith/IdeaProjects/projects/dogFoodHackathon/backend/src/auth.js):

1. **`authenticate(req, res, next)`**:
   - Inspects `Authorization: Bearer <token>` header or `req.cookies.token`.
   - If token is missing, invalid, or expired: immediately aborts with **HTTP 401 Unauthorized**.
2. **`requireRole(...roles)`**:
   - Validates that `req.user.role` matches one of the allowed roles (case-insensitive).
   - If the user's role does not match: aborts with **HTTP 403 Forbidden**.

---

## Automatic Database Seeding

When `docker compose up` starts the backend, the seed script checks if the database is empty. If empty, it automatically populates:
- **15 Users**:
  - **1 Admin**: `admin@dogfood.local`
  - **1 Organizer**: `organizer@dogfood.local`
  - **3 Judges**: `judge1@dogfood.local`, `judge2@dogfood.local`, `judge3@dogfood.local`
  - **10 Participants**: `alice@dogfood.local`, `bob@dogfood.local`, `charlie@dogfood.local`, `david@dogfood.local`, `emma@dogfood.local`, `frank@dogfood.local`, `grace@dogfood.local`, `henry@dogfood.local`, `isabella@dogfood.local`, `jack@dogfood.local`
- **1 Event with Dates**: `Global AI & Open Source Hackathon 2026` (with `start_date`, `end_date`, and `submission_deadline`)
- **2 Tracks**:
  - `Autonomous AI Agents` ($10,000 + Cloud Credits)
  - `Developer Tooling & Infrastructure` ($7,500)
- **3 Prizes**:
  - `Grand Prize — 1st Place Overall` ($10,000)
  - `Runner-Up — 2nd Place Overall` ($5,000)
  - `Community Choice Award` ($2,500)
- **4 Teams**: `Team Antigravity`, `Team ByteForge`, `Team NeuralFlow`, `Team CyberPulse`
- **8 Submitted Projects**: 2 projects per team assigned across the thematic tracks.

---

## Test Login Credentials (Printed in Backend Logs)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Platform Administrator | `admin@dogfood.local` | `AdminPassword123!` |
| **ORGANIZER** | Lead Event Organizer | `organizer@dogfood.local` | `OrganizerPassword123!` |
| **JUDGE** | Dr. Sarah Chen | `judge1@dogfood.local` | `JudgeOnePassword123!` |
| **JUDGE** | Marcus Vance | `judge2@dogfood.local` | `JudgeTwoPassword123!` |
| **JUDGE** | Elena Rostova | `judge3@dogfood.local` | `JudgeThreePassword123!` |
| **PARTICIPANT** | Alice Walker | `alice@dogfood.local` | `AlicePassword123!` |
| **PARTICIPANT** | Bob Smith | `bob@dogfood.local` | `BobPassword123!` |
| **PARTICIPANT** | Charlie Zhang | `charlie@dogfood.local` | `CharliePassword123!` |
| **PARTICIPANT** | David Kim | `david@dogfood.local` | `DavidPassword123!` |
| **PARTICIPANT** | Emma Watson | `emma@dogfood.local` | `EmmaPassword123!` |
| **PARTICIPANT** | Frank Miller | `frank@dogfood.local` | `FrankPassword123!` |
| **PARTICIPANT** | Grace Hopper | `grace@dogfood.local` | `GracePassword123!` |
| **PARTICIPANT** | Henry Ford | `henry@dogfood.local` | `HenryPassword123!` |
| **PARTICIPANT** | Isabella Garcia | `isabella@dogfood.local` | `IsabellaPassword123!` |
| **PARTICIPANT** | Jack Ryan | `jack@dogfood.local` | `JackPassword123!` |
