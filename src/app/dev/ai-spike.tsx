import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Badge, Button, Card, Screen, Stack, Text } from '@/design-system';
import type { Application } from '@/features/applications';
import { FIXTURE_MESSAGES, triageWithModel, type TriageCandidate } from '@/features/inbox';
import { extractListing } from '@/features/intake';
import {
  answerMockInterviewTurn,
  findReviewQuestions,
  generatePrepQuestions,
  startMockInterview,
} from '@/features/prep';
import { ApplicationIdSchema } from '@/lib/ids';
import { onDeviceModel } from '@/services/ai/foundationModels';

/** Sample listings and what extraction must return for each (tier 2 prompt checks). */
const SAMPLE_LISTINGS: { text: string; expectedCompany: string | null }[] = [
  {
    expectedCompany: 'Acme Health',
    text: `Acme Health is hiring a Senior React Native Engineer (hybrid, Austin, TX). Salary: $150,000 - $180,000.
You will build patient-facing mobile features in React Native and TypeScript and own our component library.
Requirements: 5+ years React Native, TypeScript, Redux Toolkit, accessibility, CI/CD for mobile.`,
  },
  {
    expectedCompany: 'Globex',
    text: `Skip to content\nSign in\nCareers at Globex\nMobile Engineer\nNew York, NY · Full-time\nAbout the role\nGlobex builds logistics software for 2,000 warehouses. As a Mobile Engineer you'll ship our driver app.\nWhat you bring\n- 3+ years iOS or Android\n- React Native experience\n- Offline-first data sync\n- Testing with Jest and Detox\nAccept all cookies\n© 2026 Globex Corporation. All rights reserved.`,
  },
  {
    expectedCompany: 'Northwind Labs',
    text: `Northwind Labs — Frontend Engineer (React), Remote (US). We're a 40-person team building analytics for clinics. You'll work across our React web app and design system. Must have: React, TypeScript, CSS architecture, Storybook. Nice to have: React Native.`,
  },
  {
    expectedCompany: 'Initech',
    text: `ROLE: Staff Mobile Engineer\nCOMPANY: Initech\nLOCATION: Remote\nCOMP: $200k–$240k + equity\nRESPONSIBILITIES:\n• Lead the mobile architecture for our payments app\n• Mentor 6 engineers\nREQUIREMENTS:\n• 8+ years mobile\n• React Native New Architecture\n• Security and PCI awareness`,
  },
  {
    expectedCompany: null,
    text: `We're looking for someone passionate about mobile to join a fast-growing team. You'll collaborate with design and product, write clean code, and have fun. Apply today!`,
  },
];

const DEMO_APPLICATION: Application = {
  id: ApplicationIdSchema.parse('app_lab_acme'),
  company: 'Acme Health',
  role: 'Senior React Native Engineer',
  location: 'Austin, TX',
  stage: 'interviewing',
  notes: 'Patient-facing app; team cares about accessibility.',
  requirements: ['React Native', 'TypeScript', 'Redux Toolkit', 'Accessibility', 'CI/CD'],
  nextSteps: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

const NORTHWIND_ID = ApplicationIdSchema.parse('app_lab_northwind');
const GLOBEX_ID = ApplicationIdSchema.parse('app_lab_globex');
const CANDIDATES: TriageCandidate[] = [
  { id: DEMO_APPLICATION.id, company: 'Acme Health', role: 'Senior React Native Engineer' },
  { id: NORTHWIND_ID, company: 'Northwind Labs', role: 'Frontend Engineer (React)' },
  { id: GLOBEX_ID, company: 'Globex', role: 'Mobile Engineer' },
];

/**
 * Accepted categories and the expected match per sample email; `proposes` = a Next Step must be
 * proposed. A scheduling email may fairly be read as an interview invite: both lead to booking time.
 */
const EXPECTED_TRIAGE: Record<
  string,
  { categories: string[]; match: string | null; proposes: boolean }
> = {
  msg_fixture_acme_invite: {
    categories: ['interview_invite', 'scheduling'],
    match: DEMO_APPLICATION.id,
    proposes: true,
  },
  msg_fixture_newsletter: { categories: ['unrelated'], match: null, proposes: false },
  msg_fixture_northwind_schedule: {
    categories: ['scheduling', 'interview_invite'],
    match: NORTHWIND_ID,
    proposes: true,
  },
  msg_fixture_initech_rejection: { categories: ['rejection'], match: null, proposes: false },
  // An agency recruiter who never names the client: no grounded match, so the user picks (INBX-4).
  msg_fixture_recruiter_followup: {
    categories: ['recruiter_followup'],
    match: null,
    proposes: true,
  },
  msg_fixture_receipt: { categories: ['unrelated'], match: null, proposes: false },
  msg_fixture_northwind_takehome: {
    categories: ['take_home'],
    match: NORTHWIND_ID,
    proposes: true,
  },
  msg_fixture_acme_offer: { categories: ['offer'], match: DEMO_APPLICATION.id, proposes: false },
};

const SAMPLE_REVIEWS = `Interviewed for a mobile role at Acme Health. The first round asked "How do you make a React Native screen accessible to VoiceOver users?" Then a system design question: design offline sync for appointment booking. Final round was behavioral, they asked about a time I disagreed with a designer.`;

type Group = 'listings' | 'triage' | 'prep';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
  ms: number;
}

