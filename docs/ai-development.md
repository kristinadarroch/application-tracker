# AI in development

This doc covers how AI is used to **build** this app. AI features inside the product are in [`architecture.md`](architecture.md#ai-features-product).

The principle: AI drafts, a human decides. The value shows in what was checked, corrected, or rejected, not in how much code AI wrote.

## Workflow

| Phase | How AI is used | Human check |
|---|---|---|
| Spec | AI drafted these specs and ADRs from a scoping conversation | Claims checked against primary docs (Expo SDK 58, Google OAuth policy); corrections logged below |
| Rules | [`AGENTS.md`](../AGENTS.md) gives coding agents the domain terms, layering, and design-system rules | Rules are enforced by TypeScript and ESLint, not just stated |
| Build | Agents implement one tier at a time from [`features.md`](features.md) | Review each diff against the tier's acceptance criteria |
| Tests | AI drafts test cases from acceptance criteria and schemas | Human adds missed edge cases and deletes tests that only restate the implementation |
| Review | AI PR review on each tier's pull request | Each suggestion accepted or rejected with a reason in the PR |
| Verification | Scripts compute facts instead of trusting AI claims (e.g. contrast ratios in the design system) | Script output pasted into docs |

## Tools

- **Claude Code** — spec drafting, scaffolding, implementation, refactors.
- **GitHub Copilot** — inline completion and PR review.

## Decision log

Entries where a proposal (from AI or from me) was accepted with changes, corrected, or rejected after checking. Newest first.

| Date | Area | Proposed | Decision | Why |
|---|---|---|---|---|
| 2026-11-05 | Demo script | Turn on airplane mode on the Mac to show offline AI live | Rejected | Would drop the video call and screen share. Offline proof is a pre-recorded clip |
| 2026-11-05 | AI binding | (AI) Write our own Expo module in Swift | Rejected after review | Puts Swift source in the repo against the brief's "built entirely with TypeScript". Using a library behind a TypeScript adapter instead ([ADR 0005](adr/0005-on-device-apple-foundation-models.md)) |
| 2026-11-05 | AI context | Apple docs: on-device context is 4,096 tokens | Measured, then budgeted conservatively | A Swift probe on macOS 27.0.1 (M4) reported 8,192 tokens and extracted a sample listing in 2.1 s. The app still budgets for 4,096 |
| 2026-11-05 | Product AI | (Mine) Use Apple Intelligence so AI costs no tokens | Accepted | Replaces the cloud proxy (ADR 0003). Trade-offs: iOS only, smaller model. See [ADR 0005](adr/0005-on-device-apple-foundation-models.md) |
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
