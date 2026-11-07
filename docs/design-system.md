# Design system: Transit

The design system is a first-class module, not a styling afterthought. Every screen is built only from its tokens and components. This keeps screens readable, makes light/dark theming free, and gives the interview a concrete "component structure" story.

Decision records: [ADR 0004 — hand-rolled design system, no UI kit](adr/0004-hand-rolled-design-system.md) and [ADR 0006 — Transit design language](adr/0006-transit-design-language.md).

## Concept

A job search is a set of journeys. Transit borrows the language of a metro map so progress reads at a glance:

| Domain term ([`CONTEXT.md`](../CONTEXT.md)) | Transit metaphor | Where it shows |
|---|---|---|
| **Application** | A **line**: one color, one roundel shape, one letter | `LineRoundel`, `LineStrip`, `RouteStation` |
| **Stage** | A **station** on the line (Saved → Applied → Interviewing → Offer) | `StationMarker`, `StagePill`, `LineStrip` |
| **Next Step** | The **next departure** | `DepartureBoard`, urgent `Badge` |
| Closed application (Rejected, Withdrawn) | A **completed route**: the line ends in a terminus bar or branches off. The trip still counts | `StationMarker`, `LineStrip` |
| AI proposal | **Track under construction**: hatched fill, dashed border, until the user confirms it | `ProposalCard`, `Card variant="proposal"` |

The metaphor lives in shapes and in new eyebrow/section text ("NEXT DEPARTURE", "YOU ARE HERE", "Route complete", "PROPOSED · FROM EMAIL"). Domain labels stay plain: stages keep their names, and a Next Step due soon reads "Due tomorrow", not "Departs tomorrow".

## Principles

1. **One source of truth.** No raw colors, font sizes, or spacing numbers in feature code. Values come from tokens.
2. **Typed end to end.** Token names, component variants, and theme shape are TypeScript types. A typo is a compile error.
3. **Accessible by default.** Components ship with roles, labels, touch targets, and contrast already handled. Color is never the only signal: stations have shape + icon + word, lines have color + shape + letter.
4. **Wayfinding first.** Bold signage type, flat white cards on platform gray, dark sign panels for what matters most. Signal yellow means urgency and nothing else.
5. **Every control is round.** Buttons, chips, icon buttons, and the tab bar are pills or circles; cards and boards are softly rounded rectangles.
6. **Themeable and small.** Light ("Platform") and dark ("Night service") share one semantic token map. Only the components the app needs; each has one job.

## Module layout

```
src/design-system/
  tokens/
    palette.ts        # primitive colors (never imported by features)
    semantic.ts       # light + dark semantic color maps, LineIndex
    spacing.ts        # 4-pt scale
    radii.ts
    typography.ts     # Overpass / Overpass Mono variants
    elevation.ts
    motion.ts
    sizing.ts         # min touch target per platform
  theme/
    theme.ts          # Theme type = semantic colors + scales
    ThemeProvider.tsx # system scheme + user override from Redux settings
    useTheme.ts
    makeStyles.ts     # typed, memoized per-theme StyleSheet factory
    useScaledIconSize.ts
  components/
    Text.tsx  Stack.tsx  Screen.tsx  Button.tsx  IconButton.tsx
    TextField.tsx  Card.tsx  StagePill.tsx  Badge.tsx  ListItem.tsx
    EmptyState.tsx  ErrorState.tsx  Skeleton.tsx  Banner.tsx  Chip.tsx
    LineRoundel.tsx  StationMarker.tsx  LineStrip.tsx  RouteStation.tsx
    DepartureBoard.tsx  ProposalCard.tsx  StatTile.tsx  ProgressStops.tsx
    FloatingTabBar.tsx  icons.ts
    Hatch.tsx  stationGlyph.tsx   # internal: hatching, View-built station shapes
  index.ts            # the only public entry point
```

Feature code imports from `@/design-system` only. Deep imports (`@/design-system/tokens/palette`) are blocked by an ESLint `no-restricted-imports` rule. The line-assignment helper lives outside the design system in `src/lib/lines.ts`, because it is domain logic.

## Token layers

