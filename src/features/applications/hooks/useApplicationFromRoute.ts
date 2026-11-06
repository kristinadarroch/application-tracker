import { useLocalSearchParams } from 'expo-router';

import { ApplicationIdSchema } from '@/lib/ids';
import { useAppSelector } from '@/store/hooks';

import type { Application } from '../schema';
import { selectApplicationById } from '../selectors';

/** The application named by the `[id]` route param, or `undefined` when the param or application is missing. */
export function useApplicationFromRoute(): Application | undefined {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parsed = ApplicationIdSchema.safeParse(id);
  return useAppSelector((state) =>
    parsed.success ? selectApplicationById(state, parsed.data) : undefined,
  );
}
