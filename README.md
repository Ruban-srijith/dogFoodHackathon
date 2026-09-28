# Three-Tier Microservices Hackathon Platform

A local-first, offline-ready microservices architecture composed of 3 isolated services orchestrated via Docker Compose:
- **Frontend**: React 18 + Vite (SPA served via Nginx with T1 UI: Gallery, Teams, Submissions, Organizer Studio)
- **Backend**: Node.js + Express (JWT + Cookie Auth, RBAC, Deadline Enforcement, Event & Team Orchestration)
- **Database**: MongoDB 6.0

---

## Quick Start (Run Command)

Start the entire stack with no manual configuration:

```bash
docker compose up --build
```

Everything starts automatically in dependency order:
1. `database` (MongoDB) initializes and reports healthy via `mongosh ping`.
2. `backend` waits for MongoDB connection, automatically seeds the database (if empty), prints test credentials to the console, and exposes the REST endpoints.
3. `frontend` starts up and serves the UI at `http://localhost:5173` (and `http://localhost:3000`).

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

Run the complete backend test suite (33 automated unit & integration tests covering auth, RBAC, team limits, drafts, and deadline checks):

```bash
npm test
```

---

## T1 Feature Implementation

### 1. Organizer Event Creation
- **Endpoint**: `POST /api/events` (Protected: `ORGANIZER`, `ADMIN`)
- **Capabilities**: Configures competition title, description, location, `start_date`, `end_date`, and `submission_deadline`. Supports dynamic assignment of thematic tracks and prize tiers.

### 2. Team Creation & Max 4 Member Enforcement
- **Endpoints**:
  - `POST /api/teams` (Protected: `PARTICIPANT`, `ADMIN`): Creates a team and returns a unique 8-character `invite_code` and `invite_link`.
  - `POST /api/teams/join` (Protected: `PARTICIPANT`, `ADMIN`): Allows teammates to join using the invite code.
- **Member Cap**: Strictly enforces a maximum of 4 members per team. Attempting to add a 5th member returns **HTTP 400 Bad Request** (`Team is full. A maximum of 4 members are allowed per team.`).

### 3. Project Submissions & Draft Status
- **Endpoint**: `POST /api/submissions` (Protected: `PARTICIPANT`, `ADMIN`)
- **Fields**: `title`, `tagline`, `description`, `repo_url`, `demo_url`, `tech_stack`, and `track_id`.
- **Drafts**: Setting `is_draft: true` saves the project in `draft` state (excluded from public gallery until finalized).

### 4. Strict Deadline Check (HTTP 403 Forbidden)
- **Endpoint**: `PUT /api/submissions/:id` (Protected: `PARTICIPANT`, `ADMIN`)
- **Rule**: Edits are permitted while `now <= event.submission_deadline`.
- **Enforcement**: Once `now > event.submission_deadline`, the backend immediately rejects any edit or new submission with **HTTP 403 Forbidden** (`Submission deadline has passed. Edits are no longer allowed.`).

### 5. Public Gallery (Search & Filter by Track)
- **Endpoint**: `GET /api/gallery` (Public)
- **Capabilities**:
  - Case-insensitive search on title, tagline, description, and tech stack (`?search=...`).
  - Track-based filtering by track ID or track name (`?track=...`).
  - Excludes draft projects from public view.

---

## Service Endpoints & API Reference

| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | **Public** | Healthcheck returning `{"status":"ok"}` |
| `GET` | `/api/gallery` | **Public** | Public project showcase with search & track filter |
| `GET` | `/api/events` | **Public** | List all hackathons with tracks and prizes |
| `POST` | `/api/events` | **ORGANIZER, ADMIN** | Create event with configurable dates, tracks, prizes |
| `POST` | `/api/teams` | **PARTICIPANT, ADMIN** | Create team and get invite link |
| `POST` | `/api/teams/join` | **PARTICIPANT, ADMIN** | Join team via invite code (max 4 members) |
| `GET` | `/api/teams/my` | **Authenticated** | Get current user's teams |
| `POST` | `/api/submissions` | **PARTICIPANT, ADMIN** | Submit project as draft or final |
| `PUT` | `/api/submissions/:id` | **PARTICIPANT, ADMIN** | Edit project before deadline (**403 after deadline**) |
| `POST` | `/api/auth/register` | **Public** | Register user with hashed password and session |
| `POST` | `/api/auth/login` | **Public** | Login (returns JWT and HTTP-only cookie) |
| `POST` | `/api/auth/logout` | **Public** | Clear session cookie |
| `GET` | `/api/auth/me` | **Authenticated** | Current user session details |

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
