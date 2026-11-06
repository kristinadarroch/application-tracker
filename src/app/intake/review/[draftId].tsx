import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { Button, ErrorState, Screen } from '@/design-system';
import { DraftReview, selectDraftById } from '@/features/intake';
import { DraftIdSchema } from '@/lib/ids';
import { useAppSelector } from '@/store/hooks';

/** Review an Application Draft before it becomes an Application (INT-4). */
export default function ReviewDraftRoute() {
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const id = DraftIdSchema.safeParse(draftId);
  const draft = useAppSelector((state) =>
    id.success ? selectDraftById(state, id.data) : undefined,
  );
  // Confirm and Discard remove the draft, then navigate away. Keep showing the draft this screen
  // already had while it animates out, instead of flashing "Not found".
  const [shown, setShown] = useState(draft);
  if (draft !== undefined && draft !== shown) setShown(draft);
  const current = draft ?? shown;

  if (current === undefined) {
    return (
      <Screen title="Review draft" onBack={() => router.dismissTo('/')}>
        <ErrorState error={{ kind: 'not_found', entity: 'draft' }} />
        <Button
          label="Back to Pipeline"
          variant="secondary"
          onPress={() => router.dismissTo('/')}
        />
      </Screen>
    );
  }
  return <DraftReview key={current.id} draft={current} />;
}
