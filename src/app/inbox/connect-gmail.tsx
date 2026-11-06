import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { ConnectGmailScreen } from '@/features/inbox';

// Closes the Google sign-in browser session when it redirects back to the app.
WebBrowser.maybeCompleteAuthSession();

export default function ConnectGmailRoute() {
  return <ConnectGmailScreen onBack={() => router.back()} />;
}
