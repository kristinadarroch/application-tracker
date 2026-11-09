import { useLocalSearchParams, useRouter } from 'expo-router';

import { Banner, Screen } from '@/design-system';
import { ApplicationIdSchema, createId } from '@/lib/ids';
import { useAppDispatch } from '@/store/hooks';

import { ApplicationPrefillSchema, formStateFromPrefill } from '../form';
import { useGoBack } from '@/lib/useGoBack';
import type { ApplicationInput } from '../schema';
import { applicationAdded, applicationSaved } from '../slice';
import { ApplicationForm } from './ApplicationForm';

/** Manual entry (PIPE-2). Intake opens it prefilled, with `aiNote` when AI wasn't used (UX-7). */
export function NewApplicationScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const goBack = useGoBack();
  const prefill = ApplicationPrefillSchema.parse(useLocalSearchParams());

  const save = (input: ApplicationInput) => {
    const id = createId(ApplicationIdSchema, 'app');
    dispatch(applicationAdded({ id, input, now: new Date().toISOString() }));
    dispatch(applicationSaved({ id }));
    router.replace({ pathname: '/application/[id]', params: { id } });
  };

  return (
    <Screen title="Add application" onBack={goBack} scroll>
      {prefill.aiNote !== undefined ? (
        <Banner tone="info" title="AI wasn’t used" body={prefill.aiNote} />
      ) : null}
      <ApplicationForm
        initialValues={formStateFromPrefill(prefill)}
        submitLabel="Save application"
        onSubmit={save}
      />
    </Screen>
  );
}
