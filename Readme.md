# AlgoVault

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

AlgoVault is a strongly-typed, full-stack developer preparation platform designed to manage and serve algorithmic coding challenges, execution test cases, and technical interview materials.

The project is structured with strict separation of concerns into a dedicated backend API service (`/backend`) and a modern React frontend Single Page Application (`/client`), fully containerized and orchestrated via Docker Compose.

---

## Architecture Overview

```mermaid
graph TD
    User["🌐 User / Browser"] -->|Port 5173| ClientContainer["📦 Client Container (Nginx Alpine)"]
    ClientContainer -->|Static Files| ReactApp["⚛️ React 19 + Vite + Tailwind"]
    ClientContainer -->|Proxy /api/*| BackendContainer["📦 Backend Container (Node 20 Alpine)"]
    User -->|Direct API Port 3000| BackendContainer
    BackendContainer -->|Express 5 + Prisma 7| APIApp["🚀 AlgoVault REST API"]
    BackendContainer -->|TCP 5432| DBContainer["📦 Database Container (PostgreSQL 16)"]
    DBContainer -->|Persist Data| DBVolume[("💾 postgres_data Volume")]
```

```text
devprep-api/
├── backend/                  # Node.js + Express 5 + Prisma 7 + PostgreSQL REST API
│   ├── src/                  # Layered controllers, services, routes, middleware, validators
│   ├── prisma/               # Database schema & migrations
│   ├── prisma7.config.ts     # Prisma 7 CLI configuration
│   ├── Dockerfile            # Multi-stage production container (Node 20 Alpine)
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                  # Local environment (git-ignored)
│   └── .env.example
├── client/                   # React 19 + Vite + Tailwind CSS v4 Single Page App
│   ├── src/                  # Problem dashboard, test case viewer, type contracts
│   ├── public/
│   ├── Dockerfile            # Multi-stage production container (Node build -> Nginx Alpine)
│   ├── nginx.conf            # SPA routing + /api reverse proxy to backend
│   ├── .dockerignore
│   ├── package.json
│   ├── vite.config.ts        # Vite + Tailwind + Dev proxy configuration
│   └── tsconfig.json
├── docker-compose.yml        # Orchestrates db (PostgreSQL), backend, and client
├── Agents.MD                 # Project source-of-truth for AI agents & developers
├── Readme.md
└── .gitignore
```

---

## Tech Stack

- **Backend:** Node.js, Express 5, TypeScript, PostgreSQL, Prisma ORM 7 with PostgreSQL Driver Adapter, Zod 3
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons
- **Infrastructure:** Docker, Docker Compose, Nginx (Alpine)

---

## Quickstart with Docker Compose

Run the entire multi-container ecosystem (Database, API, and Frontend) with a single command:

```bash
docker compose up -d
```

### Services & Port Mappings

| Service | Internal Port | Host Port | Description |
| :--- | :--- | :--- | :--- |
| **`client`** | `80` | `5173` | React 19 Frontend SPA served by Nginx with reverse proxy to `/api` |
| **`backend`** | `3000` | `3000` | AlgoVault Express 5 REST API |
| **`db`** | `5432` | `5432` | PostgreSQL 16 Alpine with persistent storage volume |

Once running:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **PostgreSQL Database:** `localhost:5432`

### Helpful Docker Commands

```bash
# View live logs across all containers
docker compose logs -f

# Rebuild containers after code modifications
docker compose up --build -d

# Stop all containers and networks
docker compose down

# Stop containers and remove database volume
docker compose down -v
```

---

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher, v20+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Docker](https://www.docker.com/) (Optional, for containerized execution)

---

### 1. Backend Setup (`/backend`)

1. **Navigate to the backend directory and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in `backend/` (or copy from `.env.example`):
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/devprep?schema=public"
   ```

3. **Run database migrations and generate Prisma Client:**
   ```bash
   npx prisma migrate dev
   ```

4. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:3000`.

5. **Build and type check:**
   ```bash
   npx tsc --noEmit
   npm run build
   ```

---

### 2. Frontend Setup (`/client`)

1. **Navigate to the client directory and install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173`. Requests to `/api/*` are automatically proxied to `http://localhost:3000/api/*`.

3. **Build and lint:**
   ```bash
   npm run build
   npm run lint
   ```

---

## API Reference

All API routes are prefixed under `/api`.

### 1. Health Check
* **Endpoint:** `GET /api/health`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "DevPrep API is running smoothly.",
    "timeStamp": "2026-10-24T17:30:30.621Z"
  }
  ```

### 2. Get Questions (Paginated with Filters & Search)
* **Endpoint:** `GET /api/questions`
* **Query Parameters:**
  - `page` (optional, default: `1`): Page number
  - `limit` (optional, default: `20`, max: `100`): Questions per page
  - `difficulty` (optional): `Easy` | `Medium` | `Hard`
  - `tag` (optional): Filter by categorization tag
  - `search` (optional): Case-insensitive search on title and description
* **Example:** `GET /api/questions?difficulty=Easy&search=Sum&page=1&limit=20`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "1154288c-9777-4b4f-841b-2403f6acb4ec",
        "title": "Two Sum",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        "difficulty": "Easy",
        "tags": ["arrays", "hash map"],
        "createdAt": "2026-10-15T13:43:58.152Z",
        "updatedAt": "2026-10-15T13:43:58.152Z",
        "testCases": [
          {
            "id": "b01e5ace-0404-48de-9163-3cb4d4f890dc",
            "input": "[2,7,11,15], 9",
            "expectedOutput": "[0,1]",
            "questionId": "1154288c-9777-4b4f-841b-2403f6acb4ec"
          }
        ]
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### 3. Get Question by ID
* **Endpoint:** `GET /api/questions/:id`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "id": "1154288c-9777-4b4f-841b-2403f6acb4ec",
      "title": "Two Sum",
      "description": "Given an array of integers nums...",
      "difficulty": "Easy",
      "tags": ["arrays", "hash map"],
      "testCases": [ ... ]
    }
  }
  ```

### 4. Create a Question
* **Endpoint:** `POST /api/questions`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "title": "Valid Palindrome",
    "description": "Given a string s, return true if it is a palindrome, or false otherwise.",
    "difficulty": "Easy",
    "tags": ["strings", "two-pointers"],
    "testCases": [
      {
        "input": "\"A man, a plan, a canal: Panama\"",
        "expectedOutput": "true"
      }
    ]
  }
  ```
* **Response (201 Created):** Returns the newly created question with generated UUIDs and relations.

### 5. Update a Question
* **Endpoint:** `PUT /api/questions/:id`
* **Headers:** `Content-Type: application/json`
* **Body (all fields optional):**
  ```json
  {
    "title": "Updated Title",
    "difficulty": "Medium"
  }
  ```
* **Response (200 OK):** Returns the updated question record.

### 6. Delete a Question
* **Endpoint:** `DELETE /api/questions/:id`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Question deleted successfully"
  }
  ```

---

## Roadmap

- [x] **Phase 1:** Modular Architecture, Question CRUD, Zod Validation, Singleton Prisma Driver Adapter.
- [x] **Phase 2:** Decoupled Architecture (`/backend` & `/client`), React 19 Frontend Dashboard, Tailwind CSS v4, Multi-stage Dockerfiles, Docker Compose Orchestration.
- [ ] **Phase 3 (Active):** Cloud Deployment (Neon/Supabase DB, Render API, Vercel Client).
- [ ] **Phase 4:** In-Browser Code Execution (Monaco Editor + Piston API Integration).
