import { EmptyState, Screen } from '@/design-system';

/** Placeholder owned by the pipeline feature (PIPE-1). */
export default function PipelineScreen() {
  return (
    <Screen title="Pipeline">
      <EmptyState icon="albums-outline" title="Pipeline" body="Coming in tier 1." />
    </Screen>
  );
}
