import { useCallback, useState } from 'react';

import { useAppDispatch } from '@/store/hooks';

import type { EmailSourceError } from '../emailSource';
import { GmailEmailSource } from '../gmail/gmailEmailSource';
import { setGmailAccessToken, useGmailAccessToken } from '../gmail/gmailSession';
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
  /** Pass `token` to sync right after sign-in, before the hook re-renders with it. */
  sync: (token?: string | null) => Promise<void>;
}

/** Reads new Gmail messages with the in-memory access token (LATER-2). */
export function useGmailSync(): GmailSync {
  const dispatch = useAppDispatch();
  const accessToken = useGmailAccessToken();
  const [state, setState] = useState<GmailSyncState>({ status: 'idle' });

  const sync = useCallback(
    async (token: string | null = accessToken) => {
      if (token === null) return;
      setState({ status: 'syncing' });
      const result = await dispatch(
        syncGmail(new GmailEmailSource({ accessToken: token, fetch }), new Date()),
      );
      // An expired token is useless: forget it so the UI asks to reconnect.
      if (!result.ok && result.error.kind === 'reauth_required') setGmailAccessToken(null);
      setState(
        result.ok
          ? { status: 'synced', added: result.value }
          : { status: 'failed', error: result.error },
      );
    },
    [accessToken, dispatch],
  );

  return { accessToken, state, sync };
}
