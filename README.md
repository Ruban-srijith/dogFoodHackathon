# DOGFOOD — Self-Hosted Hackathon Management & Judging Platform

A local-first, offline-ready microservices architecture composed of 3 isolated services orchestrated via Docker Compose:
- **Frontend**: React 18 + TypeScript + Vite (SPA with SmoothScroll, WebGL Relief, and complete participant, judge, and organizer views).
- **Backend**: Node.js + Express (JWT + HTTP-only cookies, RBAC matrix, deadline enforcement, isolated judging, z-score normalization, RFC 4180 CSV export).
- **Database**: MongoDB 6.0 (`app_db`).

---

## 1. How to Run

### Option A: Complete Docker Compose Stack
```bash
docker compose up --build
```
* **Frontend**: `http://localhost:5173` (also accessible on `http://localhost:3000` or port 80 depending on proxy setup)
* **Backend API**: `http://localhost:5000` (or `http://localhost:5001` if port 5000 is occupied by macOS AirPlay)
* **MongoDB**: `mongodb://127.0.0.1:27017/app_db`

To run detached:
```bash
docker compose up -d --build
```

### Option B: Local Direct Execution
Ensure a local MongoDB daemon is running on port 27017:
```bash
# Terminal 1: Backend
npm --prefix backend install
npm --prefix backend run seed   # Seeds initial users, events, tracks, rubrics
node backend/src/server.js

# Terminal 2: Frontend
npm --prefix frontend install
npm --prefix frontend run dev
```

---

## 2. Test Accounts & Credentials

The seed script creates the following accounts in MongoDB. The backend accepts both the canonical seed passwords and the frontend Quick-Login passwords:

| Role | Username | Email | UI Quick Login Password | Canonical Seed Password |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin@dogfood.local` | `DogfoodAdmin123!` | `AdminPassword123!` |
| **ORGANIZER** | `organizer` | `organizer@dogfood.local` | `DogfoodOrg123!` | `OrganizerPassword123!` |
| **JUDGE** | `judge1` | `judge1@dogfood.local` | `DogfoodJudge123!` | `JudgeOnePassword123!` |
| **JUDGE** | `judge2` | `judge2@dogfood.local` | `DogfoodJudge123!` | `JudgeTwoPassword123!` |
| **JUDGE** | `judge3` | `judge3@dogfood.local` | `DogfoodJudge123!` | `JudgeThreePassword123!` |
| **PARTICIPANT** | `alice` | `alice@dogfood.local` | `DogfoodUser123!` | `AlicePassword123!` |
| **PARTICIPANT** | `bob` | `bob@dogfood.local` | `DogfoodUser123!` | `BobPassword123!` |
| **PARTICIPANT** | `charlie` | `charlie@dogfood.local` | `DogfoodUser123!` | `CharliePassword123!` |
| **PARTICIPANT** | `david` | `david@dogfood.local` | `DogfoodUser123!` | `DavidPassword123!` |
| **PARTICIPANT** | `emma` | `emma@dogfood.local` | `DogfoodUser123!` | `EmmaPassword123!` |

*(7 additional participants `frank` through `jack` are also seeded with `<Name>Password123!`)*.

---

## 3. How to Run Tests

Run the complete Node.js test runner suite (123 automated tests across 6 feature suites):

```bash
npm --prefix backend test
```

Or run individual suites:
```bash
node --test backend/test/t1_features.test.js        # Auth, Events, Teams, Submissions, Deadlines
node --test backend/test/t2_features.test.js        # Judge Invites, Assignments, 403 Isolation
node --test backend/test/t3_features.test.js        # Rubric Config, Draft Locking, Scored Isolation
node --test backend/test/t4_normalization.test.js   # Z-Score, Rescaling, Bias Correction
node --test backend/test/t5_judge_progress_csv.test.js # Progress Dashboard & CSV Exports
node --test backend/test/t6_security_audit.test.js  # Security, Auth, Secrets & Deadline Audits
```

---

## 4. Tier Implementation Status (Honest Assessment)

### ✅ Completed & Tested Tiers (123 / 123 Tests Passing)

* **Tier 1: Core Platform & Lifecycle**
  * JWT + HTTP-only cookie authentication with password hashing via bcrypt (10 rounds).
  * Role-based access control matrix (`ADMIN`, `ORGANIZER`, `JUDGE`, `PARTICIPANT`, `VISITOR`).
  * Event creation with chronological validation (`start_date < end_date`).
  * Team creation with unique 8-character `invite_code` and strict 4-member cap.
  * Project submission lifecycle (`draft` vs `submitted`) with team ownership enforcement.
  * Public gallery filtering with track categorization and draft exclusion.
  * Strict deadline enforcement (`HTTP 403 Forbidden` on submissions, edits, team creation, and joining after deadline).

* **Tier 2: Judge Management & Assignment Engine**
  * Organizer judge invitation system with email-targeted verification and expiration tracking.
  * Manual, batch, and automated load-balanced project assignment modes.
  * Conflict-of-interest prevention: Judges can never be assigned projects from their own teams.
  * Strict 403 judge isolation: Judges can only view and score projects explicitly assigned to them.

* **Tier 3: Configurable Rubrics & Evaluation Locking**
  * Dynamic weighted multi-criteria rubric management per event.
  * Evaluation draft saving with backend-calculated weighted totals.
  * Submission locking: Once submitted, evaluation scores are permanently locked against judge tampering.
  * Organizer reopen capability: Organizers can reopen locked scores for editing (blocked if event is closed).
  * Evaluator confidentiality: Judges cannot inspect evaluations submitted by other judges.

* **Tier 4: Cross-Judge Z-Score Normalization**
  * Per-judge mean ($\mu$) and standard deviation ($\sigma$) calculation to eliminate evaluator grading bias.
  * Z-score calculation with complete edge-case handling (N=1 single evaluation, zero-variance identical scores, unscored submissions).
  * 0–100 rescaling with side-by-side raw vs. normalized leaderboards and rank deltas.

* **Tier 5: Judge Progress Dashboard & CSV Export Suite**
  * Real-time organizer progress tracking (assigned, evaluated, pending, completion percentages).
  * RFC 4180 compliant CSV export engine for 7 resources: `participants`, `teams`, `submissions`, `assignments`, `raw_scores`, `normalized_scores`, `final_results`.

* **Tier 6: Security & Authorization Hardening**
  * Global Mongoose schema transforms eliminating `password_hash` from all API responses and serialization.
  * Team invite codes hidden from public gallery and outsiders.
  * Logging sanitized (`MONGO_URI` credential masking).
  * Event closure enforcement across scoring and reopening endpoints.

### ⚠️ Remaining / Out of Scope (Not Implemented)

* **Live WebSockets for Real-Time Live Scoring**: Scoring updates are pulled via REST endpoints; real-time push via Socket.io/WebSockets is not implemented.
* **Payment/Sponsorship Gateway**: Monetary prize tracking is stored as metadata only; automated Stripe/payout disbursement is not implemented.
* **Native Mobile Apps**: Only the responsive Web SPA (React + Tailwind + Vite) is provided.
