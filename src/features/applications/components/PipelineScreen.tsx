import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  Button,
  EmptyState,
  IconButton,
  makeStyles,
  Screen,
  Stack,
  StatTile,
} from '@/design-system';
import { DraftsBanner } from '@/features/intake';
import type { ApplicationId } from '@/lib/ids';
import { STAGES } from '@/lib/stage';
import { useAppSelector } from '@/store/hooks';

import { formatBoardDate } from '../boardDate';
import { useNow } from '../hooks/useNow';
import {
  selectApplicationsByStage,
  selectPipelineCounts,
  selectPracticedQuestionCount,
  selectSentThisWeekCount,
  selectUpcomingNextSteps,
  selectUrgentNextStepByApplication,
} from '../selectors';
import { NextDepartureBoard } from './NextDepartureBoard';
import { YourLinesCard } from './YourLinesCard';

const useStyles = makeStyles((t) => ({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  stat: { flexGrow: 1, flexBasis: 140 },
}));

/**
 * Today on the pipeline: the next departure, every application as a line grouped by Stage in
 * pipeline order with a count per stage (PIPE-1), and weekly stats.
 */
export function PipelineScreen() {
  const router = useRouter();
  const styles = useStyles();
  const now = useNow();
  const byStage = useAppSelector(selectApplicationsByStage);
  const counts = useAppSelector(selectPipelineCounts);
  const upcoming = useAppSelector((state) => selectUpcomingNextSteps(state, now));
  const urgentSteps = useAppSelector((state) => selectUrgentNextStepByApplication(state, now));
  const sentThisWeek = useAppSelector((state) => selectSentThisWeekCount(state, now));
  const practiced = useAppSelector(selectPracticedQuestionCount);
  const total = STAGES.reduce((sum, stage) => sum + counts[stage], 0);

  const openApplication = (id: ApplicationId) =>
    router.push({ pathname: '/application/[id]', params: { id } });

  const actions = (
    <Stack direction="row" gap={2}>
      <IconButton
        icon="add"
        variant="onSign"
        accessibilityLabel="Add application"
        onPress={() => router.push('/application/new')}
      />
      <IconButton
        icon="options-outline"
        variant="onSign"
        accessibilityLabel="Open settings"
        onPress={() => router.push('/settings')}
      />
    </Stack>
  );

  return (
    <Screen
      header="sign"
      eyebrow={formatBoardDate(now, { weekday: true })}
      title="Pipeline"
      headerRight={actions}
      scroll
    >
      <DraftsBanner />
      {total === 0 ? (
        <Stack gap={3} align="center">
          <EmptyState
            icon="trail-sign-outline"
            title="No lines yet"
            body="Each job you track becomes a line. Add one from its link and review what AI fills in, or add it by hand."
            action={{ label: 'Add from a link', onPress: () => router.push('/intake/new') }}
          />
          <Button
            label="Add application"
            icon="add"
            variant="secondary"
            onPress={() => router.push('/application/new')}
          />
        </Stack>
      ) : (
        <>
          <NextDepartureBoard upcoming={upcoming} now={now} onOpen={openApplication} />
          <YourLinesCard
            byStage={byStage}
            urgentSteps={urgentSteps}
            now={now}
            onOpen={openApplication}
          />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <StatTile
                icon="paper-plane-outline"
                value={String(sentThisWeek)}
                label="sent this week"
              />
            </View>
            <View style={styles.stat}>
              <StatTile
                icon="chatbubble-outline"
                value={String(practiced)}
                label="questions practiced"
              />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
