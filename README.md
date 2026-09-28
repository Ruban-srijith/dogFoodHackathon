# DOGFOOD — Hackathon Management & Judging Platform

DOGFOOD is a local-first, self-hostable hackathon management and judging platform built with zero cloud dependencies. It runs as a 3-service stack: React frontend, Express API backend, and MongoDB database.

---

## 1. Run Command

### Option A: Docker Compose (Recommended)
```bash
docker compose up --build
```
* **Frontend**: `http://localhost:5173` (or `http://localhost:3000`)
* **Backend API**: `http://localhost:5000` (or `http://localhost:5001`)
* **MongoDB**: `mongodb://127.0.0.1:27017/app_db`

### Option B: Local Direct Execution
Ensure MongoDB is running locally on port 27017:
```bash
# Terminal 1: Backend
npm --prefix backend install
npm --prefix backend run seed
node backend/src/server.js

# Terminal 2: Frontend
npm --prefix frontend install
npm --prefix frontend run dev
```

---

## 2. Test Accounts & Credentials

The seed script (`backend/src/seed.js`) provisions deterministic test accounts. Passwords work with both canonical seed passwords and UI Quick-Login passwords:

| Role | Username | Email | UI Quick-Login | Canonical Seed Password |
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

*(Additional participants `frank` through `jack` use `<Name>Password123!` or `DogfoodUser123!`)*.

---

## 3. How to Run Tests

### Complete Backend Test Suite (123 tests)
```bash
npm --prefix backend test
```

### Acceptance Test Suite (10 criteria verified)
```bash
node tests/acceptance/runner.js
# or via Makefile
make acceptance
```

### Individual Test Suites
```bash
node --test backend/test/auth.test.js
node --test backend/test/t1_features.test.js
node --test backend/test/t2_features.test.js
node --test backend/test/t3_rubrics.test.js
node --test backend/test/t4_normalization.test.js
node --test backend/test/t5_judge_progress_and_csv_export.test.js
node --test backend/test/t6_security_audit.test.js
```

---

## 4. Implementation Status by Tier (Honest Assessment)

### ✅ Completed & Tested Tiers (Verified by Acceptance Report & 123/123 Unit/Integration Tests)

* **Tier 1: Core Platform & Lifecycle**
  * JWT authentication via HTTP-only cookies and Bearer headers; bcrypt (10 rounds) hashing.
  * Role-Based Access Control (`ADMIN`, `ORGANIZER`, `JUDGE`, `PARTICIPANT`, `VISITOR`).
  * Event creation with chronological validation (`start_date < end_date`).
  * Team creation with unique 8-character `invite_code` and strict 4-member cap.
  * Submission lifecycle (`draft` vs `submitted`) with team ownership checks.
  * Strict deadline enforcement (`403 Forbidden` on submissions, edits, team creation, and joining post-deadline).
* **Tier 2: Judge Management & Assignment Engine**
  * Organizer judge invitation system with email matching and expiration tracking.
  * Three assignment modes: Manual, Batch, and Automatic load-balanced distribution.
  * Conflict-of-interest enforcement: judges cannot be assigned projects from their own teams.
  * Strict judge isolation: judges only access and score assigned submissions (`403 Forbidden` otherwise).
* **Tier 3: Configurable Rubrics & Evaluation Locking**
  * Dynamic weighted multi-criteria rubric management per event.
  * Evaluation draft saving with server-computed weighted totals.
  * Permanent submission locking on finalize; judges cannot alter submitted scores.
  * Organizer reopen capability (allowed only while event remains open).
  * Evaluator confidentiality: judges cannot view other judges' scores.
* **Tier 4: Cross-Judge Z-Score Normalization**
  * Per-judge mean ($\mu$) and standard deviation ($\sigma$) calculation.
  * Outlier and edge-case handling ($N=1$ single score, $\sigma=0$ zero variance, unscored projects).
  * Rescaling to 0–100 with side-by-side raw vs. normalized leaderboards and rank deltas.
* **Tier 5: Judge Progress Dashboard & CSV Exports**
  * Real-time organizer tracking of assigned, scored, pending, and completion rates.
  * RFC 4180 compliant CSV exports for 7 resources: `participants`, `teams`, `submissions`, `assignments`, `raw_scores`, `normalized_scores`, and `final_results`.
* **Tier 6: Security & Authorization Hardening**
  * Schema-level transforms stripping `password_hash` from all API responses.
  * Team invite codes hidden from public endpoints and non-members.
  * Role whitelisting and event closure enforcement across scoring and admin endpoints.

### ⚠️ Remaining / Out of Scope (Not Implemented)
* **Real-time WebSockets**: Scoring updates rely on REST API polling; live WebSocket push is not implemented.
* **Payment/Disbursement Gateway**: Prize awards are stored as descriptive metadata; automated Stripe/banking payouts are not implemented.
* **Cloud Object Storage (S3)**: Files and demo links are stored as URLs; direct cloud S3 upload is not implemented.
* **Native Mobile Apps**: Only the responsive Web SPA (React + TypeScript) is provided.
