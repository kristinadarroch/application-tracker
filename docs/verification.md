# Verification

How every user story is proven, and the latest results. Three layers:

| Layer | Tool | Runs where | Command |
|---|---|---|---|
| Unit + component + screen | Jest, React Native Testing Library, `expo-router/testing-library` | Node (CI on every push) | `npm run check` |
| End-to-end on a real build | Maestro flows in [`e2e/`](../e2e) | iOS 27 Simulator (Apple Intelligence from the Mac), Android 36 emulator | `maestro test e2e/<flow>.yaml` |
| On-device model checks | Dev screen **Settings → AI spike** (`src/app/dev/ai-spike.tsx`), driven by `e2e/ai-checks.yaml` | iOS 27 Simulator | `maestro test e2e/ai-checks.yaml` |

E2E and model checks need a dev build installed and Metro running (`npm start`).

## Latest end-to-end results (2026-11-06, app code at `8b0091d`, flows at `e7b1e13`)

| Flow | iOS 27 Simulator | Android 36 emulator |
|---|---|---|
| `pipeline.yaml` | Pass | Pass (after a flow fix: scroll the link field out from under the keyboard) |
| `ai-intake.yaml` | Pass | — (AI is iOS only) |
| `ai-prep.yaml` | Failed once (the End tap didn't register right after feedback rendered); flow now waits for the UI to settle, then 2 / 2 pass | — |
| `ai-inbox.yaml` | Pass | — |
| `android-ai-off.yaml` | — | Pass |
| `a11y-large-text.yaml` | Pass (AX5, at `2bd0c9f`) | Pass (font scale 2.0, app code at `a5c8c91`) |
| `demo.yaml` | 4 passes across flow revisions; the current flow passed once | — |
| `ai-checks.yaml` | 2 / 2 runs, every group "0 failed" | — |

## Story coverage

| Story | Automated (Jest) | On a real build |
|---|---|---|
| UX-1 theme | `settings.test.tsx` | `pipeline.yaml` (dark mode screenshot) |
| UX-2 large text | Text wraps; no fixed heights (component tests); `iconScaling.test.tsx` (icons follow text size up to the label's cap) | `a11y-large-text.yaml` on both platforms, see [Accessibility](#accessibility) |
| UX-3 screen reader | Roles, labels, "Stage: X", announced errors (component + screen tests) | **Open, manual:** VoiceOver / TalkBack pass, see [Accessibility](#accessibility) |
| UX-4 reduce motion | `reduceMotion.test.tsx` (Skeleton stops pulsing) | — |
| UX-5 errors | `errorBoundary.test.tsx`, ErrorState copy tests | `ai-prep.yaml` timeouts recover via Retry |
| UX-6 gallery | Gallery renders (DS tests) | Settings → Design system gallery |
| UX-7 AI unavailable | Intake, inbox, prep screen tests | `android-ai-off.yaml` |
| PIPE-1–6 | `pipeline`, `applicationForm`, `applicationDetail`, selector and slice tests | `pipeline.yaml` |
| PIPE-7 persistence | `persistence.test.tsx` (real redux-persist config), `persistConfig.test.ts` (migration) | Data survives relaunch (manual) |
| INT-1 share sheet | `shareScreen`, `routing` tests | Manual: share from Safari / Chrome |
| INT-2–6 | `intakeScreen`, `reviewScreen`, `extractListing`, `fetchListing`, `listingText` tests | `ai-intake.yaml`, model checks (listings) |
| PREP-1–3 | Prep slice, task, and screen tests | `ai-prep.yaml`, model checks (prep) |
| MOCK-1–5 | Prep session tests (transcript restore, answer kept on failure) | `ai-prep.yaml`, model checks (mock turn) |
| INBX-1–6 | Inbox slice, triage, screen, replay tests | `ai-inbox.yaml`, model checks (triage) |
| LATER-1 reviews | `quotes.test.ts`, task + screen tests | Model checks (interview reviews) |
| LATER-2 Gmail | Paging, decoding, HTML fallback, 401/offline/503 with injected fetch | **Blocked:** live sign-in needs Google OAuth client IDs (see README) |

## On-device model checks (iOS 27.0 Simulator, M4 host)

Each check has an expected outcome; the screen marks it Pass or Fail, and `e2e/ai-checks-group.yaml` asserts "0 failed" for each group. Groups run in fresh launches.

| Group | 2026-11-05 | 2026-11-06, final code, 2 consecutive runs | Latency (2026-11-05) |
|---|---|---|---|
| Listings (5 samples: 4 real employers, 1 with no employer named) | 5 / 5 pass | 5 / 5, 5 / 5 | 1.3–4.2 s |
| Triage (8 sample emails: categories, grounded matches, proposals) | 8 / 8 pass | 8 / 8, 8 / 8 | 0.9–5.6 s |
| Prep questions, first mock question, mock turn, interview reviews | 4 / 4 pass | 4 / 4, 4 / 4 | 9.7 s, 1.1 s, 4.5 s, — |

What the checks caught before passing (all fixed, each with a unit test):

1. A timed-out request keeps running natively and blocks every request behind it → one native generation at a time, a required output-token cap per task, sequential inbox triage that pauses after a timeout.
2. Extraction invented "Acme Tech" for a listing with no employer → company, location, salary, and role must be grounded in the listing text.
3. Triage matched an Initech rejection to Globex → a match must name the company in the email; rejections never propose a step.
4. Triage returned an id with stray punctuation, and a title longer than the schema allowed (rejecting the whole response) → limits enforced in code, not in the model schema.
5. Copying exact quotes from reviews was slow → the model lists questions; code attaches the real sentence.

## Accessibility

### Largest text (2026-11-06, `e2e/a11y-large-text.yaml`)

Screens: settings, pipeline with demo data, application detail, Next Step form, inbox, intake.

| Platform | Setting | Result |
|---|---|---|
| iOS 27 Simulator | Larger Accessibility Sizes, largest (`AX5`) | Pass. All text wraps; nothing clipped or overlapping; long screens scroll. Screen titles, pills, and captions stop growing at 1.6×. |
| Android 36 emulator | Font scale 2.0 | Pass. Same screens; single-line fields truncate their placeholder with an ellipsis. |

Found and fixed in this pass: icons stayed at their base size beside very large labels. Icons that sit next to text now follow the text size, with the same cap as their label and at most 2× (`useScaledIconSize`).

To repeat: set the size (`xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large` or `adb shell settings put system font_scale 2.0`), run the flow with `-e PLATFORM=ios|android`, review `e2e/artifacts/a11y-*.png`, then reset (`content_size large`, `font_scale 1.0`).

### Screen readers: open

Not yet verified on a running build. The iOS Simulator has no VoiceOver, and an automated TalkBack attempt on the emulator produced no usable evidence (no speech output, focus stayed on a system dialog). Needs a person with a device:

1. VoiceOver on an iPhone with this build: swipe through pipeline, detail, intake review, inbox detail, prep.
2. TalkBack on the Android emulator or a phone: the same screens.
3. Check on each: reading order matches the visual order; every control has a name and role; stage pills read "Stage: …"; selected chips read as selected; errors and banners are announced.

What is covered automatically: roles, labels, selected and disabled states, and error announcements in component and screen tests.
