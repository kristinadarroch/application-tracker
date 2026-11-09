# Product research: how to make Application Tracker better

Researched 2026-11-08. Five parallel investigations, each with sources:

| File | Question |
|---|---|
| [`competitors.md`](competitors.md) | What Huntr, Teal, Simplify, Careerflow, LinkedIn, Eztrackr, and spreadsheets offer, and what users praise and complain about |
| [`job-seeker-needs.md`](job-seeker-needs.md) | Measured pain points: response rates, ghosting, timelines, follow-up, stress, what predicts success |
| [`interview-prep.md`](interview-prep.md) | What makes interview practice work (structured answers, retrieval and spaced practice) and how prep tools work |
| [`platform-and-ai-ux.md`](platform-and-ai-ux.md) | Apple and Google guidance for AI features, plus notifications, calendar, widgets, and Shortcuts in Expo SDK 58 |
| [`in-app-ux-audit.md`](in-app-ux-audit.md) | A first-time and returning-user walkthrough of this app against Nielsen's heuristics and Apple's HIG |

## Bottom line

1. **Own "private, prep-first job search."** No major competitor runs AI on the device. Mock interviews are paid or gated everywhere else: Careerflow charges $19.99/week, and LinkedIn's is Premium-only. Email-to-stage automation stops at suggestions in Teal and Simplify. This app already does all three. ([competitors](competitors.md#where-application-tracker-can-stand-out))
2. **The biggest product gap is time.** The app knows *what* stage you're in but not *when*: no interview time, no applied date, no reminders, no "gone quiet" nudge. Ghosting is the norm: 52–61% of candidates report it ([Greenhouse 2024](https://www.greenhouse.com/uk/blog/greenhouse-2024-state-of-job-hunting-report)). Every competitor users praise has dates and reminders.
3. **Make the practice itself more effective.** Mock interviews give feedback, but not against a structured rubric. Questions are a one-time checkbox, not repeated practice. Structured answers and retrieval practice are the best-supported ideas in the research ([interview-prep](interview-prep.md)).

## Before you send it (polish, about one day in total)

Small changes that remove things an interviewer would trip over in the first five minutes.

