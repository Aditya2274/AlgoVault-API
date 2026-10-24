# AGENTS.md

## 1. Project Mission

AlgoVault is a strongly-typed full-stack developer preparation platform designed to manage and serve algorithmic coding challenges, execution test cases, and technical interview materials.
The architecture is strictly decoupled into an Express + Prisma backend and a React + Vite frontend, fully containerized and orchestrated via Docker Compose.

## 2. Technical Stack

- **Backend (`/backend`):** Node.js, Express 5, TypeScript, PostgreSQL (managed via Prisma ORM 7 + Driver Adapter)
- **Frontend (`/client`):** React 19 (via Vite), Tailwind CSS v4, Lucide Icons, Monaco Editor (upcoming)
- **Infrastructure:** Docker (multi-stage builds for backend and frontend), Docker Compose, Nginx (frontend SPA server & reverse proxy)
- **External Integrations:** Piston API (upcoming for secure code execution)

## 3. Project Directory Structure

```text
devprep-api/
├── backend/                  # Isolated Node.js Express REST API
│   ├── src/                  # Controllers, services, routes, middleware, validators
│   ├── prisma/               # Prisma schema & migrations
│   ├── prisma7.config.ts     # Prisma 7 CLI configuration
│   ├── Dockerfile            # Multi-stage production container (Node 20 Alpine)
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                  # Local environment (git-ignored)
│   └── .env.example
├── client/                   # Isolated React + Vite Single Page Application
│   ├── src/                  # React UI components, state, type contracts
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

## 4. Development Commands

### Backend Commands (run in `/backend`):
- **Install dependencies:** `npm install`
- **Start local API development:** `npm run dev`
- **Compile TypeScript:** `npm run build`
- **Type check:** `npx tsc --noEmit`
- **Generate Prisma Client:** `npx prisma generate`
- **Run Migrations:** `npx prisma migrate dev`

### Frontend Commands (run in `/client`):
- **Install dependencies:** `npm install`
- **Start local dev server:** `npm run dev`
- **Compile & build for production:** `npm run build`
- **Lint:** `npm run lint`

### Docker Compose Commands (run at repository root):
- **Start entire ecosystem:** `docker compose up -d`
- **Stop entire ecosystem:** `docker compose down`
- **View logs:** `docker compose logs -f`
- **Rebuild containers:** `docker compose up --build -d`

## 5. Architecture Rules & Boundaries

- **Strict Decoupling:** The `/client` frontend and `/backend` API must never share dependencies or runtime processes; communication occurs strictly over REST endpoints.
- **Type Safety:** Maintain strict TypeScript compiler rules across both backend and client. Do not use `any` unless explicitly documented.
- **Error Handling:** Handle all errors explicitly in Express controllers. Return structured JSON error responses (`{ status: 'error', message: '...' }`).
- **Transactional Writes:** Use Prisma's nested writes / transactions for parent-child records (Questions and Test Cases).
- **Container Isolation:** In Docker Compose, services communicate over the internal bridge network (`client` -> `backend:3000` -> `db:5432`).

## 6. Agent Judgment Rules

- **NEVER** commit secrets, database passwords, or `.env` files.
- **NEVER** write raw SQL; always use the Prisma schema and Prisma Client.
- **NEVER** edit generated files like `dist/` or `node_modules/`.
- **ASK** before running destructive database migrations or dropping tables.
- **ASK** before adding heavy external dependencies.
- **ALWAYS** validate request bodies on `POST` and `PUT` routes before attempting database insertion.

---

## 7. Current Project Roadmap

1. **Backend Integration & Docker Compose:** [COMPLETED] Modular Express 5 app with Zod validation, singleton Prisma driver adapter, graceful shutdown, and containerized Dockerfile.
2. **Frontend Scaffold & Decoupled Containers:** [COMPLETED] Initialized React 19 + Vite in `/client`, configured Tailwind CSS v4, built responsive dashboard connecting to `/api/health` and `/api/questions`, created Nginx SPA `Dockerfile`, and wired root `docker-compose.yml` for isolated communication.
3. **Cloud Deployment (ACTIVE):** Deploy the PostgreSQL DB to Neon/Supabase, the Express API container to Render, and the React frontend to Vercel.
4. **Code Execution (Bonus):** Integrate `@monaco-editor/react` in the UI and securely route code execution payloads to the public Piston API.

---

## 8. Completed Phases & Architectural Decision Records (ADRs)

### Phase 1: Modular Architecture, Full Question CRUD & Zod Validation
* **Status:** ✅ Completed
* **What was built:**
  - `backend/src/config/prisma.ts`: Singleton Prisma 7 client with PostgreSQL driver adapter (`@prisma/adapter-pg` + `pg.Pool`).
  - `backend/src/validators/question.validator.ts`: Strict Zod 3 schemas for question creation, updates, pagination queries, and UUID params.
  - `backend/src/middleware/validate.middleware.ts`: Reusable validation middleware with Express 5 compatibility.
  - `backend/src/middleware/error.middleware.ts`: Global error handler with Prisma error mapping (`P2025` -> 404, `P2002` -> 409) and 404 handler.
  - `backend/src/services/question.service.ts`: Query builder, pagination calculations (`page`, `limit`, `totalPages`), text search, difficulty filtering, and atomic nested writes.
  - `backend/src/controllers/question.controller.ts` & `backend/src/controllers/health.controller.ts`: Controller handlers.
  - `backend/src/routes/question.routes.ts`, `backend/src/routes/health.routes.ts`, and `backend/src/routes/index.ts`: Modular Express routers under `/api`.
  - `backend/src/app.ts`: Decoupled Express application factory.
  - `backend/src/index.ts`: Production server listener with graceful signal shutdown (`SIGTERM`/`SIGINT`).
  - `backend/Dockerfile`: Multi-stage production container running `dist/index.js` under `USER node`.
  - `backend/.dockerignore`: Filtered node_modules, dist, git, and local envs.
  - `docker-compose.yml`: Local multi-container stack with PostgreSQL 16 Alpine and AlgoVault API with health checks.
  - `backend/.env.example`: Template for environment variables.

#### Key Architectural Decisions (Phase 1):
1. **Decision: Zod 3 vs Zod 4**
   - *Context:* `npm i zod` initially pulled Zod 4 alpha (`^4.6.7`), which changed internal exports (`AnyZodObject` removed, `.errors` changed to `.issues`), breaking standard Express validation middleware.
   - *Choice:* Pinned `zod@^3.23.8` for rock-solid stability, complete type inference, and Express middleware compatibility.
2. **Decision: Decoupling `app.ts` from Server Listener (`index.ts`)**
   - *Context:* Previously, `src/index.ts` mixed Express app configuration, route handling, and `app.listen()`.
   - *Choice:* Extracted Express configuration into `backend/src/app.ts` (`createApp()`) so test suites and Docker runners can mount `app` in-memory without port conflicts.
3. **Decision: Strict NodeNext Relative Imports (`.js` extension)**
   - *Context:* `tsconfig.json` uses `"module": "nodenext"`. All relative imports explicitly use `.js`.
4. **Decision: Atomic Nested Transactions for Question & TestCase Mutations**
   - *Context:* Replacing test cases during question updates could leave orphaned records if an error occurs midway.
   - *Choice:* Used `prisma.$transaction` in `question.service.ts` to atomically clear old test cases and create new ones.
5. **Decision: Multi-Stage Containerization with Unprivileged User**
   - *Context:* Container image size and production security.
   - *Choice:* Multi-stage `backend/Dockerfile` isolates build tools from the runtime image and runs the app under `USER node`.
6. **Decision: Express 5 Property Descriptors for Validation Middleware**
   - *Context:* In Express 5 (`5.2.1`), `req.query` and `req.params` are implemented with native getter descriptors on `IncomingMessage`, causing direct assignment (`req.query = ...`) to fail with `Cannot set property query of #<IncomingMessage> which has only a getter`.
   - *Choice:* Used `Object.defineProperty(req, 'query', { value: parsedQuery, writable: true, configurable: true, enumerable: true })` in `validate.middleware.ts` to cleanly store coerced/validated Zod outputs without throwing runtime errors.
