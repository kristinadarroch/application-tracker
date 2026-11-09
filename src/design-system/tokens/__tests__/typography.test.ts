import { maxFontSizeMultiplier, typography, type TypographyVariant } from '../typography';

/**
 * WCAG 1.4.4 for native apps (WCAG2ICT 1.4.4, Note 3): text reaches 200%, except text that is
 * already 200% of body size, which follows the platform as far as it goes, provided the
 * meaning carried by size differences is kept.
 * https://www.w3.org/TR/wcag2ict-22/#applying-sc-1-4-4-resize-text-to-non-web-software
 */
const bodySize = typography.body.fontSize ?? 0;
const variants = Object.keys(typography) as TypographyVariant[];
const sizeOf = (variant: TypographyVariant) => typography[variant].fontSize ?? 0;

/** Rendered size at a system font scale, as React Native applies `maxFontSizeMultiplier`. */
function renderedSize(variant: TypographyVariant, fontScale: number): number {
  const cap = maxFontSizeMultiplier[variant];
  return sizeOf(variant) * (cap === 0 ? fontScale : Math.min(fontScale, cap));
}

/** Android's largest setting is 2.0; iOS AX5 scales body text about 3.1×. */
const FONT_SCALES = [1, 1.5, 2, 2.5, 3.2];

describe('Dynamic Type caps (WCAG 1.4.4)', () => {
  it.each(variants)('%s reaches 200%, or already starts at body text at 200%', (variant) => {
    const cap = maxFontSizeMultiplier[variant];
    expect(cap === 0 || cap >= 2 || sizeOf(variant) >= bodySize * 2).toBe(true);
  });

  it.each(FONT_SCALES)('keeps larger styles at least as large at font scale %s', (fontScale) => {
    for (const larger of variants) {
      for (const smaller of variants) {
        if (sizeOf(larger) <= sizeOf(smaller)) continue;
        expect({
          larger,
          smaller,
          ok: renderedSize(larger, fontScale) >= renderedSize(smaller, fontScale),
        }).toEqual({
          larger,
          smaller,
          ok: true,
        });
      }
    }
  });
});
