import { useState } from 'react';

import { useAnnounce } from './useAnnounce';

/**
 * Like `useAnnounce`, but stays quiet for the value present on mount: speaks `message` only once
 * it differs from what the screen opened with (e.g. an outcome the user just caused), and every
 * new value after that. Avoids re-announcing settled state each time a screen opens.
 */
export function useAnnounceChange(message: string | undefined): void {
  const [initial] = useState(message);
  const [changed, setChanged] = useState(false);
  const differs = message !== initial;
  // Adjusting state during render (React's "storing information from previous renders" pattern).
  if (differs && !changed) setChanged(true);
  useAnnounce(changed || differs ? message : undefined);
}
