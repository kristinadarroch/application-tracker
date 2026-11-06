import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * A `Date` that stays stable between renders, so `now`-keyed selectors stay memoized.
 * Refreshes when the app returns to the foreground, so urgency is right after midnight.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setNow(new Date());
    });
    return () => subscription.remove();
  }, []);
  return now;
}
