import {
  Banner,
  Button,
  Card,
  Chip,
  ErrorState,
  Screen,
  Stack,
  Text,
  TextField,
} from '@/design-system';
import { describeError } from '@/lib/errors';
import { useGoBack } from '@/lib/useGoBack';

import { useListingIntake, type IntakeInput, type IntakeOrigin } from '../hooks/useListingIntake';

export interface ListingIntakeScreenProps {
  title: string;
  initial: IntakeInput;
  origin: IntakeOrigin;
  /** Start reading as soon as the screen opens (share sheet INT-1, `intake/new?url=` link INT-3). */
  autoSubmit: boolean;
}

/**
 * Add a job from its link (the default) or pasted text, read it on the device, and open the draft
 * for review (INT-1 – INT-3, INT-5, UX-7). A pasted link starts reading on its own. A dark
 * panel says a new application is being added and that reading stays on the device.
 */
export function ListingIntakeScreen({
  title,
  initial,
  origin,
  autoSubmit,
}: ListingIntakeScreenProps) {
  const goBack = useGoBack();
  const intake = useListingIntake(initial, origin, autoSubmit);
  const { status } = intake;
  const reading = status.kind === 'reading';
  const showsSubmit = status.kind !== 'failed' && status.kind !== 'missing_company_or_role';

  return (
    <Screen title={title} header="plain" onBack={goBack} scroll>
      <Card variant="panel">
        <Stack gap={1}>
          <Text variant="mono" color="onPanelSecondary">
            {origin === 'shared' ? 'New application · shared with the app' : 'New application'}
          </Text>
          <Text variant="bodyStrong" color="onPanel">
            {origin === 'shared'
              ? 'The shared listing is read on this device, then you check the draft before anything is saved.'
              : 'Paste the job’s link or its text. The listing is read on this device, then you check the draft before anything is saved.'}
          </Text>
        </Stack>
      </Card>
      {intake.aiUnavailable !== undefined ? (
        <Banner
          tone="warning"
          title="AI isn’t available"
          body={`${describeError({ kind: 'ai_unavailable', reason: intake.aiUnavailable }).body} You can still add this listing by hand.`}
        />
      ) : null}
      {status.kind === 'page_unreadable' ? (
        <Banner
          tone="warning"
          title={describeError(status.error).title}
          body={describeError(status.error).body}
        />
      ) : null}
      {intake.linkedInLink !== undefined ? (
        <Banner
          tone="info"
          title="LinkedIn doesn’t let apps read its job pages"
          body="Paste the job description from LinkedIn, or fill in the details yourself."
        />
      ) : null}

      <Stack direction="row" gap={2} wrap="wrap">
        <Chip
          label="From a link"
          icon="link-outline"
          selected={intake.mode === 'url'}
          onPress={() => intake.changeMode('url')}
        />
        <Chip
          label="Paste text"
          icon="document-text-outline"
          selected={intake.mode === 'text'}
          onPress={() => intake.changeMode('text')}
        />
      </Stack>

      {intake.mode === 'url' ? (
        <TextField
          label="Job link"
          value={intake.url}
          onChangeText={intake.changeUrl}
          placeholder="https://"
          keyboardType="url"
          autoCapitalize="none"
          helperText="Sharing a job from Safari or Chrome skips this screen."
          {...(intake.urlError === undefined ? {} : { error: intake.urlError })}
        />
      ) : (
        <TextField
          label="Listing text"
          value={intake.text}
          onChangeText={intake.changeText}
          placeholder="Paste the job listing here"
          multiline
          {...(intake.keptLink === undefined
            ? {}
            : { helperText: `The link ${intake.keptLink} will be saved with this listing.` })}
        />
      )}

      {status.kind === 'missing_company_or_role' ? (
        <Stack gap={3}>
          <Banner
            tone="warning"
            title="Couldn’t find the company or role"
            body="Check that the text names the hiring company and the job title, or fill in the details yourself."
          />
          <Stack direction="row" gap={2} wrap="wrap">
            <Button
              label="Edit text"
              variant="secondary"
              icon="create-outline"
              onPress={intake.editText}
            />
            <Button
              label="Fill in manually"
              variant="secondary"
              onPress={() => intake.openManualForm('missing')}
            />
          </Stack>
        </Stack>
      ) : null}

      {status.kind === 'failed' ? (
        <Stack gap={2} align="center">
          <ErrorState error={status.error} onRetry={intake.submit} />
          <Button
            label="Fill in manually"
            variant="secondary"
            onPress={() => intake.openManualForm('failed')}
          />
        </Stack>
      ) : null}

      {intake.aiUnavailable !== undefined ? (
        <Button
          label="Continue manually"
          size="lg"
          onPress={() => intake.openManualForm('unavailable')}
        />
      ) : showsSubmit ? (
        <Stack gap={2}>
          <Button
            label="Create draft"
            size="lg"
            icon="sparkles-outline"
            loading={reading}
            disabled={!intake.canSubmit}
            accessibilityHint="Reads the listing on this device and opens a draft to review"
            onPress={intake.submit}
          />
          {reading ? (
            <Text variant="mono" color="secondary" align="center">
              {intake.mode === 'url'
                ? 'Reading the page on this device…'
                : 'Reading the listing on this device…'}
            </Text>
          ) : (
            <Button
              label="Fill in manually"
              variant="ghost"
              onPress={() => intake.openManualForm('chosen')}
            />
          )}
        </Stack>
      ) : null}
    </Screen>
  );
}
