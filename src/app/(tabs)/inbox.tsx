import { router } from 'expo-router';

import { InboxScreen } from '@/features/inbox';

export default function InboxRoute() {
  return (
    <InboxScreen
      onOpenMessage={(messageId) =>
        router.push({ pathname: '/inbox/[messageId]', params: { messageId } })
      }
      onOpenGmailSettings={() => router.push('/inbox/connect-gmail')}
    />
  );
}
