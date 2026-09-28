# Three-Tier Microservices Project

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
2. `backend` waits for the database connection and exposes `GET /api/health`.
3. `frontend` starts up and displays the live health response on the web page.

To run in the background (detached mode):
```bash
docker compose up -d --build
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
| **Database** | MongoDB 6.0 | `localhost:27017` | Persistent document database |

---

## Architecture & Requirements Verification

- **GET /api/health**: Returns `{"status":"ok"}` when the backend and database connection are verified.
- **Database Readiness**: Backend incorporates a connection retry loop and Compose `condition: service_healthy` check to wait for MongoDB before serving requests.
- **Frontend Health Status**: Automatically queries `/api/health` upon loading, showing connection status, response latency, and the raw JSON payload.
- **Offline & Local-Only**: Works 100% offline with zero external cloud dependencies or API keys.
- **Configuration**: Uses `.env.example` with safe local defaults.
