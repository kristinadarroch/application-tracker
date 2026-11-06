import { useRouter } from 'expo-router';
import { ScrollView, SectionList, View } from 'react-native';

import { Button, EmptyState, IconButton, makeStyles, Screen, Stack } from '@/design-system';
import { DraftsBanner } from '@/features/intake';
import { STAGES, type Stage } from '@/lib/stage';
import { useAppSelector } from '@/store/hooks';

import { useNow } from '../hooks/useNow';
import { dueLabel } from '../nextStepDue';
import type { Application } from '../schema';
import {
  selectApplicationsByStage,
  selectPipelineCounts,
  selectUrgentNextStepByApplication,
} from '../selectors';
import { ApplicationCard } from './ApplicationCard';
import { StageHeader } from './StageHeader';

interface StageSection {
  stage: Stage;
  data: Application[];
}

const useStyles = makeStyles((t) => ({
  list: { paddingBottom: t.space[6] },
  item: { paddingBottom: t.space[3] },
  empty: { flexGrow: 1, justifyContent: 'center', paddingBottom: t.space[6] },
}));

/** Six stage headers and footers plus the first screenful of cards. */
const INITIAL_ITEMS = 24;

/** Applications grouped by Stage in pipeline order, every stage shown with its count (PIPE-1). */
export function PipelineScreen() {
  const router = useRouter();
  const styles = useStyles();
  const now = useNow();
  const byStage = useAppSelector(selectApplicationsByStage);
  const counts = useAppSelector(selectPipelineCounts);
  const urgentSteps = useAppSelector((state) => selectUrgentNextStepByApplication(state, now));
  const total = STAGES.reduce((sum, stage) => sum + counts[stage], 0);
  const sections: StageSection[] = STAGES.map((stage) => ({ stage, data: byStage[stage] }));

  const actions = (
    <Stack direction="row" gap={1}>
      <IconButton
        icon="clipboard-outline"
        accessibilityLabel="Paste a listing"
        onPress={() => router.push('/intake/new')}
      />
      <IconButton
        icon="add"
        accessibilityLabel="Add application"
        onPress={() => router.push('/application/new')}
      />
      <IconButton
        icon="settings-outline"
        accessibilityLabel="Open settings"
        onPress={() => router.push('/settings')}
      />
    </Stack>
  );

  return (
    <Screen title="Pipeline" headerRight={actions}>
      {total === 0 ? (
        <ScrollView contentContainerStyle={styles.empty}>
          <DraftsBanner />
          <EmptyState
            icon="albums-outline"
            title="No applications yet"
            body="Add a role you found anywhere, or paste a job listing and review what AI fills in."
            action={{ label: 'Add application', onPress: () => router.push('/application/new') }}
          />
          <Stack align="center">
            <Button
              label="Paste a listing"
              icon="clipboard-outline"
              variant="secondary"
              onPress={() => router.push('/intake/new')}
            />
          </Stack>
        </ScrollView>
      ) : (
        <SectionList<Application, StageSection>
          sections={sections}
          keyExtractor={(application) => application.id}
          ListHeaderComponent={DraftsBanner}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          // Every stage header (and the first cards) renders up front, so all counts are there at once.
          initialNumToRender={INITIAL_ITEMS}
          renderSectionHeader={({ section }) => (
            <StageHeader stage={section.stage} count={section.data.length} />
          )}
          renderItem={({ item }) => {
            const urgentStep = urgentSteps.get(item.id);
            return (
              <View style={styles.item}>
                <ApplicationCard
                  application={item}
                  urgentLabel={
                    urgentStep === undefined ? undefined : dueLabel(urgentStep.dueDate, now)
                  }
                  onPress={() =>
                    router.push({ pathname: '/application/[id]', params: { id: item.id } })
                  }
                />
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
