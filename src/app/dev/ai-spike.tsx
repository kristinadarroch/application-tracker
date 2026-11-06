import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Button, Card, Screen, Text } from '@/design-system';

import { ListingExtractionSchema } from '@/features/intake';
import { onDeviceModel } from '@/services/ai/foundationModels';

const SAMPLE_LISTING = `Acme Health is hiring a Senior React Native Engineer (hybrid, Austin, TX).
Salary: $150,000 - $180,000. You will build patient-facing mobile features in React Native and TypeScript,
own our component library, and partner with design. Requirements: 5+ years React Native, TypeScript,
Redux Toolkit, accessibility experience, CI/CD for mobile.`;

const INSTRUCTIONS = 'Extract job listing details. Use only facts stated in the listing.';

interface Check {
  name: string;
  outcome: string;
  ms: number;
}

/** Dev-only spike gate for ADR 0005: availability, typed extraction, and context-overflow handling. */
export default function AiSpikeScreen() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const results: Check[] = [];
    const record = async (name: string, task: () => Promise<string>) => {
      const started = Date.now();
      const outcome = await task();
      const check = { name, outcome, ms: Date.now() - started };
      results.push(check);
      console.log('[ai-spike]', JSON.stringify(check));
      setChecks([...results]);
    };

    await record('availability', async () => JSON.stringify(onDeviceModel.availability()));
    await record('extraction', async () =>
      JSON.stringify(
        await onDeviceModel.generate({
          instructions: INSTRUCTIONS,
          prompt: SAMPLE_LISTING,
          schema: ListingExtractionSchema,
          timeoutMs: 20_000,
          deterministic: true,
        }),
      ),
    );
    await record('context overflow', async () =>
      JSON.stringify(
        await onDeviceModel.generate({
          instructions: INSTRUCTIONS,
          prompt: SAMPLE_LISTING.repeat(120),
          schema: ListingExtractionSchema,
          timeoutMs: 60_000,
        }),
      ),
    );
    setRunning(false);
  }, []);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen title="On-device AI spike" scroll>
      <Button label="Run spike checks" onPress={run} loading={running} />
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