7. **Decision: TypeScript rootDir & Dockerfile Entrypoint Alignment**
   - *Context:* `prisma7.config.ts` outside `src` caused `tsc` to produce `dist/src/index.js` instead of `dist/index.js`, breaking `npm start`.
   - *Choice:* Configured `"rootDir": "./src"` and `"include": ["src/**/*"]` in `tsconfig.json` and aligned `Dockerfile` to invoke `dist/index.js`.

---

### Phase 2: Frontend Scaffold & Decoupled Multi-Container Setup
* **Status:** ✅ Completed
* **What was built:**
  - `client/`: Standalone React 19 + TypeScript Single Page Application scaffolded via Vite.
  - `client/src/App.tsx`: Modern, responsive dashboard with difficulty filtering, text search, question overview, test case breakdown, and live API health telemetry.
  - `client/src/types.ts`: Mirror TypeScript contracts matching the backend API response structures (`Question`, `TestCase`, `Pagination`, `ApiResponse`, `HealthResponse`).
  - `client/src/index.css`: Tailwind CSS v4 design system configured with high-contrast slate dark theme.
  - `client/vite.config.ts`: Integration with `@tailwindcss/vite` and automatic dev reverse-proxy routing `/api` -> `http://localhost:3000`.
  - `client/Dockerfile`: Multi-stage production container compiling React with Node 20 and serving via lightweight Nginx Alpine.
  - `client/nginx.conf`: Nginx SPA fallback configuration (`try_files $uri /index.html`) with internal Docker network proxying (`/api/` -> `http://backend:3000/api/`).
  - `docker-compose.yml`: Fully orchestrated local ecosystem linking `db`, `backend`, and `client` on an isolated bridge network.

