import { palette as p } from './palette';

export type FeedbackTone = 'success' | 'warning' | 'danger' | 'info';

/** Four line colors; an application's line index picks one (see `LineIndex`). */
export type LineIndex = 0 | 1 | 2 | 3;

export interface ColorPair {
  fg: string;
  bg: string;
}

export interface SemanticColors {
  bg: { canvas: string; surface: string; subtle: string };
  /**
   * Dark sign panels: screen headers on tab roots, the next-departure board. `roundelPlate` sits
   * behind a line roundel on the panel so the line color keeps ≥ 3:1 against its surroundings.
   */
  sign: { bg: string; fg: string; fgSecondary: string; roundelPlate: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; tertiary: string; inverse: string; link: string };
  action: { primary: { bg: string; bgPressed: string; fg: string } };
  focus: { ring: string };
  feedback: Record<FeedbackTone, ColorPair>;
  /** Due within 48 hours or overdue. Yellow with ink text in both themes. */
  urgent: ColorPair;
  /** AI proposals: dashed border over a hatched fill ("track under construction"). */
  proposal: { border: string; hatchA: string; hatchB: string };
  /** `bg` is the line color; `fg` is text drawn on it (roundel letters). */
  line: Record<LineIndex, ColorPair>;
  /** Stations not yet reached on a line. */
  station: { future: string };
}

export const lightColors: SemanticColors = {
  bg: { canvas: p.platform[50], surface: p.platform[0], subtle: p.platform[200] },
  sign: { bg: p.ink[900], fg: p.platform[0], fgSecondary: p.fog[200], roundelPlate: p.platform[0] },
  border: { subtle: p.platform[300], strong: p.ink[900] },
  text: {
    primary: p.ink[900],
    secondary: p.ink[600],
    tertiary: p.ink[500],
    inverse: p.platform[0],
    link: p.line.blue.light,
  },
  action: { primary: { bg: p.ink[900], bgPressed: p.ink[700], fg: p.platform[0] } },
  focus: { ring: p.line.blue.light },
  feedback: {
    success: { fg: p.feedback.success.lightFg, bg: p.feedback.success.lightBg },
    warning: { fg: p.feedback.warning.lightFg, bg: p.feedback.warning.lightBg },
    danger: { fg: p.feedback.danger.lightFg, bg: p.feedback.danger.lightBg },
    info: { fg: p.feedback.info.lightFg, bg: p.feedback.info.lightBg },
  },
  urgent: { fg: p.ink[900], bg: p.signal[500] },
  proposal: { border: p.ink[900], hatchA: p.platform[0], hatchB: p.platform[100] },
  line: {
    0: { bg: p.line.blue.light, fg: p.platform[0] },
    1: { bg: p.line.orange.light, fg: p.platform[0] },
    2: { bg: p.line.green.light, fg: p.platform[0] },
    3: { bg: p.line.purple.light, fg: p.platform[0] },
  },
  station: { future: p.ink[400] },
};

export const darkColors: SemanticColors = {
  bg: { canvas: p.night[950], surface: p.night[900], subtle: p.night[800] },
  // Dark line colors already clear 5:1 on the panel, so the plate blends into it.
  sign: { bg: p.night[800], fg: p.fog[100], fgSecondary: p.fog[300], roundelPlate: p.night[800] },
  border: { subtle: p.night[700], strong: p.fog[100] },
  text: {
    primary: p.fog[100],
    secondary: p.fog[300],
    tertiary: p.fog[400],
    inverse: p.ink[900],
    link: p.line.blue.dark,
  },
  action: { primary: { bg: p.fog[100], bgPressed: p.fog[200], fg: p.ink[900] } },
  focus: { ring: p.line.blue.dark },
  feedback: {
    success: { fg: p.feedback.success.darkFg, bg: p.feedback.success.darkBg },
    warning: { fg: p.feedback.warning.darkFg, bg: p.feedback.warning.darkBg },
    danger: { fg: p.feedback.danger.darkFg, bg: p.feedback.danger.darkBg },
    info: { fg: p.feedback.info.darkFg, bg: p.feedback.info.darkBg },
  },
  urgent: { fg: p.ink[900], bg: p.signal[500] },
  proposal: { border: p.fog[100], hatchA: p.night[900], hatchB: p.night[850] },
  line: {
    0: { bg: p.line.blue.dark, fg: p.night[950] },
    1: { bg: p.line.orange.dark, fg: p.night[950] },
    2: { bg: p.line.green.dark, fg: p.night[950] },
    3: { bg: p.line.purple.dark, fg: p.night[950] },
  },
  station: { future: p.fog[400] },
};
