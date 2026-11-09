import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactNode } from 'react';
import { Pressable, Text as RNText, View, type ViewStyle } from 'react-native';

import type { Stage } from '@/lib/stage';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import type { AccentIndex } from '../tokens/semantic';
import { STAGE_ICONS } from './icons';
import { STEP_METRICS, StageGlyph, type GlyphKind } from './stageGlyph';
import { toneFor, type StageState } from './StageMarker';

export interface StageStepProps {
  stage: Stage;
  state: StageState;
  accent: AccentIndex;
  /** Stage word, usually the stage label ("Interviewing"). */
  label: string;
  /** Right-aligned mono text: a date or "NEXT STAGE". */
  meta?: string;
  /** A short string renders as a yellow tag ("CURRENT"); any other node renders as is. */
  tag?: ReactNode;
  /** Makes the stage row a button. Children stay separate controls. */
  onPress?: () => void;
  /** Button name; defaults to `label`. */
  accessibilityLabel?: string;
  /** What pressing the row does, read after the name. */
  accessibilityHint?: string;
  selected?: boolean;
  /** No track below the last stage. */
  last?: boolean;
  /** Content along the track under the row: the next-step panel, proposals. */
  children?: ReactNode;
}

/** Height of each marker shape on the vertical track. */
const GLYPH_HEIGHT: Record<GlyphKind, number> = {
  dot: STEP_METRICS.dot.size,
  ring: STEP_METRICS.ring.width,
  star: STEP_METRICS.star.size,
  bar: STEP_METRICS.bar.height,
  exit: 22,
  pip: STEP_METRICS.pip.size,
};

const INDICATOR_WIDTH = 44;
const SOLID = 6;
const MARKER_TOP = 4;

const useStyles = makeStyles((t) => ({
  step: { flexDirection: 'row' },
  indicatorColumn: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: INDICATOR_WIDTH,
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
    borderColor: t.color.stage.future,
  },
  content: { flex: 1, marginLeft: INDICATOR_WIDTH, paddingBottom: t.space[2], gap: t.space[2] },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: t.space[2],
    minHeight: t.size.minTouchTarget,
    paddingTop: t.space[1] / 2,
    marginLeft: -INDICATOR_WIDTH,
    paddingLeft: INDICATOR_WIDTH,
    borderRadius: t.radius.md,
  },
  headerPressed: { backgroundColor: t.color.bg.subtle },
  headerSelected: { backgroundColor: t.color.bg.subtle },
  name: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  label: { ...t.type.bodyStrong, color: t.color.text.primary, flexShrink: 1 },
  currentLabel: { ...t.type.heading, color: t.color.text.primary, flexShrink: 1 },
  futureLabel: { ...t.type.bodyStrong, color: t.color.text.secondary, flexShrink: 1 },
  meta: { ...t.type.mono, color: t.color.text.secondary, textAlign: 'right' },
  tag: {
    ...t.type.overline,
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

function markerKind(stage: Stage, state: StageState): GlyphKind {
  if (state !== 'current') return 'dot';
  if (stage === 'offer') return 'star';
  if (stage === 'rejected') return 'bar';
  if (stage === 'withdrawn') return 'exit';
  return 'ring';
}

/**
 * One stage on the vertical progress track: marker on the track, stage icon + word, mono
 * meta, optional tag, and children laid along the track. Track above is solid once reached;
 * track below is solid only between passed stages, dotted toward the future.
 */
export function StageStep({
  stage,
  state,
  accent,
  label,
  meta,
  tag,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  selected = false,
  last = false,
  children,
}: StageStepProps) {
  const styles = useStyles();
  const theme = useTheme();
  const iconSize = useScaledIconSize(state === 'current' ? 18 : 16, 'bodyStrong');
  const kind = markerKind(stage, state);
  const color = theme.color.accent[accent].bg;

  // Marker center: the top track ends there and the bottom track starts there.
  const markerHeight = GLYPH_HEIGHT[kind] + (state === 'current' ? STEP_METRICS.halo * 2 : 0);
  const center = MARKER_TOP + markerHeight / 2;
  // Saved is always the first stage, so nothing runs above it.
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
            <RNText style={styles.tag} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.overline}>
              {tag}
            </RNText>
          ) : (
            tag
          )}
          {meta !== undefined ? (
            <RNText style={styles.meta} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.mono}>
              {meta}
            </RNText>
          ) : null}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.step}>
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
            {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
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
        style={styles.indicatorColumn}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {first ? null : <View style={[solidAbove ? styles.solid : styles.dotted, tracks.above]} />}
        {last ? null : <View style={[solidBelow ? styles.solid : styles.dotted, tracks.below]} />}
        <View style={styles.marker}>
          <StageGlyph
            kind={kind}
            tone={toneFor(state)}
            accent={accent}
            metrics={STEP_METRICS}
            orientation="vertical"
            dashed={stage === 'saved' && state === 'future'}
            halo={state === 'current'}
          />
        </View>
      </View>
    </View>
  );
}
