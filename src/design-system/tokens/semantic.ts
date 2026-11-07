import { palette as p } from './palette';

export type FeedbackTone = 'success' | 'warning' | 'danger' | 'info';

/** Four accent colors; an application's accent index picks one (see `AccentIndex`). */
export type AccentIndex = 0 | 1 | 2 | 3;

export interface ColorPair {
  fg: string;
  bg: string;
}

export interface SemanticColors {
  bg: { canvas: string; surface: string; subtle: string };
  /**
   * Dark panels: screen headers on tab roots, the up-next card. `badgePlate` sits behind a
   * company badge on the panel so the accent color keeps ≥ 3:1 against its surroundings.
   */
  panel: { bg: string; fg: string; fgSecondary: string; badgePlate: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; tertiary: string; inverse: string; link: string };
  action: { primary: { bg: string; bgPressed: string; fg: string } };
  focus: { ring: string };
  feedback: Record<FeedbackTone, ColorPair>;
  /** Due within 48 hours or overdue. Yellow with ink text in both themes. */
  urgent: ColorPair;
  /** AI proposals: dashed border over a hatched fill (not yet saved). */
  proposal: { border: string; hatchA: string; hatchB: string };
  /** `bg` is the accent color; `fg` is text drawn on it (badge letters). */
  accent: Record<AccentIndex, ColorPair>;
  /** Stages not yet reached. */
  stage: { future: string };
}

export const lightColors: SemanticColors = {
  bg: { canvas: p.paper[50], surface: p.paper[0], subtle: p.paper[200] },
  panel: { bg: p.ink[900], fg: p.paper[0], fgSecondary: p.fog[200], badgePlate: p.paper[0] },
  border: { subtle: p.paper[300], strong: p.ink[900] },
  text: {
    primary: p.ink[900],
    secondary: p.ink[600],
    tertiary: p.ink[500],
    inverse: p.paper[0],
    link: p.accent.blue.light,
  },
  action: { primary: { bg: p.ink[900], bgPressed: p.ink[700], fg: p.paper[0] } },
  focus: { ring: p.accent.blue.light },
  feedback: {
    success: { fg: p.feedback.success.lightFg, bg: p.feedback.success.lightBg },
    warning: { fg: p.feedback.warning.lightFg, bg: p.feedback.warning.lightBg },
    danger: { fg: p.feedback.danger.lightFg, bg: p.feedback.danger.lightBg },
    info: { fg: p.feedback.info.lightFg, bg: p.feedback.info.lightBg },
  },
  urgent: { fg: p.ink[900], bg: p.highlight[500] },
  proposal: { border: p.ink[900], hatchA: p.paper[0], hatchB: p.paper[100] },
  accent: {
    0: { bg: p.accent.blue.light, fg: p.paper[0] },
    1: { bg: p.accent.orange.light, fg: p.paper[0] },
    2: { bg: p.accent.green.light, fg: p.paper[0] },
    3: { bg: p.accent.purple.light, fg: p.paper[0] },
  },
  stage: { future: p.ink[400] },
};

export const darkColors: SemanticColors = {
  bg: { canvas: p.night[950], surface: p.night[900], subtle: p.night[800] },
  // Dark accent colors already clear 5:1 on the panel, so the plate blends into it.
  panel: { bg: p.night[800], fg: p.fog[100], fgSecondary: p.fog[300], badgePlate: p.night[800] },
  border: { subtle: p.night[700], strong: p.fog[100] },
  text: {
    primary: p.fog[100],
    secondary: p.fog[300],
    tertiary: p.fog[400],
    inverse: p.ink[900],
    link: p.accent.blue.dark,
  },
  action: { primary: { bg: p.fog[100], bgPressed: p.fog[200], fg: p.ink[900] } },
  focus: { ring: p.accent.blue.dark },
  feedback: {
    success: { fg: p.feedback.success.darkFg, bg: p.feedback.success.darkBg },
    warning: { fg: p.feedback.warning.darkFg, bg: p.feedback.warning.darkBg },
    danger: { fg: p.feedback.danger.darkFg, bg: p.feedback.danger.darkBg },
    info: { fg: p.feedback.info.darkFg, bg: p.feedback.info.darkBg },
  },
  urgent: { fg: p.ink[900], bg: p.highlight[500] },
  proposal: { border: p.fog[100], hatchA: p.night[900], hatchB: p.night[850] },
  accent: {
    0: { bg: p.accent.blue.dark, fg: p.night[950] },
    1: { bg: p.accent.orange.dark, fg: p.night[950] },
    2: { bg: p.accent.green.dark, fg: p.night[950] },
    3: { bg: p.accent.purple.dark, fg: p.night[950] },
  },
  stage: { future: p.fog[400] },
};
