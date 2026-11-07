import { router } from 'expo-router';
import { View } from 'react-native';

import { Card, EmptyState, LineRoundel, makeStyles, Screen, Stack, Text } from '@/design-system';
import { lineFor } from '@/lib/lines';
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

/** Prep tab: every application as a line, with its practice progress and mock interview count. */
export function PrepHubScreen() {
  const overview = useAppSelector(selectPrepOverview);
  return (
    <Screen header="sign" eyebrow="Practice loops" title="Prep" scroll>
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
            <PrepLineRow key={item.application.id} item={item} />
          ))}
        </Stack>
      )}
    </Screen>
  );
}

function PrepLineRow({ item }: { item: PrepOverviewItem }) {
  const styles = useStyles();
  const { application, progress } = item;
  const line = lineFor(application.id, application.company);
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
          <LineRoundel line={line.index} letter={line.letter} size="md" />
          <View style={styles.text}>
            <Text variant="heading">{application.company}</Text>
            <Text variant="bodySmall" color="secondary">
              {application.role}
            </Text>
          </View>
          <Text variant="board">
            {progress.total === 0 ? 'New' : `${progress.practiced} / ${progress.total}`}
          </Text>
        </View>
        <PracticeBar line={line.index} practiced={progress.practiced} total={progress.total} />
        <Text variant="caption" color="secondary">{`${questions} · ${sessions}`}</Text>
      </Stack>
    </Card>
  );
}
