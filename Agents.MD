# AGENTS.md

## 1. Project Mission

AlgoVault is a strongly-typed full-stack developer preparation platform designed to manage and serve algorithmic coding challenges, execution test cases, and technical interview materials.
The architecture is strictly decoupled into an Express + Prisma backend and a React + Vite frontend, fully containerized and orchestrated via Docker Compose.

## 2. Technical Stack

- **Backend (`/backend`):** Node.js, Express 5, TypeScript, PostgreSQL (managed via Prisma ORM 7 + Driver Adapter)
- **Frontend (`/client`):** React 19 (via Vite), Tailwind CSS v4, Lucide Icons, `@monaco-editor/react`
- **Infrastructure:** Docker (multi-stage builds for backend and frontend), Docker Compose, Nginx (frontend SPA server & reverse proxy)
- **External Integrations:** Native embedded subprocess execution engine (Node.js + Python 3 subprocesses with timeout + memory caps)

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
3. **Monaco Code Editor & Native Embedded Execution Engine:** [COMPLETED] Built in-browser Monaco Editor workspace with multi-language support (JavaScript, TypeScript, Python 3), dynamic starter templates, safe isolated subprocess execution with hard timeouts and memory caps, test case result verification, and interactive console logs.
4. **UI Redesign — Gen-Z Professional Dark Theme (ACTIVE):** Restyle the `/client` frontend with a "Linear × Vercel × Raycast" dark-first design system — Space Grotesk headings, Inter UI, JetBrains Mono for code/IDs, Tailwind v4 `@theme` CSS variables, Monaco custom theme, resizable split editor/output pane, ARIA tabs, skeleton loaders, and WCAG 2.1 AA accessibility compliance.
5. **Cloud Deployment (UPCOMING):** Deploy the PostgreSQL DB to Neon/Supabase, the Express API container to Render, and the React frontend to Vercel.

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

### Phase 3: In-Browser Monaco Code Editor & Native Embedded Execution Engine
* **Status:** ✅ Completed
* **What was built:**
  - `client/src/components/CodeWorkspace.tsx`: Monaco Editor integration (`@monaco-editor/react`) featuring multi-language syntax highlighting (`JavaScript`, `TypeScript`, `Python 3`), starter code templates, Run Code button, test case pass/fail pills, input/output diffing, custom input runner, and stdout/stderr console.
  - `backend/src/services/starter-code.service.ts`: Dynamic starter boilerplate generator providing canonical signatures for known problems (Two Sum, Longest Substring, Trapping Rain Water) and dynamic parameter extraction for custom questions.
  - `backend/src/services/execution.service.ts`: Sandboxed code execution engine using isolated subprocesses (`node` and `python3`) with 3.5s timeout limits, 128MB memory ceilings, signal killing (`SIGTERM`/`SIGKILL`), TypeScript in-memory transpilation (`ts.transpileModule`), output normalization, and batch test case verification.
  - `backend/src/validators/execute.validator.ts`, `backend/src/controllers/execute.controller.ts`, and `backend/src/routes/execute.routes.ts`: Endpoints `/api/execute` and `/api/execute/templates/:questionId` with Zod validation.
  - `backend/Dockerfile`: Added `python3` to Alpine runner image for native Python 3 execution inside containers.

#### Key Architectural Decisions (Phase 3):
12. **Decision: Native Embedded Subprocess Execution vs Heavy Judge0 Stack**
    - *Context:* Public Judge0/Piston APIs are rate-limited or require whitelists, while self-hosting Judge0 requires Redis, PostgreSQL, and multi-GB images needing 2GB–4GB RAM, exceeding AWS `t3.micro` limits.
    - *Choice:* Implemented a native, unprivileged embedded execution engine executing Node.js and Python 3 directly in timed subprocesses. Total RAM usage is under 600MB across the entire stack, perfectly running on `t3.micro` free tier.
13. **Decision: Batch Test Case Evaluation in a Single Subprocess**
    - *Context:* Spawning a separate Node/Python process for every individual testcase adds process startup overhead (50-100ms per test).
    - *Choice:* Engineered a batch test harness executing all test cases in a single isolated process invocation, reducing total execution latency to <1ms per testcase.

