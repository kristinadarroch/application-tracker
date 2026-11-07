import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactNode } from 'react';
import { Pressable, Text as RNText, View, type ViewStyle } from 'react-native';

import type { Stage } from '@/lib/stage';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import type { LineIndex } from '../tokens/semantic';
import { STAGE_ICONS } from './icons';
import { ROUTE_METRICS, StationGlyph, type GlyphKind } from './stationGlyph';
import { toneFor, type StationState } from './StationMarker';

export interface RouteStationProps {
  stage: Stage;
  state: StationState;
  line: LineIndex;
  /** Station word, usually the stage label ("Interviewing"). */
  label: string;
  /** Right-aligned board text: a date or "NEXT STATION". */
  meta?: string;
  /** A short string renders as a yellow tag ("YOU ARE HERE"); any other node renders as is. */
  tag?: ReactNode;
  /** Makes the station row a button. Children stay separate controls. */
  onPress?: () => void;
  /** Button name; defaults to `label`. */
  accessibilityLabel?: string;
  selected?: boolean;
  /** No track below the last station. */
  last?: boolean;
  /** Content along the line under the row: the next-step board, proposals. */
  children?: ReactNode;
}

/** Height of each marker shape on the vertical route. */
const GLYPH_HEIGHT: Record<GlyphKind, number> = {
  stop: ROUTE_METRICS.stop.size,
  interchange: ROUTE_METRICS.interchange.width,
  terminal: ROUTE_METRICS.terminal.size,
  terminus: ROUTE_METRICS.terminus.height,
  branch: 22,
  dot: ROUTE_METRICS.dot.size,
};

const RAIL = 44;
const SOLID = 6;
const MARKER_TOP = 4;

const useStyles = makeStyles((t) => ({
  station: { flexDirection: 'row' },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: RAIL,
    alignItems: 'center',
  },
  marker: { marginTop: MARKER_TOP },
  solid: { position: 'absolute', width: SOLID },
  /** A zero-width box with a dotted border all round draws one dotted line. */
  dotted: {
    position: 'absolute',
    width: 0,
    borderWidth: 1.5,
    borderRadius: 1.5,
    borderStyle: 'dotted',
    borderColor: t.color.station.future,
  },
  content: { flex: 1, marginLeft: RAIL, paddingBottom: t.space[2], gap: t.space[2] },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: t.space[2],
    minHeight: t.size.minTouchTarget,
    paddingTop: t.space[1] / 2,
    marginLeft: -RAIL,
    paddingLeft: RAIL,
    borderRadius: t.radius.md,
  },
  headerPressed: { backgroundColor: t.color.bg.subtle },
  headerSelected: { backgroundColor: t.color.bg.subtle },
  name: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  label: { ...t.type.bodyStrong, color: t.color.text.primary, flexShrink: 1 },
  currentLabel: { ...t.type.heading, color: t.color.text.primary, flexShrink: 1 },
  futureLabel: { ...t.type.bodyStrong, color: t.color.text.secondary, flexShrink: 1 },
  meta: { ...t.type.board, color: t.color.text.secondary, textAlign: 'right' },
  tag: {
    ...t.type.station,
    color: t.color.urgent.fg,
    backgroundColor: t.color.urgent.bg,
    borderRadius: t.radius.sm,
    overflow: 'hidden',
    paddingHorizontal: t.space[2],
    paddingTop: 3,
    paddingBottom: 1,
  },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], flexShrink: 0 },
}));

function markerKind(stage: Stage, state: StationState): GlyphKind {
  if (state !== 'current') return 'stop';
  if (stage === 'offer') return 'terminal';
  if (stage === 'rejected') return 'terminus';
  if (stage === 'withdrawn') return 'branch';
  return 'interchange';
}

/**
 * One station on the vertical route (B2): marker on the line, stage icon + word, board-style
 * meta, optional tag, and children laid along the line. Track above is solid once reached;
 * track below is solid only between passed stations, dotted toward the future.
 */
export function RouteStation({
  stage,
  state,
  line,
  label,
  meta,
  tag,
  onPress,
  accessibilityLabel,
  selected = false,
  last = false,
  children,
}: RouteStationProps) {
  const styles = useStyles();
  const theme = useTheme();
  const iconSize = useScaledIconSize(state === 'current' ? 18 : 16, 'bodyStrong');
  const kind = markerKind(stage, state);
  const color = theme.color.line[line].bg;

  // Marker center: the top track ends there and the bottom track starts there.
  const markerHeight = GLYPH_HEIGHT[kind] + (state === 'current' ? ROUTE_METRICS.halo * 2 : 0);
  const center = MARKER_TOP + markerHeight / 2;
  // Saved is always the first station, so nothing runs above it.
  const first = stage === 'saved';
  const solidAbove = state !== 'future';
  const solidBelow = state === 'passed';

  const tracks = useMemo<{ above: ViewStyle; below: ViewStyle }>(
    () => ({
      above: { top: 0, height: center, ...(solidAbove ? { backgroundColor: color } : {}) },
      below: { top: center, bottom: 0, ...(solidBelow ? { backgroundColor: color } : {}) },
    }),
    [center, color, solidAbove, solidBelow],
  );

  const labelStyle =
    state === 'current'
      ? styles.currentLabel
      : state === 'future'
        ? styles.futureLabel
        : styles.label;
  const fg = state === 'future' ? theme.color.text.secondary : theme.color.text.primary;

  const headerContent = (
    <>
      <View style={styles.name}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name={STAGE_ICONS[stage]} size={iconSize} color={fg} />
        </View>
        <RNText
          style={labelStyle}
          maxFontSizeMultiplier={
            theme.maxFontSizeMultiplier[state === 'current' ? 'heading' : 'bodyStrong']
          }
        >
          {label}
        </RNText>
      </View>
      {meta !== undefined || tag !== undefined ? (
        <View style={styles.trailing}>
          {typeof tag === 'string' ? (
            <RNText style={styles.tag} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.station}>
              {tag}
            </RNText>
          ) : (
            tag
          )}
          {meta !== undefined ? (
            <RNText style={styles.meta} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.board}>
              {meta}
            </RNText>
          ) : null}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.station}>
      <View style={styles.content}>
        {onPress === undefined ? (
          <View
            style={styles.header}
            {...(accessibilityLabel === undefined ? {} : { accessible: true, accessibilityLabel })}
          >
            {headerContent}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ selected }}
            onPress={onPress}
            style={({ pressed }) => [
              styles.header,
              selected ? styles.headerSelected : null,
              pressed ? styles.headerPressed : null,
            ]}
          >
            {headerContent}
          </Pressable>
        )}
        {children}
      </View>
      <View
        style={styles.rail}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {first ? null : <View style={[solidAbove ? styles.solid : styles.dotted, tracks.above]} />}
        {last ? null : <View style={[solidBelow ? styles.solid : styles.dotted, tracks.below]} />}
        <View style={styles.marker}>
          <StationGlyph
            kind={kind}
            tone={toneFor(state)}
            line={line}
            metrics={ROUTE_METRICS}
            orientation="vertical"
            dashed={stage === 'saved' && state === 'future'}
            halo={state === 'current'}
          />
        </View>
      </View>
    </View>
  );
}
