import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text as RNText, View } from 'react-native';

import { assertNever } from '@/lib/assertNever';

import { useAnnounce } from '../a11y/useAnnounce';
import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
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
    borderRadius: t.radius.sm,
    borderLeftWidth: 4,
    backgroundColor: t.color.bg.surface,
  },
  icon: { paddingTop: t.space[1] / 2 },
  content: { flex: 1, gap: t.space[1] },
  title: { ...t.type.bodyStrong, color: t.color.text.primary },
  body: { ...t.type.bodySmall, color: t.color.text.secondary },
  action: { alignSelf: 'flex-start', marginTop: t.space[2] },
  neutral: { borderLeftColor: t.color.border.strong },
  info: { borderLeftColor: t.color.feedback.info.fg },
  success: { borderLeftColor: t.color.feedback.success.fg },
  warning: { borderLeftColor: t.color.feedback.warning.fg },
  danger: { borderLeftColor: t.color.feedback.danger.fg },
}));

/** Tones that report an outcome or a problem, so they're announced as soon as they appear. */
const ANNOUNCED_ON_MOUNT: ReadonlySet<BannerTone> = new Set(['success', 'warning', 'danger']);

/**
 * Inline status message; never moves focus. `success`, `warning`, and `danger` banners are
 * announced when they appear; any banner is announced when its title changes. Static `info` and
 * `neutral` banners stay quiet on mount so they aren't re-read every time a screen opens.
 */
export function Banner({ tone, title, body, action }: BannerProps) {
  const styles = useStyles();
  const theme = useTheme();
  const iconSize = useScaledIconSize(20, 'bodyStrong');

  const [initialTitle] = useState(title);
  const [titleChanged, setTitleChanged] = useState(false);
  // Adjusting state during render (React's "storing information from previous renders" pattern).
  if (title !== initialTitle && !titleChanged) setTitleChanged(true);
  const announced = ANNOUNCED_ON_MOUNT.has(tone) || titleChanged || title !== initialTitle;
  useAnnounce(announced ? title : undefined);

  return (
    <View style={[styles.banner, styles[tone]]}>
      <View
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name={TONE_ICONS[tone]} size={iconSize} color={iconColor(theme, tone)} />
      </View>
      <View style={styles.content}>
        <RNText
          style={styles.title}
          maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodyStrong}
          // Role on the title (an accessible element) so the action button stays reachable.
          accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
          accessibilityLiveRegion={announced ? 'polite' : 'none'}
        >
          {title}
        </RNText>
        {body !== undefined ? (
          <RNText style={styles.body} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodySmall}>
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