---

### Phase 4: In-Browser Monaco Code Editor — Full Interactive Workspace
* **Status:** ✅ Completed
* **What was built:**
  - `client/src/components/CodeWorkspace.tsx`: Full Monaco Editor workspace featuring language switching (JavaScript, TypeScript, Python 3), dynamic starter code fetched per-question from the API, per-language code save/restore, Run Code button with live isRunning state, test case pass/fail pills, selected case breakdown (input / expected / actual output), custom input runner, stdout/stderr Logs tab, and auto-switch to Results tab on run.
  - `client/src/App.tsx`: Wired `CodeWorkspace` into the right-panel split layout below the problem description card; auto-selects the first question on load.
  - `client/src/types.ts`: Added `SupportedLanguage`, `CodeTemplates`, `ExecutionResponse`, `ExecutionResult`, and `ExecutionSummary` contracts mirroring backend response shapes.
  - `backend/src/services/execution.service.ts`: Sandboxed batch execution engine with Node.js / Python 3 subprocess isolation, 3.5s wall-clock timeout, 128 MB memory ceiling, TypeScript in-memory transpilation (`ts.transpileModule`), multi-test-case harness, stdout capture, and output normalization.
  - `backend/src/services/starter-code.service.ts`: Fully dynamic starter-code generator — no hardcoded templates in source. Derives function signatures from question title (camelCase slug) and extracts parameter names from test case inputs via regex. Includes known overrides for Two Sum, Longest Substring Without Repeating Characters, and Trapping Rain Water.
  - `backend/src/controllers/execute.controller.ts`, `backend/src/routes/execute.routes.ts`, `backend/src/validators/execute.validator.ts`: Endpoints `POST /api/execute` and `GET /api/execute/templates/:questionId` with Zod-validated request bodies.
  - `backend/Dockerfile`: Added `RUN apk add --no-cache python3` to Alpine runner stage so Python 3 is available inside the backend container.
  - `backend/package.json`: Moved `typescript` from `devDependencies` to `dependencies` because `execution.service.ts` calls `ts.transpileModule` at container runtime (not just build time).
  - `docker-compose.yml`: Pinned PostgreSQL host port to `5433` via `POSTGRES_PORT` env var to avoid conflicts with host-native PostgreSQL on port 5432.

#### Key Architectural Decisions (Phase 4):
14. **Decision: Dynamic Starter Templates with Zero Codebase Edits per New Question**
    - *Context:* Early prototype had a `KNOWN_TEMPLATES` map in the frontend that required developers to manually add an entry every time a new question was added. This was non-scalable.
    - *Choice:* Moved all template generation to `backend/src/services/starter-code.service.ts`. The service uses a slug-keyed override map for canonical LeetCode-style signatures and falls back to fully dynamic camelCase derivation + parameter extraction from test case input strings for any new question — no code changes needed.
15. **Decision: `typescript` as a Runtime Dependency**
    - *Context:* The execution service uses `ts.transpileModule` to convert user-submitted TypeScript to runnable JavaScript inside the container. This is needed at runtime, not just at build time.
    - *Choice:* Moved `typescript` from `devDependencies` to `dependencies` in `backend/package.json`. The Docker multi-stage build runs `npm ci` with all `dependencies` in the production runner stage.
16. **Decision: Single-Process Batch Test Harness**
    - *Context:* Spawning a separate Node/Python process for every individual test case adds 50–100ms of process startup overhead per test.
    - *Choice:* Each code execution spawns exactly one subprocess that runs all test cases in a tight loop, returning a JSON result array. Total per-test overhead is under 1ms.

---

## 9. Agent Quick-Resume Protocol

Whenever an agent or developer resumes work:
1. Read this file (`Agents.MD`) to grasp the active roadmap item, tech stack, and boundaries.
2. In `/backend`, run `npx tsc --noEmit` and `npm run build`.
3. In `/client`, run `npm run build`.
4. Validate `docker compose config` at root.
5. Adhere strictly to the **Agent Judgment Rules** and **Architecture Rules & Boundaries** defined above.
