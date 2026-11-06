import { ListingIntakeScreen } from '@/features/intake';
import type { IntakeInput } from '@/features/intake';

const EMPTY_INPUT: IntakeInput = { mode: 'url', text: '', url: '' };

/** Add a job from its link, or paste the listing's text (INT-2, INT-3). */
export default function NewIntakeRoute() {
  return (
    <ListingIntakeScreen
      title="Add from a link"
      initial={EMPTY_INPUT}
      origin="typed"
      autoSubmit={false}
    />
  );
}
