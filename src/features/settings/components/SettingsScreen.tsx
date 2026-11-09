import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import {
  Banner,
  Button,
  Card,
  Chip,
  ListItem,
  makeStyles,
  Screen,
  Text,
  useTheme,
  type ThemePreference,
} from '@/design-system';
import { loadDemoData } from '@/features/applications';
import { useGoBack } from '@/lib/useGoBack';
import { selectAiAvailability } from '@/features/capabilities';
import { assertNever } from '@/lib/assertNever';
import { describeError } from '@/lib/errors';
import type { AiAvailability } from '@/services/ai/model';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  aiReplayToggled,
  selectAiReplay,
  selectThemePreference,
  themePreferenceChanged,
} from '../slice';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  switchText: { flex: 1, gap: t.space[1] },
  heading: { gap: t.space[1] },
}));

/** Card heading: an overline eyebrow over the section title. */
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  const styles = useStyles();
  return (
    <View style={styles.heading}>
      <Text variant="overline" color="secondary">
        {eyebrow}
      </Text>
      <Text variant="heading">{title}</Text>
    </View>
  );
}

function AiStatus({ availability }: { availability: AiAvailability | null }) {
  if (availability === null) {
    return <Text color="secondary">Checking whether Apple Intelligence is available…</Text>;
  }
  switch (availability.status) {
    case 'available':
      return (
        <Banner
          tone="success"
          title="AI is available"
          body="Intake, prep questions, mock interviews, and inbox triage run on this device."
        />
      );
    case 'unavailable': {
      const copy = describeError({ kind: 'ai_unavailable', reason: availability.reason });
      return (
        <Banner
          tone="warning"
          title={copy.title}
          body={`${copy.body} Tracking applications works without it.`}
        />
      );
    }
    default:
      return assertNever(availability);
  }
}

/** Presenter tools; rendered only in development builds. */
function DeveloperSection() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const styles = useStyles();
  const theme = useTheme();
  const aiReplay = useAppSelector(selectAiReplay);
  const [demoAdded, setDemoAdded] = useState<number | undefined>(undefined);

  return (
    <Card>
      <SectionHeading eyebrow="Presenter tools" title="Developer" />
      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text variant="bodyStrong">AI Replay</Text>
          <Text variant="bodySmall" color="secondary">
            Show recorded AI results, always labeled “Replayed”.
          </Text>
        </View>
        <Switch
          accessibilityLabel="AI Replay"
          value={aiReplay}
          onValueChange={() => {
            dispatch(aiReplayToggled());
          }}
          trackColor={{ true: theme.color.action.primary.bg, false: theme.color.border.strong }}
        />
      </View>
      <Button
        label="Load demo data"
        icon="sparkles-outline"
        variant="secondary"
        onPress={() => setDemoAdded(dispatch(loadDemoData(new Date())))}
      />
      {demoAdded !== undefined ? (
        <Banner
          tone="success"
          title={
            demoAdded === 0
              ? 'Demo data is already loaded'
              : `Added ${demoAdded} demo ${demoAdded === 1 ? 'application' : 'applications'}`
          }
        />
      ) : null}
      <ListItem
        title="Design system gallery"
        subtitle="Tokens and components in both themes"
        onPress={() => router.push('/dev/design-system')}
      />
      <ListItem
        title="AI spike"
        subtitle="On-device model checks"
        onPress={() => router.push('/dev/ai-spike')}
      />
    </Card>
  );
}

/** Theme preference (UX-1), AI availability (UX-7), and dev-only presenter tools. */
export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const styles = useStyles();
  const goBack = useGoBack();
  const preference = useAppSelector(selectThemePreference);
  const availability = useAppSelector(selectAiAvailability);

  return (
    <Screen title="Settings" onBack={goBack} scroll>
      <Card>
        <SectionHeading eyebrow="Appearance" title="Theme" />
        <View style={styles.chips}>
          {THEME_OPTIONS.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              selected={preference === value}
              onPress={() => dispatch(themePreferenceChanged(value))}
            />
          ))}
        </View>
        <Text variant="bodySmall" color="secondary">
          System follows your device’s appearance setting.
        </Text>
      </Card>
      <Card>
        <SectionHeading eyebrow="On this device" title="AI" />
        <AiStatus availability={availability} />
      </Card>
      {__DEV__ ? <DeveloperSection /> : null}
    </Screen>
  );
}
