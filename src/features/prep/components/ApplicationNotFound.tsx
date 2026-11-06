import { router } from 'expo-router';

import { ErrorState, Screen } from '@/design-system';

/** Shown when a prep route points at an application that was deleted (or never existed). */
export function ApplicationNotFound({ title }: { title: string }) {
  return (
    <Screen title={title} onBack={router.back}>
      <ErrorState error={{ kind: 'not_found', entity: 'application' }} />
    </Screen>
  );
}