```mermaid
flowchart LR
  P[Primitive palette<br/>ink.900, line.blue.light] --> S[Semantic tokens<br/>text.secondary, line.0.bg]
  S --> C[Components<br/>Button, LineRoundel]
  C --> F[Feature screens]
```

- **Primitive** tokens are raw values. Only `semantic.ts` and `elevation.ts` read them.
- **Semantic** tokens describe purpose (`text.secondary`, `sign.bg`, `urgent.bg`, `line[2].bg`). Light and dark map the same names to different primitives.
- **Components** read semantic tokens through `useTheme()` / `makeStyles()`.

### Primitive palette

From `src/design-system/tokens/palette.ts`.

| Scale | Steps |
|---|---|
| ink | 900 `#121417` · 800 `#22272E` · 700 `#2A2F36` · 600 `#4B5058` · 500 `#5C626B` · 400 `#80868F` |
| night | 950 `#0D0F12` · 900 `#171A1F` · 850 `#1E2228` · 800 `#22272E` · 700 `#2A2F36` |
| platform | 0 `#FFFFFF` · 50 `#F2F2EE` · 100 `#EDEDE7` · 200 `#E9E9E3` · 300 `#D6D6CF` |
| fog | 100 `#F2F2EE` · 200 `#C9CCD1` · 300 `#A7ADB6` · 400 `#8D949E` |
| signal | 500 `#FFD100` (urgency only, always with ink text) |

| Line | Light | Dark |
|---|---|---|
| blue | `#0061B0` | `#4DA3FF` |
| orange | `#C2410C` | `#FB8B4B` |
| green | `#047857` | `#34D399` |
| purple | `#6D28D9` | `#A78BFA` |

| Feedback | Light fg | Light bg | Dark fg | Dark bg |
|---|---|---|---|---|
| success | `#047857` | `#E3F4EC` | `#34D399` | `#0E2A21` |
| warning | `#7A4A00` | `#FFF4CC` | `#FFD166` | `#3A2C05` |
| danger | `#B42318` | `#FDECEA` | `#FF8A80` | `#3A1714` |
| info | `#0061B0` | `#E5F0FA` | `#4DA3FF` | `#0C2440` |

### Semantic colors

From `src/design-system/tokens/semantic.ts`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg.canvas` | `#F2F2EE` platform.50 | `#0D0F12` night.950 | Screen background ("platform gray") |
| `bg.surface` | `#FFFFFF` platform.0 | `#171A1F` night.900 | Cards, inputs, chips, tab bar |
| `bg.subtle` | `#E9E9E3` platform.200 | `#22272E` night.800 | Pressed rows, neutral badge |
| `sign.bg` | `#121417` ink.900 | `#22272E` night.800 | Sign panels: tab-root headers, departure board, FAB |
| `sign.fg` | `#FFFFFF` platform.0 | `#F2F2EE` fog.100 | Text on sign panels; `onSign` button fill |
| `sign.fgSecondary` | `#C9CCD1` fog.200 | `#A7ADB6` fog.300 | Secondary text on sign panels |
| `border.subtle` | `#D6D6CF` platform.300 | `#2A2F36` night.700 | Decorative hairlines |
| `border.strong` | `#121417` ink.900 | `#F2F2EE` fog.100 | Secondary button outline, inputs, chips |
| `text.primary` | `#121417` ink.900 | `#F2F2EE` fog.100 | Default text |
| `text.secondary` | `#4B5058` ink.600 | `#A7ADB6` fog.300 | Metadata, subtitles |
| `text.tertiary` | `#5C626B` ink.500 | `#8D949E` fog.400 | Hints, captions |
| `text.inverse` | `#FFFFFF` platform.0 | `#121417` ink.900 | Text on `action.primary.bg` |
| `text.link` | `#0061B0` line.blue | `#4DA3FF` line.blue | Ghost buttons, links |
| `action.primary.bg` | `#121417` ink.900 | `#F2F2EE` fog.100 | Primary pill, selected chip, focused tab |
| `action.primary.bgPressed` | `#2A2F36` ink.700 | `#C9CCD1` fog.200 | Pressed primary |
| `action.primary.fg` | `#FFFFFF` platform.0 | `#121417` ink.900 | Label on primary |
| `focus.ring` | `#0061B0` | `#4DA3FF` | Focused input border |
| `feedback.{tone}.fg/bg` | see feedback table | see feedback table | Badges, banner rules and icons, field errors |
| `urgent.bg` / `urgent.fg` | `#FFD100` / `#121417` | `#FFD100` / `#121417` | Next Step due within 48 hours or overdue; yellow marks on sign panels |
| `proposal.border` | `#121417` ink.900 | `#F2F2EE` fog.100 | Dashed 2px proposal border |
| `proposal.hatchA` / `hatchB` | `#FFFFFF` / `#EDEDE7` | `#171A1F` / `#1E2228` | Hatched proposal stripes |
| `line[0..3].bg` | blue / orange / green / purple light | blue / orange / green / purple dark | Line color: roundels, strips, passed stations |
| `line[0..3].fg` | `#FFFFFF` | `#0D0F12` night.950 | Roundel letter |
| `station.future` | `#80868F` ink.400 | `#8D949E` fog.400 | Unreached stations (dashed) |

