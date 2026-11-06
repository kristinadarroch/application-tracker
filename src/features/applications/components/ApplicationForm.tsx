import { useState } from 'react';

import { Button, Stack, TextField, type TextFieldProps } from '@/design-system';

import {
  validateApplicationForm,
  type ApplicationFieldErrors,
  type ApplicationFormField,
  type ApplicationFormState,
} from '../form';
import type { ApplicationInput } from '../schema';
import { StagePicker } from './StagePicker';

export interface ApplicationFormProps {
  initialValues: ApplicationFormState;
  submitLabel: string;
  /** Called only with values that passed `ApplicationInputSchema`. */
  onSubmit: (input: ApplicationInput) => void;
}

type TextFieldName = Exclude<ApplicationFormField, 'stage'>;

/** Add/edit form shared by `/application/new` and `/application/[id]/edit` (PIPE-2, PIPE-4). */
export function ApplicationForm({ initialValues, submitLabel, onSubmit }: ApplicationFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ApplicationFieldErrors>({});

  const setField = (field: TextFieldName, text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = () => {
    const result = validateApplicationForm(values);
    if (result.ok) onSubmit(result.value);
    else setErrors(result.error);
  };

  const field = (name: TextFieldName, label: string, options: Partial<TextFieldProps> = {}) => {
    const error = errors[name];
    return (
      <TextField
        label={label}
        value={values[name]}
        onChangeText={(text) => setField(name, text)}
        {...(error === undefined ? {} : { error })}
        {...options}
      />
    );
  };

  return (
    <Stack gap={4}>
      {field('company', 'Company', { autoCapitalize: 'words' })}
      {field('role', 'Role', { autoCapitalize: 'words' })}
      <StagePicker
        label="Stage"
        value={values.stage}
        onChange={(stage) => setValues((current) => ({ ...current, stage }))}
      />
      {field('location', 'Location', { autoCapitalize: 'words' })}
      {field('salary', 'Salary')}
      {field('listingUrl', 'Listing link', {
        keyboardType: 'url',
        autoCapitalize: 'none',
        placeholder: 'https://',
      })}
      {field('requirements', 'Requirements', {
        multiline: true,
        helperText: 'Separate requirements with commas or new lines.',
      })}
      {field('notes', 'Notes', { multiline: true })}
      <Button label={submitLabel} size="lg" onPress={submit} />
    </Stack>
  );
}
