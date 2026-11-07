import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { makeStyles } from '../theme/makeStyles';
import type { Theme } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import type { IconName } from './icons';

/**
 * Always round. `primary` ink circle · `secondary` surface circle with a hairline ·
 * `ghost` bare glyph · `onPanel` outlined circle for dark panels.
 */
export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onPanel';

export interface IconButtonProps {
  icon: IconName;
  /** Required: icon-only controls have no visible text for screen readers. */
  accessibilityLabel: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  accessibilityHint?: string;
}

const ICON_SIZE = 20;

const useStyles = makeStyles((t) => ({
  base: {
    width: t.size.minTouchTarget,
    height: t.size.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.pill,
  },
  primary: { backgroundColor: t.color.action.primary.bg },
  primaryPressed: { backgroundColor: t.color.action.primary.bgPressed },
  secondary: {
    backgroundColor: t.color.bg.surface,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
  },
  secondaryPressed: { backgroundColor: t.color.bg.subtle },
  ghost: {},
  ghostPressed: { backgroundColor: t.color.bg.subtle },
  onPanel: { borderWidth: 2, borderColor: t.color.panel.fg },
  onPanelPressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
}));

function foregroundColor(theme: Theme, variant: IconButtonVariant): string {
  switch (variant) {
    case 'primary':
      return theme.color.action.primary.fg;
    case 'secondary':
    case 'ghost':
      return theme.color.text.primary;
    case 'onPanel':
      return theme.color.panel.fg;
    default:
      return assertNever(variant);
  }
}

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
      <Ionicons name={icon} size={ICON_SIZE} color={foregroundColor(theme, variant)} />
    </Pressable>
  );
}