There is no per-stage color. Stages are monochrome: shape + icon + word.

### Contrast (WCAG 2.x, computed)

Ratios were computed with the WCAG relative-luminance formula from the hex values above (script run 2026-11-06, not estimated). The dev gallery computes the same figures live on its palette swatches. Thresholds: text ≥ 4.5:1; large text (≥ 18.66 px bold / 24 px) and non-text marks that carry meaning ≥ 3:1.

**Text pairs** — all pass 4.5:1.

| Pair (where used) | Light | Dark |
|---|---|---|
| `text.primary` on `bg.canvas` | 16.44 | 17.10 |
| `text.primary` on `bg.surface` (cards, chips, inputs, banners, stat tiles) | 18.45 | 15.54 |
| `text.primary` on `bg.subtle` (neutral badge, pressed rows) | 15.14 | 13.39 |
| `text.secondary` on `bg.canvas` | 7.23 | 8.50 |
| `text.secondary` on `bg.surface` (subtitles, banner body, stat labels) | 8.12 | 7.72 |
| `text.tertiary` on `bg.canvas` | 5.48 | 6.27 |
| `text.tertiary` on `bg.surface` | 6.15 | 5.70 |
| `text.link` on `bg.surface` (ghost button) | 6.29 | 6.64 |
| `text.link` on `bg.canvas` | 5.61 | 7.31 |
| `action.primary.fg` on `action.primary.bg` (primary button, selected chip, focused tab) | 18.45 | 16.44 |
| `action.primary.fg` on `action.primary.bgPressed` | 13.48 | 11.46 |
| `sign.fg` on `sign.bg` (sign headers, departure title; also `onSign` label `sign.bg` on `sign.fg`) | 18.45 | 13.39 |
| `sign.fgSecondary` on `sign.bg` | 11.46 | 6.65 |
| `urgent.bg` on `sign.bg` (yellow "NEXT DEPARTURE" eyebrow) | 12.63 | 10.28 |
| `urgent.fg` on `urgent.bg` (urgent badge, "YOU ARE HERE") | 12.63 | 12.63 |
| `text.primary` on `proposal.hatchA` | 18.45 | 15.54 |
| `text.primary` on `proposal.hatchB` (worst case under the stripes) | 15.70 | 14.23 |
| `text.secondary` on `proposal.hatchB` | 6.91 | 7.07 |
| `line[0].fg` on `line[0].bg` (roundel letter, blue) | 6.29 | 7.31 |
| `line[1].fg` on `line[1].bg` (orange) | 5.18 | 8.13 |
| `line[2].fg` on `line[2].bg` (green) | 5.48 | 9.98 |
| `line[3].fg` on `line[3].bg` (purple) | 7.10 | 7.05 |
| `line[n].bg` as text on `bg.surface` (lowest line) | 5.18 | 6.41 |
| `feedback.success.fg` on `feedback.success.bg` | 4.81 | 7.96 |
| `feedback.warning.fg` on `feedback.warning.bg` | 6.79 | 9.44 |
| `feedback.danger.fg` on `feedback.danger.bg` | 5.75 | 7.01 |
| `feedback.info.fg` on `feedback.info.bg` | 5.45 | 5.96 |
| `feedback.danger.fg` on `bg.surface` (destructive button, field error) | 6.57 | 7.64 |
| `feedback.danger.fg` on `bg.canvas` (field error) | 5.86 | 8.41 |

