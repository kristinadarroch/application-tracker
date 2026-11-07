import { useMemo, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import type { Theme } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import type { LineIndex } from '../tokens/semantic';

/**
 * Drawing primitives shared by StationMarker, LineStrip, and RouteStation. Every shape is a View
 * (no SVG). Callers hide these from screen readers; the station's word carries the meaning.
 */
export type GlyphKind =
  /** Hollow round stop: a station on the line. */
  | 'stop'
  /** Interchange pill: "you are here". */
  | 'interchange'
  /** Filled block: the Offer terminal. */
  | 'terminal'
  /** Vertical bar: route complete (Rejected). */
  | 'terminus'
  /** Bar leaving the line diagonally (Withdrawn). */
  | 'branch'
  /** Small filled dot: a stop passed on a completed route. */
  | 'dot';

/** `line` = passed (line color) · `ink` = current · `future` = not yet reached (dashed). */
export type GlyphTone = 'line' | 'ink' | 'future';

export interface GlyphMetrics {
  /** Stop: outer diameter-ish size and corner radius. */
  stop: { size: number; radius: number; border: number };
  /** Interchange pill outer size; `width` is the long side along the line. */
  interchange: { width: number; height: number; radius: number; border: number };
  terminal: { size: number; radius: number };
  terminus: { width: number; height: number };
  dot: { size: number };
  /** Yellow halo width around the current station. */
  halo: number;
}

/** B4 station markers (legend, StagePill). */
export const MARKER_METRICS: GlyphMetrics = {
  stop: { size: 14, radius: 7, border: 3 },
  interchange: { width: 28, height: 16, radius: 8, border: 3 },
  terminal: { size: 18, radius: 3 },
  terminus: { width: 6, height: 22 },
  dot: { size: 10 },
  halo: 2,
};

/** B1 line strips. */
export const STRIP_METRICS: GlyphMetrics = {
  stop: { size: 18, radius: 6, border: 3 },
  interchange: { width: 36, height: 24, radius: 9, border: 3 },
  terminal: { size: 18, radius: 3 },
  terminus: { width: 6, height: 22 },
  dot: { size: 10 },
  halo: 2,
};

/** B2 vertical route (the interchange stands upright). */
export const ROUTE_METRICS: GlyphMetrics = {
  stop: { size: 18, radius: 6, border: 3 },
  interchange: { width: 36, height: 28, radius: 11, border: 3 },
  terminal: { size: 20, radius: 3 },
  terminus: { width: 22, height: 6 },
  dot: { size: 10 },
  halo: 3,
};

/** The future dashed outline is always 2 px. */
const FUTURE_BORDER = 2;
const BRANCH_THICKNESS = 4;

export function strokeColor(theme: Theme, tone: GlyphTone, line: LineIndex): string {
  switch (tone) {
    case 'line':
      return theme.color.line[line].bg;
    case 'ink':
      return theme.color.text.primary;
    case 'future':
      return theme.color.station.future;
    default:
      return assertNever(tone);
  }
}

export interface StationGlyphProps {
  kind: GlyphKind;
  tone: GlyphTone;
  line: LineIndex;
  metrics: GlyphMetrics;
  /** `vertical` turns the interchange pill upright for vertical routes. */
  orientation?: 'horizontal' | 'vertical';
  /** Dashed outline even when reached (B4 Saved: "hollow, not yet boarded"). */
  dashed?: boolean;
  /** Yellow halo marks the current station. */
  halo?: boolean;
}

function shapeStyle(
  theme: Theme,
  { kind, tone, line, metrics, orientation = 'horizontal', dashed = false }: StationGlyphProps,
): ViewStyle {
  const color = strokeColor(theme, tone, line);
  const future = tone === 'future' || dashed;
  const hollow: ViewStyle = {
    backgroundColor: theme.color.bg.surface,
    borderColor: color,
    borderStyle: future ? 'dashed' : 'solid',
  };
  const vertical = orientation === 'vertical';
  switch (kind) {
    case 'stop': {
      const { size, radius, border } = metrics.stop;
      const s = future ? size - 2 : size;
      return {
        ...hollow,
        width: s,
        height: s,
        borderRadius: radius,
        borderWidth: future ? FUTURE_BORDER : border,
      };
    }
    case 'interchange': {
      const { width, height, radius, border } = metrics.interchange;
      return {
        ...hollow,
        width: vertical ? height : width,
        height: vertical ? width : height,
        borderRadius: radius,
        borderWidth: future ? FUTURE_BORDER : border,
      };
    }
    case 'terminal': {
      const { size, radius } = metrics.terminal;
      return future
        ? { ...hollow, width: size, height: size, borderRadius: radius, borderWidth: FUTURE_BORDER }
        : { width: size, height: size, borderRadius: radius, backgroundColor: color };
    }
    case 'terminus': {
      const { width, height } = metrics.terminus;
      return { width, height, borderRadius: theme.radius.sm / 2, backgroundColor: color };
    }
    case 'dot': {
      const { size } = metrics.dot;
      return { width: size, height: size, borderRadius: size / 2, backgroundColor: color };
    }
    case 'branch':
      return { width: 26, height: 22 };
    default:
      return assertNever(kind);
  }
}

/** Two bars: a short run along the line, then a diagonal leaving it (B4 "branch leaves line"). */
function Branch({ color }: { color: string }) {
  const parts = useMemo<{ run: ViewStyle; leave: ViewStyle }>(() => {
    const leaveLength = Math.hypot(10, 14) + BRANCH_THICKNESS;
    return {
      run: {
        position: 'absolute',
        left: 2,
        top: 16,
        width: 12,
        height: BRANCH_THICKNESS,
        borderRadius: BRANCH_THICKNESS / 2,
        backgroundColor: color,
      },
      leave: {
        position: 'absolute',
        left: 17 - leaveLength / 2,
        top: 11 - BRANCH_THICKNESS / 2,
        width: leaveLength,
        height: BRANCH_THICKNESS,
        borderRadius: BRANCH_THICKNESS / 2,
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

export function StationGlyph(props: StationGlyphProps) {
  const theme = useTheme();
  const style = shapeStyle(theme, props);
  const shape = (
    <View style={style}>
      {props.kind === 'branch' ? (
        <Branch color={strokeColor(theme, props.tone, props.line)} />
      ) : null}
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
