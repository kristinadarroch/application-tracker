import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Button, Card, Screen, Text } from '@/design-system';
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

/** Sample listings for prompt checks (tier 2: "prompts checked against 5 sample listings"). */
const SAMPLE_LISTINGS = [
  `Acme Health is hiring a Senior React Native Engineer (hybrid, Austin, TX). Salary: $150,000 - $180,000.
You will build patient-facing mobile features in React Native and TypeScript and own our component library.
Requirements: 5+ years React Native, TypeScript, Redux Toolkit, accessibility, CI/CD for mobile.`,
  `Skip to content\nSign in\nCareers at Globex\nMobile Engineer\nNew York, NY · Full-time\nAbout the role\nGlobex builds logistics software for 2,000 warehouses. As a Mobile Engineer you'll ship our driver app.\nWhat you bring\n- 3+ years iOS or Android\n- React Native experience\n- Offline-first data sync\n- Testing with Jest and Detox\nAccept all cookies\n© 2026 Globex Corporation. All rights reserved.`,
  `Northwind Labs — Frontend Engineer (React), Remote (US). We're a 40-person team building analytics for clinics. You'll work across our React web app and design system. Must have: React, TypeScript, CSS architecture, Storybook. Nice to have: React Native.`,
  `ROLE: Staff Mobile Engineer\nCOMPANY: Initech\nLOCATION: Remote\nCOMP: $200k–$240k + equity\nRESPONSIBILITIES:\n• Lead the mobile architecture for our payments app\n• Mentor 6 engineers\nREQUIREMENTS:\n• 8+ years mobile\n• React Native New Architecture\n• Security and PCI awareness`,
  `We're looking for someone passionate about mobile to join a fast-growing team. You'll collaborate with design and product, write clean code, and have fun. Apply today!`,
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

const CANDIDATES: TriageCandidate[] = [
  { id: DEMO_APPLICATION.id, company: 'Acme Health', role: 'Senior React Native Engineer' },
  {
    id: ApplicationIdSchema.parse('app_lab_northwind'),
    company: 'Northwind Labs',
    role: 'Frontend Engineer (React)',
  },
  { id: ApplicationIdSchema.parse('app_lab_globex'), company: 'Globex', role: 'Mobile Engineer' },
];

const SAMPLE_REVIEWS = `Interviewed for a mobile role at Acme Health. The first round asked "How do you make a React Native screen accessible to VoiceOver users?" Then a system design question: design offline sync for appointment booking. Final round was behavioral, they asked about a time I disagreed with a designer.`;

interface Check {
  name: string;
  outcome: string;
  ms: number;
}

/**
 * Dev-only: runs every AI task against fixed samples on the real on-device model and logs
 * `[ai-checks]` lines with timings. Used for the ADR 0005 spike and for prompt checks.
 */
export default function AiChecksScreen() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const results: Check[] = [];
    const record = async (name: string, task: () => Promise<unknown>) => {
      const started = Date.now();
      const outcome = JSON.stringify(await task());
      const check = { name, outcome, ms: Date.now() - started };
      results.push(check);
      console.log('[ai-checks]', JSON.stringify(check));
      setChecks([...results]);
    };

    await record('availability', async () => onDeviceModel.availability());
    for (const [index, text] of SAMPLE_LISTINGS.entries()) {
      await record(`listing ${index + 1}`, async () => {
        const result = await extractListing(onDeviceModel, {
          kind: 'text',
          text,
          source: 'pasted_text',
        });
        if (!result.ok) return result.error;
        return result.value.status === 'drafted'
          ? { ...result.value.draft.extraction, trimmed: result.value.draft.trimmed }
          : { status: result.value.status, extraction: result.value.extraction };
      });
    }
    for (const message of FIXTURE_MESSAGES) {
      await record(`triage: ${message.subject}`, async () =>
        triageWithModel(onDeviceModel, message, CANDIDATES),
      );
    }
    await record('prep questions', async () => {
      const result = await generatePrepQuestions(DEMO_APPLICATION);
      return result.ok ? result.value.questions.map((q) => `${q.type}: ${q.text}`) : result.error;
    });
    const first = await startMockInterview(DEMO_APPLICATION);
    await record('mock first question', async () => first);
    if (first.ok) {
      await record('mock turn', async () =>
        answerMockInterviewTurn({
          application: DEMO_APPLICATION,
          currentQuestion: first.value.turns[0]?.question ?? '',
          answer:
            'I led a TypeScript migration of our React Native component library in phases and cut UI bugs by a third.',
          earlierQuestions: [],
        }),
      );
    }
    await record('interview reviews', async () =>
      findReviewQuestions({ application: DEMO_APPLICATION, reviews: SAMPLE_REVIEWS }),
    );
    setRunning(false);
  }, []);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen title="On-device model checks" scroll>
      <Button label="Run all checks" onPress={run} loading={running} />
      {checks.map((check) => (
        <Card key={check.name}>
          <Text variant="heading">{`${check.name} · ${check.ms} ms`}</Text>
          <Text variant="bodySmall" color="secondary">
            {check.outcome}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
