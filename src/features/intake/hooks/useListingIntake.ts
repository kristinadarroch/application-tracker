import { useRouter } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { selectAiAvailability } from '@/features/capabilities/slice';
import { assertNever } from '@/lib/assertNever';
import { describeError, type AiUnavailableReason, type AppError } from '@/lib/errors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { draftAdded } from '../draftsSlice';
import { useExtractListingMutation } from '../intakeApi';
import { manualFormParams, recoveryFor, type ManualPrefill } from '../manualFallback';
import type { ListingExtraction, ListingRequest } from '../schema';

export type IntakeMode = 'text' | 'url';

export interface IntakeInput {
  mode: IntakeMode;
  text: string;
  url: string;
}

/** Shared links are tagged so the draft records where it came from. */
export type IntakeOrigin = 'typed' | 'shared';

export type IntakeStatus =
  | { kind: 'editing' }
  | { kind: 'reading' }
  /** The link couldn't be loaded; the screen is in paste mode with the link kept (INT-3, INT-5). */
  | { kind: 'page_unreadable'; error: AppError }
  | { kind: 'missing_company_or_role'; extraction: ListingExtraction; sourceText: string }
  | { kind: 'failed'; error: AppError };

const LINK = /^https?:\/\/\S+$/i;
const LINK_ERROR = 'Enter a link that starts with http:// or https://';

export interface ListingIntake {
  mode: IntakeMode;
  text: string;
  url: string;
  urlError: string | undefined;
  /** The link saved with pasted text, when the user started from a link. */
  keptLink: string | undefined;
  status: IntakeStatus;
  /** Set when Apple Intelligence can't run; intake then goes straight to the manual form (UX-7). */
  aiUnavailable: AiUnavailableReason | undefined;
  canSubmit: boolean;
  changeMode: (mode: IntakeMode) => void;
  changeText: (text: string) => void;
  changeUrl: (url: string) => void;
  submit: () => void;
  /** After "Couldn't find the company or role": back to editing, with the page text when it came from a link. */
  editText: () => void;
  openManualForm: (reason: 'chosen' | 'unavailable' | 'failed' | 'missing') => void;
}

/** What to send for the current input, or `undefined` when it can't be sent (empty text, invalid link). */
function toListingRequest(
  { mode, text, url }: IntakeInput,
  origin: IntakeOrigin,
): ListingRequest | undefined {
  const link = url.trim();
  const isLink = LINK.test(link);
  if (mode === 'url') {
    return isLink
      ? { kind: 'url', url: link, source: origin === 'shared' ? 'shared' : 'pasted_url' }
      : undefined;
  }
  if (text.trim().length === 0) return undefined;
  return {
    kind: 'text',
    text,
    source: origin === 'shared' ? 'shared' : 'pasted_text',
    // A link kept from a failed page load is stored with the pasted text (INT-3).
    ...(isLink ? { listingUrl: link } : {}),
  };
}

