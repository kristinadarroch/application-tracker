import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { Stage } from '@/lib/stage';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const STAGE_ICONS: Record<Stage, IconName> = {
  saved: 'bookmark-outline',
  applied: 'paper-plane-outline',
  interviewing: 'chatbubbles-outline',
  offer: 'trophy-outline',
  rejected: 'close-circle-outline',
  withdrawn: 'exit-outline',
};
