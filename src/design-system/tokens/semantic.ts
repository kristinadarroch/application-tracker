import type { Stage } from '@/lib/stage';

import { palette as p } from './palette';

export type FeedbackTone = 'success' | 'warning' | 'danger' | 'info';

export interface ColorPair {
  fg: string;
  bg: string;
}

export interface SemanticColors {
  bg: { canvas: string; surface: string; subtle: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; tertiary: string; inverse: string; link: string };
  action: { primary: { bg: string; bgPressed: string; fg: string } };
  focus: { ring: string };
  feedback: Record<FeedbackTone, ColorPair>;
  stage: Record<Stage, ColorPair>;
}

export const lightColors: SemanticColors = {
  bg: { canvas: p.neutral[50], surface: p.neutral[0], subtle: p.neutral[100] },
  border: { subtle: p.neutral[200], strong: p.neutral[300] },
  text: {
    primary: p.neutral[900],
    secondary: p.neutral[600],
    tertiary: p.neutral[500],
    inverse: p.neutral[0],
    link: p.brand[600],
  },
  action: { primary: { bg: p.brand[600], bgPressed: p.brand[700], fg: p.neutral[0] } },
  focus: { ring: p.brand[500] },
  feedback: {
    success: { bg: p.success[100], fg: p.success[700] },
    warning: { bg: p.warning[100], fg: p.warning[700] },
    danger: { bg: p.danger[100], fg: p.danger[700] },
    info: { bg: p.info[100], fg: p.info[700] },
  },
  stage: {
    saved: { fg: p.neutral[700], bg: p.neutral[100] },
    applied: { fg: p.info[700], bg: p.info[100] },
    interviewing: { fg: p.brand[700], bg: p.brand[100] },
    offer: { fg: p.success[700], bg: p.success[100] },
    rejected: { fg: p.danger[700], bg: p.danger[100] },
    withdrawn: { fg: p.neutral[700], bg: p.neutral[100] },
  },
};

export const darkColors: SemanticColors = {
  bg: { canvas: p.neutral[950], surface: p.neutral[900], subtle: p.neutral[800] },
  border: { subtle: p.neutral[800], strong: p.neutral[700] },
  text: {
    primary: p.neutral[50],
    secondary: p.neutral[300],
    tertiary: p.neutral[400],
    inverse: p.neutral[950],
    link: p.brand[300],
  },
  action: { primary: { bg: p.brand[400], bgPressed: p.brand[300], fg: p.neutral[950] } },
  focus: { ring: p.brand[300] },
  feedback: {
    success: { bg: p.success[900], fg: p.success[300] },
    warning: { bg: p.warning[900], fg: p.warning[300] },
    danger: { bg: p.danger[900], fg: p.danger[300] },
    info: { bg: p.info[900], fg: p.info[300] },
  },
  stage: {
    saved: { fg: p.neutral[300], bg: p.neutral[800] },
    applied: { fg: p.info[300], bg: p.info[900] },
    interviewing: { fg: p.brand[300], bg: p.brand[900] },
    offer: { fg: p.success[300], bg: p.success[900] },
    rejected: { fg: p.danger[300], bg: p.danger[900] },
    withdrawn: { fg: p.neutral[300], bg: p.neutral[800] },
  },
};
