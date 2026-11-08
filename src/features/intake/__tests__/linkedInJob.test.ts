import { linkFromDeepLink } from '../deepLink';
import { fetchListing } from '../fetchListing';
import {
  canonicalLinkedInJobUrl,
  isLinkedInLink,
  linkedInJobId,
  linkedInListingUrl,
} from '../linkedInJob';

const JOB_ID = '4426021931';
const CANONICAL = 'https://www.linkedin.com/jobs/view/4426021931/';

describe('linkedInJobId (INT-3)', () => {
  it.each([
    ['https://www.linkedin.com/jobs/view/4426021931'],
    ['https://www.linkedin.com/jobs/view/4426021931/'],
    ['http://linkedin.com/jobs/view/4426021931'],
    ['https://m.linkedin.com/jobs/view/4426021931/'],
    ['https://uk.linkedin.com/jobs/view/4426021931'],
    ['https://www.linkedin.com/jobs/view/senior-mobile-engineer-react-native-at-dydx-4426021931'],
    ['https://www.linkedin.com/comm/jobs/view/4426021931/?trackingId=abc%3D%3D&refId=xyz'],
    [
      'https://www.linkedin.com/jobs/view/4426021931/?trk=public_jobs_topcard-title&refId=abc%3D%3D&trackingId=def%3D%3D',
    ],
    ['https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4426021931'],
    [
      'https://www.linkedin.com/jobs/search/?currentJobId=4426021931&keywords=react%20native&origin=JOBS_HOME_SEARCH_BUTTON',
    ],
    ['  https://www.linkedin.com/jobs/view/4426021931  '],
  ])('finds the job in %s', (url) => {
    expect(linkedInJobId(url)).toBe(JOB_ID);
  });

  it.each([
    ['company page', 'https://www.linkedin.com/company/dydx/jobs/'],
    ['post', 'https://www.linkedin.com/posts/dydx_hiring-activity-7260000000000000000-AbCd'],
    ['feed update', 'https://www.linkedin.com/feed/update/urn:li:activity:7260000000000000000/'],
    ['non-numeric id', 'https://www.linkedin.com/jobs/view/senior-engineer'],
    ['id with letters', 'https://www.linkedin.com/jobs/view/4426021931abc'],
    ['non-numeric currentJobId', 'https://www.linkedin.com/jobs/search/?currentJobId=abc'],
    ['job search without a job', 'https://www.linkedin.com/jobs/search/?keywords=react'],
    ['short link', 'https://lnkd.in/gAbC123x'],
    ['look-alike host', 'https://notlinkedin.com/jobs/view/4426021931'],
    [
      'host that only starts with linkedin.com',
      'https://linkedin.com.example/jobs/view/4426021931',
    ],
    ['other site', 'https://careers.acme.example/jobs/view/4426021931'],
    ['non-web scheme', 'linkedin://jobs/view/4426021931'],
    ['not a link', 'linkedin.com/jobs/view/4426021931'],
  ])('ignores a %s', (_label, url) => {
    expect(linkedInJobId(url)).toBeUndefined();
  });

  it('builds the canonical job link', () => {
    expect(canonicalLinkedInJobUrl(JOB_ID)).toBe(CANONICAL);
  });

  it('keeps a canonical link when the job is known, else the link as given', () => {
    expect(linkedInListingUrl('https://m.linkedin.com/jobs/view/4426021931?trk=x')).toBe(CANONICAL);
    expect(linkedInListingUrl(' https://lnkd.in/gAbC123x ')).toBe('https://lnkd.in/gAbC123x');
  });
});

describe('isLinkedInLink (INT-3)', () => {
  it.each([
    ['https://www.linkedin.com/jobs/view/4426021931/'],
    ['http://linkedin.com/company/dydx'],
    ['https://m.linkedin.com/jobs/search/?currentJobId=4426021931'],
    ['https://uk.linkedin.com/posts/x'],
    ['https://lnkd.in/gAbC123x'],
    ['https://LNKD.IN/gAbC123x'],
  ])('recognizes %s', (url) => {
    expect(isLinkedInLink(url)).toBe(true);
  });

  it.each([
    ['https://notlinkedin.com/jobs/view/4426021931'],
    ['https://linkedin.com.example/jobs/view/4426021931'],
    ['https://notlnkd.in/gAbC123x'],
    ['https://careers.acme.example/jobs/42?ref=linkedin.com'],
    ['linkedin://jobs/view/4426021931'],
    ['linkedin.com/jobs/view/4426021931'],
  ])('rejects %s', (url) => {
    expect(isLinkedInLink(url)).toBe(false);
  });
});

describe('fetchListing never loads LinkedIn (INT-3)', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([[CANONICAL], ['https://lnkd.in/gAbC123x']])('makes no request for %s', async (url) => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    expect(await fetchListing(url)).toEqual({
      ok: false,
      error: { kind: 'listing_unreadable', reason: 'blocked' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('linkFromDeepLink (INT-3)', () => {
  it('accepts web links', () => {
    expect(linkFromDeepLink(CANONICAL)).toBe(CANONICAL);
    expect(linkFromDeepLink(['http://acme.example/jobs/42', 'https://other.example'])).toBe(
      'http://acme.example/jobs/42',
    );
  });

  it.each([
    [undefined],
    [''],
    ['   '],
    ['javascript:alert(1)'],
    ['file:///etc/hosts'],
    ['applicationtracker://inbox'],
    ['www.linkedin.com/jobs/view/4426021931'],
  ])('ignores %p', (param) => {
    expect(linkFromDeepLink(param)).toBeUndefined();
  });
});
