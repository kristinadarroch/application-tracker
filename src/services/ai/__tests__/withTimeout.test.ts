import { isTimedOut, withTimeout } from '../withTimeout';

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the value when the work finishes first', async () => {
    const result = withTimeout(Promise.resolve('done'), 1_000);
    await expect(result).resolves.toBe('done');
  });

  it('reports a timeout when the work is still running at the limit', async () => {
    const never = new Promise<string>(() => {});
    const result = withTimeout(never, 1_000);
    jest.advanceTimersByTime(1_000);
    expect(isTimedOut(await result)).toBe(true);
  });

  it('passes through a rejection instead of reporting a timeout', async () => {
    const result = withTimeout(Promise.reject(new Error('boom')), 1_000);
    await expect(result).rejects.toThrow('boom');
  });
});
