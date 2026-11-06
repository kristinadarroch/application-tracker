import { GmailEmailSource, type Fetch } from '../gmailEmailSource';

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const json = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

interface Route {
  match: (url: string) => boolean;
  respond: () => Response;
}

/** Fake `fetch` answering by URL; records every requested URL. */
function fakeFetch(routes: Route[]) {
  const urls: string[] = [];
  const fetch: Fetch = async (url) => {
    urls.push(url);
    const route = routes.find((r) => r.match(url));
    if (route === undefined) throw new Error(`Unexpected request ${url}`);
    return route.respond();
  };
  return { fetch, urls };
}

const listPage = (ids: string[], nextPageToken?: string) =>
  json({
    messages: ids.map((id) => ({ id, threadId: id })),
    ...(nextPageToken ? { nextPageToken } : {}),
  });

const multipartMessage = (id: string, date: string) =>
  json({
    id,
    internalDate: '0',
    payload: {
      mimeType: 'multipart/mixed',
      headers: [
        { name: 'From', value: '"Priya Shah" <priya.shah@acmehealth.com>' },
        { name: 'Subject', value: 'Interview invitation' },
        { name: 'Date', value: date },
      ],
      parts: [
        {
          mimeType: 'multipart/alternative',
          parts: [
            {
              mimeType: 'text/plain',
              body: { data: toBase64Url('Hi — book a slot by Friday. Café at 3?') },
            },
            { mimeType: 'text/html', body: { data: toBase64Url('<p>ignored</p>') } },
          ],
        },
        { mimeType: 'application/pdf', body: { attachmentId: 'a1' } },
      ],
    },
  });

const LIST = (url: string) => url.includes('/messages?');
const SINCE = '2026-11-01T00:00:00.000Z';

describe('GmailEmailSource', () => {
  it('follows nextPageToken across pages and fetches each message in full', async () => {
    const { fetch, urls } = fakeFetch([
      {
        match: (url) => LIST(url) && url.includes('pageToken=p2'),
        respond: () => listPage(['m3']),
      },
      { match: LIST, respond: () => listPage(['m1', 'm2'], 'p2') },
      {
        match: (url) => url.includes('/messages/m'),
        respond: () => multipartMessage('m', 'Tue, 03 Nov 2026 09:00:00 +0000'),
      },
    ]);
    const source = new GmailEmailSource({ accessToken: 'token', fetch });

    const result = await source.listRecent(SINCE);

    expect(result.ok && result.value).toHaveLength(3);
    expect(urls.filter(LIST)).toHaveLength(2);
    expect(urls[0]).toContain(
      `q=${encodeURIComponent(`newer_than:30d category:primary after:${Date.parse(SINCE) / 1000}`)}`,
    );
    expect(urls.filter((url) => url.includes('format=full'))).toHaveLength(3);
  });

  it('maps headers and decodes the base64url text/plain part of a nested multipart body', async () => {
    const { fetch } = fakeFetch([
      { match: LIST, respond: () => listPage(['abc']) },
      {
        match: (url) => url.includes('/messages/abc'),
        respond: () => multipartMessage('abc', 'Tue, 03 Nov 2026 09:00:00 +0000'),
      },
    ]);

    const result = await new GmailEmailSource({ accessToken: 'token', fetch }).listRecent(SINCE);

    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 'gmail_abc',
          from: 'priya.shah@acmehealth.com',
          fromName: 'Priya Shah',
          subject: 'Interview invitation',
          receivedAt: '2026-11-03T09:00:00.000Z',
          bodyText: 'Hi — book a slot by Friday. Café at 3?',
          origin: 'gmail',
        },
      ],
    });
  });

  it('falls back to the HTML part with tags stripped when there is no plain text', async () => {
    const html =
      '<html><head><style>p{color:red}</style></head><body><p>Please submit the take-home &amp; reply.</p><p>Thanks<br>Jordan</p></body></html>';
    const { fetch } = fakeFetch([
      { match: LIST, respond: () => listPage(['h1']) },
      {
        match: (url) => url.includes('/messages/h1'),
        respond: () =>
          json({
            id: 'h1',
            internalDate: String(Date.parse('2026-11-04T10:00:00.000Z')),
            payload: {
              mimeType: 'text/html',
              headers: [
                { name: 'From', value: 'jordan.lee@northwindlabs.com' },
                { name: 'Subject', value: 'Take-home' },
              ],
              body: { data: toBase64Url(html) },
            },
          }),
      },
    ]);

    const result = await new GmailEmailSource({ accessToken: 'token', fetch }).listRecent(SINCE);

    expect(result.ok && result.value[0]).toMatchObject({
      from: 'jordan.lee@northwindlabs.com',
      receivedAt: '2026-11-04T10:00:00.000Z',
      bodyText: 'Please submit the take-home & reply.\nThanks\nJordan',
    });
  });

  it('asks to sign in again on 401', async () => {
    const { fetch } = fakeFetch([{ match: LIST, respond: () => json({}, 401) }]);

    const result = await new GmailEmailSource({ accessToken: 'expired', fetch }).listRecent(SINCE);

    expect(result).toEqual({ ok: false, error: { kind: 'reauth_required' } });
  });

  it('reports a network failure when fetch throws, and other statuses as source failures', async () => {
    const offline: Fetch = async () => {
      throw new TypeError('Network request failed');
    };
    const { fetch: failing } = fakeFetch([{ match: LIST, respond: () => json({}, 503) }]);

    expect(
      await new GmailEmailSource({ accessToken: 't', fetch: offline }).listRecent(SINCE),
    ).toEqual({
      ok: false,
      error: { kind: 'network' },
    });
    expect(
      await new GmailEmailSource({ accessToken: 't', fetch: failing }).listRecent(SINCE),
    ).toEqual({
      ok: false,
      error: { kind: 'source_failed', status: 503 },
    });
  });

  it('sends the access token as a bearer header', async () => {
    const seen: string[] = [];
    const fetch: Fetch = async (_url, init) => {
      seen.push(init.headers.Authorization ?? '');
      return listPage([]);
    };

    await new GmailEmailSource({ accessToken: 'secret', fetch }).listRecent(SINCE);

    expect(seen).toEqual(['Bearer secret']);
  });
});
