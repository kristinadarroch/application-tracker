import { useMemo, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import type { SpaceToken } from '../tokens/spacing';
import { useTheme } from '../theme/useTheme';

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export interface StackProps {
  direction?: StackDirection;
  gap?: SpaceToken;
  padding?: SpaceToken;
  align?: StackAlign;
  justify?: StackJustify;
  flex?: number;
  wrap?: 'wrap' | 'nowrap';
  children: ReactNode;
}

const ALIGN: Record<StackAlign, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY: Record<StackJustify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
};

/** Layout only: no colors, borders, or shadows. */
export function Stack({
  direction = 'column',
  gap = 0,
  padding = 0,
  align = 'stretch',
  justify = 'start',
  flex,
  wrap = 'nowrap',
  children,
}: StackProps) {
  const { space } = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      flexDirection: direction,
      gap: space[gap],
      padding: space[padding],
      alignItems: ALIGN[align],
      justifyContent: JUSTIFY[justify],
      flexWrap: wrap,
      ...(flex === undefined ? {} : { flex }),
    }),
    [direction, gap, padding, align, justify, wrap, flex, space],
  );
  return <View style={style}>{children}</View>;
}
