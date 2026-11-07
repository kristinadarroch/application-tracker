import { useRouter } from 'expo-router';
import { Alert, Linking, View } from 'react-native';

import {
  Button,
  Card,
  ErrorState,
  IconButton,
  CompanyBadge,
  makeStyles,
  Screen,
  Stack,
  StagePill,
  Text,
} from '@/design-system';
import { accentFor } from '@/lib/accents';
import type { Stage } from '@/lib/stage';
import { useAppDispatch } from '@/store/hooks';

import { useApplicationFromRoute } from '../hooks/useApplicationFromRoute';
import { useGoBack } from '../hooks/useGoBack';
import { useNow } from '../hooks/useNow';
import { applicationRemoved, stageChanged } from '../slice';
import { AddNextStepForm } from './AddNextStepForm';
import { NextStepRow } from './NextStepRow';
import { StageCard } from './StageCard';

const useStyles = makeStyles((t) => ({
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] },
  identityText: { flex: 1, gap: t.space[1] },
  closeLinks: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.space[2] },
}));

function DetailField({ label, value }: { label: string; value: string | undefined }) {
  return (
    <Stack gap={1}>
      <Text variant="overline" color="secondary">
        {label}
      </Text>
      <Text color={value === undefined ? 'tertiary' : 'primary'}>{value ?? 'Not added'}</Text>
    </Stack>
  );
}

async function openListing(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Couldn’t open the listing', 'Check the listing link on the edit screen.');
  }
}

/**
 * One application: its stages with Next Steps under the current one, then details, notes,
 * prep, and delete (PIPE-3–6).
 */
export function ApplicationDetailScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const styles = useStyles();
  const goBack = useGoBack();
  const now = useNow();
  const application = useApplicationFromRoute();

  if (application === undefined) {
    return (
      <Screen title="Application" onBack={goBack}>
        <ErrorState error={{ kind: 'not_found', entity: 'application' }} />
      </Screen>
    );
  }

  const { id, company, role, location, salary, listingUrl, stage, notes, requirements } =
    application;
  const accent = accentFor(id, company);
  const completed = application.nextSteps
    .filter((step) => step.done)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const changeStage = (next: Stage) =>
    dispatch(stageChanged({ id, stage: next, now: new Date().toISOString() }));

  const confirmDelete = () =>
    Alert.alert(
      'Delete application?',
      `${company} – ${role}, its Next Steps, prep questions, and mock interview sessions will be removed. This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            goBack();
            dispatch(applicationRemoved(id));
          },
        },
      ],
    );

  return (
    <Screen
      onBack={goBack}
      scroll
      headerRight={
        <IconButton
          icon="create-outline"
          variant="secondary"
          accessibilityLabel="Edit application"
          onPress={() => router.push({ pathname: '/application/[id]/edit', params: { id } })}
        />
      }
    >
      <View style={styles.identity}>
        <CompanyBadge accent={accent.index} letter={accent.letter} size="lg" />
        <View style={styles.identityText}>
          {location !== undefined ? (
            <Text variant="mono" color="secondary">
              {location}
            </Text>
          ) : null}
          <Text variant="title">{company}</Text>
          <Text color="secondary">{role}</Text>
          <StagePill stage={stage} />
        </View>
      </View>

      <StageCard application={application} accent={accent} now={now} onStageChange={changeStage} />

      <Stack gap={1}>
        <Text variant="overline" color="secondary">
          Close this application
        </Text>
        <View style={styles.closeLinks}>
          {stage !== 'rejected' ? (
            <Button label="Rejected" variant="ghost" onPress={() => changeStage('rejected')} />
          ) : null}
          {stage !== 'withdrawn' ? (
            <Button label="Withdrawn" variant="ghost" onPress={() => changeStage('withdrawn')} />
          ) : null}
        </View>
      </Stack>

      <Card>
        <Text variant="heading">Add a Next Step</Text>
        <AddNextStepForm applicationId={id} now={now} />
      </Card>

      {completed.length > 0 ? (
        <Card>
          <Text variant="heading">Completed</Text>
          {completed.map((step) => (
            <NextStepRow key={step.id} applicationId={id} step={step} now={now} />
          ))}
        </Card>
      ) : null}

      <Card>
        <Text variant="heading">Details</Text>
        <DetailField label="Location" value={location} />
        <DetailField label="Salary" value={salary} />
        <DetailField label="Listing link" value={listingUrl} />
        {listingUrl !== undefined ? (
          <Button
            label="Open listing"
            icon="open-outline"
            variant="secondary"
            accessibilityHint="Opens the listing in your browser"
            onPress={() => void openListing(listingUrl)}
          />
        ) : null}
      </Card>

      <Card>
        <Text variant="heading">Notes</Text>
        <Text color={notes.length === 0 ? 'tertiary' : 'primary'}>
          {notes.length === 0 ? 'No notes yet.' : notes}
        </Text>
        {requirements.length > 0 ? (
          <>
            <Text variant="heading">Requirements</Text>
            {requirements.map((requirement, index) => (
              <Text key={`${index}-${requirement}`}>• {requirement}</Text>
            ))}
          </>
        ) : null}
      </Card>

      <Card>
        <Text variant="heading">Prepare</Text>
        <Button
          label="Prep questions"
          icon="school-outline"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/prep/[applicationId]', params: { applicationId: id } })
          }
        />
        <Button
          label="Mock interview"
          icon="chatbubbles-outline"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/prep/[applicationId]/mock', params: { applicationId: id } })
          }
        />
      </Card>

      <Button
        label="Delete application"
        icon="trash-outline"
        variant="destructive"
        onPress={confirmDelete}
      />
    </Screen>
  );
}
