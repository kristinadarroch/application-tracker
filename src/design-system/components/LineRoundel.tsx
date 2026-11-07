import { useMemo } from 'react';
import { Text as RNText, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { useTheme } from '../theme/useTheme';
import type { LineIndex } from '../tokens/semantic';
import { fontFamily } from '../tokens/typography';

export type LineRoundelSize = 'sm' | 'md' | 'lg';
/** `sign`: drawn on a dark sign panel, so the roundel sits on a light plate (≥ 3:1 edge). */
export type LineRoundelSurface = 'default' | 'sign';

export interface LineRoundelProps {
  line: LineIndex;
  letter: string;
  size?: LineRoundelSize;
  surface?: LineRoundelSurface;
}

/** Plate margin around a roundel on a sign panel. */
const PLATE_INSET = 3;

const SIZES: Record<LineRoundelSize, { box: number; font: number }> = {
  sm: { box: 24, font: 12 },
  md: { box: 32, font: 16 },
  lg: { box: 44, font: 22 },
};

interface RoundelLayout {
  box: ViewStyle;
  /** The colored shape, drawn behind the letter. */
  shape: ViewStyle;
  /** Clip + horizontal squash that turns a rotated square into the triangle (line 2 only). */
  clip: ViewStyle | null;
  letter: TextStyle;
}

/**
 * Shapes by line: 0 circle, 1 rounded square, 2 triangle, 3 diamond. The triangle is the top
 * half of a 45°-rotated square, clipped and squashed horizontally (Views only, no SVG).
 */
function layoutFor(line: LineIndex, box: number, font: number, color: string): RoundelLayout {
  const container: ViewStyle = {
    width: box,
    height: box,
    alignItems: 'center',
    justifyContent: 'center',
  };
  const letter: TextStyle = {
    fontFamily: fontFamily.black,
    fontSize: font,
    lineHeight: Math.round(font * 1.2),
    textAlign: 'center',
  };
  switch (line) {
    case 0:
      return {
        box: container,
        shape: { ...StyleSheet.absoluteFill, borderRadius: box / 2, backgroundColor: color },
        clip: null,
        letter,
      };
    case 1:
      return {
        box: container,
        shape: {
          ...StyleSheet.absoluteFill,
          borderRadius: box * 0.19,
          backgroundColor: color,
        },
        clip: null,
        letter,
      };
    case 2: {
      const height = box * 0.92;
      const side = height * Math.SQRT2;
      return {
        box: container,
        clip: {
          position: 'absolute',
          top: (box - height) / 2,
          left: (box - height * 2) / 2,
          width: height * 2,
          height,
          overflow: 'hidden',
          transform: [{ scaleX: box / (height * 2) }],
        },
        shape: {
          position: 'absolute',
          width: side,
          height: side,
          left: height - side / 2,
          top: height - side / 2,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        },
        // The triangle's visual center sits low; nudge the letter down to it.
        letter: { ...letter, fontSize: font * 0.85, marginTop: box * 0.22 },
      };
    }
    case 3: {
      const side = box * 0.72;
      return {
        box: container,
        shape: {
          position: 'absolute',
          width: side,
          height: side,
          left: (box - side) / 2,
          top: (box - side) / 2,
          borderRadius: 2,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        },
        clip: null,
        letter: { ...letter, fontSize: font * 0.85 },
      };
    }
    default:
      return assertNever(line);
  }
}

/** Line badge: color + shape + letter, so color is never the only signal. Decorative. */
export function LineRoundel({ line, letter, size = 'md', surface = 'default' }: LineRoundelProps) {
  const theme = useTheme();
  const { box, font } = SIZES[size];
  const pair = theme.color.line[line];
  const plateColor = theme.color.sign.roundelPlate;
  const layout = useMemo(() => {
    const base = layoutFor(line, box, font, pair.bg);
    const plateSize = box + PLATE_INSET * 2;
    return {
      ...base,
      letter: { ...base.letter, color: pair.fg },
      plate: {
        width: plateSize,
        height: plateSize,
        borderRadius: plateSize / 2,
        backgroundColor: plateColor,
        alignItems: 'center',
        justifyContent: 'center',
      } satisfies ViewStyle,
    };
  }, [line, box, font, pair, plateColor]);
  const roundel = (
    <View style={layout.box}>
      {layout.clip === null ? (
        <View style={layout.shape} />
      ) : (
        <View style={layout.clip}>
          <View style={layout.shape} />
        </View>
      )}
      <RNText style={layout.letter} allowFontScaling={false}>
        {letter}
      </RNText>
    </View>
  );
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {surface === 'sign' ? <View style={layout.plate}>{roundel}</View> : roundel}
    </View>
  );
}
