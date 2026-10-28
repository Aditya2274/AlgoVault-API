---
id: algovault
type: goal-and-requirements
title: AlgoVault — Goal & Requirements
status: draft
---

# AlgoVault — Goal & Requirements

## Goal

AlgoVault is a full-stack developer-interview preparation platform, evolving into an **intelligent
assistive mentorship platform**: a teacher monitors and mentors a cohort of students as they solve
algorithmic challenges in real time.

## What it does today

- **Problem library** — paginated, searchable, difficulty/tag-filtered list of coding questions, each
  with its test cases.
- **In-browser editor** — Monaco editor for JavaScript, TypeScript, and Python 3, with starter
  templates generated per question.
- **Sandboxed execution** — a subprocess runner that grades a submission against a question's test
  cases and reports per-case pass/fail with input/expected/actual diffs, runtime, and stdout/stderr.

The platform has **Teacher** and **Student** roles behind JWT login, scoped to a single teacher + cohort,
with real-time class sessions and group chat. Live monitoring and the AI reviewer are the remaining
mentorship additions.

## The mentorship direction (the four pillars)

The goal is reached by four additions, each designed and landed as its own task-spec:

1. **RBAC & dashboards** — Teacher and Student roles, with distinct dashboards.
2. **Real-time engine** — WebSocket-backed class sessions and group chat.
3. **Live monitoring** — teacher-to-student peer-to-peer screen sharing (WebRTC).
4. **AI code reviewer** — an automated reviewer that reads failed test cases and emits hints.

## Access model

- **Single teacher + cohort.** One teacher owns a class/cohort; students enroll into it; sessions and
  group chat are scoped to the cohort. *Confirmed by the owner.*
- The only roles are **Teacher** and **Student**; there is no admin or organization tier.

## Non-goals

- Multi-tenant organizations, multiple teachers with fixed classes, billing/payments. *Inferred from
  the single-teacher model — unconfirmed.*
- Native mobile clients, self-hosted judge infrastructure (Judge0/Piston), or any external
  code-execution API — execution stays in-process.
