import { useLocalSearchParams } from 'expo-router';

import { ErrorState, Screen } from '@/design-system';
import { MessageDetailScreen } from '@/features/inbox';
import { MessageIdSchema } from '@/lib/ids';
import { useGoBack } from '@/lib/useGoBack';

export default function MessageRoute() {
  const params = useLocalSearchParams<{ messageId: string }>();
  const goBack = useGoBack('/inbox');
  const messageId = MessageIdSchema.safeParse(params.messageId);
  if (!messageId.success) {
    return (
      <Screen title="Message" onBack={goBack}>
        <ErrorState error={{ kind: 'not_found', entity: 'message' }} />
      </Screen>
    );
  }
  return <MessageDetailScreen messageId={messageId.data} onBack={goBack} />;
}
