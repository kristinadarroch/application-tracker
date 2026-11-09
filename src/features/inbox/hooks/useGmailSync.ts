import { useCallback, useSyncExternalStore } from 'react';

import { useAppDispatch } from '@/store/hooks';
import type { AppDispatch } from '@/store/store';

import type { EmailSourceError } from '../emailSource';
import { GmailEmailSource } from '../gmail/gmailEmailSource';
import {
  getGmailAccessToken,
  setGmailAccessToken,
  useGmailAccessToken,
} from '../gmail/gmailSession';
import { syncGmail } from '../thunks';

export type GmailSyncState =
  | { status: 'idle' }
  | { status: 'syncing' }
  | { status: 'synced'; added: number }
  | { status: 'failed'; error: EmailSourceError };

export interface GmailSync {
  /** In memory only; `null` when not connected or after the sign-in expired. */
  accessToken: string | null;
  state: GmailSyncState;
  /**
   * Reads new messages. Does nothing without a token, and joins a sync that is already running.
   * Pass `token` to sync right after sign-in, before the hook re-renders with it.
   */
  sync: (token?: string | null) => Promise<void>;
}

/**
 * One sync state for the whole app, in memory like the token: the app-wide reader
 * (`useEmailReading`), the Inbox, and the Gmail screen all show the same sync.
 */
let syncState: GmailSyncState = { status: 'idle' };
let running: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setSyncState(next: GmailSyncState): void {
  syncState = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function runSync(dispatch: AppDispatch, token: string): Promise<void> {
  setSyncState({ status: 'syncing' });
  const result = await dispatch(
    syncGmail(new GmailEmailSource({ accessToken: token, fetch }), new Date()),
  );
  // An expired token is useless: forget it so the UI asks to reconnect, unless the user already
  // signed in again while this sync ran.
  if (!result.ok && result.error.kind === 'reauth_required' && getGmailAccessToken() === token) {
    setGmailAccessToken(null);
  }
  setSyncState(
    result.ok
      ? { status: 'synced', added: result.value }
      : { status: 'failed', error: result.error },
  );
}

/** Reads new Gmail messages with the in-memory access token (LATER-2, INBX-8). */
export function useGmailSync(): GmailSync {
  const dispatch = useAppDispatch();
  const accessToken = useGmailAccessToken();
  const state = useSyncExternalStore(subscribe, () => syncState);

  const sync = useCallback(
    (token: string | null = accessToken): Promise<void> => {
      if (token === null) return Promise.resolve();
      if (running === null) {
        running = runSync(dispatch, token).finally(() => {
          running = null;
        });
      }
      return running;
    },
    [accessToken, dispatch],
  );

  return { accessToken, state, sync };
}
