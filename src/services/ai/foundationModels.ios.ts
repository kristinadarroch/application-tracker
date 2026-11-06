import { apple } from '@react-native-ai/apple';
import { generateText, Output } from 'ai';
import { Platform } from 'react-native';

import { err, ok } from '@/lib/result';

import { mapAppleError } from './errorMapping';
import { BUDGET_CONTEXT_TOKENS, type AiAvailability, type OnDeviceModel } from './model';
import { isTimedOut, withTimeout } from './withTimeout';

const MIN_IOS_MAJOR = 26;
/** Apple Intelligence through `@react-native-ai/apple` (AI SDK provider, iOS 26+). */
export const onDeviceModel: OnDeviceModel = {
  availability(): AiAvailability {
    if (Number.parseInt(String(Platform.Version), 10) < MIN_IOS_MAJOR) {
      return { status: 'unavailable', reason: 'os_too_old' };
    }
    // The provider reports a boolean only, so "not eligible", "turned off", and "still downloading" look the same.
    if (!apple.isAvailable()) {
      return { status: 'unavailable', reason: 'apple_intelligence_unavailable' };
    }
    return { status: 'available', contextTokens: BUDGET_CONTEXT_TOKENS };
  },

  async generate({ instructions, prompt, schema, timeoutMs, deterministic }) {
    const current = this.availability();
    if (current.status === 'unavailable') {
      return err({ kind: 'ai_unavailable', reason: current.reason });
    }
    try {
      // Each call is a fresh on-device session, so context never accumulates.
      const response = await withTimeout(
        generateText({
          model: apple(),
          system: instructions,
          prompt,
          output: Output.object({ schema }),
          maxRetries: 0,
          ...(deterministic ? { temperature: 0 } : {}),
        }),
        timeoutMs,
      );
      if (isTimedOut(response)) return err({ kind: 'timeout', afterMs: timeoutMs });
      // Parse again with Zod so the app never trusts a dependency's output.
      const parsed = schema.safeParse(response.output);
      if (!parsed.success) {
        return err({
          kind: 'invalid_response',
          issues: parsed.error.issues.map((issue) => issue.message),
        });
      }
      return ok(parsed.data);
    } catch (error) {
      return err(mapAppleError(error));
    }
  },
};
