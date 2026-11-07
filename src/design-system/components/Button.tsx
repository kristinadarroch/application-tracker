import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text as RNText, View } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/theme';
import { fontFamily } from '../tokens/typography';
import type { IconName } from './icons';

/**
 * `primary` ink pill · `secondary` 2px outline pill · `ghost` underlined link text ·
 * `destructive` danger outline pill · `onPanel` white pill for dark panels.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'onPanel';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label. */
  icon?: IconName;
  /** Icon after the label ("View →"). */
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

const LARGE_HEIGHT = 50;

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: t.size.minTouchTarget,
    minWidth: t.size.minTouchTarget,
    // Never wider than its container: at large text sizes the label wraps instead of clipping.
    maxWidth: '100%',
    flexShrink: 1,
    borderRadius: t.radius.pill,
    borderWidth: 2,
    paddingHorizontal: t.space[4],
  },
  md: { minHeight: t.size.minTouchTarget, paddingVertical: t.space[2] },
  lg: {
    minHeight: Math.max(LARGE_HEIGHT, t.size.minTouchTarget),
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[5],
  },
  primary: { backgroundColor: t.color.action.primary.bg, borderColor: t.color.action.primary.bg },
  primaryPressed: {
    backgroundColor: t.color.action.primary.bgPressed,
    borderColor: t.color.action.primary.bgPressed,
  },
  secondary: { backgroundColor: t.color.bg.surface, borderColor: t.color.border.strong },
  secondaryPressed: { backgroundColor: t.color.bg.subtle },
  ghost: { borderWidth: 0, paddingHorizontal: t.space[2] },
  ghostPressed: { opacity: 0.7 },
  destructive: { backgroundColor: t.color.bg.surface, borderColor: t.color.feedback.danger.fg },
  destructivePressed: { backgroundColor: t.color.feedback.danger.bg },
  onPanel: { backgroundColor: t.color.panel.fg, borderColor: t.color.panel.fg },
  onPanelPressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: {
    ...t.type.bodyStrong,
    fontFamily: fontFamily.extrabold,
    flexShrink: 1,
    textAlign: 'center',
  },
  primaryLabel: { color: t.color.action.primary.fg },
  secondaryLabel: { color: t.color.text.primary },
  ghostLabel: { color: t.color.text.link, textDecorationLine: 'underline' },
  destructiveLabel: { color: t.color.feedback.danger.fg },
  onPanelLabel: { color: t.color.panel.bg },
  content: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], flexShrink: 1 },
  hidden: { opacity: 0 },
  spinner: { position: 'absolute' },
}));

function foregroundColor(theme: Theme, variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return theme.color.action.primary.fg;
    case 'secondary':
      return theme.color.text.primary;
    case 'ghost':
      return theme.color.text.link;
    case 'destructive':
      return theme.color.feedback.danger.fg;
    case 'onPanel':
      return theme.color.panel.bg;
    default:
      return assertNever(variant);
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  loading = false,
  disabled = false,
  accessibilityHint,
}: ButtonProps) {
  const styles = useStyles();
  const theme = useTheme();
  const fg = foregroundColor(theme, variant);
  const iconSize = useScaledIconSize(18, 'bodyStrong');
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && !inactive ? styles[`${variant}Pressed`] : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={[styles.content, loading ? styles.hidden : null]}>
        {icon !== undefined ? <Ionicons name={icon} size={iconSize} color={fg} /> : null}
        <RNText
          style={[styles.label, styles[`${variant}Label`]]}
          maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodyStrong}
        >
          {label}
        </RNText>
        {trailingIcon !== undefined ? (
          <Ionicons name={trailingIcon} size={iconSize} color={fg} />
        ) : null}
      </View>
      {loading ? <ActivityIndicator style={styles.spinner} color={fg} /> : null}
    </Pressable>
  );
}
