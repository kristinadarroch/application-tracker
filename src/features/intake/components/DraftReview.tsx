import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Banner, Button, Screen, Stack, Text, TextField } from '@/design-system';
import { applicationAdded } from '@/features/applications/slice';
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
 * Every extracted field, editable. Only Confirm turns the draft into an Application (INT-4);
 * edits are saved to the draft on blur so the user can come back later (INT-6).
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
    dispatch(draftRemoved(draft.id));
    router.replace({ pathname: '/application/[id]', params: { id } });
  };

  const discard = () => {
    dispatch(draftRemoved(draft.id));
    router.dismissTo('/');
  };

  return (
    <Screen
      title="Review draft"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      scroll
    >
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
