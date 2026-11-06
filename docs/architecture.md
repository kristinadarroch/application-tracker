# Architecture

The architecture is organized around the four requirements in the project brief. Each section below names the requirement it serves.

```mermaid
flowchart TB
  subgraph Device["React Native app (Expo dev build) — all repo code is TypeScript"]
    UI["Screens<br/>src/app (Expo Router)"]
    DS["Design system<br/>src/design-system"]
    FE["Feature modules<br/>src/features/*"]
    ST["Redux store<br/>slices + RTK Query"]
    PS[("AsyncStorage<br/>redux-persist")]
    ES["EmailSource<br/>Mock (demo) | Gmail (later)"]
    AD["AI adapter<br/>src/services/ai"]
    LIB["On-device model library<br/>(dependency)"]
  end
  OS["Apple Intelligence<br/>on-device model (iOS 26+)"]
  UI --> DS
  UI --> FE
  FE --> ST
  ST <--> PS
  FE --> ES
  ST -- "RTK Query queryFn<br/>(timeout + Zod)" --> AD
  AD --> LIB
  LIB --> OS
```

## Requirement 1 — React Native & TypeScript

### Platform

- **Expo SDK 58, dev build** (not Expo Go). Required by the `expo-sharing` share-receive plugin ([ADR 0001](adr/0001-official-expo-sharing-for-share-intake.md)).
- **Expo Router** with typed routes. Route files stay thin: they read params, call a feature hook, and render feature components.
- **New Architecture** (Expo default).
- Targets: iOS Simulator and Android Emulator for the demo. Web is out of scope.
- **AI is iOS-only** (Apple Intelligence). Android runs every non-AI feature, with AI gated off. See [ADR 0005](adr/0005-on-device-apple-foundation-models.md).

### TypeScript rules

`tsconfig.json` extends `expo/tsconfig.base` and adds:

| Flag | Why |
|---|---|
| `strict: true` | Baseline |
| `noUncheckedIndexedAccess: true` | Record and array lookups return `T \| undefined`; forces handling missing entities |
| `exactOptionalPropertyTypes: true` | `salary?: Salary` can't be set to `undefined` by accident |
| `noImplicitOverride`, `noFallthroughCasesInSwitch` | Fewer silent bugs |

Code rules (enforced by ESLint where possible):

1. No `any`. `unknown` + Zod parse at boundaries.
2. No non-null assertions (`!`) outside tests.
3. Exhaustive `switch` over unions with a `never` check helper (`assertNever`).
4. Domain types are inferred from Zod schemas (`z.infer`), so runtime validation and static types can't drift.
5. IDs are branded types (`ApplicationId`, `MessageId`) so an application ID can't be passed where a message ID is expected.

## Requirement 2 — Code quality

### Folder layout (feature-first)

```
src/
  app/                          # Expo Router routes (thin)
    _layout.tsx                 # providers: Redux, PersistGate, Theme, ErrorBoundary
    +native-intent.ts           # redirect incoming shares to /intake/share
    (tabs)/
      _layout.tsx
      index.tsx                 # Pipeline
      inbox.tsx                 # Inbox
      prep.tsx                  # Prep hub
    application/[id].tsx        # Application detail
    intake/new.tsx              # Paste URL or text
    intake/share.tsx            # Share-received handler
    intake/review/[draftId].tsx # Confirm AI draft
    prep/[applicationId]/mock.tsx
    settings.tsx
    dev/design-system.tsx       # gallery (__DEV__ only)
  design-system/                # see docs/design-system.md
  features/
    applications/  { schema.ts, slice.ts, selectors.ts, components/, hooks/ }
    intake/        { schema.ts, draftsSlice.ts, fetchListing.ts, components/ }
    inbox/         { emailSource.ts, mockEmailSource.ts, fixtures/, slice.ts, matching.ts, components/ }
    prep/          { schema.ts, slice.ts, components/ }
    settings/      { slice.ts }
  services/
    ai/            { model.ts (adapter interface), foundationModels.ts, unavailableModel.ts, prompts/, tasks.ts, aiApi.ts (RTK Query), budget.ts }
  store/           { store.ts, rootReducer.ts, persist.ts, hooks.ts }
  lib/             { errors.ts, result.ts, assertNever.ts, ids.ts, dates.ts }
```

