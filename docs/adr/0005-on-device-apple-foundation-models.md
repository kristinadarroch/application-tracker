---
status: accepted — on-device Apple Intelligence through `@react-native-ai/apple` (`ai@6`), after the tier 0 spike (2026-11-05)
---

# Run AI on-device with Apple Foundation Models through a library behind a TypeScript adapter

Product AI runs on Apple's on-device foundation model (Apple Intelligence) instead of a cloud LLM, so there is no metered per-token cost, no server, and no API key, and listing and email text never leave the device. The model still has a token budget (its context window). The app reaches the model through a third-party React Native library wrapped by one TypeScript adapter in `src/services/ai/`. All code in this repo stays TypeScript, matching the brief's "built entirely with TypeScript" requirement. Supersedes [ADR 0003](0003-ai-through-server-proxy-with-validated-drafts.md).

## Considered options

- **Cloud LLM through Expo API routes (ADR 0003).** Strongest model quality, but has metered per-token cost and needs a deployed server and a secret.
- **Our own Expo module in Swift.** Full control of Apple's typed-generation APIs, but puts Swift source in this repo against the brief's TypeScript requirement. Rejected.
- **`react-native-foundation-models` (Nitro module).** Its docs describe Zod-typed output, but the published npm version (0.1.3) only exposes `respond(prompt): Promise<string>`; structured output exists only on the unreleased main branch. **Failed spike criterion 3**; not adopted.
- **`@react-native-ai/apple` (AI SDK provider, 0.12.0).** Zod output through `generateText` + `Output.object`, pinned to `ai@6` because the provider implements the AI SDK v6 provider spec. **Chosen**: passed every spike criterion.

## Spike gate (tier 0)

The chosen library is adopted only if, in an Expo SDK 58 dev build, it:

1. Builds and runs on the iOS Simulator with the New Architecture.
2. Reports the model as available on the Simulator (which uses the host Mac's model).
3. Returns a Zod-validated `ListingExtraction` for a sample listing.
4. Surfaces a distinct error when input exceeds the context window.
5. Lets the Android build compile and run, with the adapter reporting AI as unavailable.

If neither library passes, the decision returns to the user: restore the server path (ADR 0003) or reduce AI scope.

### Spike result (2026-11-05)

| Criterion | Result |
|---|---|
| 1. Builds on iOS Simulator (iOS 27.0, iPhone 18 Pro, New Architecture) | Pass |
| 2. Model available on Simulator | Pass (`available`) |
| 3. Zod-validated `ListingExtraction` | Pass: company, role, location, salary, 5 requirements; 6.3 s cold, 5.3 s warm |
| 4. Distinct context-overflow error | Pass: maps to `context_too_long` in about 4 s. The provider forwards errors as text, so the adapter matches the message |
| 5. Android compiles and runs, AI reported unavailable | Pass on Android emulator (API 36): `unsupported_platform` |

Provider limits found: availability is a boolean (no reason), errors carry no structured code, and structured output can't stream. The adapter maps all iPhone-side unavailability to one reason with Settings guidance.

## Consequences

- **iOS only.** AI needs iOS 26+ and an Apple Intelligence device with the feature turned on. Android and ineligible iPhones run the full app with AI gated off ([UX-7](../user-stories.md#ux-7--know-when-ai-isnt-available-)).
- **Smaller model.** Good at extraction and classification; prep questions and interview feedback need prompt testing against real listings.
- **Limited context.** Measured 8,192 tokens on macOS 27.0.1 (M4); Apple's "Managing the context window" article states 4,096. Every task uses a fresh session, and inputs are budgeted for the smaller window.
- **Works offline.** Extraction of pasted text, triage, prep, and mock interviews need no network. Only URL fetch does.
- **Dependency risk.** `@react-native-ai/apple` is a small community project pinned to `ai@6`. The adapter keeps a library swap to one file (`src/services/ai/foundationModels.ios.ts`).
- The model changes with OS updates (Apple's Foundation Models release notes), so prompts are re-checked after each major iOS release.
- **Carried over from ADR 0003:** every model result is validated with Zod, and AI output only lands as a draft or proposal the user confirms.
