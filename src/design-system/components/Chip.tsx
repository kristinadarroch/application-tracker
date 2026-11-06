import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text as RNText } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import type { IconName } from './icons';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  accessibilityHint?: string;
}

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.space[1],
    minHeight: t.size.minTouchTarget,
    paddingHorizontal: t.space[3],
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.border.strong,
    backgroundColor: t.color.bg.surface,
  },
  pressed: { backgroundColor: t.color.bg.subtle },
  selected: {
    backgroundColor: t.color.action.primary.bg,
    borderColor: t.color.action.primary.bg,
  },
  selectedPressed: {
    backgroundColor: t.color.action.primary.bgPressed,
    borderColor: t.color.action.primary.bgPressed,
  },
  label: { ...t.type.bodySmall, color: t.color.text.primary },
  selectedLabel: { ...t.type.bodySmall, fontWeight: '600', color: t.color.action.primary.fg },
}));

/** Single toggle used for stage pickers, filters, and due-date quick picks. */
export function Chip({ label, selected = false, onPress, icon, accessibilityHint }: ChipProps) {
  const styles = useStyles();
  const theme = useTheme();
  const fg = selected ? theme.color.action.primary.fg : theme.color.text.primary;
  const iconSize = useScaledIconSize(16, 'bodySmall');
  // A checkmark marks selection without relying on color alone when no icon is given.
  const iconName = icon ?? (selected ? 'checkmark' : undefined);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : null,
        pressed ? (selected ? styles.selectedPressed : styles.pressed) : null,
      ]}
    >
      {iconName !== undefined ? <Ionicons name={iconName} size={iconSize} color={fg} /> : null}
      <RNText
        style={selected ? styles.selectedLabel : styles.label}
        maxFontSizeMultiplier={theme.maxFontSizeMultiplier.bodySmall}
      >
        {label}
      </RNText>
    </Pressable>
  );
}
