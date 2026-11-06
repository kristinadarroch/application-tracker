import { EmptyState, Screen } from '@/design-system';

/** Placeholder owned by the inbox feature (INBX-1). */
export default function InboxScreen() {
  return (
    <Screen title="Inbox">
      <EmptyState icon="mail-outline" title="Inbox" body="Coming in tier 4." />
    </Screen>
  );
}
