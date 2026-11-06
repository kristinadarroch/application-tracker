import { useRouter } from 'expo-router';
import { useIncomingShare, type SharePayload } from 'expo-sharing';
import { useEffect, useState } from 'react';

import { EmptyState, Screen } from '@/design-system';
import { ListingIntakeScreen } from '@/features/intake';
import { readSharedListing, type SharedListing } from '@/features/intake';
import { assertNever } from '@/lib/assertNever';

interface ReceivedShare {
  payloads: SharePayload[];
  listing: SharedListing;
  /** Bumped per share so a new share while this screen is open starts a fresh intake. */
  count: number;
}

/** Share-received screen (INT-1): a shared link or text opens intake and starts reading. */
export default function ShareRoute() {
  const router = useRouter();
  const { sharedPayloads, clearSharedPayloads } = useIncomingShare();
  const [received, setReceived] = useState<ReceivedShare>(() => ({
    payloads: sharedPayloads,
    listing: readSharedListing(sharedPayloads),
    count: 0,
  }));

  // Clearing empties `sharedPayloads`; keep showing what was already received.
  if (sharedPayloads !== received.payloads) {
    setReceived(
      sharedPayloads.length > 0
        ? {
            payloads: sharedPayloads,
            listing: readSharedListing(sharedPayloads),
            count: received.count + 1,
          }
        : { ...received, payloads: sharedPayloads },
    );
  }

  useEffect(() => {
    if (sharedPayloads.length > 0) clearSharedPayloads();
  }, [sharedPayloads, clearSharedPayloads]);

  const { listing, count } = received;
  const pasteInstead = { label: 'Paste a listing', onPress: () => router.replace('/intake/new') };
  switch (listing.kind) {
    case 'url':
      return (
        <ListingIntakeScreen
          key={count}
          title="Shared listing"
          initial={{ mode: 'url', url: listing.url, text: listing.text }}
          origin="shared"
          autoSubmit
        />
      );
    case 'text':
      return (
        <ListingIntakeScreen
          key={count}
          title="Shared listing"
          initial={{ mode: 'text', url: '', text: listing.text }}
          origin="shared"
          autoSubmit
        />
      );
    case 'unsupported':
      return (
        <Screen title="Shared listing" onBack={() => router.replace('/')}>
          <EmptyState
            icon="close-circle-outline"
            title="This can’t be imported"
            body="Share a link or text from a job listing, or paste it instead."
            action={pasteInstead}
          />
        </Screen>
      );
    case 'nothing':
      return (
        <Screen title="Shared listing" onBack={() => router.replace('/')}>
          <EmptyState
            icon="share-outline"
            title="Nothing to import"
            body="Nothing was shared with the app. Paste a listing’s text or link instead."
            action={pasteInstead}
          />
        </Screen>
      );
    default:
      return assertNever(listing);
  }
}
