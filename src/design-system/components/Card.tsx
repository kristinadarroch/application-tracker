import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  /** Raised cards get `elevation.1`; flat cards use a hairline border. */
  elevated?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const useStyles = makeStyles((t) => ({
  base: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.space[4],
    gap: t.space[2],
    borderWidth: 1,
    borderColor: t.color.border.subtle,
  },
  raised: { ...t.elevation[1] },
  pressed: { backgroundColor: t.color.bg.subtle },
}));

export function Card({
  children,
  onPress,
  elevated = false,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const styles = useStyles();
  const a11y = {
    ...(accessibilityLabel === undefined ? {} : { accessibilityLabel }),
    ...(accessibilityHint === undefined ? {} : { accessibilityHint }),
  };
  if (onPress === undefined) {
    return (
      <View style={[styles.base, elevated ? styles.raised : null]} {...a11y}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        elevated ? styles.raised : null,
        pressed ? styles.pressed : null,
      ]}
      {...a11y}
    >
      {children}
    </Pressable>
  );
}
