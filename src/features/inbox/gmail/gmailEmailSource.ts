import { z } from 'zod';

import { MessageIdSchema } from '@/lib/ids';
import { err, ok, type Result } from '@/lib/result';

import type { EmailSource, EmailSourceError } from '../emailSource';
import { InboxMessageSchema, type InboxMessage } from '../schema';

const API = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const PAGE_SIZE = 25;
/** Reads at most this many messages per sync. */
export const MAX_MESSAGES = 50;
/** Message details are fetched in batches to stay under Gmail's per-user rate limit. */
const DETAIL_BATCH = 10;

const ListResponseSchema = z.object({
  messages: z.array(z.object({ id: z.string() })).optional(),
  nextPageToken: z.string().optional(),
});

const GmailPartSchema = z.object({
  mimeType: z.string().optional(),
  headers: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  body: z.object({ data: z.string().optional() }).optional(),
  get parts() {
    return z.array(GmailPartSchema).optional();
  },
});
type GmailPart = z.infer<typeof GmailPartSchema>;

const GmailMessageSchema = z.object({
  id: z.string(),
  internalDate: z.string().optional(),
  payload: GmailPartSchema,
});
type GmailMessage = z.infer<typeof GmailMessageSchema>;

/** `fetch` is injected so the source is testable without a network. */
export type Fetch = (url: string, init: { headers: Record<string, string> }) => Promise<Response>;

/**
 * Reads recent primary-inbox mail with the `gmail.readonly` scope (LATER-2).
 * The access token lives only in memory; this class never stores it.
 */
export class GmailEmailSource implements EmailSource {
  constructor(private readonly options: { accessToken: string; fetch: Fetch }) {}

  async listRecent(since: string): Promise<Result<InboxMessage[], EmailSourceError>> {
    const ids = await this.listIds(since);
    if (!ids.ok) return ids;
    const messages: InboxMessage[] = [];
    for (let start = 0; start < ids.value.length; start += DETAIL_BATCH) {
      const batch = await Promise.all(
        ids.value.slice(start, start + DETAIL_BATCH).map((id) => this.getMessage(id)),
      );
      for (const result of batch) {
        if (!result.ok) return result;
        if (result.value !== undefined) messages.push(result.value);
      }
    }
    return ok(messages.sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt)));
  }

  private async listIds(since: string): Promise<Result<string[], EmailSourceError>> {
    const sinceMs = Date.parse(since);
    const query = [
      'newer_than:30d',
      'category:primary',
      ...(Number.isNaN(sinceMs) ? [] : [`after:${Math.floor(sinceMs / 1000)}`]),
    ].join(' ');
    const ids: string[] = [];
    let pageToken: string | undefined;
    do {
      const url =
        `${API}?q=${encodeURIComponent(query)}&maxResults=${PAGE_SIZE}` +
        (pageToken === undefined ? '' : `&pageToken=${encodeURIComponent(pageToken)}`);
      const page = await this.getJson(url, ListResponseSchema);
      if (!page.ok) return page;
      ids.push(...(page.value.messages ?? []).map((message) => message.id));
      pageToken = page.value.nextPageToken;
    } while (pageToken !== undefined && ids.length < MAX_MESSAGES);
    return ok(ids.slice(0, MAX_MESSAGES));
  }

  /**
   * `undefined` when the message can't become an Inbox Message (e.g. no sender address) or was
   * deleted between listing and fetching (404).
   */
  private async getMessage(
    id: string,
  ): Promise<Result<InboxMessage | undefined, EmailSourceError>> {
    const response = await this.getJson(
      `${API}/${encodeURIComponent(id)}?format=full`,
      GmailMessageSchema,
    );
    if (response.ok) return ok(toInboxMessage(response.value));
    const gone = response.error.kind === 'source_failed' && response.error.status === 404;
    return gone ? ok(undefined) : response;
  }

  private async getJson<S extends z.ZodType>(
    url: string,
    schema: S,
  ): Promise<Result<z.infer<S>, EmailSourceError>> {
    let response: Response;
    try {
      response = await this.options.fetch(url, {
        headers: { Authorization: `Bearer ${this.options.accessToken}` },
      });
    } catch {
      return err({ kind: 'network' });
    }
    if (response.status === 401) return err({ kind: 'reauth_required' });
    if (!response.ok) return err({ kind: 'source_failed', status: response.status });
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      return err({ kind: 'invalid_response', issues: ['Gmail response was not JSON'] });
    }
    const parsed = schema.safeParse(json);
    return parsed.success
      ? ok(parsed.data)
      : err({ kind: 'invalid_response', issues: parsed.error.issues.map((i) => i.message) });
  }
}

export function toInboxMessage(message: GmailMessage): InboxMessage | undefined {
  const header = (name: string) =>
    message.payload.headers?.find((h) => h.name.toLowerCase() === name)?.value;
  const sender = parseSender(header('from') ?? '');
  const dateMs = Date.parse(header('date') ?? '');
  const receivedMs = Number.isNaN(dateMs) ? Number(message.internalDate) : dateMs;
  const parsed = InboxMessageSchema.safeParse({
    id: MessageIdSchema.parse(`gmail_${message.id}`),
    from: sender.email,
    ...(sender.name === undefined ? {} : { fromName: sender.name }),
    subject: header('subject') ?? '',
    receivedAt: Number.isFinite(receivedMs) ? new Date(receivedMs).toISOString() : '',
    bodyText: bodyText(message.payload),
    origin: 'gmail',
  });
  return parsed.success ? parsed.data : undefined;
}

/** `"Priya Shah" <priya@acme.com>`, `Priya Shah <priya@acme.com>`, or `priya@acme.com`. */
function parseSender(value: string): { email: string; name?: string } {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(value);
  if (match === null) return { email: value.trim() };
  const name = match[1]?.trim() ?? '';
  const email = match[2]?.trim() ?? '';
  return name.length === 0 ? { email } : { email, name };
}

/** Plain text from the first `text/plain` part; otherwise the first `text/html` part with tags removed. */
export function bodyText(payload: GmailPart): string {
  const plain = findPartData(payload, 'text/plain');
  if (plain !== undefined) return decodeBase64Url(plain).trim();
  const html = findPartData(payload, 'text/html');
  return html === undefined ? '' : htmlToText(decodeBase64Url(html));
}

function findPartData(part: GmailPart, mimeType: string): string | undefined {
  if (part.mimeType === mimeType && part.body?.data !== undefined) return part.body.data;
  for (const child of part.parts ?? []) {
    const found = findPartData(child, mimeType);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** Gmail encodes bodies as base64url UTF-8. */
export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const percentEncoded = Array.from(
    binary,
    (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`,
  ).join('');
  try {
    return decodeURIComponent(percentEncoded);
  } catch {
    // Not valid UTF-8 (e.g. a legacy charset): keep the bytes as Latin-1.
    return binary;
  }
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}
