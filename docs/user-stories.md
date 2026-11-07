# User stories

User stories are the source of truth for **what** the app does and how we know it works. [`features.md`](features.md) says **when** each story gets built (tiers). Terms follow [`CONTEXT.md`](../CONTEXT.md).

## Personas

| Persona | Who | Notes |
|---|---|---|
| **Job seeker** | Someone actively applying to several roles at once | Primary user. Every story is theirs unless marked otherwise. |
| **Presenter** | The developer demoing the app in an interview | Dev-only stories. Never visible in a release build. |

## Story map

★ = shown in the [demo script](demo-script.md).

| Epic | Stories | Tier | Priority |
|---|---|---|---|
| [Experience & accessibility](#experience--accessibility) | UX-1 – UX-7 | 0–2 | Must |
| [Pipeline](#pipeline) | PIPE-1 – PIPE-7 | 1 | Must |
| [Intake](#intake) | INT-1 – INT-6 | 2 | Must |
| [Prep questions](#prep-questions) | PREP-1 – PREP-3 | 2 | Must |
| [Mock interview](#mock-interview) | MOCK-1 – MOCK-5 | 3 | Should |
| [Inbox](#inbox) | INBX-1 – INBX-6 | 4 | Should |
| [Later](#later) | LATER-1 – LATER-2 | Stretch | Could |

## Shared rules

These apply to every story, so they aren't repeated in each one.

- **Loading:** any wait over 300 ms shows a `Skeleton` or a busy button, never a blank screen.
- **AI time limits:** each AI task has a time limit (20 s for extraction and triage, 45 s for prep questions and interview turns; tuned in tier 2) and shows the timeout error when it runs out.
- **AI runs on the device:** AI needs an iPhone with Apple Intelligence turned on, but no network. See [UX-7](#ux-7--know-when-ai-isnt-available-) for every other device.
- **AI never blocks tracking:** AI failure never blocks core application tracking. Intake and inbox stories offer a manual path; prep and mock-interview stories keep existing state and offer retry.
- **Urgent:** a Next Step is urgent when it is due within 48 hours or overdue.
- **Accessibility:** every screen passes the [accessibility checklist](design-system.md#accessibility-checklist).

---

## Experience & accessibility

### UX-1 · Choose light, dark, or system theme ★

As a job seeker, I want the app to match my preferred theme, so that it's comfortable to read at any time of day.

- **Given** my theme is set to System, **when** I change the OS appearance, **then** the app switches theme without a restart.
- **Given** I pick Light or Dark in Settings, **when** I change the OS appearance, **then** the app keeps my choice.
- **Given** I chose a theme, **when** I restart the app, **then** my choice is kept.

### UX-2 · Use the app with large text

As a job seeker who uses large text, I want every screen to stay readable, so that I don't lose information.

- **Given** the largest OS text size, **when** I open any screen, **then** no text is clipped or overlapping, and long content scrolls.
- **Given** the largest OS text size, **when** I view a pipeline card, **then** the company, role, and stage label are all visible.

### UX-3 · Use the app with a screen reader

As a job seeker who uses VoiceOver or TalkBack, I want every control announced clearly, so that I can use the app without seeing it.

- **Given** VoiceOver or TalkBack is on, **when** I move through a screen, **then** the reading order matches the visual order.
- **When** focus lands on an icon-only button, **then** it announces a label that says what it does.
- **When** focus lands on a stage pill, **then** it announces "Stage: {stage}".
- **When** an error or banner appears, **then** it is announced without moving my focus.

### UX-4 · Respect reduced motion

As a job seeker who is sensitive to motion, I want animations turned off when I ask the OS for that, so that the app doesn't make me uncomfortable.

- **Given** Reduce Motion is on, **when** content loads or changes, **then** nothing animates and skeletons show a static fill.

### UX-5 · Understand what went wrong

As a job seeker, I want errors in plain language with a way forward, so that a failure never leaves me stuck.

- **When** any request fails, **then** I see what happened in plain language (offline, took too long, unexpected response, AI not available on this device) and a Retry action where retrying can help.
- **When** intake or inbox AI fails, **then** I also see a manual alternative.
- **When** a screen crashes while rendering, **then** I see a recovery screen instead of a blank app, and my saved data is intact.

### UX-6 · Browse the design system (Presenter) ★

As the presenter, I want one screen showing every token and component in both themes, so that I can walk through the design system live.

- **Given** a development build, **when** I open `/dev/design-system`, **then** I see colors, type, spacing, radii, elevation, and every component in each of its variants and states.
- **When** I toggle the theme on that screen, **then** everything re-renders in the other theme.
- **Given** a release build, **then** the route doesn't exist.

### UX-7 · Know when AI isn't available ★

As a job seeker on a device without Apple Intelligence, I want to know why AI features are missing and still use everything else, so that the app never feels broken.

- **Given** an Android phone or an iPhone that can't run Apple Intelligence, **then** every non-AI feature works normally.
- **Given** AI is unavailable, **when** I start intake, **then** the manual form opens with my pasted text or URL kept, and a note says why AI wasn't used.
- **Given** AI is unavailable, **when** I open the Inbox, **then** messages show "Tag manually" instead of an analysis status.
- **Given** AI is unavailable, **when** I open prep questions or a mock interview, **then** I see the reason and what I can do, e.g. "Turn on Apple Intelligence in Settings" or "Apple Intelligence isn't available on this device".
- **Given** I turn Apple Intelligence on while the app is in the background, **when** I return to the app, **then** AI features become available without a restart.

---

## Pipeline

### PIPE-1 · See my pipeline by stage ★

As a job seeker, I want my applications grouped by stage, so that I can see where everything stands at a glance.

- **When** I open the Pipeline tab, **then** applications are grouped in stage order (Saved, Applied, Interviewing, Offer, Rejected, Withdrawn), with a count per stage.
- **Given** no applications, **then** I see an empty state led by "Add from a link", with "Add application" for entering one by hand.
- **Given** a stage has no applications, **then** that group shows its count of 0 and takes minimal space.
- **When** I open the Pipeline tab, **then** a "Next interview" card comes first, showing the Interviewing application with the soonest open Next Step (ties: most recently updated), its company and role, prep progress ("4 of 10 questions practiced · 1 mock interview" or "Prep not started"), and "Practice questions" and "Mock interview" buttons that open that application's prep and mock interview.
- **Given** more than one application is Interviewing, **then** the card shows how many others there are ("+N MORE").
- **Given** no application is Interviewing, **then** the card reads "No interviews yet" with "Move an application to Interviewing and its prep questions show up here." and no buttons.
- **When** I look below the Next interview card, **then** I see the "Up next" Next Step, then "Your applications" ("3 active · 0 closed"), then stats with questions practiced first.
- **Given** an application is Interviewing, **then** its row shows its prep progress ("4 of 10 practiced · 1 mock" or "Prep not started"), and the row's screen-reader label ends with ", Prep: 4 of 10 questions practiced" (or ", Prep: not started").

### PIPE-2 · Add an application by hand

As a job seeker, I want to add an application manually, so that I can track roles I found anywhere.

- **When** I save with company and role filled in, **then** the application appears under Saved (or the stage I picked).
- **When** I save with a blank company or role, **then** I see an error on each missing field and nothing is saved.
- **When** I enter a listing link that isn't an `http(s)` URL, **then** I see an error on that field.

### PIPE-3 · Move an application to a new stage ★

As a job seeker, I want to change an application's stage, so that my pipeline reflects reality.

- **When** I change the stage on the detail screen, **then** the card moves to the new group immediately.
- **When** I restart the app, **then** the new stage is kept.

### PIPE-4 · View and edit details

As a job seeker, I want to see and edit everything about an application, so that my notes stay in one place.

- **When** I open an application, **then** I see company, role, location, salary, listing link, stage, notes, and Next Steps.
- **When** I edit a field and save, **then** the change shows everywhere that application appears.
- **When** I tap the listing link, **then** it opens in the browser.

### PIPE-5 · Delete an application

As a job seeker, I want to delete an application, so that my pipeline only shows what matters.

- **When** I tap Delete, **then** I must confirm before anything is removed.
- **When** I confirm, **then** the application, its Next Steps, prep questions, and mock interview sessions are removed.

### PIPE-6 · Track next steps ★

As a job seeker, I want dated next steps on each application, so that I don't miss a deadline.

- **When** I add a Next Step with a title and due date, **then** it appears on the application, sorted by due date.
- **Given** a Next Step is urgent, **then** its pipeline card shows a warning badge.
- **When** I mark a Next Step done, **then** it moves to a completed list and no longer counts as urgent.

### PIPE-7 · Keep my data

As a job seeker, I want my data saved on my device, so that nothing is lost when I close the app.

- **When** I force-quit and reopen the app, **then** all applications, drafts, Next Steps, prep questions, sessions, and settings are restored.

---

## Intake

### INT-1 · Share a listing from my browser ★

As a job seeker, I want to share a job listing straight from my browser, so that saving a role takes one tap.

- **Given** I'm viewing a listing in Safari (iOS) or Chrome (Android), **when** I share it to Application Tracker, **then** the app opens on the share-received screen with the URL filled in.
- **When** the shared content isn't a URL or text, **then** I see "This can't be imported" and a link to add the job from its link instead.

### INT-2 · Paste a listing's text

As a job seeker, I want to paste a listing's text when I have no link, so that I can import roles from any site.

- **When** I choose "Paste text", paste listing text, and submit, **then** I get an Application Draft with company and role filled in.
- **Given** the text box is empty or only whitespace, **then** Submit is disabled and nothing is sent.
- **When** the AI can't find a company or role in the text, **then** I see "Couldn't find the company or role" with "Edit text" and "Fill in manually", and my text is kept.

### INT-3 · Add a job from its link ★

As a job seeker, I want to give the app a job's link and have it fill in the rest, so that I never copy a whole listing.

- **When** I open "Add from a link", **then** the link field is shown first; pasting text is the fallback.
- **When** I paste a whole link into the empty field, **then** the app starts loading and reading the page without another tap, and I get an Application Draft with the listing link stored.
- **Given** the page is blocked, empty, behind a login, or needs JavaScript, **then** I see "Couldn't read this page" and the screen switches to paste mode with the URL kept.

### INT-4 · Review a draft before saving ★

As a job seeker, I want to check and fix what the AI extracted, so that wrong details never land in my pipeline.

- **When** a draft is ready, **then** every extracted field is shown and editable.
- **When** I tap Confirm, **then** an application is created and the draft is removed.
- **When** I tap Discard, **then** the draft is removed and nothing is created.
- **Then** no draft ever becomes an application without an explicit Confirm tap.

### INT-5 · Recover when extraction fails

As a job seeker, I want a way forward when the AI can't read a listing, so that I can still save the role.

- **When** the AI response doesn't match the expected shape, **then** I see an error with Retry and "Fill in manually".
- **Given** I'm offline, **when** I paste listing text, **then** extraction still works, because AI runs on the device.
- **When** I go offline while a listing URL is loading, **then** I see the offline error and the screen switches to paste mode with the URL kept.
- **Given** the listing is longer than the AI can read at once, **then** the draft review says "Only the first part of this listing was read".
- **When** I tap "Fill in manually", **then** the manual form opens with any text or URL I already entered.

### INT-6 · Come back to an unfinished draft

As a job seeker, I want unconfirmed drafts kept, so that I can finish reviewing later.

- **Given** I left a draft without confirming or discarding, **when** I return to the Pipeline tab, **then** I see a "1 draft to review" banner that opens it.

---

## Prep questions

### PREP-1 · Get prep questions for an application ★

As a job seeker, I want likely interview questions for a specific role, so that I can prepare for what I'll actually be asked.

- **When** I open prep questions for an application that has none, **then** they generate on their own, with no button to tap, grouped as behavioral, technical, role-specific, and questions to ask them.
- **When** I save a new application (by hand or by confirming a draft) and AI is available, **then** its questions start generating in the background, so they are ready or nearly ready when I open Prep. Loading demo data does not start this.
- **Then** the role-specific questions mention the application's role or listed requirements.
- **When** I regenerate, **then** I'm asked whether to replace the existing set first.

### PREP-2 · Track what I've practiced

As a job seeker, I want to mark questions as practiced, so that I can see my progress.

- **When** I mark a question practiced, **then** the application shows progress such as "6 / 14 practiced".
- **When** I restart the app, **then** progress is kept.

### PREP-3 · Recover when question generation fails

As a job seeker, I want a clear retry when generation fails, so that I'm not stuck.

- **When** generation fails or times out, **then** I see the error with Retry, and any existing question set stays as it was. A failure is not retried on its own.

---

## Mock interview

### MOCK-1 · Start a mock interview ★

As a job seeker, I want to practice an interview for a specific application, so that practice matches the real thing.

- **When** I open the mock interview and no session is active, **then** the AI asks a first question about this application's role, with no Start step. An active session resumes instead.
- **When** I end a session, **then** no new session starts while the screen closes.
- **Given** two applications with different roles, **then** their first questions differ in a way that reflects each role (checked by hand).

### MOCK-2 · Get feedback on each answer ★

As a job seeker, I want feedback after every answer, so that I improve as I go.

- **When** I submit an answer, **then** I see strengths, gaps, and a stronger example answer, followed by the next question.

### MOCK-3 · Keep my answer when a turn fails

As a job seeker, I want my typed answer kept if something fails, so that I never have to retype it.

- **When** a turn fails or times out, **then** my answer stays in the input and I can retry.

### MOCK-4 · Leave and resume

As a job seeker, I want to leave a session and come back, so that I can practice in short bursts.

- **When** I leave mid-session and return, **then** the full transcript is restored and I can continue.

### MOCK-5 · Review a finished session

As a job seeker, I want a summary when I end a session, so that I know what to work on.

- **When** I tap End, **then** I see a summary of strengths and gaps across all answers.
- **Then** past sessions are listed on the application, newest first.

---

## Inbox

### INBX-1 · See job-related messages ★

As a job seeker, I want my job-search email in one place, so that I can see what needs a response.

- **When** I open the Inbox tab, **then** I see messages newest first, each showing sender, subject, and triage status (analyzing, done, couldn't analyze).

### INBX-2 · Get a next step from an email ★

As a job seeker, I want the app to spot what an email asks me to do, so that I can act without re-reading it.

- **Given** an interview-invite message from a company I have an application for, **when** triage finishes, **then** I see a proposed Next Step with a due date, linked to that application.
- **When** I accept the proposal, **then** the Next Step is added to that application.
- **When** I dismiss it, **then** nothing changes.

### INBX-3 · Ignore unrelated email

As a job seeker, I want unrelated email set aside, so that the inbox stays focused.

- **Given** a newsletter or a receipt, **when** triage finishes, **then** it is labeled unrelated and proposes nothing.

### INBX-4 · Pick the application when the match is uncertain

As a job seeker, I want to choose the application myself when the app isn't sure, so that next steps land in the right place.

- **Given** a low-confidence match, **then** I'm asked to choose from my applications before accepting.
- **Given** the AI returns an application that doesn't exist, **then** the result is treated as an unexpected response, never shown as a match.

### INBX-5 · Tag an email by hand ★

As a job seeker, I want to link an email to an application myself when analysis fails, so that the inbox never blocks me.

- **When** triage fails, **then** only that message shows "Couldn't analyze — Retry"; other messages are unaffected.
- **When** I tap "Tag manually", **then** I can pick an application and add a Next Step myself.

### INBX-6 · Simulate incoming email (Presenter) ★

As the presenter, I want to deliver the next sample email on demand, so that I can show the inbox reacting live.

- **Given** a development build, **when** I tap "Receive next email", **then** the next sample message appears and triage starts.
- **Given** AI Replay is on, **then** every replayed result shows a "Replayed" badge.
- **Given** all sample messages are delivered, **then** the button is disabled with "No more sample emails".

---

## Later

### LATER-1 · Summarize interview reviews I found

As a job seeker, I want to paste interview reviews I found online and get likely questions, so that I can learn from others' experiences.

- **When** I paste review text, **then** I get likely questions, each quoting the source text it came from.

### LATER-2 · Connect my real Gmail

As a job seeker, I want the inbox to read my actual job-search email, so that I don't have to forward anything.

- Scoped in [ADR 0002](adr/0002-mock-email-source-behind-interface.md). Test users only; acceptance criteria to be written if this is picked up.
