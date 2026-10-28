---
id: client
type: module-design
title: Client — React 19 SPA
status: draft
parent: algovault-architecture
---

# Client — React 19 SPA

## Responsibility

The `/client` package is the entire UI: the problem list with search/filters, the question detail
panel, and the interactive code workspace (Monaco editor, test runner, results/logs console, health
telemetry). It owns all frontend state and mirrors the API's contracts in `src/types.ts`.

## Boundary

- **Allowed:** the backend REST API (`/api/*`) and the Socket.io WebSocket (`/socket.io/`), reached
  same-origin through the Vite dev proxy locally and the Nginx reverse proxy in Docker.
- **Forbidden:** any direct database access, any backend code, and any server-side code execution —
  all execution happens on the backend.

## Structure

- `App.tsx` — router shell with role-gated routes (`/login`, `/teacher`, `/student`).
- `auth/AuthContext.tsx` — loads `/api/auth/me`, exposes `login`/`logout`; every API call is same-origin
  and carries the auth cookie.
- `pages/StudentDashboard.tsx` — the problem library + editor + progress header, plus a live-sessions tab.
- `pages/TeacherDashboard.tsx` — question management (create/edit/delete + test cases), the student
  roster, and a live-sessions tab (create/open/end).
- `realtime/socket.ts` + `components/SessionRoom.tsx` — Socket.io client factory and the shared chat
  room (message history, live messages, presence).
- `pages/LoginPage.tsx` — email/password sign-in.
- `components/CodeWorkspace.tsx` — Monaco editor, language switching, per-question starter code, test
  run, per-case results, custom-input runner, and stdout/stderr logs.
- `types.ts` — TypeScript mirrors of the API response shapes (the single client-side contract; the
  packages share no code, so it is duplicated from the backend's validators by design).

## Design language

A dark, utility-first Tailwind v4 theme: `slate-950` base with `indigo`/`emerald`/`amber`/`rose`
accents and `Inter` as the base font (set in `index.css`). New components must follow the Linear/Vercel
"Gen-Z" dark aesthetic. *The richer design system — Space Grotesk headings, JetBrains Mono code font,
and a custom Monaco theme — is roadmap intent in `Agents.MD`, not yet implemented.*
