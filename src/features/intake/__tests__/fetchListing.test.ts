import { fetchListing } from '../fetchListing';
import { LISTING_PAGE_HTML, SPA_SHELL_HTML } from '../testing/fixtures';

const LISTING_URL = 'https://careers.acme.example/jobs/42';

function htmlResponse(body: string, init: ResponseInit = {}) {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
    ...init,
  });
}

/** A request that only ends when it's aborted, like a stalled connection. */
function stalledFetch(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { promise, reject } = Promise.withResolvers<Response>();
  init?.signal?.addEventListener('abort', () =>
    reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
  );
  return promise;
}

describe('fetchListing', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  afterEach(() => fetchMock.mockReset());
  afterAll(() => fetchMock.mockRestore());

  it('returns the readable text of an HTML listing', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(LISTING_PAGE_HTML));
    const result = await fetchListing(LISTING_URL);
    expect(result.ok && result.value).toContain('Senior React Native Engineer');
  });

  it('reports a 403 as blocked', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse('Forbidden', { status: 403 }));
    expect(await fetchListing(LISTING_URL)).toEqual({
      ok: false,
      error: { kind: 'listing_unreadable', reason: 'blocked' },
    });
  });

  it('reports a PDF as not a web page', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('%PDF-1.7', { status: 200, headers: { 'content-type': 'application/pdf' } }),
    );
    expect(await fetchListing(LISTING_URL)).toEqual({
      ok: false,
      error: { kind: 'listing_unreadable', reason: 'non_html' },
    });
  });

  it('reports a JavaScript-only page as empty', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(SPA_SHELL_HTML));
    expect(await fetchListing(LISTING_URL)).toEqual({
      ok: false,
      error: { kind: 'listing_unreadable', reason: 'empty' },
    });
  });

  it('reports a failed connection as offline', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await fetchListing(LISTING_URL)).toEqual({ ok: false, error: { kind: 'network' } });
  });

  it('gives up with a timeout error when the page takes too long', async () => {
    fetchMock.mockImplementationOnce(stalledFetch);
    expect(await fetchListing(LISTING_URL, { timeoutMs: 20 })).toEqual({
      ok: false,
      error: { kind: 'timeout', afterMs: 20 },
    });
  });
});
