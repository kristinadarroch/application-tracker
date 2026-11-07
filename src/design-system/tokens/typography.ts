import type { TextStyle } from 'react-native';

/**
 * Overpass (the U.S. highway-sign face, open source) for display and body; Overpass Mono for
 * boards, dates, and codes. Custom fonts carry their weight in the family name, so no
 * `fontWeight` is set. Families are loaded in `src/app/_layout.tsx` (`TRANSIT_FONTS`).
 */
export const fontFamily = {
  regular: 'Overpass_400Regular',
  semibold: 'Overpass_600SemiBold',
  bold: 'Overpass_700Bold',
  extrabold: 'Overpass_800ExtraBold',
  black: 'Overpass_900Black',
  mono: 'OverpassMono_700Bold',
} as const;

export type TypographyVariant =
  | 'display'
  | 'title'
  | 'departure'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'bodySmall'
  | 'caption'
  | 'station'
  | 'board';

type TypeStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'
>;

export const typography: Record<TypographyVariant, TypeStyle> = {
  /** Sign titles on tab roots ("Today") and empty-state heroes. */
  display: { fontFamily: fontFamily.black, fontSize: 34, lineHeight: 40 },
  /** Screen titles ("Acme Health"). */
  title: { fontFamily: fontFamily.black, fontSize: 28, lineHeight: 34 },
  /** The next departure and other single most-important lines ("Book the onsite"). */
  departure: { fontFamily: fontFamily.extrabold, fontSize: 22, lineHeight: 28 },
  /** Card titles and section headers. */
  heading: { fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 22 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  /** Station names and section eyebrows: SAVED · APPLIED · INTERVIEW. */
  station: {
    fontFamily: fontFamily.extrabold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  /** Departure-board text: DUE TOMORROW · SAT 7 NOV. */
  board: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
};

/** Dynamic Type cap per variant. `0` means uncapped (React Native convention). */
export const maxFontSizeMultiplier: Record<TypographyVariant, number> = {
  display: 1.6,
  title: 1.6,
  departure: 1.8,
  heading: 0,
  body: 0,
  bodyStrong: 0,
  bodySmall: 0,
  caption: 1.6,
  station: 1.6,
  board: 1.6,
};