Rules:

1. A feature can import from `design-system`, `lib`, `services`, `store/hooks`, and its own folder. Features don't import each other's internals; they share through selectors exported from a feature's `index.ts`.
2. Only `src/services/ai/foundationModels.ts` imports the on-device model library. An ESLint `no-restricted-imports` rule blocks it everywhere else, so swapping libraries touches one file.
3. Components receive data through props. Hooks (`useApplication(id)`) connect components to the store.

### Error handling

All failures become one typed union. Screens never see raw exceptions.

```ts
// src/lib/errors.ts
export type AppError =
  | { kind: 'network' }                                   // offline, DNS, connection reset (URL fetch only)
  | { kind: 'timeout'; afterMs: number }                  // request took longer than its limit
  | { kind: 'invalid_response'; issues: string[] }        // Zod parse failed
  | { kind: 'ai_unavailable'; reason: AiUnavailableReason }
  | { kind: 'context_too_long' }                          // input didn't fit the model's context window
  | { kind: 'content_blocked' }                           // model safety guardrail refused the request
  | { kind: 'listing_unreadable'; reason: 'blocked' | 'empty' | 'login_wall' | 'non_html' }
  | { kind: 'not_found'; entity: 'application' | 'draft' | 'message' };

export type AiUnavailableReason =
  | 'unsupported_platform'      // Android
  | 'os_too_old'                // iOS < 26
  | 'device_not_eligible'
  | 'apple_intelligence_off'
  | 'model_not_ready';          // still downloading
```

