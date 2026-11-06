import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import type { IconName } from './icons';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface IconButtonProps {
  icon: IconName;
  /** Required: icon-only controls have no visible text for screen readers. */
  accessibilityLabel: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  accessibilityHint?: string;
}

const useStyles = makeStyles((t) => ({
  base: {
    width: t.size.minTouchTarget,
    height: t.size.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
  },
  primary: { backgroundColor: t.color.action.primary.bg },
  primaryPressed: { backgroundColor: t.color.action.primary.bgPressed },
  secondary: {
    backgroundColor: t.color.bg.surface,
    borderWidth: 1,
    borderColor: t.color.border.strong,
  },
  secondaryPressed: { backgroundColor: t.color.bg.subtle },
  ghost: {},
  ghostPressed: { backgroundColor: t.color.bg.subtle },
  disabled: { opacity: 0.5 },
}));

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'ghost',
  disabled = false,
  accessibilityHint,
}: IconButtonProps) {
  const styles = useStyles();
  const theme = useTheme();
  let fg: string;
  switch (variant) {
    case 'primary':
      fg = theme.color.action.primary.fg;
      break;
    case 'secondary':
    case 'ghost':
      fg = theme.color.text.primary;
      break;
    default:
      return assertNever(variant);
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles[`${variant}Pressed`] : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Ionicons name={icon} size={22} color={fg} />
    </Pressable>
  );
}
