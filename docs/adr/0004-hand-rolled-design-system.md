---
status: accepted
---

# Hand-rolled token design system instead of a UI kit

The app uses its own small design system (typed tokens, `ThemeProvider`, `makeStyles`, about 14 components) instead of a UI kit such as Tamagui, NativeWind, React Native Paper, or Restyle. Component structure and type-safe UI code are core to this project's purpose, and owning the tokens and components makes those decisions visible and explainable instead of hidden inside a dependency.

## Considered options

- **UI kit (Paper, Tamagui).** Faster first screens, but the kit's design language and abstractions become the story instead of our own.
- **Utility styling (NativeWind).** Productive, but string class names lose the typed-token guarantees this project wants to show.
- **Restyle.** Closest fit (typed theme), but adds a dependency to do what about 150 lines of `ThemeProvider` + `makeStyles` already do.

## Consequences

- We own accessibility defaults, so the [accessibility checklist](../design-system.md#accessibility-checklist) is part of every component PR.
- Component count must stay small; new visual needs become variants, not new one-off components.
