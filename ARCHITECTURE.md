# DOGFOOD — Architecture Specification

> **Technical architecture, inter-service communication, request lifecycle, and key technical decisions.**

---

## 1. Services & System Topology

The platform runs as 3 containerized services communicating over an isolated Docker network (`dogfood-network`):

```text
                           CLIENT BROWSER
                                 │
                                 │ Port 5173 (or 80 / 3000)
                                 ▼
                    ┌─────────────────────────┐
                    │      FRONTEND SPA       │
                    │   React 18 + Vite + TS  │
                    │   (Proxy /api -> :5001) │
                    └────────────┬────────────┘
                                 │
                                 │ HTTP REST (Port 5001 / 5000)
                                 ▼
                    ┌─────────────────────────┐
                    │     EXPRESS BACKEND     │
                    │   Node.js 18+ REST API  │
                    │   JWT + RBAC + Z-Score  │
                    └────────────┬────────────┘
                                 │
                                 │ mongodb://database:27017/app_db
                                 ▼
                    ┌─────────────────────────┐
                    │    MONGODB DATABASE     │
                    │    MongoDB 6.0 Engine   │
                    │    Collection Storage   │
                    └─────────────────────────┘
```

### Inter-Service Connections
1. **Client to Frontend**: Browser interacts with Vite dev server (or Nginx production bundle) on port `5173`.
2. **Frontend to Backend**: In development, `vite.config.ts` proxies `/api` and `/api/v1` to `http://localhost:5001` (with port 5000 fallback). In production Docker Compose, Nginx proxies requests to `http://backend:5000`.
3. **Backend to Database**: Backend establishes a persistent connection via Mongoose to `mongodb://database:27017/app_db` (with automatic fallback to `mongodb://127.0.0.1:27017/app_db` for host-direct execution).

---

## 2. Request Lifecycle

Every incoming API request follows this sequential pipeline:

```text
HTTP Request
     │
     ▼
[CORS & Body Parser]        (express.json with 10MB limit, cookie-parser)
     │
     ▼
[authenticate]              (Extracts Bearer token or 'token' cookie, verifies JWT, populates req.user)
     │
     ▼
[requireRole(...roles)]     (Enforces RBAC against user role: ADMIN, ORGANIZER, JUDGE, PARTICIPANT)
     │
     ▼
[Domain Guard]              (Deadline checks, Conflict-of-Interest validation, Ownership check)
     │
     ▼
[Route Handler]             (Business logic execution: scoring, assignment, aggregation)
     │
     ▼
[Mongoose ODM]              (MongoDB query execution with schema-level toJSON transforms)
     │
     ▼
JSON / CSV Response         (Strict error formatting or RFC 4180 CSV attachment)
```

---

## 3. Key Architectural Decisions

### 1. Dual Auth Delivery: HTTP-Only Cookies + Bearer Header
* **Why**: Provides flexibility for both browser-based SPAs (cookie protection against XSS token harvesting) and automated API test suites / external clients (Bearer Authorization header).

### 2. Schema-Level Secret Stripping (`toJSON` / `toObject`)
* **Why**: Rather than relying on developers remembering `.select('-password_hash')` in every query controller, the Mongoose `userSchema` implements global `transform` hooks that automatically purge `password_hash` whenever any User document is serialized.

### 3. Server-Calculated Weighted Rubrics
* **Why**: The client is never trusted to calculate composite evaluation totals. When a judge submits criteria ratings, the server fetches the event's active rubric from MongoDB, verifies criteria weights, calculates the weighted total server-side, and stores both the criterion breakdown and the total.

### 4. Positive Whitelisting for Privilege Boundaries
* **Why**: Blacklisting roles (e.g. `role !== 'PARTICIPANT'`) allowed undefined or malformed roles to bypass security gates. All access-control points now use positive whitelisting (`['JUDGE', 'ORGANIZER', 'ADMIN'].includes(role)`).

### 5. In-Memory Z-Score Normalization Engine
* **Why**: Statistical normalization is computed dynamically on read (`/api/leaderboard`) via a pure mathematical service rather than pre-baked database triggers. This allows instant recalibration whenever organizers reopen scores or when new evaluations arrive, without database corruption.

### 6. RFC 4180 Compliant Native CSV Exporter
* **Why**: Organizers require offline spreadsheets for external audit. The CSV serialization is built in-house with zero external heavy dependencies, properly handling comma escaping, multi-line quotes, and carriage returns per RFC 4180.
