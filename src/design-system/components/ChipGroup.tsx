import { createContext, useContext, type ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { Text } from './Text';

export interface ChipGroupProps {
  /** Visible group label, also the group's accessible name, e.g. "Stage" or "Due". */
  label: string;
  /** Marks the group as required: a visible "Required" next to the label and ", required" in its name. */
  required?: boolean;
  /** `overline` for short names ("Stage", "Due"); `bodyStrong` when the label is a question. */
  labelVariant?: 'overline' | 'bodyStrong';
  /** `Chip`s; at most one is selected at a time. */
  children: ReactNode;
}

/** Accessible name of the enclosing `ChipGroup`, or null outside one. */
const ChipGroupNameContext = createContext<string | null>(null);

/** The accessible name of the single-select group a `Chip` sits in, or null outside a `ChipGroup`. */
export function useChipGroupName(): string | null {
  return useContext(ChipGroupNameContext);
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.space[2] },
  labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[1] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
}));

/**
 * A labelled single-choice row of `Chip`s (WCAG 1.3.1); each chip inside is a radio with `checked`.
 *
 * Android: the container is a focusable radio group named after the label (TalkBack says
 * "Stage, radio group"), so the visible label is hidden to avoid reading it twice.
 * iOS: there is no radio group trait, and an accessible container would hide its chips from
 * VoiceOver, so the label stays readable text and each chip carries the group name in its hint.
 */
export function ChipGroup({
  label,
  required = false,
  labelVariant = 'overline',
  children,
}: ChipGroupProps) {
  const styles = useStyles();
  const name = required ? `${label}, required` : label;
  const isAndroid = Platform.OS === 'android';
  return (
    <View style={styles.wrap}>
      <View
        style={styles.labelRow}
        {...(isAndroid ? { importantForAccessibility: 'no-hide-descendants' as const } : {})}
      >
        <Text variant={labelVariant} color={labelVariant === 'overline' ? 'secondary' : 'primary'}>
          {label}
        </Text>
        {required ? (
          <Text variant={labelVariant} color="secondary">
            · Required
          </Text>
        ) : null}
      </View>
      <View
        accessible={isAndroid}
        accessibilityRole="radiogroup"
        accessibilityLabel={name}
        style={styles.chips}
      >
        <ChipGroupNameContext.Provider value={name}>{children}</ChipGroupNameContext.Provider>
      </View>
    </View>
  );
}
