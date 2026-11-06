import { router } from 'expo-router';

import { EmptyState, ListItem, Screen, Stack } from '@/design-system';
import { useAppSelector } from '@/store/hooks';

import { selectPrepOverview, type PrepOverviewItem } from '../selectors';

function describeProgress({ progress, sessionCount }: PrepOverviewItem): string {
  const questions =
    progress.total === 0
      ? 'No prep questions yet'
      : `${progress.practiced} / ${progress.total} practiced`;
  const sessions = sessionCount === 1 ? '1 mock interview' : `${sessionCount} mock interviews`;
  return `${questions} · ${sessions}`;
}

/** Prep tab: every application with its practice progress and mock interview count. */
export function PrepHubScreen() {
  const overview = useAppSelector(selectPrepOverview);
  return (
    <Screen title="Prep" scroll>
      {overview.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="Nothing to prep yet"
          body="Add an application to your Pipeline, then come back to practice for its interviews."
          action={{ label: 'Go to Pipeline', onPress: () => router.navigate('/') }}
        />
      ) : (
        <Stack gap={2}>
          {overview.map((item) => (
            <ListItem
              key={item.application.id}
              title={`${item.application.role} · ${item.application.company}`}
              subtitle={describeProgress(item)}
              accessibilityHint="Opens prep questions and mock interviews"
              onPress={() =>
                router.push({
                  pathname: '/prep/[applicationId]',
                  params: { applicationId: item.application.id },
                })
              }
            />
          ))}
        </Stack>
      )}
    </Screen>
  );
}
