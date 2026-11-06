export type TypographyVariant =
  'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'bodySmall' | 'caption';

interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
}

/** System fonts only; no `fontFamily` so the platform default is used. */
export const typography: Record<TypographyVariant, TypeStyle> = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
};

/** Dynamic Type cap per variant. `0` means uncapped (React Native convention). */
export const maxFontSizeMultiplier: Record<TypographyVariant, number> = {
  display: 1.6,
  title: 1.6,
  heading: 0,
  body: 0,
  bodyStrong: 0,
  bodySmall: 0,
  caption: 1.6,
};
