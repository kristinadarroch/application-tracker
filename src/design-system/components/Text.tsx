import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import type { TypographyVariant } from '../tokens/typography';
import { useTheme } from '../theme/useTheme';

/** Text colors; `onSign*` are for text drawn on dark sign panels. */
export type TextColor =
  'primary' | 'secondary' | 'tertiary' | 'inverse' | 'link' | 'onSign' | 'onSignSecondary';
export type TextAlign = 'left' | 'center' | 'right';

export interface TextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextAlign;
  numberOfLines?: number;
  children: ReactNode;
}

const useStyles = makeStyles((t) => ({
  ...t.type,
  primary: { color: t.color.text.primary },
  secondary: { color: t.color.text.secondary },
  tertiary: { color: t.color.text.tertiary },
  inverse: { color: t.color.text.inverse },
  link: { color: t.color.text.link },
  onSign: { color: t.color.sign.fg },
  onSignSecondary: { color: t.color.sign.fgSecondary },
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
}));

/** Header role for sign, screen, and section titles so screen readers can jump between them. */
const HEADER_VARIANTS: readonly TypographyVariant[] = ['display', 'title', 'heading'];

export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  numberOfLines,
  children,
}: TextProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <RNText
      style={[styles[variant], styles[color], styles[align]]}
      maxFontSizeMultiplier={theme.maxFontSizeMultiplier[variant]}
      accessibilityRole={HEADER_VARIANTS.includes(variant) ? 'header' : 'text'}
      {...(numberOfLines === undefined ? {} : { numberOfLines })}
    >
      {children}
    </RNText>
  );
}
