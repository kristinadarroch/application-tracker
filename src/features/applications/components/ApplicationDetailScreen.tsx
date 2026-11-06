import { useRouter } from 'expo-router';
import { Alert, Linking } from 'react-native';

import {
  Button,
  Card,
  ErrorState,
  IconButton,
  Screen,
  Stack,
  StagePill,
  Text,
} from '@/design-system';
import { useAppDispatch } from '@/store/hooks';

import { useApplicationFromRoute } from '../hooks/useApplicationFromRoute';
import { useGoBack } from '../hooks/useGoBack';
import { useNow } from '../hooks/useNow';
import { applicationRemoved, stageChanged } from '../slice';
import { NextStepsSection } from './NextStepsSection';
import { StagePicker } from './StagePicker';

function DetailField({ label, value }: { label: string; value: string | undefined }) {
  return (
    <Stack gap={1}>
      <Text variant="caption" color="secondary">
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

/** Everything about one application: fields, stage, notes, Next Steps, prep, delete (PIPE-3–6). */
export function ApplicationDetailScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
      title={company}
      onBack={goBack}
      scroll
      headerRight={
        <IconButton
          icon="create-outline"
          accessibilityLabel="Edit application"
          onPress={() => router.push({ pathname: '/application/[id]/edit', params: { id } })}
        />
      }
    >
      <Stack gap={2}>
        <Text variant="heading">{role}</Text>
        <StagePill stage={stage} />
      </Stack>

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
        <Text variant="heading">Stage</Text>
        <StagePicker
          label="Tap a stage to move this application."
          value={stage}
          onChange={(next) =>
            dispatch(stageChanged({ id, stage: next, now: new Date().toISOString() }))
          }
        />
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

      <NextStepsSection application={application} now={now} />

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
