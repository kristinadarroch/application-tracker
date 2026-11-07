import { View } from 'react-native';

import { assertNever } from '@/lib/assertNever';
import type { Stage } from '@/lib/stage';

import { makeStyles } from '../theme/makeStyles';
import type { AccentIndex } from '../tokens/semantic';
import { MARKER_METRICS, StageGlyph, type GlyphKind, type GlyphTone } from './stageGlyph';

export type StageState = 'passed' | 'current' | 'future';

export interface StageMarkerProps {
  stage: Stage;
  state: StageState;
  /**
   * The application's accent, for stages it has passed. Omit it when the marker stands for a
   * stage across all applications (section headers): passed stages then draw in neutral ink.
   */
  accent?: AccentIndex;
}

/** B4 shapes: each stage has its own mark, so color is never the only signal. */
export const STAGE_GLYPHS: Record<Stage, GlyphKind> = {
  saved: 'dot',
  applied: 'dot',
  interviewing: 'ring',
  offer: 'star',
  rejected: 'bar',
  withdrawn: 'exit',
};

export function toneFor(state: StageState): GlyphTone {
  switch (state) {
    case 'passed':
      return 'accent';
    case 'current':
      return 'ink';
    case 'future':
      return 'future';
    default:
      return assertNever(state);
  }
}

const useStyles = makeStyles(() => ({
  // Fixed slot so markers of different shapes line up in lists.
  slot: { width: 30, minHeight: 26, alignItems: 'center', justifyContent: 'center' },
}));

/** Decorative stage mark; the adjacent stage word carries the meaning. */
export function StageMarker({ stage, state, accent }: StageMarkerProps) {
  const styles = useStyles();
  return (
    <View
      style={styles.slot}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <StageGlyph
        kind={STAGE_GLYPHS[stage]}
        tone={state === 'passed' && accent === undefined ? 'ink' : toneFor(state)}
        accent={accent ?? 0}
        metrics={MARKER_METRICS}
        dashed={stage === 'saved'}
        halo={state === 'current'}
      />
    </View>
  );
}
