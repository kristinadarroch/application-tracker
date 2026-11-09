import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Text as RNText } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import { fontFamily } from '../tokens/typography';
import { useChipGroupName } from './ChipGroup';
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
    // Never wider than its row: at large text sizes the label wraps instead of clipping.
    maxWidth: '100%',
    flexShrink: 1,
    gap: t.space[1],
    minHeight: t.size.minTouchTarget,
    paddingHorizontal: t.space[3],
    borderRadius: t.radius.pill,
    borderWidth: 2,
    borderColor: t.color.border.subtle,
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
  label: {
    ...t.type.bodySmall,
    fontFamily: fontFamily.bold,
    color: t.color.text.primary,
    flexShrink: 1,
  },
  selectedLabel: {
    ...t.type.bodySmall,
    fontFamily: fontFamily.extrabold,
    color: t.color.action.primary.fg,
    flexShrink: 1,
  },
}));

/**
 * Single toggle used for stage pickers, filters, and due-date quick picks. Inside a `ChipGroup`
 * it is a radio (`checked`); on its own it is a button (`selected`).
 */
export function Chip({ label, selected = false, onPress, icon, accessibilityHint }: ChipProps) {
  const styles = useStyles();
  const theme = useTheme();
  const groupName = useChipGroupName();
  const fg = selected ? theme.color.action.primary.fg : theme.color.text.primary;
  const iconSize = useScaledIconSize(16, 'bodySmall');
  // A checkmark marks selection without relying on color alone when no icon is given.
  const iconName = icon ?? (selected ? 'checkmark' : undefined);
  // iOS has no radio group trait, so VoiceOver hears the group name in each chip's hint.
  const hint =
    groupName !== null && Platform.OS === 'ios'
      ? [groupName, accessibilityHint].filter((part) => part !== undefined).join('. ')
      : accessibilityHint;
  return (
    <Pressable
      accessibilityRole={groupName === null ? 'button' : 'radio'}
      accessibilityLabel={label}
      {...(hint === undefined ? {} : { accessibilityHint: hint })}
      accessibilityState={groupName === null ? { selected } : { checked: selected }}
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
