---
status: superseded by ADR-0005 (the proxy is replaced; the validated-drafts rule carries over)
---

# Route AI through Expo API routes; AI output lands only as validated drafts

> **Superseded by [ADR 0005](0005-on-device-apple-foundation-models.md).** Kept for history; the validated-drafts rule carries over.

All model calls go through server-only Expo API routes (`src/app/api/ai/*+api.ts`) so the provider key never ships in the app bundle, where it could be extracted. Every response must match a Zod schema on both server and client, and AI output is written only to draft or proposal state that the user must confirm before it changes their Applications.

## Considered options

- **Call the provider directly from the app.** Fastest to build, but exposes the API key. Rejected.
- **Separate serverless project (e.g. a Vercel function).** Works, but splits the repo and adds a second deploy for a demo. Rejected for now.
- **Expo API routes (chosen).** Same repo and language, served by the dev server during development, deployable to EAS Hosting for a shareable build.

## Consequences

- The app needs a reachable server for AI features. Offline, intake and triage fall back to manual entry; prep and mock interview keep existing state and offer retry. Core application tracking works fully offline.
- Code under `server/` (prompts, provider client) is imported only by `src/app/api/**`; an ESLint `no-restricted-imports` rule enforces this so it never reaches the client bundle.
