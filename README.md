# Application Tracker

A React Native + TypeScript app for tracking job applications from first listing to offer. AI turns messy inputs (a shared job listing, a recruiter email) into typed, validated data and helps you prepare for interviews.

> **Status:** spec phase. No app code yet. The specs in `docs/` are the source of truth for the build.

## The brief → the architecture

The project brief has four graded requirements. Each one is an architectural pillar with a home in the repo and a moment in the demo.

| Brief requirement | How this repo meets it | Where it lives | Shown in demo |
|---|---|---|---|
| **React Native & TypeScript** — functional RN app, entirely TypeScript | Expo SDK 58 dev build, `strict` TypeScript plus stricter flags, Expo Router typed routes, no `any` | `app/`, `src/`, [`tsconfig` rules](docs/architecture.md#typescript-rules) | Live on iOS Simulator and Android Emulator |
| **Code quality** — clean, readable, type-safe, good component structure, basic error handling | Token-based design system, feature folders, Zod at every trust boundary, typed `AppError` union, error boundary, retry-able error states | [`docs/design-system.md`](docs/design-system.md), [`docs/architecture.md`](docs/architecture.md#error-handling) | Design-system gallery screen; turn wifi off to show the AI failure path |
| **AI in development** — use AI to build more efficiently and cleanly | Spec-first workflow, `AGENTS.md` rules for coding agents, an AI decision log, AI-drafted tests reviewed by a human, AI PR review | [`AGENTS.md`](AGENTS.md), [`docs/ai-development.md`](docs/ai-development.md) | Walk through log entries where AI output was accepted, changed, or rejected |
| **Redux (or similar)** | Redux Toolkit slices with entity adapters, memoized selectors, RTK Query for AI endpoints, redux-persist | [`docs/architecture.md`](docs/architecture.md#requirement-3--redux-redux-toolkit) | Redux DevTools timeline while an AI draft becomes a saved application |

The brief also asks for a live demo, a code walkthrough, and a discussion of challenges. See [`docs/demo-script.md`](docs/demo-script.md).

## Product in one paragraph

Share a job listing into the app (or paste it). AI extracts the company, role, location, salary, and requirements into a **draft** you confirm. Each application moves through a pipeline of stages. A mock inbox simulates recruiter email; AI triages each message, matches it to an application, and proposes a **next step**. For any application, AI generates **prep questions** and runs a text **mock interview** with feedback on each answer.

## Docs

| Doc | What it covers |
|---|---|
| [`CONTEXT.md`](CONTEXT.md) | Domain glossary. Use these terms in code and UI. |
| [`docs/design-system.md`](docs/design-system.md) | Tokens, themes, components, accessibility rules |
| [`docs/architecture.md`](docs/architecture.md) | Folder layout, Redux design, AI proxy, error handling, testing |
| [`docs/user-stories.md`](docs/user-stories.md) | User stories with Given/When/Then acceptance criteria |
| [`docs/features.md`](docs/features.md) | Build tiers, screens, which stories each tier delivers |
| [`docs/ai-development.md`](docs/ai-development.md) | How AI is used to build this, plus the decision log |
| [`docs/demo-script.md`](docs/demo-script.md) | Timed demo and walkthrough script |
| [`docs/adr/`](docs/adr/) | Architecture decision records |

## Stack

Expo SDK 58 (dev build) · TypeScript (strict) · Expo Router · Redux Toolkit + RTK Query · redux-persist + AsyncStorage · Zod · Expo API routes as the AI proxy · Jest + React Native Testing Library

## Getting started

Setup steps will be added with the scaffold (tier 0 in [`docs/features.md`](docs/features.md)).
