import type { SharePayload } from 'expo-sharing';

import { redirectSystemPath } from '@/app/+native-intent';

import { manualFormParams, recoveryFor } from '../manualFallback';
import { readSharedListing } from '../sharedListing';

describe('redirectSystemPath (INT-1)', () => {
  it('sends incoming shares to the share-received screen', () => {
    expect(
      redirectSystemPath({ path: 'applicationtracker://expo-sharing?dataUrl=x', initial: true }),
    ).toBe('/intake/share');
  });

  it('leaves every other link alone', () => {
    expect(redirectSystemPath({ path: '/application/app_1', initial: false })).toBe(
      '/application/app_1',
    );
    expect(redirectSystemPath({ path: 'applicationtracker://inbox', initial: true })).toBe(
      'applicationtracker://inbox',
    );
  });

  it('falls back to the Pipeline for a path it can’t parse', () => {
    expect(redirectSystemPath({ path: 'http://[bad', initial: true })).toBe('/');
  });
});

describe('readSharedListing (INT-1)', () => {
  const payload = (shareType: SharePayload['shareType'], value: string): SharePayload => ({
    shareType,
    value,
  });

  it('opens a shared URL in link mode', () => {
    expect(readSharedListing([payload('url', 'https://acme.example/jobs/42')])).toEqual({
      kind: 'url',
      url: 'https://acme.example/jobs/42',
      text: '',
    });
  });

  it('opens shared text that contains a link in link mode and keeps the text', () => {
    const text = 'Senior React Native Engineer at Acme https://acme.example/jobs/42';
    expect(readSharedListing([payload('text', text)])).toEqual({
      kind: 'url',
      url: 'https://acme.example/jobs/42',
      text,
    });
  });

  it('opens plain shared text in paste mode', () => {
    expect(readSharedListing([payload('text', ' Acme Health is hiring. ')])).toEqual({
      kind: 'text',
      text: 'Acme Health is hiring.',
    });
  });

  it('rejects images, files, and non-web URLs', () => {
    expect(readSharedListing([payload('image', 'file:///photo.jpg')])).toEqual({
      kind: 'unsupported',
    });
    expect(readSharedListing([payload('file', 'file:///listing.pdf')])).toEqual({
      kind: 'unsupported',
    });
    expect(readSharedListing([payload('url', 'mailto:jobs@acme.example')])).toEqual({
      kind: 'unsupported',
    });
  });

  it('reports when nothing was shared', () => {
    expect(readSharedListing([])).toEqual({ kind: 'nothing' });
  });
});

describe('intake recovery (INT-3, INT-5)', () => {
  it('switches to paste mode only when the page couldn’t be loaded', () => {
    expect(recoveryFor({ kind: 'network' })).toBe('paste_text');
    expect(recoveryFor({ kind: 'listing_unreadable', reason: 'login_wall' })).toBe('paste_text');
    expect(recoveryFor({ kind: 'invalid_response', issues: [] })).toBe('retry_or_manual');
    expect(recoveryFor({ kind: 'timeout', afterMs: 20_000 })).toBe('retry_or_manual');
  });

  it('prefills the manual form with what the user entered and leaves out blanks', () => {
    expect(
      manualFormParams({
        text: ' Listing text ',
        url: '',
        extraction: { company: 'Acme Health', role: '', requirements: [] },
        aiNote: 'AI couldn’t find the company or role.',
      }),
    ).toEqual({
      company: 'Acme Health',
      notes: 'Listing text',
      aiNote: 'AI couldn’t find the company or role.',
    });
  });
});
