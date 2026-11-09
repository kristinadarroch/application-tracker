# Accessibility and healthcare compliance

Updated 2026-11-09. Three documents:

| File | What it answers |
|---|---|
| [`healthcare-standards.md`](healthcare-standards.md) | Which laws and standards apply to a component library used in US healthcare apps, with deadlines and a 15-item checklist |
| [`design-system-audit.md`](design-system-audit.md) | Criterion-by-criterion WCAG 2.2 A/AA audit of `src/design-system/` and its use, at commit `4392072` (before the fixes below) |
| This file | Where the design system stands now, what changed, and what still needs a device |

## Which standard applies

**WCAG 2.1 Level AA is the legal bar; build to WCAG 2.2 AA.** The two binding rules name WCAG 2.1 AA for websites and native mobile apps:

| Rule | Who | Compliance date |
|---|---|---|
| HHS Section 504, [45 CFR 84.84](https://www.ecfr.gov/current/title-45/section-84.84) | Recipients of HHS federal financial assistance, commonly hospitals funded through Medicare Part A or Medicaid. The definition excludes contracts of insurance or guaranty ([84.10](https://www.ecfr.gov/current/title-45/section-84.10)), so Medicare Part B payment alone may not make a provider a recipient; applicability needs legal review | **May 11, 2027** (15+ employees); May 10, 2028 (fewer), after the [May 11, 2026 extension](https://www.federalregister.gov/documents/2026/05/11/2026-09266/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web) |
| ADA Title II, [28 CFR 35.200](https://www.ecfr.gov/current/title-28/section-35.200) | Public hospitals and state or local health entities | April 26, 2027 or 2028 by size, after the [April 20, 2026 extension](https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web) |

ADA Title III (private providers) has no codified technical standard. HIPAA adds no visual standard but shapes some components: session-timeout warnings, masked fields, and keeping health information out of logs and notification previews. [`healthcare-standards.md`](healthcare-standards.md) covers these, plus Section 1557, Section 508, and when FDA rules apply.

A component library can't claim conformance on its own: WCAG conformance applies to complete screens and processes. The library's job is to make the accessible behavior the default and to give each product the evidence it needs for its own Accessibility Conformance Report (a completed VPAT).

## Status of the design system

WCAG 2.2 A/AA criteria the component library is responsible for, applied to native apps through [WCAG2ICT](https://www.w3.org/TR/wcag2ict-22/). The audit has the full table, including criteria that don't apply.

| Criterion | Status | Evidence |
|---|---|---|
| 1.1.1 Non-text content | Supports | `IconButton` requires a label at compile time; decorative shapes are hidden |
| 1.3.1 Info and relationships | Implemented; device check pending | Headers on titles and spotlight eyebrows; single-choice chips in a labelled `ChipGroup` (`chipGroup.test.tsx`, `stagePicker.test.tsx`). On the Android 36 emulator, `uiautomator dump` shows the "Filter by stage" group with each chip as its own focusable `RadioButton` with the right checked state (2026-11-09). What VoiceOver and TalkBack actually say hasn't been heard yet |
| 1.3.4 Orientation | **Does not support: documented exception** | The app is locked to portrait (`app.json`). This is app configuration, not a component; landscape needs layout work and a native rebuild |
| 1.4.1 Use of color | Supports | Stage is shape + icon + word |
| 1.4.3 / 1.4.11 Contrast | Supports | Every text and meaningful-mark pair in both themes, checked by `tokens/__tests__/contrast.test.ts` |
| 1.4.4 Resize text | Supports | Every style reaches 200% except `display`, which starts above body text at 200% (1.8× cap), as [WCAG2ICT 1.4.4 Note 3](https://www.w3.org/TR/wcag2ict-22/#applying-sc-1-4-4-resize-text-to-non-web-software) allows for naturally large headings; headings stay larger than body text at every font scale up to iOS's largest (`tokens/__tests__/typography.test.ts`). Header buttons move above the title at accessibility sizes (`largeTextHeader.test.tsx`). Layout checked at iOS AX5 and Android font scale 2.0 (`e2e/a11y-large-text.yaml`, screenshots reviewed). Long single words in titles can still wrap mid-word at the largest size; no text is cut off |
| 2.2.1 Timing adjustable | Supports | No time limits; Undo stays until dismissed |
| 2.5.8 Target size | Supports | 44 pt iOS / 48 dp Android (`tokens/__tests__/sizing.test.ts`), above WCAG's 24 × 24 minimum; 44 × 44 is also WCAG 2.5.5 (AAA) |
| 3.2.2 On input | Supports | The Job link field says before use that pasting a link starts reading it (visible helper text, also the field's hint) |
| 3.3.1 / 3.3.3 Errors | Supports | Errors are text next to the field and say how to fix them |
| 3.3.2 Labels or instructions | Supports | Required fields show "· Required" and are named "Company, required" (`TextField`, `ChipGroup`) |
| 3.3.4 Error prevention | Supports | Deleting an application or a Next Step and discarding a draft ask first; email updates offer Undo |
| 4.1.2 Name, role, value | Implemented; device check pending | Roles, names, and states are covered by component tests; spoken output not yet heard on a device |
| 4.1.3 Status messages | Implemented; device check pending on both platforms | Tests prove `useAnnounce` calls `announceForAccessibility` for errors, AI results, and undo outcomes (`announcements.test.tsx`); no VoiceOver run yet. Android relies on live regions, and whether TalkBack on Android 16 speaks them is open |

### What changed to get here

| Before (audit at `4392072`) | Now |
|---|---|
| Errors, AI results, and Undo outcomes appeared silently | `useAnnounce` / `useAnnounceChange` in the design system; `TextField`, `ErrorState`, `Banner`, `ApplicationPicker`, and the inbox and intake screens use them |
| Small text stopped growing at 1.6×; at the largest sizes, body text outgrew screen titles | Small text reaches 2×; heading caps raised so headings stay larger than body text; header buttons move above the title at accessibility sizes |
| Deleting a Next Step and discarding a draft were immediate | Both ask first |
| Required fields weren't marked | `required` on `TextField` and `ChipGroup` |
| Chip-row labels weren't tied to their chips | New `ChipGroup`: a radio group on Android; on iOS each chip's hint carries the group name |
| Pasting a link opened the draft without warning | Helper text says so before use |
| Contrast was computed only in the dev gallery | `contrastRatio` moved to `tokens/contrast.ts` and runs in Jest |
| Static info banners were re-read on every visit; labelled non-pressable cards dropped their label on iOS | Fixed |

## Still needs a device

The iOS Simulator has no VoiceOver, and an automated TalkBack run produced no usable evidence. These need a person with a phone, about 1 hour per platform:

1. VoiceOver and TalkBack: swipe through pipeline, application detail, draft review, inbox detail, and prep. Confirm names, roles, states, and reading order (1.3.2, 4.1.2), and that `ChipGroup` chips are reachable one by one.
2. Announcements on Android 16, which deprecates announcement events: trigger a field error, an `ErrorState`, and Undo, and listen (4.1.3).
3. Focus after Undo, Accept, Dismiss, and answer submit (2.4.3).
4. Full Keyboard Access (iOS) and a hardware keyboard or Switch Access (Android): reach and activate every control, and see a focus indicator on each (2.1.1, 2.4.7).
5. The on-screen keyboard never covers the focused field on a small phone (2.4.11).

## Healthcare components this app doesn't need yet

This app stores no health information, so it has no session timeout, masked fields, or PHI rules. A healthcare library would add them as components:

- **Session-timeout warning,** for products that log users off after inactivity (an addressable HIPAA specification, 45 CFR 164.312(a)(2)(iii), so each organization decides through its risk analysis): announces itself, offers "Stay signed in", and gives at least 20 seconds to respond (WCAG 2.2.1).
- **Sensitive text:** masked by default with a "Show" toggle, and excluded from logs, analytics, and screenshots of the app switcher.
- **Notifications:** generic previews by default ("You have a new message").

## How to check

- `npm run check`: contrast, type-scale, and target-size rules, plus the role, label, state, and announcement tests.
- `e2e/a11y-large-text.yaml` at the largest text size: `xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`, or `adb shell settings put system font_scale 2.0`.
