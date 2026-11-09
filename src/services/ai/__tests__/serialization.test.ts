import { z } from 'zod';

const schema = z.object({ value: z.string() });

type Deferred = { resolve: (value: unknown) => void };
const calls: Deferred[] = [];

jest.mock('react-native', () => ({ Platform: { OS: 'ios', Version: '27.0' } }));
jest.mock('@react-native-ai/apple', () => ({
  apple: Object.assign(() => 'apple-model', { isAvailable: () => true }),
}));
jest.mock('ai', () => ({
  Output: { object: () => 'object-output' },
  NoObjectGeneratedError: { isInstance: () => false },
  generateText: () => {
    const { promise, resolve } = Promise.withResolvers<unknown>();
    calls.push({ resolve });
    return promise;
  },
}));

// Imported after the mocks so the iOS adapter binds to them.
// eslint-disable-next-line import/first
import { onDeviceModel } from '../foundationModels.ios';

const request = {
  instructions: 'Extract.',
  prompt: 'Text',
  schema,
  maxOutputTokens: 50,
  sampling: 'repeatable' as const,
};

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

describe('on-device generation queue', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('starts the next native request only after the previous one settles', async () => {
    const first = onDeviceModel.generate({ ...request, timeoutMs: 10_000 });
    const second = onDeviceModel.generate({ ...request, timeoutMs: 10_000 });
    await flush();
    expect(calls).toHaveLength(1);

    calls[0]?.resolve({ output: { value: 'one' } });
    await expect(first).resolves.toEqual({ ok: true, value: { value: 'one' } });
    await flush();
    expect(calls).toHaveLength(2);

    calls[1]?.resolve({ output: { value: 'two' } });
    await expect(second).resolves.toEqual({ ok: true, value: { value: 'two' } });
  });

  it('keeps later requests waiting while a timed-out request is still running natively', async () => {
    const slow = await onDeviceModel.generate({ ...request, timeoutMs: 5 });
    expect(slow).toEqual({ ok: false, error: { kind: 'timeout', afterMs: 5 } });

    const next = onDeviceModel.generate({ ...request, timeoutMs: 10_000 });
    await flush();
    expect(calls).toHaveLength(1); // the timed-out native call still occupies the model

    calls[0]?.resolve({ output: { value: 'late' } });
    await flush();
    expect(calls).toHaveLength(2);
    calls[1]?.resolve({ output: { value: 'next' } });
    await expect(next).resolves.toEqual({ ok: true, value: { value: 'next' } });
  });

  it('skips a queued request that timed out before its turn', async () => {
    const first = onDeviceModel.generate({ ...request, timeoutMs: 10_000 });
    const abandoned = await onDeviceModel.generate({ ...request, timeoutMs: 5 });
    expect(abandoned).toEqual({ ok: false, error: { kind: 'timeout', afterMs: 5 } });

    calls[0]?.resolve({ output: { value: 'one' } });
    await expect(first).resolves.toEqual({ ok: true, value: { value: 'one' } });
    await flush();
    expect(calls).toHaveLength(1);
  });
});
