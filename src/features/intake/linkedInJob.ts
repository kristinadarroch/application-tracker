/**
 * LinkedIn job links. LinkedIn's terms don't allow apps to load its pages, so the app never
 * makes a request to LinkedIn: a LinkedIn link is only recognized and saved with the listing,
 * and the user pastes the job description instead.
 */

const JOB_ID = /^\d+$/;
/** `/jobs/view/<id>`, `/jobs/view/<slug>-<id>`, and the same under `/comm/` (email links). */
const JOB_VIEW_PATH = /^\/(?:comm\/)?jobs\/view\/(?:[^/]*-)?(\d+)(?:\/|$)/i;

function parseWebUrl(url: string): URL | undefined {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isHost(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

/** Any web link to LinkedIn: `linkedin.com` or a subdomain, or an `lnkd.in` short link. */
export function isLinkedInLink(url: string): boolean {
  const parsed = parseWebUrl(url);
  return (
    parsed !== undefined &&
    (isHost(parsed.hostname, 'linkedin.com') || isHost(parsed.hostname, 'lnkd.in'))
  );
}

/**
 * The job ID in a LinkedIn job link, or `undefined` when the link isn't one. Accepts
 * `linkedin.com` and any subdomain (`www.`, `m.`, country sites), job view paths with or
 * without a title slug, and search or collection pages that name the job in `currentJobId`.
 */
export function linkedInJobId(url: string): string | undefined {
  const parsed = parseWebUrl(url);
  if (parsed === undefined || !isHost(parsed.hostname, 'linkedin.com')) return undefined;
  const fromPath = JOB_VIEW_PATH.exec(parsed.pathname)?.[1];
  if (fromPath !== undefined) return fromPath;
  const fromQuery = parsed.searchParams.get('currentJobId');
  return fromQuery !== null && JOB_ID.test(fromQuery) ? fromQuery : undefined;
}

/** The link saved on the draft: the same job always gets the same link, with no tracking. */
export function canonicalLinkedInJobUrl(id: string): string {
  return `https://www.linkedin.com/jobs/view/${id}/`;
}

/** The link to keep with a LinkedIn listing: canonical when the job ID is known, else as given. */
export function linkedInListingUrl(url: string): string {
  const id = linkedInJobId(url);
  return id === undefined ? url.trim() : canonicalLinkedInJobUrl(id);
}
