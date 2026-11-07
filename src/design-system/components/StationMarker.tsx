import { View } from 'react-native';

import { assertNever } from '@/lib/assertNever';
import type { Stage } from '@/lib/stage';

import { makeStyles } from '../theme/makeStyles';
import type { LineIndex } from '../tokens/semantic';
import { MARKER_METRICS, StationGlyph, type GlyphKind, type GlyphTone } from './stationGlyph';

export type StationState = 'passed' | 'current' | 'future';

export interface StationMarkerProps {
  stage: Stage;
  state: StationState;
  /** Line color for passed stations. Defaults to the first line. */
  line?: LineIndex;
}

/** B4 shapes: each stage has its own mark, so color is never the only signal. */
export const STAGE_GLYPHS: Record<Stage, GlyphKind> = {
  saved: 'stop',
  applied: 'stop',
  interviewing: 'interchange',
  offer: 'terminal',
  rejected: 'terminus',
  withdrawn: 'branch',
};

export function toneFor(state: StationState): GlyphTone {
  switch (state) {
    case 'passed':
      return 'line';
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

/** Decorative station mark; the adjacent stage word carries the meaning. */
export function StationMarker({ stage, state, line = 0 }: StationMarkerProps) {
  const styles = useStyles();
  return (
    <View
      style={styles.slot}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <StationGlyph
        kind={STAGE_GLYPHS[stage]}
        tone={toneFor(state)}
        line={line}
        metrics={MARKER_METRICS}
        dashed={stage === 'saved'}
        halo={state === 'current'}
      />
    </View>
  );
}
