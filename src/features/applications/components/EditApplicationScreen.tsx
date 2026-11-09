import { ErrorState, Screen } from '@/design-system';
import { useAppDispatch } from '@/store/hooks';

import { formStateFromApplication } from '../form';
import { useApplicationFromRoute } from '../hooks/useApplicationFromRoute';
import { useGoBack } from '@/lib/useGoBack';
import type { ApplicationInput } from '../schema';
import { applicationUpdated } from '../slice';
import { ApplicationForm } from './ApplicationForm';

/** Edit every field of an application (PIPE-4). */
export function EditApplicationScreen() {
  const dispatch = useAppDispatch();
  const application = useApplicationFromRoute();
  const goBack = useGoBack(
    application === undefined
      ? '/'
      : { pathname: '/application/[id]', params: { id: application.id } },
  );

  if (application === undefined) {
    return (
      <Screen title="Edit application" onBack={goBack}>
        <ErrorState error={{ kind: 'not_found', entity: 'application' }} />
      </Screen>
    );
  }

  const save = (input: ApplicationInput) => {
    dispatch(applicationUpdated({ id: application.id, input, now: new Date().toISOString() }));
    goBack();
  };

  return (
    <Screen title="Edit application" onBack={goBack} scroll>
      <ApplicationForm
        key={application.id}
        initialValues={formStateFromApplication(application)}
        submitLabel="Save changes"
        onSubmit={save}
      />
    </Screen>
  );
}
