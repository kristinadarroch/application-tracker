import { Text as RNText, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Text is always shown; tone color is never the only signal. */
  label: string;
}

const useStyles = makeStyles((t) => ({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: t.radius.pill,
    paddingHorizontal: t.space[2],
    paddingVertical: t.space[1] / 2,
  },
  label: t.type.caption,
  neutral: { backgroundColor: t.color.stage.saved.bg },
  info: { backgroundColor: t.color.feedback.info.bg },
  success: { backgroundColor: t.color.feedback.success.bg },
  warning: { backgroundColor: t.color.feedback.warning.bg },
  danger: { backgroundColor: t.color.feedback.danger.bg },
  neutralFg: { color: t.color.stage.saved.fg },
  infoFg: { color: t.color.feedback.info.fg },
  successFg: { color: t.color.feedback.success.fg },
  warningFg: { color: t.color.feedback.warning.fg },
  dangerFg: { color: t.color.feedback.danger.fg },
}));

export function Badge({ tone = 'neutral', label }: BadgeProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={[styles.badge, styles[tone]]}>
      <RNText
        style={[styles.label, styles[`${tone}Fg`]]}
        maxFontSizeMultiplier={theme.maxFontSizeMultiplier.caption}
      >
        {label}
      </RNText>
    </View>
  );
}
