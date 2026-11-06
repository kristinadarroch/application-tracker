import { useRouter } from 'expo-router';

import { Banner } from '@/design-system';
import { useAppSelector } from '@/store/hooks';

import { selectAllDrafts } from '../draftsSlice';

/** "N drafts to review" on the Pipeline; opens the newest draft (INT-6). Renders nothing without drafts. */
export function DraftsBanner() {
  const router = useRouter();
  const drafts = useAppSelector(selectAllDrafts);
  const newest = drafts[0];
  if (newest === undefined) return null;
  const { company, role } = newest.extraction;
  return (
    <Banner
      tone="info"
      title={drafts.length === 1 ? '1 draft to review' : `${drafts.length} drafts to review`}
      body={`Newest: ${role} at ${company}`}
      action={{
        label: 'Review draft',
        onPress: () =>
          router.push({ pathname: '/intake/review/[draftId]', params: { draftId: newest.id } }),
      }}
    />
  );
}
