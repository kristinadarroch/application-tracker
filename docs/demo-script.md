# Demo and walkthrough script

The brief asks for three things in the interview: a live demo, a code walkthrough, and a discussion of challenges. Target: 15 minutes total.

## Before the call (10 minutes)

1. Boot the iOS Simulator and the Android Emulator; install the latest dev build on both.
2. Start the dev server; confirm `/api/ai/*` responds.
3. Reset app state, then load the seed data (3 applications in different stages).
4. Open Safari on the simulator with the demo listing URL in a tab.
5. Keep the backup video and the demo listing text ready to paste.

## Demo (6 minutes)

| Time | Show | Requirement it proves |
|---|---|---|
| 0:00 | Pipeline tab: stages, counts, urgent next-step badge | RN + TypeScript, Redux selectors |
| 0:45 | Share the listing from Safari → app opens → draft review → confirm | AI intake, human-in-the-loop drafts |
| 2:00 | Application detail → prep questions → one mock-interview turn with feedback | AI prep |
| 3:30 | Inbox → "Receive next email" → triage proposes a next step → accept | Email Source interface, triage, Redux |
| 4:30 | Turn off wifi → receive another email → "Couldn't analyze — Retry" → tag manually | Error handling |
| 5:15 | Settings → dark mode; dev gallery screen | Design system, theming |

If the network or model fails live: say so, show the error state (it's part of the demo), then play the backup video.

## Code walkthrough (5 minutes)

1. `README.md` table: brief → architecture.
2. `src/design-system/`: tokens → semantic tokens → `makeStyles` → `StagePill`.
3. `src/features/applications/schema.ts` → `slice.ts` → `selectors.ts`: one Zod schema drives the type, validation, and Redux entity.
4. `src/services/ai/baseQuery.ts`: timeout, `AppError` mapping, Zod parse.
5. `src/app/api/ai/extract-listing+api.ts`: server-only key, validated structured output.

## Discussion prompts (4 minutes)

- **Challenge:** the share-receive API is experimental → paste intake built as a full peer ([ADR 0001](adr/0001-official-expo-sharing-for-share-intake.md)).
- **Challenge:** AI output is untrusted input → Zod on both sides, drafts before data ([ADR 0003](adr/0003-ai-through-server-proxy-with-validated-drafts.md)).
- **Scope call:** mock inbox instead of live Gmail ([ADR 0002](adr/0002-mock-email-source-behind-interface.md)).
- **AI in development:** walk the [decision log](ai-development.md#decision-log); the corrections are the point.
- **Learning:** fill in after the build.
