import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { selectMessagesToTriage, selectTriagePaused } from '../selectors';
import { triageNextMessage } from '../thunks';

/**
 * Triages waiting messages one at a time, whenever Triage can run (on-device AI available,
 * or an AI Replay recording exists); never when it can't (UX-7). A time-out means the model
 * is stuck and everything queued behind it would time out too, so the queue pauses until the
 * user taps "Analyze remaining" (`triageResumed`). Mounted once, app-wide (`useEmailReading`).
 */
export function useAutoTriage(): void {
  const dispatch = useAppDispatch();
  const toTriage = useAppSelector(selectMessagesToTriage);
  const paused = useAppSelector(selectTriagePaused);

  // Re-runs whenever a Triage settles (the waiting list changes); the thunk skips while one runs.
  useEffect(() => {
    if (!paused && toTriage.length > 0) void dispatch(triageNextMessage());
  }, [dispatch, paused, toTriage]);
}
