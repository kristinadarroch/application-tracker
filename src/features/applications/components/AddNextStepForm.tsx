import { useState } from 'react';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, Chip, makeStyles, Stack, Text, TextField } from '@/design-system';
import { addDays, toIsoDate } from '@/lib/dates';
import { createId, NextStepIdSchema, type ApplicationId } from '@/lib/ids';
import { useAppDispatch } from '@/store/hooks';

import { DUE_QUICK_PICKS } from '../nextStepDue';
import { NextStepInputSchema, type NextStepInput } from '../schema';
import { nextStepAdded } from '../slice';

export interface AddNextStepFormProps {
  applicationId: ApplicationId;
  now: Date;
}

type NextStepErrors = Partial<Record<keyof NextStepInput, string>>;

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
}));

/** Title plus a due date from quick picks or typed as YYYY-MM-DD, validated by `NextStepInputSchema` (PIPE-6). */
export function AddNextStepForm({ applicationId, now }: AddNextStepFormProps) {
  const dispatch = useAppDispatch();
  const styles = useStyles();
  const tomorrow = toIsoDate(addDays(now, 1));
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(tomorrow);
  const [errors, setErrors] = useState<NextStepErrors>({});

  const clearError = (field: keyof NextStepInput) =>
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });

  const changeDueDate = (date: string) => {
    setDueDate(date);
    clearError('dueDate');
  };

  const add = () => {
    const parsed = NextStepInputSchema.safeParse({ title, dueDate });
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      const titleError = fieldErrors.title?.[0];
      const dueDateError = fieldErrors.dueDate?.[0];
      setErrors({
        ...(titleError === undefined ? {} : { title: titleError }),
        ...(dueDateError === undefined ? {} : { dueDate: dueDateError }),
      });
      return;
    }
    dispatch(
      nextStepAdded({
        applicationId,
        id: createId(NextStepIdSchema, 'step'),
        ...parsed.data,
        source: 'manual',
        now: new Date().toISOString(),
      }),
    );
    setTitle('');
    setDueDate(tomorrow);
    setErrors({});
  };

  return (
    <Stack gap={3}>
      <TextField
        label="Next Step"
        placeholder="e.g. Book the onsite interview"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          clearError('title');
        }}
        {...(errors.title === undefined ? {} : { error: errors.title })}
      />
      <Stack gap={2}>
        <Text variant="bodySmall" color="secondary">
          Due
        </Text>
        <View style={styles.chips}>
          {DUE_QUICK_PICKS.map(({ label, daysFromToday }) => {
            const date = toIsoDate(addDays(now, daysFromToday));
            return (
              <Chip
                key={label}
                label={label}
                selected={dueDate === date}
                onPress={() => changeDueDate(date)}
              />
            );
          })}
        </View>
      </Stack>
      <TextField
        label="Due date"
        helperText="YYYY-MM-DD"
        value={dueDate}
        onChangeText={changeDueDate}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        {...(errors.dueDate === undefined ? {} : { error: errors.dueDate })}
      />
      <Button label="Add Next Step" icon="add" variant="secondary" onPress={add} />
    </Stack>
  );
}
