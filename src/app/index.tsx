import { router } from 'expo-router';

import { Button, EmptyState, Screen, Stack } from '@/design-system';

/** Tier 0 home. The pipeline replaces this in tier 1. */
export default function Home() {
  return (
    <Screen title="Application Tracker">
      <Stack flex={1} justify="center" gap={4}>
        <EmptyState
          icon="briefcase-outline"
          title="No applications yet"
          body="The pipeline arrives in the next build tier."
        />
        {__DEV__ ? (
          <Stack gap={2}>
            <Button
              label="Design system gallery"
              variant="secondary"
              onPress={() => router.push('/dev/design-system')}
            />
            <Button
              label="On-device AI spike"
              variant="secondary"
              onPress={() => router.push('/dev/ai-spike')}
            />
          </Stack>
        ) : null}
      </Stack>
    </Screen>
  );
}
