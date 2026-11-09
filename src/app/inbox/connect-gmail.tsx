import * as WebBrowser from 'expo-web-browser';

import { ConnectGmailScreen } from '@/features/inbox';
import { useGoBack } from '@/lib/useGoBack';

// Closes the Google sign-in browser session when it redirects back to the app.
WebBrowser.maybeCompleteAuthSession();

export default function ConnectGmailRoute() {
  const goBack = useGoBack('/inbox');
  return <ConnectGmailScreen onBack={goBack} />;
}
