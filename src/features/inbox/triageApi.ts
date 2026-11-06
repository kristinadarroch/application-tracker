import { aiApi } from '@/services/ai/aiApi';
import { onDeviceModel } from '@/services/ai/foundationModels';

import type { InboxMessage, TriageCandidate, TriageResult } from './schema';
import {
  buildTriagePrompt,
  replayedTriageOutput,
  toTriageResult,
  TRIAGE_INSTRUCTIONS,
  TRIAGE_TIMEOUT_MS,
  TriageOutputSchema,
} from './triage';

export interface TriageRequest {
  message: InboxMessage;
  candidates: TriageCandidate[];
  /** AI Replay is on: use the recorded result when there is one. */
  replay: boolean;
}

export interface TriageOutcome {
  result: TriageResult;
  /** Came from an AI Replay recording, not the model. Always shown as "Replayed". */
  replayed: boolean;
}

/** `triageMessage` (Triage task): the inbox slice copies its lifecycle into `inbox.triage`. */
export const triageApi = aiApi.injectEndpoints({
  endpoints: (build) => ({
    triageMessage: build.mutation<TriageOutcome, TriageRequest>({
      async queryFn({ message, candidates, replay }) {
        const recorded = replay ? replayedTriageOutput(message.id, candidates) : undefined;
        if (recorded !== undefined) {
          const result = toTriageResult(recorded, candidates, message.receivedAt);
          return result.ok
            ? { data: { result: result.value, replayed: true } }
            : { error: result.error };
        }
        const generated = await onDeviceModel.generate({
          instructions: TRIAGE_INSTRUCTIONS,
          prompt: buildTriagePrompt(message, candidates),
          schema: TriageOutputSchema,
          timeoutMs: TRIAGE_TIMEOUT_MS,
          deterministic: true,
        });
        if (!generated.ok) return { error: generated.error };
        const result = toTriageResult(generated.value, candidates, message.receivedAt);
        return result.ok
          ? { data: { result: result.value, replayed: false } }
          : { error: result.error };
      },
    }),
  }),
});
