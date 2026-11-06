---
status: accepted
---

# Run AI on-device with Apple Foundation Models through a library behind a TypeScript adapter

Product AI runs on Apple's on-device foundation model (Apple Intelligence) instead of a cloud LLM, so there is no per-token cost, no server, and no API key, and listing and email text never leave the device. The app reaches the model through a third-party React Native library wrapped by one TypeScript adapter in `src/services/ai/`. All code in this repo stays TypeScript, matching the brief's "built entirely with TypeScript" requirement. Supersedes [ADR 0003](0003-ai-through-server-proxy-with-validated-drafts.md).

## Considered options

- **Cloud LLM through Expo API routes (ADR 0003).** Strongest model quality, but costs tokens and needs a deployed server and a secret.
- **Our own Expo module in Swift.** Full control of Apple's typed-generation APIs, but puts Swift source in this repo against the brief's TypeScript requirement. Rejected.
- **`react-native-foundation-models` (Nitro module, published Aug 2026).** Zod-typed output, iOS 27 support, token usage, typed error codes. Chosen first, subject to the spike below.
- **`@react-native-ai/apple` (AI SDK provider, published Feb 2026).** Zod output through the AI SDK, but built against AI SDK v6 and React Native 0.81. Fallback if the first library fails the spike.

## Spike gate (tier 0)

The chosen library is adopted only if, in an Expo SDK 58 dev build, it:

1. Builds and runs on the iOS Simulator with the New Architecture.
2. Reports the model as available on the Simulator (which uses the host Mac's model).
3. Returns a Zod-validated `ListingExtraction` for a sample listing.
4. Surfaces a distinct error when input exceeds the context window.
5. Lets the Android build compile and run, with the adapter reporting AI as unavailable.

If neither library passes, the decision returns to the user: restore the server path (ADR 0003) or reduce AI scope.

## Consequences

- **iOS only.** AI needs iOS 26+ and an Apple Intelligence device with the feature turned on. Android and ineligible iPhones run the full app with AI gated off ([UX-7](../user-stories.md#ux-7--know-when-ai-isnt-available-)).
- **Smaller model.** Good at extraction and classification; prep questions and interview feedback need prompt testing against real listings.
- **Limited context.** Measured 8,192 tokens on macOS 27.0.1 (M4); Apple's "Managing the context window" article states 4,096. Every task uses a fresh session, and inputs are budgeted for the smaller window.
- **Works offline.** Extraction of pasted text, triage, prep, and mock interviews need no network. Only URL fetch does.
- **Dependency risk.** Both candidate libraries are small community projects. The adapter keeps a library swap to one file.
- The model changes with OS updates (Apple's Foundation Models release notes), so prompts are re-checked after each major iOS release.
- **Carried over from ADR 0003:** every model result is validated with Zod, and AI output only lands as a draft or proposal the user confirms.
