import { apple } from '@react-native-ai/apple';
import { generateText, Output } from 'ai';
import { Platform } from 'react-native';

import { err, ok } from '@/lib/result';

import { mapAppleError } from './errorMapping';
import { BUDGET_CONTEXT_TOKENS, type AiAvailability, type OnDeviceModel } from './model';
import { isTimedOut, withTimeout } from './withTimeout';

const MIN_IOS_MAJOR = 26;

/**
 * One native generation at a time. A request that hits its time limit keeps running natively,
 * so the next request waits for the real native promise, not the caller's timeout. Without this,
 * a slow request plus new ones piles work onto the model and every later request times out.
 */
let nativeQueue: Promise<unknown> = Promise.resolve();

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

  async generate({ instructions, prompt, schema, timeoutMs, maxOutputTokens, sampling }) {
    const current = this.availability();
    if (current.status === 'unavailable') {
      return err({ kind: 'ai_unavailable', reason: current.reason });
    }
    try {
      // Each call is a fresh on-device session, so context never accumulates.
      // A request that timed out while still queued never reaches the model.
      let abandoned = false;
      const native = nativeQueue.then(() => {
        if (abandoned) throw new Error('Request timed out before it started.');
        return generateText({
          model: apple(),
          system: instructions,
          prompt,
          output: Output.object({ schema }),
          maxRetries: 0,
          maxOutputTokens,
          ...(sampling === 'repeatable' ? { temperature: 0 } : { temperature: 0.7, topP: 0.9 }),
        });
      });
      nativeQueue = native.catch(() => undefined);
      // The time limit covers waiting in the queue too: it is how long the user waits.
      const response = await withTimeout(native, timeoutMs);
      if (isTimedOut(response)) {
        abandoned = true;
        return err({ kind: 'timeout', afterMs: timeoutMs });
      }
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
