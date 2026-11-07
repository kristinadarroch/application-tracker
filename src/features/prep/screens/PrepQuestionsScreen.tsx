import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, View } from 'react-native';

import {
  Button,
  ErrorState,
  ListItem,
  makeStyles,
  Screen,
  Skeleton,
  Stack,
  Text,
} from '@/design-system';
import type { Application } from '@/features/applications/model';
import { selectAiAvailability } from '@/features/capabilities';
import { lineFor } from '@/lib/lines';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { AiUnavailableNotice } from '../components/AiUnavailableNotice';
import { ApplicationNotFound } from '../components/ApplicationNotFound';
import { LineHeading } from '../components/LineHeading';
import { PracticeBar } from '../components/PracticeBar';
import { QuestionRow } from '../components/QuestionRow';
import { SectionHeader } from '../components/SectionHeader';
import { useGeneratePrepQuestions, useRouteApplication } from '../hooks';
import { PREP_QUESTION_TYPE_LABELS, PREP_QUESTION_TYPES, type PrepQuestionSet } from '../schema';
import {
  selectActiveSession,
  selectPrepProgress,
  selectQuestionSet,
  selectSessionsForApplication,
} from '../selectors';
import { formatSessionDate, summarizeSession } from '../session';
import { questionPracticeToggled } from '../slice';

const TITLE = 'Prep questions';

const useStyles = makeStyles((t) => ({
  skeletonStop: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  skeletonText: { flex: 1 },
}));

/** `/prep/[applicationId]`: prep questions (PREP-1–3), past mock interviews (MOCK-5), and reviews (LATER-1). */
export function PrepQuestionsScreen() {
  const application = useRouteApplication();
  if (application === undefined) return <ApplicationNotFound title={TITLE} />;
  return <PrepQuestions application={application} />;
}

function PrepQuestions({ application }: { application: Application }) {
  const set = useAppSelector((state) => selectQuestionSet(state, application.id));
  return (
    <Screen title={TITLE} onBack={router.back} scroll>
      <LineHeading application={application} />
      {set === undefined ? (
        <NoQuestionSet application={application} />
      ) : (
        <QuestionSet application={application} set={set} />
      )}
      <MockInterviews application={application} />
      <Button
        label="Paste interview reviews"
        icon="document-text-outline"
        variant="ghost"
        onPress={() =>
          router.push({
            pathname: '/prep/[applicationId]/reviews',
            params: { applicationId: application.id },
          })
        }
      />
    </Screen>
  );
}

/** Placeholder stops while the questions generate. */
function LoadingQuestions() {
  const styles = useStyles();
  return (
    <View
      accessible
      accessibilityLabel="Generating prep questions"
      accessibilityState={{ busy: true }}
    >
      <Stack gap={4}>
        <Skeleton width="30%" height={16} />
        {[0, 1, 2, 3].map((stop) => (
          <View key={stop} style={styles.skeletonStop}>
            <Skeleton width={22} height={22} radius="pill" />
            <View style={styles.skeletonText}>
              <Skeleton width="100%" height={40} />
            </View>
          </View>
        ))}
      </Stack>
    </View>
  );
}

/**
 * No questions yet: they generate on their own, from the job's role, requirements, and notes
 * (PREP-1). Usually already running, started in the background when the job was saved.
 */
function NoQuestionSet({ application }: { application: Application }) {
  const ai = useAppSelector(selectAiAvailability);
  const generate = useGeneratePrepQuestions(application);
  const shouldStart =
    ai?.status === 'available' && !generate.pending && generate.error === undefined;
  const { run } = generate;

  useEffect(() => {
    if (shouldStart) void run();
  }, [run, shouldStart]);

  if (ai?.status === 'unavailable')
    return <AiUnavailableNotice reason={ai.reason} variant="empty" />;
  if (generate.error !== undefined) {
    return <ErrorState error={generate.error} onRetry={generate.run} />;
  }
  // Waiting for availability (a moment at launch) or for the questions themselves.
  return <LoadingQuestions />;
}

function QuestionSet({ application, set }: { application: Application; set: PrepQuestionSet }) {
  const dispatch = useAppDispatch();
  const ai = useAppSelector(selectAiAvailability);
  const progress = useAppSelector((state) => selectPrepProgress(state, application.id));
  const generate = useGeneratePrepQuestions(application);
  const line = lineFor(application.id, application.company).index;

  // PREP-1: regenerating replaces the set and its practice progress, so ask first.
  const confirmRegenerate = () =>
    Alert.alert(
      'Replace prep questions?',
      'You’ll get a new set of questions, and practice progress on the current set will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: generate.run },
      ],
    );

  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Text variant="departure">{`${progress.practiced} / ${progress.total} practiced`}</Text>
        <PracticeBar line={line} practiced={progress.practiced} total={progress.total} />
      </Stack>
      {ai?.status === 'unavailable' ? (
        <AiUnavailableNotice reason={ai.reason} variant="banner" />
      ) : ai?.status === 'available' ? (
        <Button
          label="Regenerate"
          icon="refresh"
          variant="secondary"
          loading={generate.pending}
          onPress={confirmRegenerate}
        />
      ) : null}
      {/* PREP-3: a failed generation leaves the existing set in place, below the error. */}
      {generate.error !== undefined && !generate.pending ? (
        <ErrorState error={generate.error} onRetry={generate.run} />
      ) : null}
      {PREP_QUESTION_TYPES.map((type) => {
        const questions = set.questions.filter((q) => q.type === type);
        if (questions.length === 0) return null;
        return (
          <Stack key={type} gap={1}>
            <SectionHeader label={PREP_QUESTION_TYPE_LABELS[type]} />
            {questions.map((question, index) => (
              <QuestionRow
                key={question.id}
                question={question}
                line={line}
                track={index === questions.length - 1 ? 'end' : 'continues'}
                onToggle={() =>
                  dispatch(
                    questionPracticeToggled({
                      applicationId: application.id,
                      questionId: question.id,
                    }),
                  )
                }
              />
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
}

function MockInterviews({ application }: { application: Application }) {
  const sessions = useAppSelector((state) => selectSessionsForApplication(state, application.id));
  const active = useAppSelector((state) => selectActiveSession(state, application.id));
  const openMock = () =>
    router.push({
      pathname: '/prep/[applicationId]/mock',
      params: { applicationId: application.id },
    });
  return (
    <Stack gap={2}>
      <SectionHeader label="Mock interviews" />
      <Button
        label={active === undefined ? 'Mock interview' : 'Resume mock interview'}
        icon="chatbubbles-outline"
        onPress={openMock}
      />
      {sessions.map((session) => {
        const { answered } = summarizeSession(session);
        return (
          <ListItem
            key={session.id}
            title={formatSessionDate(session.startedAt)}
            subtitle={`${answered} ${answered === 1 ? 'answer' : 'answers'} · ${
              session.status === 'active' ? 'In progress' : 'Ended'
            }`}
            accessibilityHint={
              session.status === 'active' ? 'Resumes this session' : 'Opens the session summary'
            }
            onPress={
              session.status === 'active'
                ? openMock
                : () =>
                    router.push({
                      pathname: '/prep/[applicationId]/session/[sessionId]',
                      params: { applicationId: application.id, sessionId: session.id },
                    })
            }
          />
        );
      })}
    </Stack>
  );
}
