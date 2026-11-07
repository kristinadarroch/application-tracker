import { Ionicons } from '@expo/vector-icons';
import { Text as RNText, View } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { makeStyles } from '../theme/makeStyles';
import type { Theme } from '../theme/theme';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import type { IconName } from './icons';

/** `urgent` is highlight yellow with ink mono text: due within 48 hours or overdue. */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'urgent';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Text is always shown; tone color is never the only signal. */
  label: string;
  /** Leading icon. `urgent` shows a clock unless another icon is given. */
  icon?: IconName;
}

const useStyles = makeStyles((t) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.space[1],
    borderRadius: t.radius.sm,
    paddingHorizontal: t.space[2],
    paddingTop: 3,
    paddingBottom: 1,
  },
  urgentBadge: {
    gap: 6,
    paddingLeft: t.space[2],
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 3,
  },
  label: { ...t.type.caption, flexShrink: 1 },
  urgentLabel: { ...t.type.mono, flexShrink: 1 },
  neutral: { backgroundColor: t.color.bg.subtle },
  info: { backgroundColor: t.color.feedback.info.bg },
  success: { backgroundColor: t.color.feedback.success.bg },
  warning: { backgroundColor: t.color.feedback.warning.bg },
  danger: { backgroundColor: t.color.feedback.danger.bg },
  urgent: { backgroundColor: t.color.urgent.bg },
  neutralFg: { color: t.color.text.primary },
  infoFg: { color: t.color.feedback.info.fg },
  successFg: { color: t.color.feedback.success.fg },
  warningFg: { color: t.color.feedback.warning.fg },
  dangerFg: { color: t.color.feedback.danger.fg },
  urgentFg: { color: t.color.urgent.fg },
}));

function foregroundColor(theme: Theme, tone: BadgeTone): string {
  switch (tone) {
    case 'neutral':
      return theme.color.text.primary;
    case 'info':
    case 'success':
    case 'warning':
    case 'danger':
      return theme.color.feedback[tone].fg;
    case 'urgent':
      return theme.color.urgent.fg;
    default:
      return assertNever(tone);
  }
}

export function Badge({ tone = 'neutral', label, icon }: BadgeProps) {
  const styles = useStyles();
  const theme = useTheme();
  const urgent = tone === 'urgent';
  const variant = urgent ? 'mono' : 'caption';
  const iconSize = useScaledIconSize(14, variant);
  const iconName = icon ?? (urgent ? 'time-outline' : undefined);
  return (
    <View style={[styles.badge, urgent ? styles.urgentBadge : null, styles[tone]]}>
      {iconName !== undefined ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name={iconName} size={iconSize} color={foregroundColor(theme, tone)} />
        </View>
      ) : null}
      <RNText
        style={[urgent ? styles.urgentLabel : styles.label, styles[`${tone}Fg`]]}
        maxFontSizeMultiplier={theme.maxFontSizeMultiplier[variant]}
      >
        {label}
      </RNText>
    </View>
  );
}