**Non-text marks** (WCAG 1.4.11, ≥ 3:1).

| Pair (where used) | Light | Dark | Status |
|---|---|---|---|
| `border.strong` on `bg.surface` (secondary button, inputs, chips) | 18.45 | 15.54 | Pass |
| `border.strong` on `bg.canvas` | 16.44 | 17.10 | Pass |
| `focus.ring` on `bg.surface` | 6.29 | 6.64 | Pass |
| `proposal.border` on `proposal.hatchB` | 15.70 | 14.23 | Pass |
| `line[n].bg` on `bg.surface` (strips, passed stations; lowest line) | 5.18 | 6.41 | Pass |
| `line[n].bg` on `bg.canvas` (lowest line) | 4.61 | 7.05 | Pass |
| `urgent.bg` on `sign.bg` (FAB icon, practiced stops) | 12.63 | 10.28 | Pass |
| `action.primary.bg` on `bg.surface` (focused tab pill) | 18.45 | 15.54 | Pass |
| Roundel plate (`sign.roundelPlate`, light) on `sign.bg` (roundel on departure board) | 18.45 | — | Pass: in light, roundels on a sign panel sit on a white plate |
| `line[0..3].bg` on the white plate (light) | 6.29 · 5.18 · 5.48 · 7.10 | — | Pass |
| `line[0..3].bg` on `sign.bg` (dark; the plate matches the panel) | — | 5.72 · 6.37 · 7.82 · 5.52 | Pass |
| `station.future` on `bg.surface` (unreached stations) | 3.67 | 5.70 | Passes 3:1 (non-text) |
| `station.future` on `bg.canvas` | 3.27 | 6.27 | Passes 3:1 (non-text) |
| `border.subtle` on `bg.surface` (hairlines, secondary `IconButton` edge) | **1.46** | **1.29** | Below 3:1; decorative only |
| `urgent.bg` on `bg.surface` (urgent badge edge) | **1.46** | 11.94 | Below 3:1 in light; the badge's ink text (12.63) carries it |
| `sign.bg` on `bg.canvas` (sign panel edge) | 16.44 | **1.28** | Below 3:1 in dark; text inside the panel carries it |

The flagged marks are decorative: the information they sit beside is also given as text (roundel letter at ≥ 5.18:1 and the company name; station word and icon; badge text; panel text), so no meaning is lost. They are listed so that nobody promotes them to sole carriers of meaning. If a future design makes a line roundel on a sign panel or a future station the only signal, the light-theme values must change first.

Any new color pair must be added to these tables with its computed ratio before it is used.

### Stations

Each **Stage** (see [`CONTEXT.md`](../CONTEXT.md)) maps to a station shape, an icon, and a word. Shapes are built from Views.

| Stage | Station shape | Icon (Ionicons) |
|---|---|---|
| Saved | Hollow dashed circle (not yet boarded) | `bookmark-outline` |
| Applied | Ring (station passed) | `paper-plane-outline` |
| Interviewing | Interchange pill | `chatbubble-outline` |
| Offer | Terminal block (filled square) | `star-outline` |
| Rejected | "Route complete" vertical terminus bar | `flag-outline` |
| Withdrawn | Branch leaving the line (diagonal bar) | `exit-outline` |

State: **passed** uses the line color, **current** is ink with a yellow halo, **future** uses `station.future`, dashed. Yellow (`urgent`) otherwise marks only a Next Step due within 48 hours or overdue.

### Line assignment

`lineFor(applicationId, company)` in `src/lib/lines.ts` gives each application a `{ index: 0 | 1 | 2 | 3, letter }`:

- **Index**: a 31-multiplier string hash of the application ID (unsigned 32-bit), modulo 4. The same ID always gets the same line, across launches and devices, with nothing stored.
- **Letter**: the company's first letter or digit, upper-cased; `•` when there is none.
- **Shape by index**: 0 circle, 1 rounded square, 2 triangle, 3 diamond (`LineRoundel`).

