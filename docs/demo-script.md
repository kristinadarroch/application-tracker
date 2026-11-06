# Demo and walkthrough script

The brief asks for three things in the interview: a live demo, a code walkthrough, and a discussion of challenges. Target: 15 minutes total.

## Before the call (15 minutes)

1. Confirm Apple Intelligence is on in this Mac's System Settings (the iOS Simulator uses the Mac's model).
2. Boot the iOS Simulator and the Android Emulator; install the latest dev build on both.
3. Reset app state, then load the seed data (3 applications in different stages).
4. Open Safari on the simulator with the demo listing URL in a tab.
5. Keep the backup video and the demo listing text ready to paste.
6. Record a 15 s clip proving offline AI: on a physical iPhone (or the Simulator before the call), turn networking off, paste a listing, show the draft appear. Never turn off the Mac's network during the call; it drops the video call and screen share.

## Demo (6 minutes)

| Time | Show | Requirement it proves |
|---|---|---|
| 0:00 | Pipeline tab: stages, counts, urgent next-step badge | RN + TypeScript, Redux selectors |
| 0:45 | Share the listing from Safari → app opens → draft review → confirm | AI intake, human-in-the-loop drafts |
| 2:00 | Application detail → prep questions → one mock-interview turn with feedback | AI prep |
| 3:30 | Inbox → "Receive next email" → triage proposes a next step → accept | Email Source interface, triage, Redux |
| 4:30 | Paste a listing → draft appears with no API call → play the offline clip | On-device AI: no metered per-token cost, private, works offline |
| 5:00 | Android Emulator → Inbox shows "Tag manually"; prep shows why AI is unavailable | Error handling, capability gating |
| 5:15 | Settings → dark mode; dev gallery screen | Design system, theming |

If the model fails live: say so, show the error state (it's part of the demo), then play the backup video.

## Code walkthrough (5 minutes)

1. `README.md` table: brief → architecture.
2. `src/design-system/`: tokens → semantic tokens → `makeStyles` → `StagePill`.
3. `src/features/applications/schema.ts` → `slice.ts` → `selectors.ts`: one Zod schema drives the type, validation, and Redux entity.
4. `src/services/ai/model.ts` → `foundationModels.ts`: the adapter boundary, `AppError` mapping, Zod re-validation.
5. `src/services/ai/budget.ts` + `prompts/`: fitting a small on-device context window.

## Discussion prompts (4 minutes)

- **Challenge:** the share-receive API is experimental → paste intake built as a full peer ([ADR 0001](adr/0001-official-expo-sharing-for-share-intake.md)).
- **Challenge:** AI output is untrusted input → Zod validation, drafts before data ([ADR 0003](adr/0003-ai-through-server-proxy-with-validated-drafts.md), carried into [ADR 0005](adr/0005-on-device-apple-foundation-models.md)).
- **Trade-off:** on-device AI (no metered per-token cost, private, offline, but a small context-token budget) vs a cloud model (stronger, billed per token), and keeping the repo all TypeScript ([ADR 0005](adr/0005-on-device-apple-foundation-models.md)).
- **Scope call:** mock inbox instead of live Gmail ([ADR 0002](adr/0002-mock-email-source-behind-interface.md)).
- **AI in development:** walk the [decision log](ai-development.md#decision-log); the corrections are the point.
- **Learning:** fill in after the build.
