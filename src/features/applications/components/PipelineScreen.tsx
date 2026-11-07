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

import { useNow } from '../hooks/useNow';
import {
  selectApplicationsByStage,
  selectNextInterview,
  selectPipelineCounts,
  selectPracticedQuestionCount,
  selectPrepSummaryByApplication,
  selectSentThisWeekCount,
  selectUpcomingNextSteps,
  selectUrgentNextStepByApplication,
} from '../selectors';
import { formatShortDate } from '../shortDate';
import { ApplicationsCard } from './ApplicationsCard';
import { NextInterviewCard } from './NextInterviewCard';
import { UpNextCard } from './UpNextCard';

const useStyles = makeStyles((t) => ({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  stat: { flexGrow: 1, flexBasis: 140 },
}));

/**
 * Today on the pipeline, prep first: the next interview with its prep progress, the next
 * step due, every application grouped by Stage in pipeline order with a count per stage
 * (PIPE-1), and stats.
 */
export function PipelineScreen() {
  const router = useRouter();
  const styles = useStyles();
  const now = useNow();
  const byStage = useAppSelector(selectApplicationsByStage);
  const counts = useAppSelector(selectPipelineCounts);
  const nextInterview = useAppSelector(selectNextInterview);
  const prepByApplication = useAppSelector(selectPrepSummaryByApplication);
  const upcoming = useAppSelector((state) => selectUpcomingNextSteps(state, now));
  const urgentSteps = useAppSelector((state) => selectUrgentNextStepByApplication(state, now));
  const sentThisWeek = useAppSelector((state) => selectSentThisWeekCount(state, now));
  const practiced = useAppSelector(selectPracticedQuestionCount);
  const total = STAGES.reduce((sum, stage) => sum + counts[stage], 0);

  const openApplication = (id: ApplicationId) =>
    router.push({ pathname: '/application/[id]', params: { id } });
  const openPrep = (applicationId: ApplicationId) =>
    router.push({ pathname: '/prep/[applicationId]', params: { applicationId } });
  const openMock = (applicationId: ApplicationId) =>
    router.push({ pathname: '/prep/[applicationId]/mock', params: { applicationId } });

  const actions = (
    <Stack direction="row" gap={2}>
      <IconButton
        icon="add"
        variant="onPanel"
        accessibilityLabel="Add application"
        onPress={() => router.push('/application/new')}
      />
      <IconButton
        icon="options-outline"
        variant="onPanel"
        accessibilityLabel="Open settings"
        onPress={() => router.push('/settings')}
      />
    </Stack>
  );

  return (
    <Screen
      header="panel"
      eyebrow={formatShortDate(now, { weekday: true })}
      title="Pipeline"
      headerRight={actions}
      scroll
    >
      <DraftsBanner />
      {total === 0 ? (
        <Stack gap={3} align="center">
          <EmptyState
            icon="briefcase-outline"
            title="No applications yet"
            body="Add a job from its link and review what AI fills in, or add it by hand."
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
          <NextInterviewCard next={nextInterview} onPractice={openPrep} onMock={openMock} />
          <UpNextCard upcoming={upcoming} now={now} onOpen={openApplication} />
          <ApplicationsCard
            byStage={byStage}
            urgentSteps={urgentSteps}
            prepByApplication={prepByApplication}
            now={now}
            onOpen={openApplication}
          />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <StatTile
                icon="chatbubble-outline"
                value={String(practiced)}
                label="questions practiced"
              />
            </View>
            <View style={styles.stat}>
              <StatTile
                icon="paper-plane-outline"
                value={String(sentThisWeek)}
                label="sent this week"
              />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
