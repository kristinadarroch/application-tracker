# Application Tracker

A React Native + TypeScript app for tracking job applications from first listing to offer. AI turns messy inputs (a shared job listing, a recruiter email) into typed, validated data and helps you prepare for interviews.

> **Status:** all user stories built. Tested with Jest, Maestro E2E on iOS and Android, and on-device model checks, except three manual checks still open: the screen-reader pass, sharing from Safari/Chrome, and live Gmail sign-in (needs OAuth client IDs). Details in [`docs/features.md`](docs/features.md) and [`docs/verification.md`](docs/verification.md).

## The brief → the architecture

The project brief has four graded requirements. Each one is an architectural pillar with a home in the repo and a moment in the demo.

| Brief requirement | How this repo meets it | Where it lives | Shown in demo |
|---|---|---|---|
| **React Native & TypeScript** — functional RN app, entirely TypeScript | Expo SDK 58 dev build, `strict` TypeScript plus stricter flags, Expo Router typed routes, no `any` | `app/`, `src/`, [`tsconfig` rules](docs/architecture.md#typescript-rules) | Live on iOS Simulator and Android Emulator |
| **Code quality** — clean, readable, type-safe, good component structure, basic error handling | Token-based design system, feature folders, Zod at every trust boundary, typed `AppError` union, error boundary, retry-able error states | [`docs/design-system.md`](docs/design-system.md), [`docs/architecture.md`](docs/architecture.md#error-handling) | Design-system gallery screen; AI gated off cleanly on Android with manual paths |
| **AI in development** — use AI to build more efficiently and cleanly | Spec-first workflow, `AGENTS.md` rules for coding agents, an AI decision log, AI-drafted tests reviewed by a human, AI PR review | [`AGENTS.md`](AGENTS.md), [`docs/ai-development.md`](docs/ai-development.md) | Walk through log entries where AI output was accepted, changed, or rejected |
| **Redux (or similar)** | Redux Toolkit slices with entity adapters, memoized selectors, RTK Query for AI endpoints, redux-persist | [`docs/architecture.md`](docs/architecture.md#requirement-3--redux-redux-toolkit) | Redux DevTools timeline while an AI draft becomes a saved application |

The brief also asks for a live demo, a code walkthrough, and a discussion of challenges. See [`docs/demo-script.md`](docs/demo-script.md).

## Product in one paragraph

Share a job listing into the app (or paste it, or open `applicationtracker://intake/new?url=…`). AI extracts the company, role, location, salary, and requirements into a **draft** you confirm; LinkedIn pages are never loaded (its terms), so a LinkedIn link switches to pasting the description and keeps the link. Each application moves through a pipeline of stages, with a Stage filter. The home screen is prep-first: a **Next interview** card leads with your soonest interview, its prep progress ("4 of 10 questions practiced · 1 mock interview"), and **Practice questions** / **Mock interview** buttons, followed by the next step and your applications. The inbox (sample email, or Gmail with OAuth client IDs) is triaged by AI on every screen: when the match is confident, the email moves the application's Stage and adds its next step by itself, logged with one-tap **Undo**; when unsure, it asks. For any application, AI generates **prep questions** and runs a text **mock interview** with feedback on each answer.

## Docs

| Doc | What it covers |
|---|---|
| [`CONTEXT.md`](CONTEXT.md) | Domain glossary. Use these terms in code and UI. |
| [`docs/design-system.md`](docs/design-system.md) | Visual design language (dark panels, company badges, stage markers): tokens, themes, components, contrast, accessibility rules |
| [`docs/architecture.md`](docs/architecture.md) | Folder layout, Redux design, on-device AI, error handling, testing |
| [`docs/user-stories.md`](docs/user-stories.md) | User stories with Given/When/Then acceptance criteria |
| [`docs/features.md`](docs/features.md) | Build tiers, screens, which stories each tier delivers |
| [`docs/ai-development.md`](docs/ai-development.md) | How AI is used to build this, plus the decision log |
| [`docs/demo-script.md`](docs/demo-script.md) | Timed demo and walkthrough script |
| [`docs/adr/`](docs/adr/) | Architecture decision records |

## Stack

Expo SDK 58 (dev build) · React Native 0.88 · TypeScript 6 (strict) · Expo Router · Redux Toolkit + RTK Query · redux-persist + AsyncStorage · Zod · Apple Foundation Models on-device through `@react-native-ai/apple` behind a TypeScript adapter · Jest + React Native Testing Library

## Getting started

### Requirements

| Tool | Version used |
|---|---|
| Node | 24 |
| Xcode | 27 (iOS 27 Simulator) |
| Android Studio | SDK 36 emulator, JDK 17 |
| Mac | Apple silicon with Apple Intelligence turned on (the iOS Simulator uses the Mac's on-device model) |

### Run

1. `npm install`
2. `npm run ios` — builds the dev client and opens the iOS Simulator (first build takes about 6 minutes).
3. `npm run android` — builds the dev client for the Android emulator (first build takes about 10 minutes). AI features are switched off on Android by design.
4. `npm start` — starts Metro for later sessions once a dev build is installed.
5. In the app: **Settings → Load demo data** (development builds only) adds three sample applications for the demo.

This app uses native modules (share extension, on-device AI), so it needs a development build; Expo Go can't run it.

### Check

`npm run check` runs the typecheck, ESLint, and Jest. CI runs the same plus a Prettier check on every push.

### Optional: Gmail

The inbox runs on sample emails by default ([ADR 0002](docs/adr/0002-mock-email-source-behind-interface.md)). To try a real inbox, create Google OAuth client IDs (iOS and Android) with the `gmail.readonly` scope, add yourself as a test user, and set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in `.env.local` before building.
