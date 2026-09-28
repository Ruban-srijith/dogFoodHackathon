# DOGFOOD — Architecture Specification

Technical architecture, inter-service connectivity, request lifecycle, and key technical decisions for the DOGFOOD platform.

---

## 1. Services Overview

The platform consists of 3 containerized services orchestrated via Docker Compose:

1. **Frontend (`frontend`)**:
   * Single Page Application built with React 18, TypeScript, and Vite.
   * Serves user dashboards for Participants, Judges, Organizers, and Admins.
   * Runs on port `5173` (mapped to `80` or `3000` via Nginx in production).

2. **Backend (`backend`)**:
   * REST API built with Node.js 18+ and Express.
   * Handles authentication (JWT/cookies), RBAC, rubric evaluations, assignment algorithms, z-score normalization, and RFC 4180 CSV exports.
   * Runs on port `5000` (or `5001`).

3. **Database (`database`)**:
   * MongoDB 6.0 (`app_db`).
   * Persistent document storage for users, events, teams, submissions, rubrics, assignments, and evaluation scores.
   * Runs on port `27017`.

---

## 2. How Services Connect

```text
  [ Client Browser ]
          │
          │ HTTP / Port 5173 (or 80 / 3000)
          ▼
  ┌─────────────────┐
  │  Frontend SPA   │  (Vite / Nginx proxy /api & /api/v1 -> Backend)
  └────────┬────────┘
           │
           │ HTTP REST / Port 5000 / 5001
           ▼
  ┌─────────────────┐
  │ Express Backend │  (JWT validation, RBAC, domain validation)
  └────────┬────────┘
           │
           │ mongodb://database:27017/app_db
           ▼
  ┌─────────────────┐
  │ MongoDB Engine  │  (Document storage with Mongoose ODM)
  └─────────────────┘
```

1. **Client to Frontend**: Browser interacts with the Vite development server on port `5173` (or Nginx production proxy on port `80`/`3000`).
2. **Frontend to Backend**: In development, `vite.config.ts` proxies `/api` and `/api/v1` calls to `http://localhost:5000` (fallback `5001`). In production Docker Compose, Nginx forwards requests directly to `http://backend:5000`.
3. **Backend to Database**: Express connects to MongoDB via Mongoose at `mongodb://database:27017/app_db` inside Docker, or `mongodb://127.0.0.1:27017/app_db` when running natively.

---

## 3. Key Architectural Decisions

1. **Dual Authentication Support (HTTP-Only Cookie + Bearer Token)**:
   * *Decision*: The auth middleware inspects both the `token` HTTP-only cookie and the `Authorization: Bearer <token>` header.
   * *Rationale*: Protects browser sessions against XSS token theft via cookies while supporting automated CLI scripts, acceptance tests, and headless tools via Bearer tokens.

2. **Schema-Level Secret Stripping**:
   * *Decision*: The Mongoose `userSchema` implements global `transform` rules on `toJSON` and `toObject` that delete `password_hash`.
   * *Rationale*: Eliminates inadvertent credential leakage across all queries, population hooks, and JSON serialization without depending on per-route `.select('-password_hash')`.

3. **Server-Side Rubric Math & Score Integrity**:
   * *Decision*: Criteria weights and composite scores are computed exclusively on the backend from active event rubric definitions.
   * *Rationale*: Prevents client-side manipulation of weighting multipliers or final totals.

4. **Strict Role Whitelisting (Positive RBAC)**:
   * *Decision*: Access control checks require explicit role inclusion (`['ORGANIZER', 'ADMIN'].includes(user.role)`), rather than negative exclusion (`user.role !== 'PARTICIPANT'`).
   * *Rationale*: Prevents privilege escalation from malformed, missing, or unexpected role values.

5. **Read-Time In-Memory Normalization**:
   * *Decision*: Z-score normalization and leaderboard ranking are computed on-demand from submitted scores rather than stored as rigid static database fields.
   * *Rationale*: Ensures instant recalculation when organizers reopen evaluations, judges submit updates, or ties are broken, avoiding data desynchronization.

6. **Native RFC 4180 CSV Engine**:
   * *Decision*: Custom CSV serialization without external heavyweight libraries, enforcing proper RFC 4180 escaping (commas, quotes, CRLF).
   * *Rationale*: Guarantees reliable offline spreadsheet export for organizers with zero external package vulnerabilities.
