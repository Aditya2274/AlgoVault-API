# AlgoVault

AlgoVault is a strongly-typed, full-stack developer preparation platform designed to manage and serve algorithmic coding challenges, execution test cases, and technical interview materials.

The project is structured with strict separation of concerns into a dedicated backend API service (`/backend`) and a modern React frontend Single Page Application (`/client`), fully containerized and orchestrated via Docker Compose.

---

## Architecture Overview

```text
devprep-api/
├── backend/                  # Node.js + Express 5 + Prisma 7 + PostgreSQL REST API
│   ├── src/                  # Layered controllers, services, routes, middleware, validators
│   ├── prisma/               # Database schema & migrations
│   ├── Dockerfile            # Multi-stage production container (Node 20 Alpine)
│   └── package.json
├── client/                   # React 19 + Vite + Tailwind CSS v4 Single Page App
│   ├── src/                  # Problem dashboard, test case viewer, type contracts
│   ├── Dockerfile            # Multi-stage production container (Node build -> Nginx Alpine)
│   ├── nginx.conf            # SPA routing + /api reverse proxy to backend
│   └── package.json
└── docker-compose.yml        # Orchestrates db (PostgreSQL), backend, and client
```

---

## Tech Stack

- **Backend:** Node.js, Express 5, TypeScript, PostgreSQL, Prisma ORM 7 with PostgreSQL Driver Adapter, Zod 3
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons
- **Infrastructure:** Docker, Docker Compose, Nginx (Alpine)

---

## Quickstart with Docker Compose

Run the entire ecosystem (Database, API, and Frontend) with a single command:

```bash
docker compose up -d
```

Once running:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173) (served by Nginx, reverse-proxying `/api` to the backend)
- **Backend API:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **PostgreSQL Database:** `localhost:5432`

To shut down the containers:
```bash
docker compose down
```

---

## Local Development Setup

### 1. Backend Setup (`/backend`)

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in `backend/` (or copy from `.env.example`):
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/devprep?schema=public"
   ```

3. Run migrations and generate Prisma Client:
   ```bash
   npx prisma migrate dev
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:3000`.

---

### 2. Frontend Setup (`/client`)

1. Navigate to the client directory and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173` with automatic API proxying to `http://localhost:3000/api`.

---

## API Reference

### 1. Health Check
* **Endpoint:** `GET /api/health`
* **Response:**
  ```json
  {
    "status": "success",
    "message": "DevPrep API is running smoothly.",
    "timeStamp": "2026-10-24T17:30:30.621Z"
  }
  ```

### 2. Get Questions (with Pagination, Filter, & Search)
* **Endpoint:** `GET /api/questions?difficulty=Easy&search=Sum&page=1&limit=20`
* **Response:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "1154288c-9777-4b4f-841b-2403f6acb4ec",
        "title": "Two Sum",
        "description": "Given an array of integers nums and an integer target...",
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

### 3. Create a Question
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

### 4. Update a Question
* **Endpoint:** `PUT /api/questions/:id`
* **Headers:** `Content-Type: application/json`

### 5. Delete a Question
* **Endpoint:** `DELETE /api/questions/:id`
