import type { TextStyle } from 'react-native';

/**
 * Overpass (open source) for display and body; Overpass Mono for dates, codes, and short
 * labels. Custom fonts carry their weight in the family name, so no `fontWeight` is set.
 * Families are loaded in `src/app/_layout.tsx` (`APP_FONTS`).
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
  | 'feature'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'bodySmall'
  | 'caption'
  | 'overline'
  | 'mono';

type TypeStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'
>;

export const typography: Record<TypographyVariant, TypeStyle> = {
  /** Panel titles on tab roots ("Today") and empty-state heroes. */
  display: { fontFamily: fontFamily.black, fontSize: 34, lineHeight: 40 },
  /** Screen titles ("Acme Health"). */
  title: { fontFamily: fontFamily.black, fontSize: 28, lineHeight: 34 },
  /** The next step and other single most-important lines ("Book the onsite"). */
  feature: { fontFamily: fontFamily.extrabold, fontSize: 22, lineHeight: 28 },
  /** Card titles and section headers. */
  heading: { fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 22 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  /** Stage names and section eyebrows: SAVED · APPLIED · INTERVIEW. */
  overline: {
    fontFamily: fontFamily.extrabold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  /** Monospace labels: DUE TOMORROW · SAT 7 NOV. */
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
};

/**
 * Dynamic Type cap per variant. `0` means uncapped (React Native convention).
 * WCAG 1.4.4 (WCAG2ICT Note 3): every variant reaches 200%, except `display`, which already
 * starts above body text at 200%. Caps follow iOS's own heading ramp at the largest sizes
 * (Large Title ≈ 1.8×, Title 1 ≈ 2.1×) so headings stay larger than body text at every size;
 * small variants stop at 2× to protect pill and tab layouts. Tested in
 * `__tests__/typography.test.ts`.
 */
export const maxFontSizeMultiplier: Record<TypographyVariant, number> = {
  display: 1.8,
  title: 2.1,
  feature: 2.65,
  heading: 0,
  body: 0,
  bodyStrong: 0,
  bodySmall: 0,
  caption: 2,
  overline: 2,
  mono: 2,
};