There are four line colors, so they repeat after four applications and two applications can share a line. The letter and the company name next to every roundel tell them apart.

### Spacing (4-pt scale)

| Token | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|
| px | 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 |

Screen horizontal padding is `space.4`. Gaps between cards are `space.3`. Section gaps are `space.6`. Card padding is `space.4`.

### Shape (radii)

`sm` 4 · `md` 8 · `lg` 10 · `pill` 999.

Cards and sign panels use `lg` (10). Boards and inputs inside them use `md` (8: 10 minus a 2 px inset). Small marks use `sm`. Every control (buttons, chips, icon buttons, tab bar, FAB) uses `pill`.

### Typography

Overpass (the open-source face based on U.S. highway signage) for display and body; Overpass Mono for boards, dates, and codes. Both come from `@expo-google-fonts/overpass` and `@expo-google-fonts/overpass-mono` and load in `src/app/_layout.tsx` (`TRANSIT_FONTS`, via `expo-font`'s `useFonts`) while the splash screen is still up. If loading fails, the app starts with system fonts. Custom fonts carry their weight in the family name, so variants set `fontFamily`, not `fontWeight`.

| Variant | Size / line height | Family | Use |
|---|---|---|---|
| `display` | 34 / 40 | Overpass Black (900) | Sign titles on tab roots ("Today"), empty-state heroes |
| `title` | 28 / 34 | Overpass Black (900) | Screen titles ("Acme Health") |
| `departure` | 22 / 28 | Overpass ExtraBold (800) | The next departure ("Book the onsite") |
| `heading` | 18 / 24 | Overpass ExtraBold (800) | Card titles, section headers |
| `body` | 16 / 22 | Overpass Regular (400) | Default text |
| `bodyStrong` | 16 / 22 | Overpass Bold (700) | Emphasis |
| `bodySmall` | 14 / 20 | Overpass Regular (400) | Metadata (company, location, dates) |
| `caption` | 12 / 16 | Overpass SemiBold (600) | Helper text |
| `station` | 12 / 16, tracking 0.8, UPPERCASE | Overpass ExtraBold (800) | Station names, eyebrows: SAVED · APPLIED · INTERVIEW |
| `board` | 13 / 18, tracking 0.4, UPPERCASE | Overpass Mono Bold (700) | Departure-board text: DUE TOMORROW · SAT 7 NOV |

`station` and `board` upper-case through `textTransform`, so the stored text stays sentence case ("Due tomorrow") and screen readers read words, not letters. Dynamic Type / font scaling stays on. `maxFontSizeMultiplier` is capped at 1.8 for `departure` and 1.6 for `display`, `title`, `caption`, `station`, and `board`; body and heading text are uncapped. Text containers have no fixed heights so large text wraps.

### Elevation

Transit is flat: white cards on platform gray, no borders or shadows. Uses React Native's cross-platform `boxShadow` style.

| Token | Use |
|---|---|
| `elevation.0`, `elevation.1` | Flat (no shadow) |
| `elevation.2` | Floating controls only: `FloatingTabBar`, its FAB |

Dark theme drops shadows; surfaces separate by `bg.*` steps.

### Motion

| Token | ms | Use |
|---|---|---|
| `motion.fast` | 120 | Press feedback |
| `motion.base` | 200 | State changes, banner in/out |
| `motion.slow` | 320 | Larger transitions |

When the OS "Reduce Motion" setting is on, every duration becomes `0` (`theme.reduceMotion` is `true`) and skeleton shimmer is replaced with a static fill.

## Theming API

```ts
// src/design-system/theme/theme.ts
export type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';

export interface Theme {
  scheme: ColorScheme;
  color: SemanticColors;   // from semantic.ts, fully typed
  space: typeof space;
  radius: typeof radii;
  size: typeof sizing;     // minTouchTarget: 44 iOS / 48 Android
  type: typeof typography;
  maxFontSizeMultiplier: typeof maxFontSizeMultiplier;
  elevation: Record<ElevationLevel, ViewStyle>;
  motion: Motion;          // all 0 when Reduce Motion is on
  reduceMotion: boolean;
}
```

```ts
// usage in a component
const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.space[4],
    gap: t.space[2],
  },
}));
```

- `ThemeProvider` resolves `ThemePreference` (stored in the Redux `settings` slice) against `useColorScheme()`, and reads the OS Reduce Motion setting.
- `makeStyles` builds one `StyleSheet` per scheme and memoizes it. Switching theme does not rebuild styles on every render.
- Components never branch on `scheme`. If a component needs a different value in dark mode, that value becomes a semantic token.

## Components

Each component has a typed props interface, string-union variants, accessibility defaults, and a gallery entry. All are exported from `@/design-system`; none import the store, navigation, or feature code.

| Component | Key props | Accessibility defaults |
|---|---|---|
| `Text` | `variant?: TypographyVariant`, `color?: 'primary' \| 'secondary' \| 'tertiary' \| 'inverse' \| 'link' \| 'onSign' \| 'onSignSecondary'` | Font-scaling caps above; `accessibilityRole="header"` for `display`, `title`, `heading` |
| `Stack` | `direction`, `gap`, `padding`, `align`, `justify`, `flex`, `wrap` | Layout only; no visual styles |
| `Screen` | `title?`, `eyebrow?`, `headerRight?`, `onBack?`, `scroll?`, `header?: 'plain' \| 'sign'` | Safe-area aware; title keeps the header role; back is a round `IconButton` labelled "Back" |
| `Button` | `label`, `onPress`, `variant?: 'primary' \| 'secondary' \| 'ghost' \| 'destructive' \| 'onSign'`, `size?: 'md' \| 'lg'`, `icon?`, `trailingIcon?`, `loading?`, `disabled?` | Min touch target even for `ghost` (underlined text, no box); `accessibilityState` busy/disabled; label required |
| `IconButton` | `icon`, `accessibilityLabel`, `onPress`, `variant?: 'primary' \| 'secondary' \| 'ghost' \| 'onSign'` | Round; `accessibilityLabel` is a required prop; min touch target |
| `TextField` | `label`, `value`, `onChangeText`, `helperText?`, `error?`, `multiline?`, `secure?` | Radius `md`, 1.5 px `border.strong`, 2 px `focus.ring` when focused; label announced; error announced on change |
| `Card` | `children`, `onPress?`, `accessibilityLabel?`, `accessibilityHint?`, `variant?: 'surface' \| 'sign' \| 'proposal'` | Pressable cards get `accessibilityRole="button"` |
| `Chip` | `label`, `onPress`, `selected?`, `icon?` | Round; selected = ink fill; `accessibilityState.selected` |
| `StagePill` | `stage` | Station label (current `StationMarker` + icon + word, no tint); announces "Stage: Interviewing" |
| `Badge` | `label`, `tone?: 'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'urgent'`, `icon?` | Text always present; `urgent` = yellow, ink `board` text, clock icon |
| `ListItem` | `title`, `subtitle`, `leading`, `trailing`, `onPress` | Combined label for the row |
| `Banner` | `tone`, `title`, `body?`, `action?` | Flat surface with a 4 px left rule and icon in the tone color; announced politely |
| `EmptyState` | `icon`, `title`, `body`, `action` | Hero text is a header |
| `ErrorState` | `error: AppError`, `onRetry?` | Maps `AppError.kind` to plain-language copy; retry focusable first |
| `Skeleton` | `width`, `height`, `radius` | Hidden from screen readers; parent sets `accessibilityState={{ busy: true }}` |
| `LineRoundel` | `line: LineIndex`, `letter`, `size?: 'sm' \| 'md' \| 'lg'` (24/32/44) | Shape by line index; decorative, hidden from screen readers |
| `StationMarker` | `stage`, `state: 'passed' \| 'current' \| 'future'`, `line?` | Decorative; the adjacent label names the stage |
| `LineStrip` | `stage`, `line` | Four stations; reached segments solid, unreached dotted; closed routes end in a terminus or branch. Decorative (the row label carries the stage) |
| `LineStripLegend` | — | SAVED · APPLIED · INTERVIEW · OFFER captions aligned with `LineStrip` |
| `RouteStation` | `stage`, `state`, `line`, `label`, `meta?`, `tag?`, `onPress?`, `accessibilityLabel?`, `selected?`, `last?`, `children?` | When pressable: a button named `accessibilityLabel ?? label` with `accessibilityState.selected` |
| `DepartureBoard` | `eyebrow`, `count?`, `line?: { index, letter }`, `title`, `subtitle?`, `urgentLabel?`, `action?: { label, onPress }`, `onDone?`, `onDoneLabel?` | Sign panel; urgency is shown as text (`urgentLabel`), not just yellow; roundel decorative |
| `ProposalCard` | `eyebrow`, `onDevice?`, `children` | Dashed border + hatched fill; container label starts "Proposal, not saved" |
| `StatTile` | `icon`, `value`, `label` | Big number + caption on a white card |
| `ProgressStops` | `total`, `done` | Announces "6 of 20 practiced" |
| `FloatingTabBar` | `tabs: { key, label, icon, focused, onPress, badge? }[]`, `action?: { icon, accessibilityLabel, onPress }` | Tabs keep `accessibilityRole="tab"` and visible names; FAB is a round ink button with a yellow icon; `elevation.2` |

### Component rules

1. **Props are unions, not booleans.** `variant="destructive"`, not `isDestructive`.
2. **No `style` escape hatch for visuals.** Components accept layout-only props (`flex`, `alignSelf`, margins via `Stack`). If a screen needs a new look, add a variant.
3. **Required accessibility props are required types.** An `IconButton` without `accessibilityLabel` does not compile.
4. **Loading and error are component states**, not ad-hoc spinners. Every async screen renders `Skeleton` → content, or `ErrorState` with retry.
5. **No business logic.** Components don't import from `src/features`, the store, or navigation. `StationMarker` takes a `Stage`; `LineRoundel` takes an index and letter that the feature got from `lineFor`.
6. **Shapes from Views.** Roundels, stations, hatching, and dashed lines are built from Views (`borderStyle`, rotation, `overflow: 'hidden'`). No `react-native-svg`: it is a native module and would need a dev-client rebuild.

## Accessibility checklist

Every component and screen PR passes this list:

- [ ] Touch targets ≥ 44×44 pt (iOS) / 48×48 dp (Android) via size or `hitSlop`
- [ ] Every interactive element has a role and a label
- [ ] Text contrast ≥ 4.5:1 and meaningful marks ≥ 3:1 (tables above)
- [ ] Works at the largest Dynamic Type / font scale without clipped text
- [ ] Color is never the only signal (stations: shape + icon + word; lines: color + shape + letter)
- [ ] Reduced Motion respected
- [ ] VoiceOver / TalkBack reading order matches visual order; decorative shapes hidden

## Gallery screen

`src/app/dev/design-system.tsx` is the Transit system sheet in the app ([UX-6](user-stories.md#ux-6--browse-the-design-system-presenter-)): sign header, palette swatches with hex and live-computed contrast, type scale, spacing, radii, elevation, motion, station markers for all six stages in every state, roundels for the four lines in every size, a `LineStrip` per stage, a `RouteStation` timeline, `DepartureBoard`, `ProposalCard` next to a confirmed card, every `Card` variant, badges, buttons and icon buttons in every variant, chips, text fields, banners, `StatTile`, `ProgressStops`, a `FloatingTabBar` sample, list rows, skeletons, and empty/error states. The header button switches the sheet between light and dark. It is reachable only in development builds (`__DEV__`).

Why an in-app gallery instead of Storybook: it ships with no extra build setup, runs on the same simulator as the demo, and shows the real components with the real fonts on the real device. Storybook for React Native is a reasonable upgrade if the component count grows.

## Enforcement

| Rule | Mechanism |
|---|---|
| No color literals in feature code (palette is the only exception) | `eslint-plugin-react-native` → `no-color-literals` |
| No inline style objects | `eslint-plugin-react-native` → `no-inline-styles` |
| No deep imports into the design system | ESLint `no-restricted-imports` (`@/design-system/*`) |
| Required accessibility props | TypeScript prop types |
| Component behavior (roles, states, labels, error copy) | Jest + React Native Testing Library, queried by role and label |
| Contrast | Ratios computed by script and recorded above; new pairs added before use |
