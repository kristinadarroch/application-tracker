import { useEffect, useEffectEvent } from 'react';
import { AppState } from 'react-native';

import { useAutoTriage } from './useAutoTriage';
import { useGmailSync } from './useGmailSync';

export interface EmailReading {
  /** Reads new Gmail messages now, when a Gmail token exists (e.g. when the Inbox tab is focused). */
  syncGmail: () => void;
}

/**
 * The inbox's app-wide reader, mounted once in the root layout (INBX-8). New messages are triaged
 * and confident updates applied even when the Inbox tab isn't open. With a Gmail token it reads
 * new mail when the app opens (the token arrives) and whenever the app returns to the foreground.
 * No timers: reading only happens on those events, Inbox focus, and pull-to-refresh.
 */
export function useEmailReading(): EmailReading {
  useAutoTriage();
  const { accessToken, sync } = useGmailSync();

  // Reads the latest `sync` when an event fires, without re-subscribing.
  const syncNow = useEffectEvent(() => void sync());

  useEffect(() => {
    if (accessToken !== null) syncNow();
  }, [accessToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') syncNow();
    });
    return () => subscription.remove();
  }, []);

  return { syncGmail: () => void sync() };
}