#### Key Architectural Decisions (Phase 2):
8. **Decision: Explicit Repository Decoupling into `backend/` and `client/`**
   - *Context:* Mixing frontend and backend configurations at repository root leads to tooling collisions (`tsconfig.json`, `package.json`, `node_modules`).
   - *Choice:* Completely separated all API and database logic into `/backend`, and frontend UI into `/client`, each with dedicated dependency graphs.
9. **Decision: Dual Multi-Stage Dockerization & Nginx Reverse Proxy**
   - *Context:* Frontend SPA needs production hosting without exposing raw Node development servers, and browser calls to `/api` must avoid CORS friction in Docker environments.
   - *Choice:* Containerized `/client` using a multi-stage Dockerfile (Node 20 build -> Nginx Alpine runner). Configured `client/nginx.conf` with SPA routing (`try_files $uri /index.html`) and an internal reverse proxy passing `/api/` directly to `http://backend:3000/api/` across the internal Docker bridge network.
10. **Decision: Vite Dev Proxy Configuration**
    - *Context:* Local frontend development (`npm run dev` on port 5173) needs seamless communication with the backend (`http://localhost:3000`).
    - *Choice:* Configured Vite's development proxy in `client/vite.config.ts` to automatically route `/api` to `http://localhost:3000`, matching production behavior without requiring hardcoded origin URLs in React components.
11. **Decision: Zero-Config Tailwind CSS v4 via `@tailwindcss/vite`**
    - *Context:* Tailwind v4 removes `tailwind.config.js` in favor of first-class Vite compiler integration.
    - *Choice:* Adopted `@tailwindcss/vite` and `@import "tailwindcss";` in `index.css`, giving lightning-fast HMR and minimal configuration surface.

---

## 9. Agent Quick-Resume Protocol

Whenever an agent or developer resumes work:
1. Read this file (`Agents.MD`) to grasp the active roadmap item, tech stack, and boundaries.
2. In `/backend`, run `npx tsc --noEmit` and `npm run build`.
3. In `/client`, run `npm run build`.
4. Validate `docker compose config` at root.
5. Adhere strictly to the **Agent Judgment Rules** and **Architecture Rules & Boundaries** defined above.
