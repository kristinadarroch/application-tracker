import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { Stage } from '@/lib/stage';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Station icons (B4): stages are shape + icon + word, never color alone. */
export const STAGE_ICONS: Record<Stage, IconName> = {
  saved: 'bookmark-outline',
  applied: 'paper-plane-outline',
  interviewing: 'chatbubble-outline',
  offer: 'star-outline',
  rejected: 'flag-outline',
  withdrawn: 'exit-outline',
};
