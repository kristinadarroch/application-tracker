---
status: accepted (2026-11-06)
---

# Visual design language: dark panels, company badges, stage markers

The app's visual language uses dark panels, a colored company badge per application, a distinct marker shape per stage, stage progress strips, and hatched AI proposals. It is built on the existing hand-rolled design system ([ADR 0004](0004-hand-rolled-design-system.md)): new tokens and components, same module, same theming API. Details are in [`docs/design-system.md`](../design-system.md).

## Context

The first design system (indigo accent, system fonts, stage pills tinted per stage) met its contrast and accessibility rules but had no distinct visual identity, and an application's progress was a single pill rather than something you could read along a path.

AI (Claude Design) explored four complete directions, each as a design-system sheet plus three screens (home/Pipeline, Application detail, Mock interview feedback). Artifact: [claude.ai/artifact/S14rD7cgtzVwRd2qxpVZnA](https://claude.ai/artifact/S14rD7cgtzVwRd2qxpVZnA); the exported renders and markup are kept locally and are not in git.

- **A. Field Notes**: a job search kept like a notebook; Fraunces and IBM Plex Mono on paper tones.
- **B. Dark panels and badges** (this decision): Overpass and Overpass Mono, flat cards, dark panels, yellow for urgency.
- **C. Quiet Glass**: "Native iOS 26, turned down." SF Pro Rounded, solid cards on a canvas tinted by the current stage, Liquid Glass only on controls.
- **D. Coach**: a warm, conversational coach; Fredoka and Figtree, cream and terracotta.

## Decision

- Each application has a **company badge** with a stable accent color, shape, and letter from `accentFor(applicationId, company)` in `src/lib/accents.ts`.
- Each stage has a **stage marker** with a distinct shape (dashed circle, ring, pill, block, bar, exit), plus an icon and the stage word. There is no per-stage color. A **stage progress** strip shows where an application stands across the stages.
- The home screen is prep-first: the next interview and its prep progress come first, then the next step on a dark **spotlight panel**, then the application list.
- Yellow `#FFD100` with ink text is used only for urgency.
- AI proposals use a **hatched** look (hatched fill, dashed border) until the user confirms them.
- Type is Overpass (display and body) and Overpass Mono (dates, counts, panel labels).
- Shape: flat white cards on light gray, radius 10 for cards, 8 for inner panels and inputs, every control fully round.

## Consequences

- **Custom fonts load before the splash hides.** `src/app/_layout.tsx` loads six font files with `expo-font` (`@expo-google-fonts/overpass`, `@expo-google-fonts/overpass-mono`) and renders nothing until they load or fail, so there is no flash of system text. A load error falls back to system fonts instead of blocking startup. This adds two dependencies and a small amount of startup work.
- **Shapes are built from Views; no SVG native module.** Badges, stage markers, progress strips, dashed connectors, and hatching use View borders, rotation, and `overflow: 'hidden'`. `react-native-svg` is not installed, and adding a native module would need a dev-client rebuild. The cost is more layout code per shape and some shapes (triangle, diamond) built from rotated or bordered Views.
- **Color + shape + letter per application.** Color alone never identifies an application: each accent index has its own badge shape (circle, rounded square, triangle, diamond) and the company's initial. Badges are decorative to screen readers; the company name carries the identity.
- **Four accent colors repeat.** There are four accent colors and shapes, so more than four applications reuse them, and because assignment is a hash of the application ID, two applications can share an accent even with fewer. The letter and the company name tell them apart. In return the accent is stable with nothing stored.
- **Some decorative marks are below 3:1 in light theme** (future stage markers, blue and purple badges on the dark panel). They are never the only signal; the contrast table in the design-system doc lists them so they stay that way.
- **Domain labels stay plain.** Stage names, "Due tomorrow", button labels, and tab names are plain words, so unit tests and Maestro flows keep their queries.
- Every screen was restyled; component APIs grew (`Screen` panel header, `Card` variants replace `elevated`, new `Text` colors and typography variants, new `Badge` tone `urgent`), and the old `color.stage` tokens were removed.

## Considered options

The notes below are the trade-offs as recorded here, not the user's stated reasons.

- **Keep the original system.** No new work, but no identity and no at-a-glance progress.
- **A. Field Notes.** Its pencil/ink split also expresses "AI proposes, you confirm", but it needs a serif display face plus a second mono family, and says less about where each application stands.
- **C. Quiet Glass.** Closest to native iOS, but its Liquid Glass controls are iOS 26 material with no Android equivalent, and per-stage canvas tints bring back stage color.
- **D. Coach.** Strongest voice, but the conversational copy would rewrite many labels the tests and flows depend on.
- **B. Dark panels and badges.** Chosen: badges and stage markers show each application's identity and progress at a glance, stay high-contrast, and work the same on iOS and Android.

## History

The look started from a transit-map exploration in Claude Design (direction B, "Transit", 2026-11-06), which framed applications as lines and stages as stations. On 2026-11-06 the user kept the visuals but chose to drop the railroad wording from the product copy, code names, and docs, and to make the home screen prep-first.
