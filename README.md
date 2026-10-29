# three-tier full-stack-app

A task list built as three tiers: React frontend, Node.js backend, MongoDB database.

| Tier         | Tech                         | Folder      |
|--------------|------------------------------|-------------|
| Presentation | React 18 + Vite              | `frontend/` |
| Application  | Node.js + Express + Mongoose | `backend/`  |
| Data         | MongoDB 7                    | Docker / local / Atlas |

The browser only talks to the frontend. The frontend talks to the REST API.
Only the API talks to MongoDB.

## Option A: Docker (one command)

    docker compose up --build

Open http://localhost:8080

## Option B: Run locally

Requirements: Node 18+ and a MongoDB instance (local or Atlas).

    # 1. Backend
    cd backend
    cp .env.example .env        # edit MONGO_URI if needed
    npm install
    npm run dev                 # http://localhost:5000

    # 2. Frontend (new terminal)
    cd frontend
    npm install
    npm run dev                 # http://localhost:5173

Vite proxies `/api` to the backend, so no CORS setup is needed in development.

## REST API

| Method | Endpoint           | Body                             | Description          |
|--------|--------------------|----------------------------------|----------------------|
| GET    | /api/health        |                                  | API + DB status      |
| GET    | /api/tasks         |                                  | List tasks           |
| POST   | /api/tasks         | `{ title, priority? }`           | Create a task        |
| PATCH  | /api/tasks/:id     | `{ title?, priority?, done? }`   | Update a task        |
| DELETE | /api/tasks/:id     |                                  | Delete a task        |

`priority` is one of `low`, `medium`, `high`.
