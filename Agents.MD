
# AGENTS.md

## 1. Project Mission

AlgoVault API is a strongly-typed RESTful backend engine designed to manage and serve algorithmic coding challenges, execution test cases, and technical interview materials.
The immediate goal is to transition this standalone API into a fully orchestrated ecosystem using Docker Compose, build a decoupled React/Vite frontend, and deploy the full stack to the cloud.

## 2. Technical Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (managed via Prisma ORM)
- **Frontend (Upcoming):** React (via Vite), Tailwind CSS, Monaco Editor
- **Infrastructure:** Docker, Docker Compose
- **External Integrations:** Piston API (for secure code execution)

## 3. Development Commands

Use these exact commands when testing or building the application:

- **Install dependencies:** `npm install`
- **Start local API development:** `npm run dev`
- **Compile TypeScript for production:** `npm run build`
- **Generate Prisma Client:** `npx prisma generate`
- **Run Database Migrations:** `npx prisma migrate dev`
- **Start Docker ecosystem:** `docker compose up -d`
- **Stop Docker ecosystem:** `docker compose down`

## 4. Architecture Rules & Boundaries

- **Type Safety:** Maintain strict TypeScript compiler rules. Do not bypass type checking with `any` unless absolutely necessary and explicitly documented.
- **Error Handling:** Handle all errors explicitly in Express controllers. Never swallow exceptions silently; always return structured JSON error responses (e.g., `{ status: 'error', message: '...' }`).
- **Database Operations:** Use Prisma's nested writes (`include` or `create` relations) to manage parent-child records (like Questions and Test Cases) in a single transactional query.
- **Frontend Integration:** The Vite React frontend must remain completely decoupled from the Express backend, communicating only via REST endpoints.

## 5. Agent Judgment Rules

- **NEVER** commit secrets, database passwords, or `.env` files.
- **NEVER** write raw SQL; always use the Prisma schema and Prisma Client.
- **NEVER** edit generated files like `dist/` or `node_modules/`.
- **ASK** before running destructive database migrations or dropping tables.
- **ASK** before adding heavy external dependencies to the `package.json`.
- **ALWAYS** validate request bodies on `POST` and `PUT` routes before attempting database insertion.

## 6. Current Project Roadmap (Context for AI)

1. **Backend Integration & Docker Compose:** Wire `src/index.ts` to modular `src/app.ts`, orchestrate the local PostgreSQL database and the Node API container with `docker-compose.yml`.
2. **Frontend Scaffold:** Initialize a Vite React app with Tailwind CSS to consume the API.
3. **Cloud Deployment:** Deploy the DB to Neon/Supabase, the API to Render, and the Frontend to Vercel.
4. **Code Execution (Bonus):** Integrate `@monaco-editor/react` in the UI and securely route code execution payloads to the public Piston API.

---

## 7. Completed Phases & Architectural Decision Records (ADRs)

### Phase 1: Modular Architecture, Full Question CRUD & Zod Validation
* **Status:** ✅ Completed
* **What was built:**
  - `src/config/prisma.ts`: Singleton Prisma 7 client with PostgreSQL driver adapter (`@prisma/adapter-pg` + `pg.Pool`).
  - `src/validators/question.validator.ts`: Strict Zod 3 schemas for question creation, updates, pagination queries, and UUID params.
  - `src/middleware/validate.middleware.ts`: Reusable validation middleware formatting structured 400 Bad Request responses.
  - `src/middleware/error.middleware.ts`: Global error handler with Prisma error mapping (`P2025` -> 404, `P2002` -> 409) and 404 handler.
  - `src/services/question.service.ts`: Query builder, pagination calculations (`page`, `limit`, `totalPages`), text search, difficulty filtering, and atomic nested writes.
  - `src/controllers/question.controller.ts` & `src/controllers/health.controller.ts`: Controller handlers.
  - `src/routes/question.routes.ts`, `src/routes/health.routes.ts`, and `src/routes/index.ts`: Modular Express routers under `/api`.
  - `src/app.ts`: Decoupled Express application factory.
  - `DockerFile`: Multi-stage build (Node 20 alpine builder -> Node 20 alpine runner).
  - `.dockerignore`: Filtered node_modules, dist, git, and local envs.

#### Key Architectural Decisions & Thinking:
1. **Decision: Zod 3 vs Zod 4**
   - *Context:* `npm i zod` initially pulled Zod 4 alpha (`^4.6.7`), which changed internal exports (`AnyZodObject` removed, `.errors` changed to `.issues`), breaking standard Express validation middleware.
   - *Choice:* Pinned `zod@^3.23.8` for rock-solid stability, complete type inference, and Express middleware compatibility.
2. **Decision: Decoupling `app.ts` from Server Listener (`index.ts`)**
   - *Context:* Previously, `src/index.ts` mixed Express app configuration, route handling, and `app.listen()`.
   - *Choice:* Extracted Express configuration into `src/app.ts` (`createApp()`) so test suites (Supertest) and Docker runners can mount `app` in-memory without port conflicts.
3. **Decision: Strict NodeNext Relative Imports (`.js` extension)**
   - *Context:* `tsconfig.json` uses `"module": "nodenext"` and `"moduleResolution": "nodenext"`.
   - *Choice:* All internal relative imports must explicitly state `.js` (e.g. `import app from './app.js'`).
4. **Decision: Atomic Nested Transactions for Question & TestCase Mutations**
   - *Context:* Replacing test cases during question updates could leave orphaned records if an error occurs midway.
   - *Choice:* Used `prisma.$transaction` in `question.service.ts` to atomically clear old test cases and create new ones.
5. **Decision: Multi-Stage Containerization with Unprivileged User**
   - *Context:* Container image size and production security.
   - *Choice:* Multi-stage `DockerFile` isolates build tools from the runtime image and runs the app under `USER node`.

---

## 8. Agent Quick-Resume Protocol

Whenever an agent or developer resumes work:
1. Read this file (`Agents.MD`) to grasp the active roadmap item, tech stack, and boundaries.
2. Run `npx tsc --noEmit` to verify type safety.
3. Check `git status` to ensure working tree cleanliness.
4. Adhere strictly to the **Agent Judgment Rules** and **Architecture Rules & Boundaries** defined above.

