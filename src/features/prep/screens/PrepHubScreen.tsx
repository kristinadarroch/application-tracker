import { router } from 'expo-router';
import { View } from 'react-native';

import { Card, EmptyState, CompanyBadge, makeStyles, Screen, Stack, Text } from '@/design-system';
import { accentFor } from '@/lib/accents';
import { useAppSelector } from '@/store/hooks';

import { PracticeBar } from '../components/PracticeBar';
import { selectPrepOverview, type PrepOverviewItem } from '../selectors';

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  text: { flex: 1 },
}));

function describeQuestions({ progress }: PrepOverviewItem): string {
  return progress.total === 0
    ? 'No prep questions yet'
    : `${progress.practiced} / ${progress.total} practiced`;
}

function describeSessions({ sessionCount }: PrepOverviewItem): string {
  return sessionCount === 1 ? '1 mock interview' : `${sessionCount} mock interviews`;
}

/** Prep tab: every application, with its practice progress and mock interview count. */
export function PrepHubScreen() {
  const overview = useAppSelector(selectPrepOverview);
  return (
    <Screen header="panel" eyebrow="Interview prep" title="Prep" scroll>
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
            <PrepApplicationRow key={item.application.id} item={item} />
          ))}
        </Stack>
      )}
    </Screen>
  );
}

function PrepApplicationRow({ item }: { item: PrepOverviewItem }) {
  const styles = useStyles();
  const { application, progress } = item;
  const accent = accentFor(application.id, application.company);
  const questions = describeQuestions(item);
  const sessions = describeSessions(item);
  return (
    <Card
      accessibilityLabel={`${application.company}, ${application.role}, ${questions} · ${sessions}`}
      accessibilityHint="Opens prep questions and mock interviews"
      onPress={() =>
        router.push({
          pathname: '/prep/[applicationId]',
          params: { applicationId: application.id },
        })
      }
    >
      <Stack gap={3}>
        <View style={styles.row}>
          <CompanyBadge accent={accent.index} letter={accent.letter} size="md" />
          <View style={styles.text}>
            <Text variant="heading">{application.company}</Text>
            <Text variant="bodySmall" color="secondary">
              {application.role}
            </Text>
          </View>
          <Text variant="mono">
            {progress.total === 0 ? 'New' : `${progress.practiced} / ${progress.total}`}
          </Text>
        </View>
        <PracticeBar accent={accent.index} practiced={progress.practiced} total={progress.total} />
        <Text variant="caption" color="secondary">{`${questions} · ${sessions}`}</Text>
      </Stack>
    </Card>
  );
}
