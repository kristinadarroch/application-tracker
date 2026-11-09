import { describeError } from '../errors';

describe('describeError', () => {
  it('says an expired listing is gone', () => {
    expect(describeError({ kind: 'listing_unreadable', reason: 'gone' })).toEqual({
      title: 'This listing is gone',
      body: 'The page no longer exists. Paste the listing text instead.',
      retryable: false,
    });
  });

  it('still says a refused page was blocked', () => {
    expect(describeError({ kind: 'listing_unreadable', reason: 'blocked' }).body).toBe(
      'The site blocked the request. Paste the listing text instead.',
    );
  });
});
