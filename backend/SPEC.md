---
id: backend
type: module-design
title: Backend — Express 5 API, data & execution engine
status: draft
parent: algovault-architecture
---

# Backend — Express 5 API, data & execution engine

## Responsibility

The `/backend` package owns everything server-side: the PostgreSQL data model (Prisma), the REST API,
and the code-execution pipeline. It is the only component that talks to the database.

It exposes four domains:

- **Questions** — CRUD on `Question`/`TestCase` (the `TestCase` relation cascades on delete) plus
  nested test-case endpoints, with pagination, search, and difficulty/tag filtering.
- **Execution** — per-question starter-code templates, and `POST /api/execute`, which grades a
  submission against the question's test cases.
- **Auth & cohort** — JWT login/logout/me, teacher-only student registration, the single `Cohort`
  (create/enroll/roster), and per-student progress (`completedQuestions` + `totalScore`) recorded on a
  passing submission.
- **Sessions & realtime** — Socket.io class sessions and group chat, persisted as `ClassSession` and
  `ChatMessage`, authenticated on handshake, plus the Zod-validated session REST endpoints.

## Boundary

- **Allowed:** PostgreSQL via Prisma Client (driver adapter); Node.js and Python 3 child processes
  (the execution engine); WebSocket via Socket.io; Express + Zod.
- **Forbidden:** anything from `/client`; raw SQL; any frontend dependency or asset.

## Layering

Requests flow one way — routes → controllers → services → Prisma — with validation and error handling
at the edge:

- `validators/` (Zod schemas) and `middleware/` (`validate`, `error`, `auth`) sit at the route boundary.
  `auth` verifies the JWT cookie and enforces the `Teacher`/`Student` roles.
- `services/` hold business logic; `controllers/` only shape HTTP responses.
- `config/prisma.ts` is the singleton Prisma client (driver adapter + `pg.Pool`).

## Execution engine (a hard boundary inside the package)

`services/execution.service.ts` runs submitted code in a sandboxed child process — never in the API
process. One subprocess per run evaluates all test cases in a batch harness; Node runs under a 128MB
heap cap, both Node and Python run under a 3.5s wall-clock timeout, and TypeScript is transpiled
in-memory first. `services/starter-code.service.ts` derives starter signatures from the question title
and test-case input shapes, with slug overrides for canonical problems.

## Realtime (Socket.io)

`realtime/socket.ts` attaches Socket.io to the HTTP server and authenticates every handshake with the
same JWT cookie as REST. Events (`session:join` / `chat:message` / `session:leave`) are
membership-checked against the cohort before any message is persisted or broadcast; presence is
in-memory. The session REST endpoints live alongside it in `services/session.service.ts` and
`controllers/session.controller.ts`.
