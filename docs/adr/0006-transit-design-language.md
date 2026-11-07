---
status: accepted (user chose Transit, 2026-11-06)
---

# Transit design language: applications as transit lines

The app's visual language is "Transit": every application is a transit line, stages are stations, the Next Step is the next departure, a closed application is a completed route, and an AI proposal is track under construction. It is built on the existing hand-rolled design system ([ADR 0004](0004-hand-rolled-design-system.md)): new tokens and components, same module, same theming API. Details are in [`docs/design-system.md`](../design-system.md).

## Context

The first design system (indigo accent, system fonts, stage pills tinted per stage) met its contrast and accessibility rules but had no distinct visual identity, and an application's progress was a single pill rather than something you could read along a path.

AI (Claude Design) explored four complete directions, each as a design-system sheet plus three screens (Today/Pipeline, Application detail, Mock interview feedback). Artifact: [claude.ai/artifact/S14rD7cgtzVwRd2qxpVZnA](https://claude.ai/artifact/S14rD7cgtzVwRd2qxpVZnA); exported renders and markup are in `e2e/artifacts/design/`.

- **A. Field Notes**: "A job search kept like a good notebook. The AI writes in pencil; only you write in ink." Fraunces and IBM Plex Mono on paper tones.
- **B. Transit**: "Every application is a line. Stages are stations, the next step is a departure, and a closed application is a completed route." Overpass and Overpass Mono, flat cards, dark sign panels, signal yellow for urgency.
- **C. Quiet Glass**: "Native iOS 26, turned down." SF Pro Rounded, solid cards on a canvas tinted by the current stage, Liquid Glass only on controls.
- **D. Coach**: "A warm coach in your pocket … It suggests; you decide." Fredoka and Figtree, cream and terracotta, a short daily list in a conversational voice.

The user chose **Transit** on 2026-11-06.

## Decision

- Each application is a **line** with a stable color, roundel shape, and letter from `lineFor(applicationId, company)` in `src/lib/lines.ts`.
- Stages are **stations** with distinct shapes (dashed circle, ring, interchange pill, terminal block, terminus bar, branch), plus an icon and the stage word. There is no per-stage color.
- The Next Step is shown on a **departure board** (dark sign panel). Signal yellow `#FFD100` with ink text is used only for urgency.
- AI proposals use a **construction** look (hatched fill, dashed border) until the user confirms them.
- Type is Overpass (display and body) and Overpass Mono (boards, dates).
- Shape: flat white cards on platform gray, radius 10 for cards, 8 for inner boards and inputs, every control fully round.

## Consequences

- **Custom fonts load before the splash hides.** `src/app/_layout.tsx` loads six font files with `expo-font` (`@expo-google-fonts/overpass`, `@expo-google-fonts/overpass-mono`) and renders nothing until they load or fail, so there is no flash of system text. A load error falls back to system fonts instead of blocking startup. This adds two dependencies and a small amount of startup work.
- **Shapes are built from Views; no SVG native module.** Roundels, station markers, line strips, dashed track, and hatching use View borders, rotation, and `overflow: 'hidden'`. `react-native-svg` is not installed, and adding a native module would need a dev-client rebuild. The cost is more layout code per shape and some shapes (triangle, diamond) built from rotated or bordered Views.
- **Color + shape + letter per line.** Color alone never identifies an application: each line index has its own roundel shape (circle, rounded square, triangle, diamond) and the company's initial. Roundels are decorative to screen readers; the company name carries the identity.
- **Four line colors repeat.** There are four line colors and shapes, so more than four applications reuse them, and because assignment is a hash of the application ID, two applications can share a line even with fewer. The letter and the company name tell them apart. In return the line is stable with nothing stored.
- **Some decorative marks are below 3:1 in light theme** (future stations, blue and purple roundels on the dark sign panel). They are never the only signal; the contrast table in the design-system doc lists them so they stay that way.
- **Domain labels stay plain.** Transit words appear only in new eyebrows and section text. Stage names, "Due tomorrow", button labels, and tab names are unchanged, so unit tests and Maestro flows keep their queries.
- Every screen was restyled; component APIs grew (`Screen` sign header, `Card` variants replace `elevated`, new `Text` colors and typography variants, new `Badge` tone `urgent`), and the old `color.stage` tokens were removed.

## Considered options

The user picked Transit from the four mocks; the notes below are the trade-offs as recorded here, not the user's stated reasons.

- **Keep the original system.** No new work, but no identity and no at-a-glance progress.
- **A. Field Notes.** Its pencil/ink split also expresses "AI proposes, you confirm", but it needs a serif display face plus a second mono family, and the notebook metaphor says less about where each application stands.
- **C. Quiet Glass.** Closest to native iOS, but its Liquid Glass controls are iOS 26 material with no Android equivalent, and per-stage canvas tints bring back stage color.
- **D. Coach.** Strongest voice, but the conversational copy would rewrite many labels the tests and flows depend on.
- **B. Transit.** Chosen: the metaphor maps directly onto the domain (application → line, stage → station, Next Step → departure), stays high-contrast, works the same on iOS and Android, and keeps closed applications positive ("the trip still counts").
