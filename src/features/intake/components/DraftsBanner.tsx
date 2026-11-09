import { useRouter } from 'expo-router';

import { Button, Card, Stack, Text } from '@/design-system';
import { useAppSelector } from '@/store/hooks';

import { selectAllDrafts } from '../draftsSlice';

/**
 * "N drafts to review" on the Pipeline; opens the newest draft (INT-6). Renders nothing without
 * drafts. Drafts are unconfirmed AI output, so the panel wears the proposal (hatched) look.
 */
export function DraftsBanner() {
  const router = useRouter();
  const drafts = useAppSelector(selectAllDrafts);
  const newest = drafts[0];
  if (newest === undefined) return null;
  const { company, role } = newest.extraction;
  return (
    <Card variant="proposal">
      <Stack gap={2}>
        <Text variant="mono" color="secondary">
          Proposed · new applications
        </Text>
        <Text variant="heading">
          {drafts.length === 1 ? '1 draft to review' : `${drafts.length} drafts to review`}
        </Text>
        <Text variant="bodySmall" color="secondary">
          {`Newest: ${role === '' || company === '' ? 'New application' : `${role} at ${company}`}`}
        </Text>
        <Stack direction="row">
          <Button
            label="Review draft"
            variant="secondary"
            trailingIcon="arrow-forward"
            onPress={() =>
              router.push({ pathname: '/intake/review/[draftId]', params: { draftId: newest.id } })
            }
          />
        </Stack>
      </Stack>
    </Card>
  );
}
