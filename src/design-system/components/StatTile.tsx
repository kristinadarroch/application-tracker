import { Ionicons } from '@expo/vector-icons';
import { Text as RNText, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import { fontFamily } from '../tokens/typography';
import type { IconName } from './icons';

export interface StatTileProps {
  icon: IconName;
  /** The big number, e.g. "3". */
  value: string;
  /** Caption under it, e.g. "sent this week". */
  label: string;
}

const useStyles = makeStyles((t) => ({
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: t.space[3],
    borderRadius: t.radius.lg,
    backgroundColor: t.color.bg.surface,
  },
  text: { flex: 1 },
  value: { ...t.type.feature, fontFamily: fontFamily.black, color: t.color.text.primary },
  label: { ...t.type.caption, color: t.color.text.secondary },
}));

/** Big number + caption on a card; read as one phrase, "3 sent this week". */
export function StatTile({ icon, value, label }: StatTileProps) {
  const styles = useStyles();
  const theme = useTheme();
  const iconSize = useScaledIconSize(22, 'feature');
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={iconSize} color={theme.color.text.primary} />
      <View style={styles.text}>
        <RNText style={styles.value} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.feature}>
          {value}
        </RNText>
        <RNText style={styles.label} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.caption}>
          {label}
        </RNText>
      </View>
    </View>
  );
}
