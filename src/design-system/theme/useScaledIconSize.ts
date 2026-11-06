import { useWindowDimensions } from 'react-native';

import { maxFontSizeMultiplier, type TypographyVariant } from '../tokens/typography';

/** Icons stop growing here so they stay recognisable beside very large text. */
const MAX_ICON_SCALE = 2;

/**
 * Size for an icon that sits beside text of `variant`: it follows the user's text size with the
 * same cap as the text, so glyph and label stay in proportion at large Dynamic Type / font scale.
 */
export function useScaledIconSize(baseSize: number, variant: TypographyVariant): number {
  const { fontScale } = useWindowDimensions();
  const textCap = maxFontSizeMultiplier[variant];
  const cap = textCap === 0 ? MAX_ICON_SCALE : Math.min(textCap, MAX_ICON_SCALE);
  return Math.round(baseSize * Math.min(Math.max(fontScale, 1), cap));
}
