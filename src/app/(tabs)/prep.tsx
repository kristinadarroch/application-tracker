import { EmptyState, Screen } from '@/design-system';

/** Placeholder owned by the prep feature (PREP-1). */
export default function PrepHubScreen() {
  return (
    <Screen title="Prep">
      <EmptyState icon="school-outline" title="Prep" body="Coming in tier 2." />
    </Screen>
  );
}
