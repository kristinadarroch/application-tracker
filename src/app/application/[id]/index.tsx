import { ApplicationDetailScreen } from '@/features/applications';
import { EmailUpdatesSection } from '@/features/inbox';

export default function ApplicationDetailRoute() {
  return (
    <ApplicationDetailScreen
      emailUpdates={(applicationId) => <EmailUpdatesSection applicationId={applicationId} />}
    />
  );
}
