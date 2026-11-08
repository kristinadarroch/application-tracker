---
status: accepted (2026-11-07)
---

# Apply confident email updates without asking, with Undo

When Triage is confident about an Inbox Message (high confidence and a matched application), the app applies the update right away: it moves the application's Stage and adds the proposed Next Step, shows "Updated from email" with one-tap Undo, and logs the update on the application under "Updates from email". Unsure or unmatched messages still wait for the user. This narrows the rule that AI output only lands as a draft or a proposal ([ADR 0005](0005-on-device-apple-foundation-models.md), `AGENTS.md`).

## Context

On 2026-11-07 the user asked for the inbox to read email for interview-process updates and update the app by itself: "The email inbox should be reading for interview process updates and auto updating the app." Of the options offered, the user chose **auto-apply when sure, with Undo**, and explicitly accepted changing the `AGENTS.md` hard rule "AI output goes to drafts or proposals; it never writes straight into applications" for this case.

Until then every Triage result was a proposal the user had to accept, so the pipeline fell behind whenever the user didn't open the Inbox. Most job-search email that matters (an interview invite, a take-home, an offer, a rejection) names the company, and Triage already refuses a match when the email doesn't name it.

## Decision

- After a Triage settles with `confidence: 'high'` and a matched application, `applyConfidentTriage` dispatches `stageChanged` and `nextStepAdded` and records an `EmailUpdate` (`inbox.updates`, keyed by message) with the previous Stage, the new Stage, the added Next Step, and when it was applied. The Triage decision becomes `auto_applied`.
- AI Replay results apply the same way and are labeled "Replayed" wherever the update is shown.
- Undo (`undoEmailUpdate`) reverts exactly what the email changed and marks the decision `undone`.
- Everything else is unchanged: low confidence or no match stays an open proposal with the application picker (INBX-4), and the manual path stays (INBX-5). Accepting a proposal now also applies its Stage change.

## Guardrails

- **Code decides the Stage, not the model.** `stageFromTriage(category, currentStage)`: an interview invite, scheduling, or take-home email moves a Saved or Applied application to Interviewing; an offer moves an application before Offer to Offer; a rejection moves it to Rejected. Recruiter follow-ups and unrelated email never move a Stage.
- **Only forward moves, except a rejection.** No email moves an application back.
- **Closed applications never move.** Rejected and Withdrawn stay as they are.
- **The matched application must be a real candidate.** Triage only matches one of the user's applications that the email names (guardrails 3 and 6 in [`docs/architecture.md`](../architecture.md#guardrails)), and the application must still exist when the update is applied.
- **Undo is exact.** The Stage goes back only if the application is still at the Stage the email set; the Next Step is removed only if it still exists and isn't done. Anything the user changed since stays. Undoing twice does nothing.

## Consequences

- The pipeline stays current without opening the Inbox: reading and Triage run app-wide (INBX-8).
- **Risk: a confident wrong match edits the wrong application until undone.** The damage is bounded to one Stage move and one Next Step, both visible in the Inbox row badge, the message's "Updated from email" panel, and the application's "Updates from email" log, each with Undo.
- A user who never looks may miss that a Stage changed; the badge and the log are the only notice (no push notifications).
- The persisted inbox gained `updates` (persist migration 3).
