# AI in development

This doc covers how AI is used to **build** this app. AI features inside the product are in [`architecture.md`](architecture.md#ai-features-product).

The principle: AI drafts, a human decides. The value shows in what was checked, corrected, or rejected, not in how much code AI wrote.

## Workflow

| Phase | How AI is used | Human check |
|---|---|---|
| Spec | AI drafted these specs and ADRs from a scoping conversation | Claims checked against primary docs (Expo SDK 58, Google OAuth policy); corrections logged below |
| Rules | [`AGENTS.md`](../AGENTS.md) gives coding agents the domain terms, layering, and design-system rules | Rules are enforced by TypeScript and ESLint, not just stated |
| Build | Contracts first (store shape, slice names, routes, adapter API), then parallel coding agents, one per feature folder, each owning only its files. See [How the build ran](#how-the-build-ran) | Each agent's report checked against the story criteria; integration checks (tsc, ESLint, Prettier, Jest, Maestro on simulators) run by the integrator |
| Tests | AI drafts test cases from acceptance criteria and schemas | Human adds missed edge cases and deletes tests that only restate the implementation |
| Review | AI PR review on each tier's pull request | Each suggestion accepted or rejected with a reason in the PR |
| Verification | Scripts compute facts instead of trusting AI claims (e.g. contrast ratios in the design system) | Script output pasted into docs |

## Tools

- **Claude Code** — spec drafting, scaffolding, implementation, refactors.
- **GitHub Copilot** — inline completion and PR review.

## How the build ran

1. **Contracts by hand.** The integrator wrote the shared contracts before any feature code: domain schemas for applications, the store with named slice exports, the `OnDeviceModel` adapter, `aiApi`, route ownership, and cross-feature links (prefill params, the drafts banner, delete cascades).
2. **Parallel agents.** Five coding agents built design-system additions, pipeline, intake, prep, and inbox at the same time. Each could edit only its own folder and routes; shared files changed only through the integrator.
3. **Integration fixes found by agents.** Agents reported shared-file problems instead of patching them: Jest needed ESM packages transformed, `persistStore` ran on import and leaked timers, persisted placeholder state would crash old installs, and RNTL 14's async `render` broke the test helper. Each was fixed once, centrally.
4. **Boundaries enforced after the fact.** A follow-up agent added feature barrels and an ESLint rule that blocks deep imports across features, because the architecture doc required it and the first pass hadn't.
5. **Real-device proof.** Maestro flows in `e2e/` drive the built app on the iOS Simulator (with the Mac's Apple Intelligence) and the Android emulator.

## Decision log

Entries where a proposal (from AI or from me) was accepted with changes, corrected, or rejected after checking. Newest first.

| Date | Area | Proposed | Decision | Why |
|---|---|---|---|---|
| 2026-11-05 | AI reliability | (AI) Fix two timeouts by flattening nested output schemas | Partly right, then revised | A later run showed the real failure mode: a timed-out request keeps running natively and every request queued behind it also times out. Fix: one native generation at a time, a required output-token cap on every task, and sequential inbox triage that pauses after a timeout |
| 2026-11-05 | Listing extraction | Prompt example "e.g. Acme Health" to steer the company field | Rejected after a device run | The small model invented "Acme Tech" for a listing that names no employer. Example names were removed and company, location, and salary must now appear in the listing text |
| 2026-11-05 | Inbox triage | Rely on the model to propose a Next Step for an interview invite | Changed | On device the model classified the invite correctly but proposed nothing; action categories now get a default title in code |
| 2026-11-05 | Interview reviews (LATER-1) | Model output: questions, each with an exact quote copied from the reviews | Changed twice | Copying quotes was slow on device; the model now lists questions only and code attaches the best-matching real sentence, so no quote can be invented |
| 2026-11-05 | Inbox triage | Model output: matched application ID | Constrained | Only IDs from the candidate list are accepted; anything else is an "unexpected response", never a match (INBX-4) |
| 2026-11-05 | Persistence | (AI) Migration that copies `settings` and `applications` from v1 data | Corrected after review | Copying a missing key as `undefined` would overwrite the reducer's initial state on rehydrate; keys are now copied only when present, with a test |
| 2026-11-05 | AI library | `react-native-foundation-models`, whose docs show Zod-typed output | Rejected after spike | The published 0.1.3 package returns plain strings; typed output exists only on the unreleased main branch ([ADR 0005](adr/0005-on-device-apple-foundation-models.md)) |
| 2026-11-05 | Text cleanup | (AI) Boilerplate regex ending in `\b` | Corrected by a failing test | `©\b` never matches before a space, so copyright lines leaked into prompts |
| 2026-11-05 | Demo script | Turn on airplane mode on the Mac to show offline AI live | Rejected | Would drop the video call and screen share. Offline proof is a pre-recorded clip |
| 2026-11-05 | AI binding | (AI) Write our own Expo module in Swift | Rejected after review | Puts Swift source in the repo against the brief's "built entirely with TypeScript". Using a library behind a TypeScript adapter instead ([ADR 0005](adr/0005-on-device-apple-foundation-models.md)) |
| 2026-11-05 | AI context | Apple docs: on-device context is 4,096 tokens | Measured, then budgeted conservatively | A Swift probe on macOS 27.0.1 (M4) reported 8,192 tokens and extracted a sample listing in 2.1 s. The app still budgets for 4,096 |
| 2026-11-05 | Product AI | (Mine) Use Apple Intelligence so AI has no metered per-token cost | Accepted | Replaces the cloud proxy (ADR 0003). Trade-offs: iOS only, smaller model, small context-token budget. See [ADR 0005](adr/0005-on-device-apple-foundation-models.md) |
| 2026-11-05 | Design system | Color palette with claimed AA contrast | Accepted after verification | Ratios computed with a WCAG luminance script; every specified text/background pair ≥ 4.5:1 (lowest 4.97). Arbitrary palette combinations not checked |
| 2026-11-05 | Inbox demo | "Mock inbox gives the same result every demo" | Corrected | Only the fixtures are fixed; triage still calls a live model, so it needs timeouts, error states, and labeled AI Replay |
| 2026-11-05 | Gmail | "Real Gmail requires Google's security review" | Corrected | Verification applies to publishing a public app with restricted scopes; a test-user demo doesn't need it. Mock chosen for predictability and privacy, not because Gmail was impossible |
| 2026-11-05 | Listing intake | "Greenhouse, Lever, and Ashby pages fetch fine" | Corrected | Any page can block, require JavaScript, or change. Paste-first intake for every job board |
| 2026-11-05 | Share intake | Use third-party `expo-share-intent` | Replaced | Expo SDK 58 `expo-sharing` now receives shares (experimental). See [ADR 0001](adr/0001-official-expo-sharing-for-share-intake.md) |
| 2026-11-05 | Interview research | (Mine) Pull interview questions from Glassdoor | Rejected after AI flagged it | No supported integration identified; omitted for reliability and scope. Replaced with user-pasted reviews (stretch) |

## Entry template

```md
| YYYY-MM-DD | Area | What AI proposed | Accepted / Changed / Rejected | One-line reason, with link to PR or doc |
```
