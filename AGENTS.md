# Agent rules

Rules for AI coding agents (Claude Code, Codex, Copilot) working in this repo. Humans follow them too.

## Read first

1. [`CONTEXT.md`](CONTEXT.md) — use these domain terms in code, UI copy, and commits. Don't introduce synonyms.
2. [`docs/architecture.md`](docs/architecture.md) — folder layout, store shape, error handling.
3. [`docs/design-system.md`](docs/design-system.md) — tokens, components, accessibility checklist.
4. [`docs/features.md`](docs/features.md) — work only on the current tier's scope.
5. [`docs/user-stories.md`](docs/user-stories.md) — a story is done only when every Given/When/Then for it passes. Reference story IDs (e.g. `PIPE-3`) in commits and PRs.

## Hard rules

- TypeScript only. No `any`, no non-null `!` outside tests, no `@ts-ignore`. Use `unknown` + Zod at boundaries.
- Domain types come from Zod schemas via `z.infer`. Don't hand-write a type that duplicates a schema.
- Screens use design-system components and tokens only. No color literals, raw font sizes, or inline style objects.
- Import the design system from `@/design-system` only.
- Use `useAppDispatch` / `useAppSelector`, never the untyped hooks.
- AI output goes to drafts or proposals; it never writes straight into `applications`.
- Only `src/services/ai/foundationModels.ios.ts` imports the on-device model library. Everything else uses the `OnDeviceModel` adapter (`@/services/ai/foundationModels`) or the RTK Query AI endpoints.
- All repo code is TypeScript. No Swift, Kotlin, or JavaScript source files; native code comes only from dependencies.
- Every AI entry point checks `selectAiAvailability` and has an unavailable state (see UX-7).
- Every async UI path renders loading, success, and `ErrorState` with retry.
- `switch` over a union ends with `assertNever`.

## Workflow

1. Before writing code, state the plan: files to touch, types to add, tests to write.
2. Keep changes inside the current tier. Note ideas outside it in the PR description instead of building them.
3. Tests cover behavior a user would notice: validation, selectors, error mapping, component roles and states. No tests that only restate the implementation.
4. Run `npm run typecheck && npm run lint && npm test` before declaring work done.
5. Add an entry to the decision log in [`docs/ai-development.md`](docs/ai-development.md) when AI output was rejected or materially changed.

## Don't

- Add dependencies without stating why an existing one doesn't work.
- Add a UI kit or styling library (see [ADR 0004](docs/adr/0004-hand-rolled-design-system.md)).
- Scrape sites that forbid it.
- Present AI Replay results as live output.
