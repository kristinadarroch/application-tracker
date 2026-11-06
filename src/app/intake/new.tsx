import { ListingIntakeScreen } from '@/features/intake/components/ListingIntakeScreen';
import type { IntakeInput } from '@/features/intake/hooks/useListingIntake';

const EMPTY_INPUT: IntakeInput = { mode: 'text', text: '', url: '' };

/** Paste a listing's text or link (INT-2, INT-3). */
export default function NewIntakeRoute() {
  return (
    <ListingIntakeScreen
      title="Add from a listing"
      initial={EMPTY_INPUT}
      origin="typed"
      autoSubmit={false}
    />
  );
}