| # | Change | Why | Effort |
|---|---|---|---|
| 1 | **Release Inbox.** Replace the "SAMPLE EMAILS" header and the empty promise ("Sample messages appear here as they arrive.") with a **Try sample emails** button that works in release builds. Hide "Connect Gmail" when no OAuth client IDs exist, instead of showing developer setup steps. | In a release build the Inbox never fills, and Connect shows `.env.local` instructions ([audit #3](in-app-ux-audit.md#issues-ranked-by-user-impact)) | S |
| 2 | **Rejection tone.** Use a neutral badge instead of a green check for "Updated: Rejected". Add one kind, base-rate line ("Most applications don't get a reply; this isn't a verdict on you") and an optional "What did you learn?" note. | Self-compassion buffers the effect of setbacks on job seekers ([Kreemers 2018](https://pure.uva.nl/ws/files/22282603/1_s2.0_S0001879118300186_main.pdf)); HIG: match tone to context ([audit #8](in-app-ux-audit.md#issues-ranked-by-user-impact)) | S |
| 3 | **Explain auto-updates.** Under an email update, show *why*: "Moved to Interviewing · email names Acme Health and asks to schedule". Add **Wrong application?** next to Undo. | Apple HIG asks AI features to show their reason and offer a correction ([attribution](https://developer.apple.com/design/human-interface-guidelines/machine-learning#Attribution), [corrections](https://developer.apple.com/design/human-interface-guidelines/machine-learning#Corrections)). The data is already there (category + grounded company) | S |
| 4 | **One meaning per icon.** The header "+" (manual form) and the floating "+" (add from a link) look the same but do different things. The Settings icon (sliders) reads as "filter". Keep one "+" that offers both, and use a gear for Settings. | [audit #7](in-app-ux-audit.md#issues-ranked-by-user-impact) | S |
| 5 | **Keep the listing text.** Save the shared or pasted description on the application and show it under Details. | Postings disappear; users want the description at interview time ([Teal help](https://help.tealhq.com/en/articles/14435727-how-to-track-your-job-applications), [competitors #1](competitors.md#opportunities-for-application-tracker)) | S |
| 6 | **Duplicate guard.** At draft review, if company and role match an application, say "You added this on 28 Oct". | "I sometimes even forget that I applied" ([competitors #4](competitors.md#opportunities-for-application-tracker)) | S |
| 7 | **App icon.** Replace the default Expo icon (`assets/expo.icon` uses `expo-symbol 2.svg`). | First thing seen on the home screen | S |

## Next: the features that make it a real product (about 1–2 weeks)

Ordered by impact for effort. Each builds on what's already there.

| # | Feature | Evidence | Impact | Effort |
|---|---|---|---|---|
| 1 | **Interview date and time + Add to Calendar.** Optional time on Next Steps, native date-time picker instead of typed `YYYY-MM-DD`, time shown on the Next interview card. The system event sheet (EventKitUI) needs no calendar permission on iOS 17+. | [audit #1](in-app-ux-audit.md#issues-ranked-by-user-impact), [Apple EventKit](https://developer.apple.com/documentation/eventkit/accessing-the-event-store), [`expo-calendar`](https://docs.expo.dev/versions/latest/sdk/calendar/) | High | M |
| 2 | **Stage history + "gone quiet" nudge.** Record when each Stage was entered (persist migration v4). After 14 days in Applied with no email activity, propose "Send a follow-up" with an on-device draft; after an interview, propose "Send thank-you" for the next day. Base "sent this week" on the Applied date. | 80% of HR managers weigh thank-you notes, but only 24% of candidates send one ([Accountemps 2017](https://press.roberthalf.com/2017-11-20-Thank-You-Notes-Can-Tip-Scale-in-Job-Candidates-Favor-Yet-Few-Write-Them)); [job-seeker #1–2](job-seeker-needs.md#opportunities-for-application-tracker) | High | M |
| 3 | **Local reminders.** The evening before an interview ("Practice 3 questions") and Time Sensitive 60 minutes before, with Snooze. Generic lock-screen text by default. | [HIG managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications), [`expo-notifications`](https://docs.expo.dev/versions/latest/sdk/notifications/); Teal's reminders are praised, Eztrackr charges for them ([competitors](competitors.md#what-users-praise)) | High | M (after #1) |
| 4 | **STAR rubric + one follow-up probe in mock interviews.** Flat booleans for Situation, Action, Result and a level (borderline, solid, outstanding). Code counts "I" vs "we" and checks for a number in the result. Then ask one probe ("What did *you* do?") before moving on. | Structured interviews predict performance better than unstructured ones; [Google re:Work rubrics](https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices), [DDI STAR](https://www.ddi.com/solutions/behavioral-interviewing/star-method), [Maurer 2001](https://pubmed.ncbi.nlm.nih.gov/11519654) | High | S–M |
| 5 | **Answer first, then reveal.** Hide the stronger answer until the user has answered. Replace the one-time "practiced" checkbox with a log of attempts, and mark questions "due again" before the interview. | Retrieval beats re-reading ([Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066)); spacing helps more ([Cepeda 2008](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2008.02209.x)) | High | M |
| 6 | **Undo everywhere.** A snackbar Undo after a stage change, closing an application, deleting a Next Step, discarding a draft, and ending a mock interview. | Only email updates can be undone today ([audit #2](in-app-ux-audit.md#issues-ranked-by-user-impact)); [HIG undo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo) | High | M |
| 7 | **Your data.** Export (JSON/CSV through the share sheet), import a backup, delete everything, and one line saying data stays on this iPhone. CSV also covers unemployment-claim reporting users ask for. | [audit #4](in-app-ux-audit.md#issues-ranked-by-user-impact), [competitors #5](competitors.md#opportunities-for-application-tracker) | High | M |
| 8 | **Weekly progress on Home.** "This week: 4 applied · 12 questions practiced · 1 mock", shown next to outcomes, not instead of them. | Perceived progress drives next-day effort ([Wanberg 2010](https://bm.hkust.edu.hk/bizinsight/2011/01/insights-job-search-grind)); search intensity predicts interviews ([van Hooft 2021](https://pubmed.ncbi.nlm.nih.gov/32658493/)) | High | S–M |
| 9 | **Search and sort the Pipeline.** Search as you type over company and role; sort by next due date, last updated, or Stage. | [audit #5](in-app-ux-audit.md#issues-ranked-by-user-impact), [HIG search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields) | Med | S |
| 10 | **Contacts from the inbox.** When an email matches an application, offer to save the sender as its recruiter contact. | "Losing recruiter contacts" is a top complaint; contacts are table stakes in Huntr, Teal, Eztrackr ([competitors #3](competitors.md#opportunities-for-application-tracker)) | Med–High | M |

## Later: bigger bets

| Bet | Why it's worth it | Effort |
|---|---|---|
| **Spoken mock interviews, transcribed on the phone.** Record with `expo-audio`, transcribe with the already-installed `@react-native-ai/apple` transcription model (iOS 26+), delete the audio after. Pace and pause stats from timings. | Interviews are spoken; Google's free Interview Warmup is gone; competitors charge for audio practice and store recordings. No one else can say "your answers never leave your phone" ([interview-prep #4](interview-prep.md#opportunities-for-application-tracker)) | L |
| **Story bank.** Save strong STAR answers and reuse them across applications; suggest one when a similar question comes up. | Organized answers are a core prep finding ([Maurer 2001](https://pubmed.ncbi.nlm.nih.gov/11519654)) | L |
| **Home Screen widget + App Shortcuts.** "Next interview Thu 2:00 PM · 6/10 practiced", "Practice for my next interview" via Siri. | [HIG widgets](https://developer.apple.com/design/human-interface-guidelines/widgets), [`expo-widgets`](https://docs.expo.dev/versions/latest/sdk/widgets/), [`expo-app-intents`](https://docs.expo.dev/versions/v58.0.0/sdk/app-intents/) (alpha) | M–L |
| **Android AI on Gemini Nano devices** through the existing `OnDeviceModel` adapter. | [RN AI Android](https://www.react-native-ai.dev/docs/android/getting-started) | M–L |
| **Personal funnel by source.** Interview rate by career site vs job board vs referral, on device. | Career sites convert about 1.7× job boards ([Huntr research](https://huntr.co/research/job-search-trends-q3-2026)) | M |
| **Prewarm the model** with `prepare()` when intake or a mock interview opens, so the first answer starts sooner. `AppleLLMChatLanguageModel.prepare()` exists in the installed 0.12.0. | Fewer slow first responses [INFERENCE: not measured] | S |
| **Read the model's context size at runtime** instead of the hard-coded 4,096. **Blocked:** the installed `@react-native-ai/apple` 0.12.0, which is also the latest on npm (checked 2026-11-08), has no `getModelInfo()` or `contextSize`; the docs page describes an unreleased API. Needs a library upgrade or a small native spike. | Context size varies by device on iOS 27 ([Apple](https://developer.apple.com/documentation/foundationmodels/detecting-available-apple-foundation-models)) | Unknown until the spike |

## Non-goals

- **A live in-interview copilot** (as Final Round AI sells). Employers forbid it ([Anthropic candidate guidance](https://www.anthropic.com/candidate-ai-guidance)), and it undercuts the "practice" promise.
- **Loading LinkedIn pages.** Against LinkedIn's terms and this repo's rules; paste stays the path.
- **Cloud AI.** Privacy is the differentiator; keep everything on the device and say so in the UI.
- **Resume and cover-letter generation.** Commoditized; users say ChatGPT does it as well ([competitors](competitors.md#table-stakes-vs-differentiators)).

## Open questions

- Follow-up timing (7 vs 14 days) is convention; no controlled study shows that following up raises response rates ([job-seeker-needs](job-seeker-needs.md)).
- Whether Apple's on-device transcription keeps filler words ("um") is undocumented; test on a device before showing a filler count.
- Reddit blocked automated reads for some threads; those links are cited as found but not every quote could be re-fetched ([competitors](competitors.md)).
