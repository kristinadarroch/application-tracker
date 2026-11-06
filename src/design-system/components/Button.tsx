import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text as RNText, View } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/theme';
import type { IconName } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[2],
    minHeight: t.size.minTouchTarget,
    minWidth: t.size.minTouchTarget,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border.strong,
    paddingHorizontal: t.space[4],
  },
  md: { minHeight: t.size.minTouchTarget, paddingVertical: t.space[2] },
  lg: { minHeight: 52, paddingVertical: t.space[3], paddingHorizontal: t.space[5] },
  primary: { backgroundColor: t.color.action.primary.bg, borderColor: t.color.action.primary.bg },
  primaryPressed: {
    backgroundColor: t.color.action.primary.bgPressed,
    borderColor: t.color.action.primary.bgPressed,
  },
  secondary: { backgroundColor: t.color.bg.surface },
  secondaryPressed: { backgroundColor: t.color.bg.subtle },
  ghost: { borderWidth: 0 },
  ghostPressed: { backgroundColor: t.color.bg.subtle },
  destructive: {
    backgroundColor: t.color.feedback.danger.bg,
    borderColor: t.color.feedback.danger.fg,
  },
  destructivePressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  label: t.type.bodyStrong,
  primaryLabel: { color: t.color.action.primary.fg },
  secondaryLabel: { color: t.color.text.primary },
  ghostLabel: { color: t.color.text.link },
  destructiveLabel: { color: t.color.feedback.danger.fg },
  content: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
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
  loading = false,
  disabled = false,
  accessibilityHint,
}: ButtonProps) {
  const styles = useStyles();
  const theme = useTheme();
  const fg = foregroundColor(theme, variant);
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
        {icon !== undefined ? <Ionicons name={icon} size={18} color={fg} /> : null}
        <RNText
          style={[styles.label, styles[`${variant}Label`]]}
          maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodyStrong}
        >
          {label}
        </RNText>
      </View>
      {loading ? <ActivityIndicator style={styles.spinner} color={fg} /> : null}
    </Pressable>
  );
}