/** State and actions for the paste/share intake screen. AI output only becomes a draft; the user confirms it later. */
export function useListingIntake(
  initial: IntakeInput,
  origin: IntakeOrigin,
  autoSubmit: boolean,
): ListingIntake {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const availability = useAppSelector(selectAiAvailability);
  const aiUnavailable = availability?.status === 'unavailable' ? availability.reason : undefined;
  const [extract] = useExtractListingMutation();
  const [mode, setMode] = useState(initial.mode);
  const [text, setText] = useState(initial.text);
  const [url, setUrl] = useState(initial.url);
  const [urlError, setUrlError] = useState<string | undefined>(undefined);
  // A shared listing starts reading as soon as it arrives (INT-1), unless AI can't run.
  const [sharedRequest] = useState(() =>
    autoSubmit && aiUnavailable === undefined ? toListingRequest(initial, origin) : undefined,
  );
  const [status, setStatus] = useState<IntakeStatus>(
    sharedRequest === undefined ? { kind: 'editing' } : { kind: 'reading' },
  );
  const pending = useRef<{ abort: () => void } | null>(null);

  const trimmedUrl = url.trim();
  const keptLink = mode === 'text' && LINK.test(trimmedUrl) ? trimmedUrl : undefined;
  const hasInput = (mode === 'text' ? text : url).trim().length > 0;

  /** Typing after a failure means the user is trying again, so the old outcome goes away. */
  const clearOutcome = () => {
    if (status.kind === 'failed' || status.kind === 'missing_company_or_role') {
      setStatus({ kind: 'editing' });
    }
  };

  /** Results are handled in the promise callback, never synchronously, so this is safe to start from an effect. */
  const run = (request: ListingRequest) => {
    const call = extract(request);
    pending.current = call;
    void call.then((result) => {
      if (pending.current === call) pending.current = null;

      if (result.error !== undefined) {
        // Aborted because the screen closed: nothing to show.
        if (!('kind' in result.error) && result.error.name === 'AbortError') return;
        const error: AppError =
          'kind' in result.error
            ? result.error
            : { kind: 'ai_failed', code: result.error.name ?? 'unknown' };
        if (request.kind === 'url' && recoveryFor(error) === 'paste_text') {
          setMode('text');
          setStatus({ kind: 'page_unreadable', error });
        } else {
          setStatus({ kind: 'failed', error });
        }
        return;
      }

      const outcome = result.data;
      switch (outcome.status) {
        case 'drafted':
          dispatch(draftAdded(outcome.draft));
          router.replace({
            pathname: '/intake/review/[draftId]',
            params: { draftId: outcome.draft.id },
          });
          return;
        case 'missing_company_or_role':
          setStatus({
            kind: 'missing_company_or_role',
            extraction: outcome.extraction,
            sourceText: outcome.sourceText,
          });
          return;
        default:
          assertNever(outcome);
      }
    });
  };

  const submit = () => {
    const request = toListingRequest({ mode, text, url }, origin);
    if (request === undefined) {
      if (mode === 'url') setUrlError(LINK_ERROR);
      return;
    }
    setStatus({ kind: 'reading' });
    void run(request);
  };

  const startShared = useEffectEvent(() => {
    if (sharedRequest !== undefined) void run(sharedRequest);
  });
  useEffect(() => {
    startShared();
    // Closing the screen cancels the request, so a late result can't navigate away.
    return () => pending.current?.abort();
  }, []);

  const openManualForm: ListingIntake['openManualForm'] = (reason) => {
    const prefill: ManualPrefill = { text: mode === 'text' ? text : '', url: trimmedUrl };
    switch (reason) {
      case 'chosen':
        break;
      case 'unavailable':
        // The manual form titles this note "AI wasn’t used"; the body says why.
        if (aiUnavailable !== undefined) {
          prefill.aiNote = describeError({ kind: 'ai_unavailable', reason: aiUnavailable }).body;
        }
        break;
      case 'failed':
        prefill.aiNote = 'AI couldn’t read this listing, so fill in the details yourself.';
        break;
      case 'missing':
        prefill.aiNote = 'AI couldn’t find the company or role. Check the details below.';
        if (status.kind === 'missing_company_or_role') prefill.extraction = status.extraction;
        break;
      default:
        assertNever(reason);
    }
    router.push({ pathname: '/application/new', params: manualFormParams(prefill) });
  };

  return {
    mode,
    text,
    url,
    urlError,
    keptLink,
    status,
    aiUnavailable,
    canSubmit: hasInput && status.kind !== 'reading',
    changeMode: (next) => {
      setMode(next);
      setUrlError(undefined);
      clearOutcome();
    },
    changeText: (next) => {
      setText(next);
      clearOutcome();
    },
    changeUrl: (next) => {
      setUrl(next);
      setUrlError(undefined);
      clearOutcome();
    },
    submit,
    editText: () => {
      if (status.kind === 'missing_company_or_role' && mode === 'url') {
        setMode('text');
        setText(status.sourceText);
      }
      setStatus({ kind: 'editing' });
    },
    openManualForm,
  };
}
