import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { AccessibilityInfo, Text as RNText, View } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/theme';
import { Button } from './Button';
import type { IconName } from './icons';

export type BannerTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BannerAction {
  label: string;
  onPress: () => void;
}

export interface BannerProps {
  tone: BannerTone;
  title: string;
  body?: string;
  action?: BannerAction;
}

const TONE_ICONS: Record<BannerTone, IconName> = {
  neutral: 'chatbubble-ellipses-outline',
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  danger: 'alert-circle-outline',
};

function iconColor(theme: Theme, tone: BannerTone): string {
  switch (tone) {
    case 'neutral':
      return theme.color.text.primary;
    case 'info':
    case 'success':
    case 'warning':
    case 'danger':
      return theme.color.feedback[tone].fg;
    default:
      return assertNever(tone);
  }
}

const useStyles = makeStyles((t) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.space[3],
    padding: t.space[4],
    borderRadius: t.radius.md,
  },
  icon: { paddingTop: t.space[1] / 2 },
  content: { flex: 1, gap: t.space[1] },
  title: t.type.bodyStrong,
  body: t.type.bodySmall,
  action: { alignSelf: 'flex-start', marginTop: t.space[2] },
  neutral: { backgroundColor: t.color.bg.subtle },
  info: { backgroundColor: t.color.feedback.info.bg },
  success: { backgroundColor: t.color.feedback.success.bg },
  warning: { backgroundColor: t.color.feedback.warning.bg },
  danger: { backgroundColor: t.color.feedback.danger.bg },
  neutralFg: { color: t.color.text.primary },
  infoFg: { color: t.color.feedback.info.fg },
  successFg: { color: t.color.feedback.success.fg },
  warningFg: { color: t.color.feedback.warning.fg },
  dangerFg: { color: t.color.feedback.danger.fg },
}));

/** Inline status message. Announced politely on mount and whenever the title changes; never moves focus. */
export function Banner({ tone, title, body, action }: BannerProps) {
  const styles = useStyles();
  const theme = useTheme();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(title);
  }, [title]);

  return (
    <View style={[styles.banner, styles[tone]]}>
      <View
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name={TONE_ICONS[tone]} size={20} color={iconColor(theme, tone)} />
      </View>
      <View style={styles.content}>
        <RNText
          style={[styles.title, styles[`${tone}Fg`]]}
          maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodyStrong}
          // Role on the title (an accessible element) so the action button stays reachable.
          accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
        >
          {title}
        </RNText>
        {body !== undefined ? (
          <RNText
            style={[styles.body, styles[`${tone}Fg`]]}
            maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodySmall}
          >
            {body}
          </RNText>
        ) : null}
        {action !== undefined ? (
          <View style={styles.action}>
            <Button label={action.label} variant="secondary" onPress={action.onPress} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
