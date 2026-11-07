import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { Hatch } from './Hatch';

/**
 * `surface` flat white card on the platform gray · `sign` dark sign panel ·
 * `proposal` hatched fill with a dashed border (AI output not yet saved).
 */
export type CardVariant = 'surface' | 'sign' | 'proposal';

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
  sign: { backgroundColor: t.color.sign.bg },
  signPressed: { opacity: 0.85 },
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
      <View style={[styles.base, styles[variant]]} {...a11y}>
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
