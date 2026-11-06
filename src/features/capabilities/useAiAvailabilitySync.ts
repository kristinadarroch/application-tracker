import { useEffect } from 'react';
import { AppState } from 'react-native';

import { onDeviceModel } from '@/services/ai/foundationModels';
import { useAppDispatch } from '@/store/hooks';

import { aiAvailabilityChecked } from './slice';

/**
 * Checks AI availability at launch and whenever the app returns to the foreground,
 * so turning Apple Intelligence on in Settings takes effect without a restart (UX-7).
 */
export function useAiAvailabilitySync(): void {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(aiAvailabilityChecked(onDeviceModel.availability()));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') dispatch(aiAvailabilityChecked(onDeviceModel.availability()));
    });
    return () => subscription.remove();
  }, [dispatch]);
}
