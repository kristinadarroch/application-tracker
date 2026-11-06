import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/**
 * The OAuth client id this platform needs (Google Cloud console, test users only),
 * or `undefined` when it isn't configured and Gmail can't be connected.
 */
export const platformClientId: string | undefined =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  }) || undefined;

/**
 * The Gmail access token, kept in memory only: never persisted, gone on restart.
 * A tiny external store so screens re-render when it changes.
 */
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function setGmailAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGmailAccessToken(): string | null {
  return useSyncExternalStore(subscribe, () => accessToken);
}
