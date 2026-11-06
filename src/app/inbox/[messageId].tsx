import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState, Screen } from '@/design-system';
import { MessageDetailScreen } from '@/features/inbox/components/MessageDetailScreen';
import { MessageIdSchema } from '@/lib/ids';

export default function MessageRoute() {
  const params = useLocalSearchParams<{ messageId: string }>();
  const messageId = MessageIdSchema.safeParse(params.messageId);
  if (!messageId.success) {
    return (
      <Screen title="Message" onBack={() => router.back()}>
        <ErrorState error={{ kind: 'not_found', entity: 'message' }} />
      </Screen>
    );
  }
  return <MessageDetailScreen messageId={messageId.data} onBack={() => router.back()} />;
}
