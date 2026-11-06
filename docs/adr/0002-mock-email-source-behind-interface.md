---
status: accepted
---

# Demo the inbox with a mock Email Source behind an interface

Inbox Messages come from an `EmailSource` interface. The demo uses `MockEmailSource` backed by fixture messages instead of a live Gmail connection. This keeps the demo predictable, keeps real inbox content away from the LLM, and keeps the build within the time budget.

## Considered options

- **Live Gmail (read-only scope, test users).** Works for a personal demo without Google verification, but adds OAuth setup, token handling, and real-inbox privacy questions. Publishing publicly would require Google's verification for restricted scopes, plus a security assessment if email data is stored on or sent through a server. Deferred to stretch.
- **Mock source behind an interface (chosen).** Same triage, matching, and Redux code paths as a real source would use.

## Consequences

- Only the fixture messages are fixed. Triage still calls a live model, so it needs timeouts, validation, error states, and the labeled AI Replay safety net.
- A Gmail adapter can be added later without changing triage, matching, or UI code.