/**
 * Dev-only acceptance checks for the AI tasks on the real on-device model: each check has an
 * expected outcome and is marked passed or failed. Groups run separately so a slow task can't
 * starve the others. Every result is logged to Metro as an `[ai-checks]` line.
 */
export default function AiChecksScreen() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState<Group | null>(null);
  const [finished, setFinished] = useState<Group | null>(null);

  const run = useCallback(async (group: Group) => {
    setRunning(group);
    setFinished(null);
    const results: Check[] = [];
    /** Times one check; a thrown error fails that check and the rest still run. */
    const check = async (
      name: string,
      task: () => Promise<{ passed: boolean; detail: unknown }>,
    ) => {
      const started = Date.now();
      let outcome: { passed: boolean; detail: string };
      try {
        const { passed, detail } = await task();
        outcome = { passed, detail: JSON.stringify(detail) };
      } catch (error) {
        outcome = {
          passed: false,
          detail: `threw: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
      const result = { name, ...outcome, ms: Date.now() - started };
      results.push(result);
      console.log('[ai-checks]', JSON.stringify(result));
      setChecks([...results]);
    };

    if (group === 'listings') {
      for (const [index, sample] of SAMPLE_LISTINGS.entries()) {
        await check(`listing ${index + 1}`, async () => {
          const result = await extractListing(onDeviceModel, {
            kind: 'text',
            text: sample.text,
            source: 'pasted_text',
          });
          if (!result.ok) return { passed: false, detail: result.error };
          const outcome = result.value;
          if (sample.expectedCompany === null) {
            return { passed: outcome.status === 'missing_company_or_role', detail: outcome };
          }
          return {
            passed:
              outcome.status === 'drafted' &&
              outcome.draft.extraction.company === sample.expectedCompany,
            detail: outcome.status === 'drafted' ? outcome.draft.extraction : outcome,
          };
        });
      }
    }

    if (group === 'triage') {
      for (const message of FIXTURE_MESSAGES) {
        await check(`triage ${message.id}`, async () => {
          const expected = EXPECTED_TRIAGE[message.id];
          const result = await triageWithModel(onDeviceModel, message, CANDIDATES);
          if (!result.ok || expected === undefined) return { passed: false, detail: result };
          const value = result.value;
          return {
            passed:
              expected.categories.includes(value.category) &&
              value.applicationId === expected.match &&
              (!expected.proposes || value.proposedNextStep !== undefined),
            detail: value,
          };
        });
      }
    }

    if (group === 'prep') {
      await check('prep questions', async () => {
        const result = await generatePrepQuestions(DEMO_APPLICATION);
        return {
          passed: result.ok && result.value.questions.length >= 8,
          detail: result.ok
            ? result.value.questions.map((q) => `${q.type}: ${q.text}`)
            : result.error,
        };
      });
      let firstQuestion: string | undefined;
      await check('mock first question', async () => {
        const result = await startMockInterview(DEMO_APPLICATION);
        firstQuestion = result.ok ? result.value.turns[0]?.question : undefined;
        return {
          passed: firstQuestion !== undefined,
          detail: result.ok ? firstQuestion : result.error,
        };
      });
      await check('mock turn', async () => {
        const result = await answerMockInterviewTurn({
          application: DEMO_APPLICATION,
          currentQuestion: firstQuestion ?? 'Tell me about a project you led.',
          answer:
            'I led a TypeScript migration of our React Native component library in phases and cut UI bugs by a third.',
          earlierQuestions: [],
        });
        return {
          passed: result.ok && result.value.nextQuestion.length > 0,
          detail: result.ok ? result.value : result.error,
        };
      });
      await check('interview reviews', async () => {
        const result = await findReviewQuestions({
          application: DEMO_APPLICATION,
          reviews: SAMPLE_REVIEWS,
        });
        return {
          passed: result.ok && result.value.questions.length >= 2,
          detail: result.ok ? result.value : result.error,
        };
      });
    }

    setRunning(null);
    setFinished(group);
  }, []);

  if (!__DEV__) return <Redirect href="/" />;

  const failed = checks.filter((c) => !c.passed).length;
  return (
    <Screen title="On-device model checks" scroll>
      <Stack gap={2}>
        <Button
          label="Check listings"
          onPress={() => run('listings')}
          loading={running === 'listings'}
        />
        <Button label="Check triage" onPress={() => run('triage')} loading={running === 'triage'} />
        <Button label="Check prep" onPress={() => run('prep')} loading={running === 'prep'} />
      </Stack>
      {finished !== null ? (
        <Text variant="heading">{`${finished} done · ${failed} failed`}</Text>
      ) : null}
      {checks.map((c) => (
        <Card key={c.name}>
          <Stack direction="row" gap={2} align="center">
            <Badge tone={c.passed ? 'success' : 'danger'} label={c.passed ? 'Pass' : 'Fail'} />
            <Text variant="heading">{`${c.name} · ${c.ms} ms`}</Text>
          </Stack>
          <Text variant="bodySmall" color="secondary">
            {c.detail}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
