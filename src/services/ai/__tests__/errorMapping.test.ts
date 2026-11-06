import { NoObjectGeneratedError } from 'ai';

import { mapAppleError } from '../errorMapping';

describe('mapAppleError', () => {
  it('maps a schema mismatch from the AI SDK to invalid_response', () => {
    const error = new NoObjectGeneratedError({
      message: 'No object generated: response did not match schema.',
      text: '{}',
      response: { id: '1', timestamp: new Date(0), modelId: 'apple' },
      usage: {
        inputTokens: undefined,
        inputTokenDetails: {
          noCacheTokens: undefined,
          cacheReadTokens: undefined,
          cacheWriteTokens: undefined,
        },
        outputTokens: undefined,
        outputTokenDetails: { textTokens: undefined, reasoningTokens: undefined },
        totalTokens: undefined,
      },
      finishReason: 'stop',
    });
    expect(mapAppleError(error)).toEqual({
      kind: 'invalid_response',
      issues: ['No object generated: response did not match schema.'],
    });
  });

  it('maps the native MODEL_UNAVAILABLE rejection to ai_unavailable', () => {
    const error = Object.assign(new Error('Apple Intelligence model is not available'), {
      code: 'MODEL_UNAVAILABLE',
    });
    expect(mapAppleError(error)).toEqual({
      kind: 'ai_unavailable',
      reason: 'apple_intelligence_unavailable',
    });
  });

  it.each([
    ['Exceeded model context window size', { kind: 'context_too_long' }],
    ['The content exceeded the context size limit.', { kind: 'context_too_long' }],
    ['Detected content likely to be unsafe (guardrail violation).', { kind: 'content_blocked' }],
  ])('maps the Foundation Models message %j', (message, expected) => {
    expect(mapAppleError(Object.assign(new Error(message), { code: 'AppleLLM' }))).toEqual(
      expected,
    );
  });

  it('keeps the code of an unrecognised failure so it can be diagnosed', () => {
    expect(mapAppleError(Object.assign(new Error('Rate limited'), { code: 'AppleLLM' }))).toEqual({
      kind: 'ai_failed',
      code: 'AppleLLM',
    });
  });
});
