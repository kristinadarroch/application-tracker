import { Ionicons } from '@expo/vector-icons';
import { Text as RNText, View } from 'react-native';

import { STAGE_LABELS, type Stage } from '@/lib/stage';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import { fontFamily } from '../tokens/typography';
import { STAGE_ICONS } from './icons';
import { StationMarker } from './StationMarker';

export interface StagePillProps {
  stage: Stage;
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.space[1],
  },
  label: { ...t.type.caption, fontFamily: fontFamily.extrabold, color: t.color.text.primary },
}));

/** Station label: station shape + stage icon + stage word, monochrome. */
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
      style={styles.row}
    >
      <StationMarker stage={stage} state="current" />
      <Ionicons name={STAGE_ICONS[stage]} size={iconSize} color={theme.color.text.primary} />
      <RNText style={styles.label} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.caption}>
        {label}
      </RNText>
    </View>
  );
}
