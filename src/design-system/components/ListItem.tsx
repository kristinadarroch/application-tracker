import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Decorative content before the text (icon, avatar). Hidden from screen readers. */
  leading?: ReactNode;
  /** Content after the text (badge, pill). Replaces the chevron when the row is pressable. */
  trailing?: ReactNode;
  /** Makes the whole row one button. */
  onPress?: () => void;
  accessibilityHint?: string;
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    minHeight: t.size.minTouchTarget,
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[4],
    backgroundColor: t.color.bg.surface,
  },
  pressed: { backgroundColor: t.color.bg.subtle },
  text: { flex: 1, gap: t.space[1] / 2 },
  title: { ...t.type.bodyStrong, color: t.color.text.primary },
  subtitle: { ...t.type.bodySmall, color: t.color.text.secondary },
}));

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  accessibilityHint,
}: ListItemProps) {
  const styles = useStyles();
  const theme = useTheme();
  const accessibilityLabel = subtitle === undefined ? title : `${title}, ${subtitle}`;
  const hint = accessibilityHint === undefined ? {} : { accessibilityHint };

  const content = (
    <>
      {leading !== undefined ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {leading}
        </View>
      ) : null}
      <View style={styles.text}>
        <RNText style={styles.title} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodyStrong}>
          {title}
        </RNText>
        {subtitle !== undefined ? (
          <RNText
            style={styles.subtitle}
            maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodySmall}
          >
            {subtitle}
          </RNText>
        ) : null}
      </View>
      {trailing ??
        (onPress !== undefined ? (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.color.text.tertiary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null)}
    </>
  );

  if (onPress === undefined) {
    return (
      <View style={styles.row} accessible accessibilityLabel={accessibilityLabel} {...hint}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...hint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}
