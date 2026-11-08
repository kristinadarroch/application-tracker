import { useLocalSearchParams } from 'expo-router';

import { linkFromDeepLink, ListingIntakeScreen } from '@/features/intake';
import type { IntakeInput } from '@/features/intake';

const EMPTY_INPUT: IntakeInput = { mode: 'url', text: '', url: '' };

/**
 * Add a job from its link, or paste the listing's text (INT-2, INT-3).
 * `applicationtracker://intake/new?url=<encoded link>` fills in the link and starts reading,
 * the same as a pasted link; without a web link in `url` the screen opens empty.
 */
export default function NewIntakeRoute() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const link = linkFromDeepLink(url);
  return (
    <ListingIntakeScreen
      // A new link while the screen is open starts a fresh intake.
      key={link ?? ''}
      title="Add from a link"
      initial={link === undefined ? EMPTY_INPUT : { mode: 'url', text: '', url: link }}
      origin="typed"
      autoSubmit={link !== undefined}
    />
  );
}
