import { useMemo, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import type { Theme } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import type { AccentIndex } from '../tokens/semantic';

/**
 * Drawing primitives shared by StageMarker, StageProgress, and StageStep. Every shape is a View
 * (no SVG). Callers hide these from screen readers; the stage's word carries the meaning.
 */
export type GlyphKind =
  /** Hollow rounded square: a stage. */
  | 'dot'
  /** Pill: the current stage. */
  | 'ring'
  /** Filled block: Offer. */
  | 'star'
  /** Short bar: closed as rejected. */
  | 'bar'
  /** Bar leaving the track diagonally: closed as withdrawn. */
  | 'exit'
  /** Small filled dot: a stage passed on a closed application. */
  | 'pip';

/** `accent` = passed (accent color) · `ink` = current · `future` = not yet reached (dashed). */
export type GlyphTone = 'accent' | 'ink' | 'future';

export interface GlyphMetrics {
  /** Dot: outer size and corner radius. */
  dot: { size: number; radius: number; border: number };
  /** Ring pill outer size; `width` is the long side along the track. */
  ring: { width: number; height: number; radius: number; border: number };
  star: { size: number; radius: number };
  bar: { width: number; height: number };
  pip: { size: number };
  /** Yellow halo width around the current stage. */
  halo: number;
}

/** Stage markers (legend, StagePill). */
export const MARKER_METRICS: GlyphMetrics = {
  dot: { size: 14, radius: 7, border: 3 },
  ring: { width: 28, height: 16, radius: 8, border: 3 },
  star: { size: 18, radius: 3 },
  bar: { width: 6, height: 22 },
  pip: { size: 10 },
  halo: 2,
};

/** Horizontal stage progress. */
export const STRIP_METRICS: GlyphMetrics = {
  dot: { size: 18, radius: 6, border: 3 },
  ring: { width: 36, height: 24, radius: 9, border: 3 },
  star: { size: 18, radius: 3 },
  bar: { width: 6, height: 22 },
  pip: { size: 10 },
  halo: 2,
};

/** Vertical stage steps (the ring stands upright). */
export const STEP_METRICS: GlyphMetrics = {
  dot: { size: 18, radius: 6, border: 3 },
  ring: { width: 36, height: 28, radius: 11, border: 3 },
  star: { size: 20, radius: 3 },
  bar: { width: 22, height: 6 },
  pip: { size: 10 },
  halo: 3,
};

/** The future dashed outline is always 2 px. */
const FUTURE_BORDER = 2;
const EXIT_THICKNESS = 4;

function strokeColor(theme: Theme, tone: GlyphTone, accent: AccentIndex): string {
  switch (tone) {
    case 'accent':
      return theme.color.accent[accent].bg;
    case 'ink':
      return theme.color.text.primary;
    case 'future':
      return theme.color.stage.future;
    default:
      return assertNever(tone);
  }
}

export interface StageGlyphProps {
  kind: GlyphKind;
  tone: GlyphTone;
  accent: AccentIndex;
  metrics: GlyphMetrics;
  /** `vertical` turns the ring pill upright for vertical stage steps. */
  orientation?: 'horizontal' | 'vertical';
  /** Dashed outline even when reached (Saved: hollow, not yet applied). */
  dashed?: boolean;
  /** Yellow halo marks the current stage. */
  halo?: boolean;
}

function shapeStyle(
  theme: Theme,
  { kind, tone, accent, metrics, orientation = 'horizontal', dashed = false }: StageGlyphProps,
): ViewStyle {
  const color = strokeColor(theme, tone, accent);
  const future = tone === 'future' || dashed;
  const hollow: ViewStyle = {
    backgroundColor: theme.color.bg.surface,
    borderColor: color,
    borderStyle: future ? 'dashed' : 'solid',
  };
  const vertical = orientation === 'vertical';
  switch (kind) {
    case 'dot': {
      const { size, radius, border } = metrics.dot;
      const s = future ? size - 2 : size;
      return {
        ...hollow,
        width: s,
        height: s,
        borderRadius: radius,
        borderWidth: future ? FUTURE_BORDER : border,
      };
    }
    case 'ring': {
      const { width, height, radius, border } = metrics.ring;
      return {
        ...hollow,
        width: vertical ? height : width,
        height: vertical ? width : height,
        borderRadius: radius,
        borderWidth: future ? FUTURE_BORDER : border,
      };
    }
    case 'star': {
      const { size, radius } = metrics.star;
      return future
        ? { ...hollow, width: size, height: size, borderRadius: radius, borderWidth: FUTURE_BORDER }
        : { width: size, height: size, borderRadius: radius, backgroundColor: color };
    }
    case 'bar': {
      const { width, height } = metrics.bar;
      return { width, height, borderRadius: theme.radius.sm / 2, backgroundColor: color };
    }
    case 'pip': {
      const { size } = metrics.pip;
      return { width: size, height: size, borderRadius: size / 2, backgroundColor: color };
    }
    case 'exit':
      return { width: 26, height: 22 };
    default:
      return assertNever(kind);
  }
}

/** Two bars: a short run along the track, then a diagonal leaving it (Withdrawn). */
function Exit({ color }: { color: string }) {
  const parts = useMemo<{ run: ViewStyle; leave: ViewStyle }>(() => {
    const leaveLength = Math.hypot(10, 14) + EXIT_THICKNESS;
    return {
      run: {
        position: 'absolute',
        left: 2,
        top: 16,
        width: 12,
        height: EXIT_THICKNESS,
        borderRadius: EXIT_THICKNESS / 2,
        backgroundColor: color,
      },
      leave: {
        position: 'absolute',
        left: 17 - leaveLength / 2,
        top: 11 - EXIT_THICKNESS / 2,
        width: leaveLength,
        height: EXIT_THICKNESS,
        borderRadius: EXIT_THICKNESS / 2,
        backgroundColor: color,
        transform: [{ rotate: `${-Math.atan2(14, 10)}rad` }],
      },
    };
  }, [color]);
  return (
    <>
      <View style={parts.run} />
      <View style={parts.leave} />
    </>
  );
}

function Halo({ width, radius, children }: { width: number; radius: number; children: ReactNode }) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      padding: width,
      borderRadius: radius + width,
      backgroundColor: theme.color.urgent.bg,
    }),
    [width, radius, theme.color.urgent.bg],
  );
  return <View style={style}>{children}</View>;
}

export function StageGlyph(props: StageGlyphProps) {
  const theme = useTheme();
  const style = shapeStyle(theme, props);
  const shape = (
    <View style={style}>
      {props.kind === 'exit' ? <Exit color={strokeColor(theme, props.tone, props.accent)} /> : null}
    </View>
  );
  if (props.halo !== true) return shape;
  return (
    <Halo
      width={props.metrics.halo}
      radius={typeof style.borderRadius === 'number' ? style.borderRadius : 0}
    >
      {shape}
    </Halo>
  );
}
