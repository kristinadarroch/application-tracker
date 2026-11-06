import { Ionicons } from '@expo/vector-icons';
import { Text as RNText, View } from 'react-native';

import { STAGE_LABELS, type Stage } from '@/lib/stage';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import { STAGE_ICONS } from './icons';

export interface StagePillProps {
  stage: Stage;
}

const useStyles = makeStyles((t) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.space[1],
    borderRadius: t.radius.pill,
    paddingHorizontal: t.space[2],
    paddingVertical: t.space[1],
  },
  label: t.type.caption,
  saved: { backgroundColor: t.color.stage.saved.bg },
  applied: { backgroundColor: t.color.stage.applied.bg },
  interviewing: { backgroundColor: t.color.stage.interviewing.bg },
  offer: { backgroundColor: t.color.stage.offer.bg },
  rejected: { backgroundColor: t.color.stage.rejected.bg },
  withdrawn: { backgroundColor: t.color.stage.withdrawn.bg },
  savedFg: { color: t.color.stage.saved.fg },
  appliedFg: { color: t.color.stage.applied.fg },
  interviewingFg: { color: t.color.stage.interviewing.fg },
  offerFg: { color: t.color.stage.offer.fg },
  rejectedFg: { color: t.color.stage.rejected.fg },
  withdrawnFg: { color: t.color.stage.withdrawn.fg },
}));

/** Label + icon + color, so color is never the only signal. */
export function StagePill({ stage }: StagePillProps) {
  const styles = useStyles();
  const theme = useTheme();
  const label = STAGE_LABELS[stage];
  const iconSize = useScaledIconSize(14, 'caption');
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Stage: ${label}`}
      style={[styles.pill, styles[stage]]}
    >
      <Ionicons name={STAGE_ICONS[stage]} size={iconSize} color={theme.color.stage[stage].fg} />
      <RNText
        style={[styles.label, styles[`${stage}Fg`]]}
        maxFontSizeMultiplier={theme.maxFontSizeMultiplier.caption}
      >
        {label}
      </RNText>
    </View>
  );
}
