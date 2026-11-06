import type { AppError } from '@/lib/errors';
import { err, ok, type Result } from '@/lib/result';
import { BUDGET_CONTEXT_TOKENS, type OnDeviceModel } from '@/services/ai/model';

/** A scripted `OnDeviceModel` for tests. Only imported by tests. */
export interface FakeModel extends OnDeviceModel {
  /** What the next `generate` call returns; values are parsed with the request's schema, like the real adapter. */
  nextResult: Result<unknown, AppError>;
  /** Every prompt sent, oldest first. */
  prompts: string[];
}

export function createFakeModel(): FakeModel {
  const model: FakeModel = {
    nextResult: err({ kind: 'ai_failed', code: 'not_scripted' }),
    prompts: [],
    availability: () => ({ status: 'available', contextTokens: BUDGET_CONTEXT_TOKENS }),
    async generate(request) {
      model.prompts.push(request.prompt);
      const result = model.nextResult;
      return result.ok ? ok(request.schema.parse(result.value)) : err(result.error);
    },
  };
  return model;
}

/** Shared instance for `jest.mock('@/services/ai/foundationModels', …)` in screen tests. */
export const fakeModel = createFakeModel();
