# DOGFOOD — Architecture Specification

> **Technical architecture, request lifecycle, modular boundaries, and security enforcement models for the DOGFOOD platform.**

---

## 1. Architectural Principles

1. **Self-Hostable & Local-First:** No reliance on AWS, Supabase, Firebase, or external cloud OAuth. Runs reliably on a local laptop or an isolated air-gapped server.
2. **Reproducibility:** A single `docker compose up --build` brings up the entire platform deterministically.
3. **Decoupled Three-Tier Topology:** Strict separation between presentation (React SPA), API & domain logic (Node.js/TypeScript REST API), and storage (PostgreSQL).
4. **Never Trust the Client:** Authorization, role checks, team ownership, and judging isolation are evaluated exclusively server-side.

---

## 2. System Topology

```text
                           CLIENT BROWSER
                                 │
                                 │ :8080
                                 ▼
                     ┌───────────────────────┐
                     │         NGINX         │
                     │     Reverse Proxy     │
                     └───────────┬───────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
         / (Frontend SPA)                 /api/*, /health, /ready
                │                                 │
                ▼                                 ▼
     ┌─────────────────────┐           ┌─────────────────────┐
     │   dogfood_frontend  │           │   dogfood_backend   │
     │     (Port 80)       │           │     (Port 3000)     │
     │ React+TS Vite Nginx │           │ Express REST API TS │
     └─────────────────────┘           └──────────┬──────────┘
                                                  │
                                                  ▼
                                       ┌─────────────────────┐
                                       │   dogfood_postgres  │
                                       │     (Port 5432)     │
                                       │ Internal Network    │
                                       └─────────────────────┘
```

### Network Isolation (Rule 18)
* Only the **NGINX** container binds to the host's public port (`8080`).
* The **Frontend**, **Backend**, and **PostgreSQL** communicate on the internal bridge network `dogfood-internal`.
* PostgreSQL is intentionally unexposed to the host to protect persistent data from unauthorized external network access.

---

## 3. Backend Request Lifecycle (Rule 6)

Every incoming HTTP request flows sequentially through well-defined responsibility boundaries:

```text
HTTP Request
     │
     ▼
[Route]                     (Mounts endpoint, rate limiting, and parameter schema)
     │
     ▼
[Auth Middleware]           (Extracts Bearer JWT, validates signature, populates req.user)
     │
     ▼
[RBAC Middleware]           (Enforces allowed roles e.g. ADMIN, ORGANIZER, JUDGE)
     │
     ▼
[Validation Middleware]     (Zod schema validation on body, params, and query string)
     │
     ▼
[Controller]                (Extracts input, delegates to service, formats JSON response)
     │
     ▼
[Service]                   (Business logic, domain invariants, audit logging, permissions)
     │
     ▼
[Repository]                (Direct SQL execution via connection pool, transactions)
     │
     ▼
[PostgreSQL Database]       (Persistent ACID storage, constraints, foreign keys)
```

---

## 4. Frontend Architecture (Rule 5)

The frontend avoids ad-hoc API calls within UI trees by maintaining strict layer boundaries:

```text
Component / Screen (e.g. GalleryPage)
     │
     ▼
Hook (e.g. useSubmissions)
     │
     ▼
Service (e.g. submissionService)
     │
     ▼
API Client (apiClient with token interceptors)
     │
     ▼
Backend REST API (/api/v1/*)
```

### Layer Responsibilities
* **`pages/`**: Routable views representing application screens.
* **`components/`**: Reusable design system primitives (`Button`, `Card`, `Badge`, `Modal`, `Table`, `Loading`, `EmptyState`, `ErrorState`).
* **`services/`**: Feature-level business operations.
* **`api/`**: Centralized HTTP client and endpoint URL constants.
* **`contexts/`**: Shared global state (`AuthContext`, `ToastContext`).
* **`types/`**: TypeScript interfaces synchronized with backend domain models.
* **`utils/`**: Pure formatting and local persistence helpers.

---

## 5. Security & Threat Model

### 1. Judge Isolation Enforcement (Rule 16)
* A judge cannot view or score any project submission unless an explicit `judge_assignments` record links their `user_id` to that `submission_id`.
* The server inspects `req.user.userId` rather than any client-supplied `judge_id`.

### 2. Team & Submission Ownership (Rule 8)
* Editing a project submission requires verified membership in the submission's associated team.
* The backend verifies `isMemberOfSubmissionTeam(req.user.userId, submissionId)` before applying mutations.

### 3. Append-Only Audit Trail (Rule 23)
* Security-critical actions (`LOGIN`, `LOGOUT`, `TEAM_CREATED`, `SUBMISSION_SUBMITTED`, `JUDGE_ASSIGNED`, `SCORE_CREATED`, `VOTE_CREATED`, `RESULTS_PUBLISHED`) write append-only records to `audit_logs`.
* The standard application API provides no endpoints to delete or mutate audit logs.

### 4. Input Sanitization & Information Hiding (Rule 12 & 14)
* Input payloads are verified using strict Zod schemas with regex constraints.
* Unhandled database exceptions and internal stack traces are redacted before sending responses to normal users.
