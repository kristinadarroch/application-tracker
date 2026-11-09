import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { Hatch } from './Hatch';

/**
 * `surface` flat white card on the paper gray · `panel` dark panel ·
 * `proposal` hatched fill with a dashed border (AI output not yet saved).
 */
export type CardVariant = 'surface' | 'panel' | 'proposal';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radius.lg,
    padding: t.space[4],
    gap: t.space[2],
  },
  surface: { backgroundColor: t.color.bg.surface },
  surfacePressed: { backgroundColor: t.color.bg.subtle },
  panel: { backgroundColor: t.color.panel.bg },
  panelPressed: { opacity: 0.85 },
  proposal: {
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: t.color.proposal.border,
    padding: t.space[3],
  },
  proposalPressed: { opacity: 0.85 },
}));

export function Card({
  children,
  onPress,
  variant = 'surface',
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const styles = useStyles();
  const a11y = {
    ...(accessibilityLabel === undefined ? {} : { accessibilityLabel }),
    ...(accessibilityHint === undefined ? {} : { accessibilityHint }),
  };
  const content = (
    <>
      {variant === 'proposal' ? <Hatch /> : null}
      {children}
    </>
  );
  if (onPress === undefined) {
    return (
      // `accessible` groups the card so iOS uses its label; without a label, children stay reachable.
      <View
        style={[styles.base, styles[variant]]}
        accessible={accessibilityLabel !== undefined}
        {...a11y}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed ? styles[`${variant}Pressed`] : null,
      ]}
      {...a11y}
    >
      {content}
    </Pressable>
  );
}
