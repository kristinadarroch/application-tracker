export interface Motion {
  fast: number;
  base: number;
  slow: number;
}

export const motion: Motion = { fast: 120, base: 200, slow: 320 };

/** Used when the OS Reduce Motion setting is on. */
export const reducedMotion: Motion = { fast: 0, base: 0, slow: 0 };
