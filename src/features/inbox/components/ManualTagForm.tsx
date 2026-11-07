import { useState } from 'react';

import { Button, Card, Chip, Stack, Text, TextField } from '@/design-system';
import { NextStepInputSchema, type NextStepInput } from '@/features/applications/model';
import { addDays, formatDueDate, toIsoDate } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';

import type { TriageCandidate } from '../schema';
import { ApplicationPicker } from './ApplicationPicker';

const DUE_PICKS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'In a week', days: 7 },
] as const;

export interface ManualTag extends NextStepInput {
  applicationId: ApplicationId;
}

export interface ManualTagFormProps {
  applications: readonly TriageCandidate[];
  onSubmit: (tag: ManualTag) => void;
  onCancel?: () => void;
}

interface Errors {
  application?: string;
  title?: string;
}

/** Link a message to an application and add a Next Step by hand (INBX-5). */
export function ManualTagForm({ applications, onSubmit, onCancel }: ManualTagFormProps) {
  const [applicationId, setApplicationId] = useState<ApplicationId | null>(null);
  const [title, setTitle] = useState('');
  const [dueInDays, setDueInDays] = useState<number>(1);
  const [errors, setErrors] = useState<Errors>({});
  const now = new Date();
  const dueDate = toIsoDate(addDays(now, dueInDays));

  const submit = () => {
    const parsed = NextStepInputSchema.safeParse({ title, dueDate });
    const next: Errors = {
      ...(applicationId === null ? { application: 'Choose an application' } : {}),
      ...(parsed.success
        ? {}
        : { title: parsed.error.issues.find((i) => i.path[0] === 'title')?.message ?? '' }),
    };
    setErrors(next);
    if (applicationId === null || !parsed.success) return;
    onSubmit({ applicationId, ...parsed.data });
  };

  return (
    <Card variant="surface">
      <Stack gap={4}>
        <Stack gap={1}>
          <Text variant="station" color="tertiary">
            From this email
          </Text>
          <Text variant="heading">Tag manually</Text>
        </Stack>
        <ApplicationPicker
          label="Application"
          applications={applications}
          selectedId={applicationId}
          onSelect={setApplicationId}
          {...(errors.application === undefined ? {} : { error: errors.application })}
        />
        <TextField
          label="Next Step"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Book interview"
          {...(errors.title === undefined ? {} : { error: errors.title })}
        />
        <Stack gap={2}>
          <Text variant="station" color="secondary">
            Due
          </Text>
          <Stack direction="row" gap={2} wrap="wrap">
            {DUE_PICKS.map((pick) => (
              <Chip
                key={pick.label}
                label={pick.label}
                selected={pick.days === dueInDays}
                onPress={() => setDueInDays(pick.days)}
              />
            ))}
          </Stack>
          <Text variant="board" color="secondary">
            {formatDueDate(dueDate, now)}
          </Text>
        </Stack>
        <Stack direction="row" gap={2} wrap="wrap">
          <Button label="Add Next Step" icon="add" onPress={submit} />
          {onCancel !== undefined ? (
            <Button label="Cancel" variant="ghost" onPress={onCancel} />
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}
