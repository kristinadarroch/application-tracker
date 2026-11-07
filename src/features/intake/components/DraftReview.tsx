import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  Banner,
  Button,
  Card,
  CompanyBadge,
  StageProgress,
  StageProgressLegend,
  ProposalCard,
  Screen,
  Stack,
  Text,
  TextField,
} from '@/design-system';
import { applicationAdded, applicationSaved } from '@/features/applications/model';
import { accentFor } from '@/lib/accents';
import { ApplicationIdSchema, createId } from '@/lib/ids';
import { useAppDispatch } from '@/store/hooks';

import { draftRemoved, draftUpdated } from '../draftsSlice';
import {
  draftToFormValues,
  formValuesToEdits,
  validateDraftForm,
  type DraftFormErrors,
  type DraftFormValues,
} from '../reviewForm';
import type { ApplicationDraft } from '../schema';

export interface DraftReviewProps {
  draft: ApplicationDraft;
}

/**
 * Every extracted field, editable, inside a proposal card: the draft is unconfirmed AI output.
 * Only Confirm turns the draft into an Application (INT-4); edits are saved to the draft on blur so
 * the user can come back later (INT-6). A preview shows its badge and progress, starting at Saved.
 */
export function DraftReview({ draft }: DraftReviewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [values, setValues] = useState<DraftFormValues>(() => draftToFormValues(draft));
  const [errors, setErrors] = useState<DraftFormErrors>({});

  const field = (key: keyof DraftFormValues) => {
    const error = errors[key];
    return {
      value: values[key],
      onChangeText: (value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
        if (error !== undefined) {
          setErrors((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
        }
      },
      onBlur: () => dispatch(draftUpdated(formValuesToEdits(draft.id, values))),
      ...(error === undefined ? {} : { error }),
    };
  };

  const confirm = () => {
    const result = validateDraftForm(values);
    if (!result.ok) {
      setErrors(result.error);
      return;
    }
    const id = createId(ApplicationIdSchema, 'app');
    dispatch(applicationAdded({ id, input: result.value, now: new Date().toISOString() }));
    dispatch(applicationSaved({ id }));
    dispatch(draftRemoved(draft.id));
    router.replace({ pathname: '/application/[id]', params: { id } });
  };

  const discard = () => {
    dispatch(draftRemoved(draft.id));
    router.dismissTo('/');
  };

  const accent = accentFor(draft.id, values.company);
  const company = values.company.trim();
  const role = values.role.trim();

  return (
    <Screen
      title="Review draft"
      header="plain"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      scroll
    >
      <Card>
        <Stack gap={3}>
          <Stack direction="row" gap={3} align="center">
            <CompanyBadge accent={accent.index} letter={accent.letter} size="lg" />
            <Stack gap={1} flex={1}>
              <Text variant="overline" color="secondary">
                New application
              </Text>
              <Text variant="bodyStrong">
                {role === '' || company === '' ? 'New application' : `${role} at ${company}`}
              </Text>
            </Stack>
          </Stack>
          <Stack gap={1}>
            <StageProgressLegend />
            <StageProgress stage="saved" accent={accent.index} />
          </Stack>
          <Text variant="bodySmall" color="secondary">
            Confirm adds it to your pipeline at Saved.
          </Text>
        </Stack>
      </Card>

      <ProposalCard eyebrow="PROPOSED · READ FROM THE LISTING" onDevice>
        <Stack gap={3}>
          <Text color="secondary">
            AI read this listing on your device. Check each detail, then confirm to add it to your
            pipeline.
          </Text>
          {draft.trimmed ? (
            <Banner
              tone="info"
              title="Only the first part of this listing was read"
              body="The listing was too long to read at once. Check the details against the full listing."
            />
          ) : null}

          <TextField label="Company" autoCapitalize="words" {...field('company')} />
          <TextField label="Role" autoCapitalize="words" {...field('role')} />
          <TextField label="Location" autoCapitalize="words" {...field('location')} />
          <TextField label="Salary" {...field('salary')} />
          <TextField
            label="Listing link"
            keyboardType="url"
            autoCapitalize="none"
            {...field('listingUrl')}
          />
          <TextField
            label="Requirements"
            helperText="One per line"
            multiline
            {...field('requirements')}
          />
          <TextField label="Notes" multiline {...field('notes')} />
        </Stack>
      </ProposalCard>

      <Stack gap={2}>
        <Button label="Confirm" size="lg" icon="checkmark" onPress={confirm} />
        <Button
          label="Discard"
          variant="destructive"
          accessibilityHint="Deletes this draft without adding an application"
          onPress={discard}
        />
      </Stack>
    </Screen>
  );
}