| Layer | Responsibility |
|---|---|
| `services/ai/foundationModels.ts` | Maps library errors to `AppError`; Zod-parses every result even though the library already applies the schema |
| `services/ai/aiApi.ts` | Enforces per-task time limits; returns `AppError`, never throws |
| `features/intake/fetchListing.ts` | URL fetch with a 10 s timeout; maps failures to `network` or `listing_unreadable` |
| Slices | Store `AppError` in state where the UI needs it (e.g. a message's triage status) |
| Components | `ErrorState` maps `kind` to plain-language copy and a retry action |
| Root | `ErrorBoundary` in `_layout.tsx` catches render errors, shows a recover screen, and logs in dev |
| Forms | Zod schemas validate manual entry; field errors render through `TextField.error` |

**AI failure never blocks core application tracking.** If extraction fails, the user fills the form by hand. If triage fails, the user tags the message by hand. Prep questions and mock interviews have no manual equivalent; on failure they keep existing state (question set, transcript, typed answer) and offer retry.

## Requirement 3 — Redux (Redux Toolkit)

### Store shape

```ts
interface RootState {
  applications: EntityState<Application, ApplicationId>; // createEntityAdapter, sorted by updatedAt
  drafts: EntityState<ApplicationDraft, DraftId>;          // AI output awaiting user confirmation
  inbox: {
    messages: EntityState<InboxMessage, MessageId>;
    triage: Record<MessageId, TriageState>;               // idle | pending | done(result) | failed(AppError)
    fixtureCursor: number;                                // next mock message to "receive"
  };
  prep: {
    questionSets: Record<ApplicationId, PrepQuestionSet>;
    sessions: EntityState<MockInterviewSession, SessionId>;
  };
  settings: { theme: ThemePreference; emailSource: 'mock'; aiReplay: boolean };
  capabilities: { ai: AiAvailability };                   // not persisted; re-checked at launch and on app foreground
  aiApi: /* RTK Query cache */;
}
```

### Why this shape

- **Entity adapters** for anything listed or looked up by ID: O(1) lookups, ready-made CRUD reducers, normalized state.
- **Drafts are a separate slice.** AI output never writes straight into `applications`. The user confirms a draft, which dispatches `applicationAdded` and `draftRemoved`. This is the human-in-the-loop boundary in code.
- **Triage state lives next to messages**, keyed by ID, so one failed message doesn't affect others.
- **RTK Query** owns request lifecycle (loading, error, dedupe) for AI calls. Its results are copied into domain slices on success via `extraReducers` or `onQueryStarted`, so domain data persists even though the RTK Query cache doesn't.

### Selectors

Memoized with `createSelector`, colocated in each feature's `selectors.ts`, and unit-tested:

| Selector | Returns |
|---|---|
| `selectApplicationsByStage` | `Record<Stage, Application[]>` for the pipeline board |
| `selectUpcomingNextSteps` | Next steps sorted by due date, flagged `urgent` within 48 h |
| `selectPipelineCounts` | Counts per stage for the header summary |
| `selectUntriagedMessages` | Inbox messages with no triage result |
| `selectAiAvailability` | `capabilities.ai`, read by every AI entry point |
| `selectPrepProgress(applicationId)` | Answered / total prep questions |

### Persistence

`redux-persist` with AsyncStorage. Persisted: `applications`, `drafts`, `inbox`, `prep`, `settings`. Not persisted: `capabilities` (the user can turn Apple Intelligence on or off at any time) and `aiApi` (request cache). Each persisted slice has a `version` and a `migrate` function from the first release onward.

### Typed hooks

`store/hooks.ts` exports `useAppDispatch` and `useAppSelector` (`.withTypes<>()`). Untyped `useDispatch`/`useSelector` are banned by ESLint.

## AI features (product)

### On-device model

AI runs on Apple's on-device foundation model through a third-party React Native library, wrapped by one adapter ([ADR 0005](adr/0005-on-device-apple-foundation-models.md)). No server, no API key, no per-token cost, and listing and email text never leave the device.

```ts
// src/services/ai/model.ts
export type AiAvailability =
  | { status: 'available'; contextTokens: number }
  | { status: 'unavailable'; reason: AiUnavailableReason };

export interface OnDeviceModel {
  availability(): AiAvailability;
  generate<S extends z.ZodType>(request: {
    instructions: string;
    prompt: string;
    schema: S;
  }): Promise<Result<z.infer<S>, AppError>>;
}
```

- `foundationModels.ts` implements `OnDeviceModel` with the library that passes the [spike gate](adr/0005-on-device-apple-foundation-models.md#spike-gate-tier-0).
- `unavailableModel.ts` implements it for Android and ineligible iPhones; every call returns `ai_unavailable`.
- Jest tests use a fake `OnDeviceModel`. The library is never loaded in tests.

### Tasks

Each task is a function in `tasks.ts` with its own prompt (`prompts/*.ts`), Zod schema, and time limit, exposed through RTK Query `queryFn` endpoints.

| Task | Input | Output (Zod schema) | Time limit |
|---|---|---|---|
| `extractListing` | listing text | `ListingExtraction` → becomes an `ApplicationDraft` | 20 s |
| `triageMessage` | `{ message, applications: { id, company, role }[] }` | `TriageResult`: category, matched application ID or none, proposed next step, confidence | 20 s |
| `prepQuestions` | application summary | `PrepQuestionSet`: questions grouped by type (behavioral, technical, role-specific, questions to ask) | 45 s |
| `mockInterviewTurn` | application summary, current question, answer, earlier question titles | `MockInterviewTurn`: feedback on the answer + next question | 45 s |

Time limits are starting values, to be tuned after measuring on the Simulator and a device in tier 2.

### Context budget

The on-device model has a small context window (8,192 tokens measured on macOS 27; Apple documents 4,096). Rules:

1. **One fresh session per request.** No long-lived chat sessions, so context never accumulates.
2. **Budget for 4,096 tokens** regardless of the measured size, so the app behaves the same on every supported OS.
3. **Trim listings before sending.** `budget.ts` strips boilerplate (navigation, legal footers, repeated whitespace) and, if still too long, keeps the beginning, where company and role usually appear. The draft review shows "Only the first part of this listing was read" when trimming happened.
4. **Mock interviews send a summary, not the transcript.** Each turn sends the application summary, the current question and answer, and the titles of earlier questions (to avoid repeats). The full transcript stays in Redux.
5. **`context_too_long` is still handled** in case an estimate is wrong: intake offers manual entry; other tasks offer retry with shorter input.

### Availability

`capabilities.ai` is filled at launch and re-checked when the app returns to the foreground. AI entry points read it through `selectAiAvailability`:

- **Available:** AI actions are shown normally.
- **Unavailable:** intake opens the manual form, inbox shows "Tag manually", and prep and mock interview show why AI is unavailable and what to do (e.g. "Turn on Apple Intelligence in Settings"). See [UX-7](user-stories.md#ux-7--know-when-ai-isnt-available-).

### Listing fetch

URL intake fetches the page on the device, strips it to text, and checks the result before calling the model. Blocked, empty, login-wall, or JavaScript-only pages return `listing_unreadable`, and the app asks the user to paste the listing text. **Pasted text is the primary path for every job board**; URL fetch is a shortcut that may fail on any site. URL fetch is the only AI-adjacent step that needs a network.

### Guardrails

1. Structured output only. The library constrains output to the task's Zod schema, and the adapter validates it again with Zod.
2. Triage receives only the user's existing applications as match candidates and must return one of those IDs or `none`. It can't invent applications.
3. Deterministic (greedy) sampling for extraction and triage, if the library supports it, to reduce run-to-run drift.
4. Per-task time limit and a Retry action. Intake and triage also offer the manual path; prep and mock interview keep state for retry.
5. **AI replay** (`settings.aiReplay`, dev only): replays recorded results for the fixture inbox and demo listing. The UI shows a "Replayed" badge on any replayed result. It is a demo safety net, never presented as live output.

## Inbox

```ts
// src/features/inbox/emailSource.ts
export interface EmailSource {
  listRecent(since: string): Promise<InboxMessage[]>;
}
```

The demo uses `MockEmailSource`, backed by `fixtures/inbox.json` (about 8 messages: interview invite, scheduling link, take-home, rejection, offer, recruiter follow-up, newsletter, receipt). A dev-only "Receive next email" action appends the next fixture so the app can react live. A Gmail implementation can be added behind the same interface. See [ADR 0002](adr/0002-mock-email-source-behind-interface.md).

## Requirement 4 — AI in development

How AI is used to build the app (separate from AI features in the product) is in [`docs/ai-development.md`](ai-development.md) and enforced by [`AGENTS.md`](../AGENTS.md).

## Testing

| Level | Tool | What |
|---|---|---|
| Unit | Jest (`jest-expo`) | Zod schemas (accept/reject real-shaped payloads), reducers, selectors, triage matching, adapter error mapping, `budget.ts` trimming |
| Component | React Native Testing Library | Design-system components by role/label: disabled, loading, error copy, required labels |
| Screen | RNTL + fake `OnDeviceModel` | Intake flow: paste → draft → confirm → appears in pipeline; failure → manual form; AI unavailable → manual form |
| Manual | Simulator + Emulator | On-device AI on the iOS Simulator; AI gated off on Android; share-sheet intake, theme switch, font scaling, VoiceOver/TalkBack pass |

CI runners have no Apple Intelligence, so CI never calls the real model. Prompt quality is checked by hand against a fixed set of sample listings and emails (tier 2 and 4).

CI (GitHub Actions): `tsc --noEmit`, ESLint, Jest on every push.
