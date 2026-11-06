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
| 2026-11-05 | Design system | Color palette with claimed AA contrast | Accepted after verification | Ratios computed with a WCAG luminance script; all text pairs ≥ 4.5:1 (lowest 4.97) |
| 2026-11-05 | Inbox demo | "Mock inbox gives the same result every demo" | Corrected | Only the fixtures are fixed; triage still calls a live model, so it needs timeouts, error states, and labeled AI Replay |
| 2026-11-05 | Gmail | "Real Gmail requires Google's security review" | Corrected | Verification applies to publishing a public app with restricted scopes; a test-user demo doesn't need it. Mock chosen for predictability and privacy, not because Gmail was impossible |
| 2026-11-05 | Listing intake | "Greenhouse, Lever, and Ashby pages fetch fine" | Corrected | Any page can block, require JavaScript, or change. Paste-first intake for every job board |
| 2026-11-05 | Share intake | Use third-party `expo-share-intent` | Replaced | Expo SDK 58 `expo-sharing` now receives shares (experimental). See [ADR 0001](adr/0001-official-expo-sharing-for-share-intake.md) |
| 2026-11-05 | Interview research | (Mine) Pull interview questions from Glassdoor | Rejected after AI flagged it | No supported integration identified; omitted for reliability and scope. Replaced with user-pasted reviews (stretch) |

## Entry template

```md
| YYYY-MM-DD | Area | What AI proposed | Accepted / Changed / Rejected | One-line reason, with link to PR or doc |
```
