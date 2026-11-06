import { Banner, EmptyState } from '@/design-system';
import { assertNever } from '@/lib/assertNever';
import { describeError, type AiUnavailableReason } from '@/lib/errors';

export interface AiUnavailableNoticeProps {
  reason: AiUnavailableReason;
  /** `empty` fills a screen with nothing else to show; `banner` sits above content that stays usable. */
  variant: 'empty' | 'banner';
}

/** UX-7: why AI is missing and what to do, in place of the AI action. */
export function AiUnavailableNotice({ reason, variant }: AiUnavailableNoticeProps) {
  const copy = describeError({ kind: 'ai_unavailable', reason });
  switch (variant) {
    case 'empty':
      return <EmptyState icon="sparkles-outline" title={copy.title} body={copy.body} />;
    case 'banner':
      return <Banner tone="info" title={copy.title} body={copy.body} />;
    default:
      return assertNever(variant);
  }
}
