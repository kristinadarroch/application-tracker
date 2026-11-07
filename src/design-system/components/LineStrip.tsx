import { useMemo } from 'react';
import { Text as RNText, View, type ViewStyle } from 'react-native';

import type { Stage } from '@/lib/stage';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import type { LineIndex } from '../tokens/semantic';
import { STRIP_METRICS, StationGlyph } from './stationGlyph';

export interface LineStripProps {
  stage: Stage;
  line: LineIndex;
}

/** The four stations of a running line, left to right. */
const STRIP_STAGES = ['saved', 'applied', 'interviewing', 'offer'] as const;
const LEGEND = ['Saved', 'Applied', 'Interview', 'Offer'] as const;
const COLUMNS = STRIP_STAGES.length;
/** A closed route ends at this column (B1 "Route complete"), before the Offer terminal. */
const END_COLUMN = 2;
const TRACK_HEIGHT = 30;
const RUNNING_THICKNESS = 6;
const COMPLETE_THICKNESS = 4;

/** Center of a column, as a share of the strip width. */
function columnCenter(column: number): number {
  return ((column + 0.5) / COLUMNS) * 100;
}

const useStyles = makeStyles((t) => ({
  track: { height: TRACK_HEIGHT, justifyContent: 'center' },
  columns: { flexDirection: 'row', alignItems: 'center' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  /** A zero-height box with a 1px dotted border all round draws one 2px dotted line. */
  dotted: {
    position: 'absolute',
    top: TRACK_HEIGHT / 2 - 1,
    height: 0,
    borderWidth: 1,
    borderRadius: 1,
    borderStyle: 'dotted',
    borderColor: t.color.station.future,
  },
  legend: { flexDirection: 'row' },
  legendLabel: {
    ...t.type.station,
    flex: 1,
    textAlign: 'center',
    color: t.color.text.secondary,
  },
}));

function Segment({
  from,
  to,
  thickness,
  color,
}: {
  from: number;
  to: number;
  thickness: number;
  color: string;
}) {
  const style = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      left: `${columnCenter(from)}%`,
      width: `${columnCenter(to) - columnCenter(from)}%`,
      top: (TRACK_HEIGHT - thickness) / 2,
      height: thickness,
      borderRadius: thickness / 2,
      backgroundColor: color,
    }),
    [from, to, thickness, color],
  );
  return <View style={style} />;
}

function DottedSegment({ from, to }: { from: number; to: number }) {
  const styles = useStyles();
  const span = useMemo<ViewStyle>(
    () => ({
      left: `${columnCenter(from)}%`,
      width: `${columnCenter(to) - columnCenter(from)}%`,
    }),
    [from, to],
  );
  return <View style={[styles.dotted, span]} />;
}

/**
 * Horizontal 4-station strip (B1). Reached track is solid in the line color, the rest dotted;
 * the current station is the interchange pill with a yellow halo. A closed route (Rejected,
 * Withdrawn) is solid with small stops, ending in a terminus bar or a branch. Decorative: the
 * row's own label carries the stage.
 */
export function LineStrip({ stage, line }: LineStripProps) {
  const styles = useStyles();
  const theme = useTheme();
  const color = theme.color.line[line].bg;
  const closed = stage === 'rejected' || stage === 'withdrawn';
  const current = closed ? END_COLUMN : (STRIP_STAGES as readonly Stage[]).indexOf(stage);

  return (
    <View
      style={styles.track}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {current > 0 ? (
        <Segment
          from={0}
          to={current}
          thickness={closed ? COMPLETE_THICKNESS : RUNNING_THICKNESS}
          color={color}
        />
      ) : null}
      {!closed && current < COLUMNS - 1 ? <DottedSegment from={current} to={COLUMNS - 1} /> : null}
      <View style={styles.columns}>
        {STRIP_STAGES.map((station, column) => (
          <View key={station} style={styles.column}>
            {closed ? (
              column < END_COLUMN ? (
                <StationGlyph kind="dot" tone="line" line={line} metrics={STRIP_METRICS} />
              ) : column === END_COLUMN ? (
                <StationGlyph
                  kind={stage === 'rejected' ? 'terminus' : 'branch'}
                  tone="ink"
                  line={line}
                  metrics={STRIP_METRICS}
                />
              ) : null
            ) : column === current ? (
              <StationGlyph
                kind="interchange"
                tone="ink"
                line={line}
                metrics={STRIP_METRICS}
                halo
              />
            ) : (
              <StationGlyph
                kind="stop"
                tone={column < current ? 'line' : 'future'}
                line={line}
                metrics={STRIP_METRICS}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Column captions for `LineStrip`; give it the same width as the strips below it. */
export function LineStripLegend() {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View
      style={styles.legend}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {LEGEND.map((label) => (
        <RNText
          key={label}
          style={styles.legendLabel}
          maxFontSizeMultiplier={theme.maxFontSizeMultiplier.station}
        >
          {label}
        </RNText>
      ))}
    </View>
  );
}
