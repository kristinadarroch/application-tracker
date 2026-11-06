import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { selectLatestTimeoutStart, selectMessagesToTriage } from '../selectors';
import { triageNextMessage } from '../thunks';

export interface AutoTriage {
  /** Stopped after a time-out; waiting messages stay untouched until `resume`. */
  paused: boolean;
  /** Messages still waiting for Triage. */
  waiting: number;
  resume: () => void;
}

/**
 * Triages waiting messages one at a time, whenever Triage can run (on-device AI available,
 * or an AI Replay recording exists); never when it can't (UX-7). A time-out means the model
 * is stuck and everything queued behind it would time out too, so the queue pauses until resumed.
 */
export function useAutoTriage(): AutoTriage {
  const dispatch = useAppDispatch();
  const toTriage = useAppSelector(selectMessagesToTriage);
  const latestTimeout = useAppSelector(selectLatestTimeoutStart);
  // Time-outs already present when the inbox opened, or acknowledged by "Analyze remaining", don't pause.
  const [acknowledgedTimeout, setAcknowledgedTimeout] = useState(latestTimeout);
  const paused =
    latestTimeout !== null && (acknowledgedTimeout === null || latestTimeout > acknowledgedTimeout);

  // Re-runs whenever a Triage settles (the waiting list changes); the thunk skips while one runs.
  useEffect(() => {
    if (!paused && toTriage.length > 0) void dispatch(triageNextMessage());
  }, [dispatch, paused, toTriage]);

  return { paused, waiting: toTriage.length, resume: () => setAcknowledgedTimeout(latestTimeout) };
}
