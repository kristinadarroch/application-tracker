import { router } from 'expo-router';
import { useState } from 'react';

import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Stack,
  Text,
  TextField,
} from '@/design-system';
import type { Application } from '@/features/applications/model';
import { selectAiAvailability } from '@/features/capabilities';
import { createId, QuestionIdSchema } from '@/lib/ids';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { AiUnavailableNotice } from '../components/AiUnavailableNotice';
import { ApplicationNotFound } from '../components/ApplicationNotFound';
import { toAppError, useFindReviewQuestionsMutation } from '../api';
import { useRouteApplication } from '../hooks';
import type { ReviewQuestion } from '../schema';
import { questionsAdded } from '../slice';

const TITLE = 'Interview reviews';

/** `/prep/[applicationId]/reviews`: likely questions from pasted reviews, each with its quote (LATER-1). */
export function InterviewReviewsScreen() {
  const application = useRouteApplication();
  if (application === undefined) return <ApplicationNotFound title={TITLE} />;
  return <InterviewReviews application={application} />;
}

function InterviewReviews({ application }: { application: Application }) {
  const ai = useAppSelector(selectAiAvailability);
  const [reviews, setReviews] = useState('');
  // No fixed cache key: results live only as long as this screen (not persisted).
  const [find, result] = useFindReviewQuestionsMutation();
  const error = toAppError(result.error);
  const submit = () => {
    void find({ application, reviews });
  };

  return (
    <Screen title={TITLE} onBack={router.back} scroll>
      <Text color="secondary">{`${application.role} · ${application.company}`}</Text>
      <TextField
        label="Paste interview reviews"
        helperText="Paste reviews you found, for example on Glassdoor. Nothing is fetched from any site."
        value={reviews}
        onChangeText={setReviews}
        multiline
      />
      {ai?.status === 'unavailable' ? (
        <AiUnavailableNotice reason={ai.reason} variant="banner" />
      ) : (
        <Button
          label="Find likely questions"
          icon="sparkles-outline"
          loading={result.isLoading}
          disabled={ai === null || reviews.trim().length === 0}
          onPress={submit}
        />
      )}
      {error !== undefined && !result.isLoading ? (
        <ErrorState error={error} onRetry={submit} />
      ) : null}
      {result.data !== undefined && !result.isLoading ? (
        <Stack gap={3}>
          {result.data.trimmed ? (
            <Banner tone="info" title="Only the first part of the pasted text was read." />
          ) : null}
          {result.data.questions.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="No questions found"
              body="These reviews don’t mention specific interview questions. Paste reviews that describe what candidates were asked."
            />
          ) : (
            result.data.questions.map((question) => (
              <ReviewQuestionCard
                // A new result remounts the cards, so "Added" never carries over.
                key={`${result.requestId ?? ''}-${question.question}`}
                application={application}
                question={question}
              />
            ))
          )}
        </Stack>
      ) : null}
    </Screen>
  );
}

function ReviewQuestionCard({
  application,
  question,
}: {
  application: Application;
  question: ReviewQuestion;
}) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'new' | 'added'>('new');
  const add = () => {
    dispatch(
      questionsAdded({
        applicationId: application.id,
        questions: [
          {
            id: createId(QuestionIdSchema, 'q'),
            type: 'role_specific',
            text: question.question,
            practiced: false,
          },
        ],
        now: new Date().toISOString(),
      }),
    );
    setStatus('added');
  };
  return (
    <Card>
      <Text variant="heading">{question.question}</Text>
      <Text variant="bodySmall" color="secondary">{`“${question.quote}”`}</Text>
      <Button
        label={status === 'added' ? 'Added to prep questions' : 'Add to prep questions'}
        icon={status === 'added' ? 'checkmark' : 'add'}
        variant="secondary"
        disabled={status === 'added'}
        onPress={add}
      />
    </Card>
  );
}
