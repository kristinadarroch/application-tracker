import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { selectMessagesToTriage } from '../selectors';
import { startTriage } from '../thunks';

/**
 * Starts Triage for every message that hasn't been triaged yet, whenever Triage can run
 * (on-device AI available, or an AI Replay recording exists). Never runs when it can't (UX-7).
 */
export function useAutoTriage(): void {
  const dispatch = useAppDispatch();
  const toTriage = useAppSelector(selectMessagesToTriage);
  useEffect(() => {
    for (const message of toTriage) void dispatch(startTriage(message.id));
  }, [dispatch, toTriage]);
}
