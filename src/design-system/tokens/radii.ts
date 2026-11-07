/**
 * Transit shape: cards 10, boards and inputs inside them 8 (10 − 2 inset), small marks 4, and
 * every control fully round.
 */
export const radii = { sm: 4, md: 8, lg: 10, pill: 999 } as const;

export type RadiusToken = keyof typeof radii;
