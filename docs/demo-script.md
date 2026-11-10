# Demo and walkthrough script

The brief asks for three things in the interview: a live demo, a code walkthrough, and a discussion of challenges. Target: 15 minutes total.

## Before the call (15 minutes)

1. Confirm Apple Intelligence is on in this Mac's System Settings (the iOS Simulator uses the Mac's model).
2. Boot the iOS Simulator and the Android Emulator; install the latest dev build on both.
3. Reset app state, then **Open settings → Load demo data** (3 applications in different stages).
4. Open Safari on the simulator with the demo listing URL in a tab.
5. Keep the backup videos (`e2e/artifacts/backup-demo.mov`, `e2e/artifacts/backup-intake.mov`) and the demo listing text ready. They are not in git; re-record them with the commands in [Dry run](#dry-run).
6. Record a 15 s clip proving offline AI: on a physical iPhone (or the Simulator before the call), turn networking off, paste a listing, show the draft appear. Never turn off the Mac's network during the call; it drops the video call and screen share.

## Demo (6 minutes)

| Time | Show | Requirement it proves |
|---|---|---|
| 0:00 | Pipeline tab opens on **Next interview**: Acme's prep progress with **Practice questions** and **Mock interview**; below it Up next (urgent next step) and Your applications by stage | RN + TypeScript, Redux selectors |
| 0:45 | Share the listing from Safari → app opens and reads the page → draft review → confirm (or **Add from a link** and paste the URL: it starts reading by itself). Optional: a LinkedIn link shows "LinkedIn doesn’t let apps read its job pages" and switches to Paste text | AI intake, human-in-the-loop drafts, respecting site terms |
| 2:00 | The application just confirmed → Prep questions are already generating (started on Confirm) → Mock interview asks its first question on open → one answer with feedback | AI prep, no extra taps |
| 3:30 | Inbox → "Receive next email" ×3 → the Northwind scheduling email moves Northwind Applied → Interviewing by itself ("Updated: Interviewing") → open Northwind → "Updates from email" log → Undo. If the model is unsure, it asks which application, then Accept | Email Source interface, triage, auto-apply with Undo (ADR 0007), Redux |
| 4:30 | Add from a link → Paste text → draft appears with no network or cloud AI call → play the offline clip | On-device AI: no metered per-token cost, private, works offline |
| 5:00 | Android Emulator → Inbox shows "Tag manually"; prep shows why AI is unavailable | Error handling, capability gating |
| 5:15 | Settings → dark mode; dev gallery screen | Design system, theming |

If the model fails live: say so, show the error state (it's part of the demo), then play the backup video.

## Dry run

`e2e/demo.yaml` runs the in-app part of the table above in order, with the real on-device model: load demo data, paste a listing → draft → confirm, prep questions, one mock-interview turn, the Acme invite email (applied by itself when the model is sure, otherwise picked and accepted), dark mode. Not in it: the Safari share sheet, Android, the offline clip, the LinkedIn link (see `link-import.yaml`), and Undo (see `ai-inbox.yaml`).

| Date | Result | Wall time (incl. app launch) |
|---|---|---|
| 2026-11-06 | 4 passes across flow revisions; the current flow (waits before tapping End) passed once | 106 s, 149 s (first run after a simulator reboot), 109 s; the 4th was not timed separately |

The recorded run (`backup-demo.mov`, re-recorded 2026-11-09 against the current app) is 81 s from the first Pipeline frame to dark mode, including the Acme invite email adding a Next Step by itself with Undo; the 6-minute slot leaves room for narration. The presenter's own rehearsal with narration has not been timed. `backup-intake.mov` (28 s) pastes a Globex listing and confirms the draft. Copies of all three videos are in `~/Movies/Application Tracker backups/`; the 2026-11-06 versions, which show the older design, are in its `older (2026-11-06)` folder.

`e2e/new-experience.yaml` shows the link-first path end to end: a job link (a sample page served from the Mac, `e2e/fixtures/job-listing.html`) is read on the device, the draft is confirmed, prep questions start generating, and the mock interview asks its first question on open. Its recording, `new-experience.mov` (56 s, starting at Add from a link), was re-recorded on 2026-11-09. The link is typed in that run, so it takes one Create draft tap; the simulator used here has no working pasteboard to show a real paste.

Re-record the backup videos (iOS Simulator, Metro running):

```sh
# Full demo. recordVideo writes the file when it receives SIGINT.
xcrun simctl io <udid> recordVideo --codec h264 --force e2e/artifacts/backup-demo.mov & REC=$!
maestro --device <udid> test e2e/demo.yaml
kill -INT $REC; wait $REC

# 20–30 s intake clip, from an app already open on the Pipeline (trim the idle start if needed).
xcrun simctl io <udid> recordVideo --codec h264 --force e2e/artifacts/backup-intake.mov & REC=$!
maestro --device <udid> test e2e/clip-intake.yaml
kill -INT $REC; wait $REC
```

Each recording starts while the app relaunches and the developer menu is open; trim that off with `avconvert --source raw.mov --preset PresetHighestQuality --output e2e/artifacts/<name>.mov --start <seconds>` (the 2026-11-09 cuts: 39 s for the demo, 16 s for the intake clip, 42.4 s for the link-first video so it starts at Add from a link).

If `recordVideo` reports "Host recording is already in progress", an earlier recorder was killed without SIGINT; shut down and boot the simulator to clear it.

## Code walkthrough (5 minutes)

1. `README.md` table: brief → architecture.
2. `src/design-system/`: tokens → semantic tokens → `makeStyles` → `StagePill`.
3. `src/features/applications/schema.ts` → `slice.ts` → `selectors.ts`: one Zod schema drives the type, validation, and Redux entity.
4. `src/services/ai/model.ts` → `foundationModels.ios.ts`: the adapter boundary, `AppError` mapping, Zod re-validation.
5. `src/services/ai/budget.ts` + a feature prompt: fitting a small on-device context window.

## Discussion prompts (4 minutes)

- **Challenge:** the share-receive API is experimental → paste intake built as a full peer ([ADR 0001](adr/0001-official-expo-sharing-for-share-intake.md)).
- **Challenge:** AI output is untrusted input → Zod validation, drafts before data ([ADR 0003](adr/0003-ai-through-server-proxy-with-validated-drafts.md), carried into [ADR 0005](adr/0005-on-device-apple-foundation-models.md)).
- **Trade-off:** on-device AI (no metered per-token cost, private, offline, but a small context-token budget) vs a cloud model (stronger, billed per token), and keeping the repo all TypeScript ([ADR 0005](adr/0005-on-device-apple-foundation-models.md)).
- **Scope call:** mock inbox instead of live Gmail ([ADR 0002](adr/0002-mock-email-source-behind-interface.md)).
- **AI in development:** walk the [decision log](ai-development.md#decision-log); the corrections are the point.
