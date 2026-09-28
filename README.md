# Three-Tier Microservices Platform

A local-first, offline-ready microservices architecture composed of 3 isolated services orchestrated via Docker Compose:
- **Frontend**: React + Vite (Served via Nginx)
- **Backend**: Node.js + Express
- **Database**: MongoDB 6.0

---

## Quick Start (Run Command)

Start the entire stack with no manual configuration:

```bash
docker compose up --build
```

Everything starts automatically in dependency order:
1. `database` (MongoDB) initializes and reports healthy via `mongosh ping`.
2. `backend` waits for MongoDB connection, automatically runs the seed script (if database is empty), prints test credentials to the console, and exposes `GET /api/health`.
3. `frontend` starts up and displays the live health response and seeded database overview on the web page.

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

## Service Endpoints

| Service | Technology | Port / URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite | `http://localhost:5173` (also `http://localhost:3000`) | Web UI calling and rendering `/api/health` |
| **Backend** | Node + Express | `http://localhost:5000` | REST API service |
| **Healthcheck** | Express Endpoint | `http://localhost:5000/api/health` | Returns `{"status":"ok"}` |
| **Overview API** | Express Endpoint | `http://localhost:5000/api/overview` | Returns seeded stats and test credentials |
| **Database** | MongoDB 6.0 | `localhost:27017` | Persistent document database |

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
