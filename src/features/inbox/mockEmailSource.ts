import { z } from 'zod';

import { ok } from '@/lib/result';

import type { EmailSource } from './emailSource';
import fixtureJson from './fixtures/inbox.json';
import { InboxMessageSchema, type InboxMessage } from './schema';

/** Parsed once at load: a malformed fixture fails fast in development and tests. */
export const FIXTURE_MESSAGES: readonly InboxMessage[] = z
  .array(InboxMessageSchema.omit({ origin: true }))
  .parse(fixtureJson)
  .map((message) => ({ ...message, origin: 'mock' as const }));

/**
 * The fixture at `index`, stamped as arriving at `receivedAt` so the demo inbox feels live
 * and proposed due dates are relative to the demo day (INBX-6). `undefined` once all are delivered.
 */
export function deliverFixture(index: number, receivedAt: string): InboxMessage | undefined {
  const fixture = FIXTURE_MESSAGES[index];
  return fixture === undefined ? undefined : { ...fixture, receivedAt };
}

/** Sample Email Source backed by `fixtures/inbox.json` (ADR 0002). */
export class MockEmailSource implements EmailSource {
  constructor(private readonly messages: readonly InboxMessage[] = FIXTURE_MESSAGES) {}

  async listRecent(since: string) {
    const sinceMs = Date.parse(since);
    return ok(
      this.messages
        .filter((message) => Number.isNaN(sinceMs) || Date.parse(message.receivedAt) > sinceMs)
        .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt)),
    );
  }
}
