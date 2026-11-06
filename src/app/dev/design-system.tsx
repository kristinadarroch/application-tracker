import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  makeStyles,
  Screen,
  Skeleton,
  Stack,
  StagePill,
  Text,
  TextField,
  ThemeProvider,
  useTheme,
  type BadgeTone,
  type ButtonVariant,
  type ColorScheme,
  type IconButtonVariant,
  type TextColor,
  type TypographyVariant,
} from '@/design-system';
import { STAGES } from '@/lib/stage';

const TYPE_VARIANTS: TypographyVariant[] = [
  'display',
  'title',
  'heading',
  'body',
  'bodyStrong',
  'bodySmall',
  'caption',
];
const TEXT_COLORS: TextColor[] = ['primary', 'secondary', 'tertiary', 'link'];
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive'];
const ICON_VARIANTS: IconButtonVariant[] = ['primary', 'secondary', 'ghost'];
const BADGE_TONES: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const noop = () => undefined;

const useStyles = makeStyles((t) => ({
  swatch: {
    width: 44,
    height: 44,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
  },
  spaceBar: { height: 8, backgroundColor: t.color.action.primary.bg },
  radiusBox: {
    width: 44,
    height: 44,
    backgroundColor: t.color.bg.subtle,
    borderWidth: 1,
    borderColor: t.color.border.strong,
  },
  elevationBox: {
    width: 88,
    height: 56,
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={3}>
      <Text variant="heading">{title}</Text>
      {children}
    </Stack>
  );
}

function Swatch({ name, color }: { name: string; color: string }) {
  const styles = useStyles();
  return (
    <Stack direction="row" gap={3} align="center">
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text variant="bodySmall" color="secondary">
        {name}
      </Text>
    </Stack>
  );
}

function ColorTokens() {
  const { color } = useTheme();
  const groups: [string, Record<string, string>][] = [
    ['bg', color.bg],
    ['border', color.border],
    ['text', color.text],
    ['action.primary', color.action.primary],
    ['focus', color.focus],
  ];
  return (
    <Section title="Colors">
      {groups.map(([group, values]) =>
        Object.entries(values).map(([key, value]) => (
          <Swatch key={`${group}.${key}`} name={`${group}.${key}`} color={value} />
        )),
      )}
      {Object.entries(color.feedback).map(([tone, pair]) => (
        <Stack key={tone} direction="row" gap={3}>
          <Swatch name={`feedback.${tone}.bg`} color={pair.bg} />
          <Swatch name="fg" color={pair.fg} />
        </Stack>
      ))}
      {Object.entries(color.stage).map(([stage, pair]) => (
        <Stack key={stage} direction="row" gap={3}>
          <Swatch name={`stage.${stage}.bg`} color={pair.bg} />
          <Swatch name="fg" color={pair.fg} />
        </Stack>
      ))}
    </Section>
  );
}

function ScaleTokens() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <>
      <Section title="Spacing">
        {Object.entries(theme.space).map(([key, value]) => (
          <Stack key={key} direction="row" gap={3} align="center">
            <Text variant="caption" color="secondary">
              {`space.${key} · ${value}`}
            </Text>
            <View style={[styles.spaceBar, { width: value }]} />
          </Stack>
        ))}
      </Section>
      <Section title="Radii">
        <Stack direction="row" gap={4} wrap="wrap">
          {Object.entries(theme.radius).map(([key, value]) => (
            <Stack key={key} gap={1} align="center">
              <View style={[styles.radiusBox, { borderRadius: value }]} />
              <Text variant="caption" color="secondary">
                {key}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Section>
      <Section title="Typography">
        {TYPE_VARIANTS.map((variant) => (
          <Text key={variant} variant={variant}>
            {variant}
          </Text>
        ))}
        {TEXT_COLORS.map((c) => (
          <Text key={c} color={c}>
            {`color: ${c}`}
          </Text>
        ))}
      </Section>
      <Section title="Elevation">
        <Stack direction="row" gap={4}>
          {([0, 1, 2] as const).map((level) => (
            <View key={level} style={[styles.elevationBox, theme.elevation[level]]}>
              <Text variant="caption">{`elevation.${level}`}</Text>
            </View>
          ))}
        </Stack>
      </Section>
      <Section title="Motion">
        {Object.entries(theme.motion).map(([key, value]) => (
          <Text key={key} variant="bodySmall" color="secondary">
            {`motion.${key} · ${value}ms${theme.reduceMotion ? ' (Reduce Motion on)' : ''}`}
          </Text>
        ))}
      </Section>
    </>
  );
}

function Components() {
  const [text, setText] = useState('');
  return (
    <>
      <Section title="Button">
        {BUTTON_VARIANTS.map((variant) => (
          <Stack key={variant} direction="row" gap={2} wrap="wrap">
            <Button label={variant} variant={variant} onPress={noop} />
            <Button label="Large" variant={variant} size="lg" icon="add" onPress={noop} />
            <Button label="Loading" variant={variant} loading onPress={noop} />
            <Button label="Disabled" variant={variant} disabled onPress={noop} />
          </Stack>
        ))}
      </Section>
      <Section title="IconButton">
        <Stack direction="row" gap={2}>
          {ICON_VARIANTS.map((variant) => (
            <IconButton
              key={variant}
              icon="add"
              variant={variant}
              accessibilityLabel={`Add (${variant})`}
              onPress={noop}
            />
          ))}
          <IconButton icon="trash-outline" accessibilityLabel="Delete" disabled onPress={noop} />
        </Stack>
      </Section>
      <Section title="TextField">
        <TextField
          label="Company"
          value={text}
          onChangeText={setText}
          placeholder="Acme Inc."
          helperText="Shown on the pipeline card."
        />
        <TextField label="Role" value="" onChangeText={noop} error="Role is required." />
        <TextField label="Notes" value="" onChangeText={noop} multiline />
        <TextField label="Password" value="secret" onChangeText={noop} secure />
      </Section>
      <Section title="Card">
        <Card>
          <Text variant="heading">Flat card</Text>
          <Text color="secondary">Hairline border on canvas.</Text>
        </Card>
        <Card elevated onPress={noop} accessibilityLabel="Pressable raised card">
          <Text variant="heading">Raised, pressable</Text>
          <StagePill stage="offer" />
        </Card>
      </Section>
      <Section title="StagePill">
        <Stack direction="row" gap={2} wrap="wrap">
          {STAGES.map((stage) => (
            <StagePill key={stage} stage={stage} />
          ))}
        </Stack>
      </Section>
      <Section title="Badge">
        <Stack direction="row" gap={2} wrap="wrap">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone} label={tone} />
          ))}
        </Stack>
      </Section>
      <Section title="Skeleton">
        <Stack gap={2}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="100%" height={56} radius="lg" />
        </Stack>
      </Section>
      <Section title="EmptyState">
        <EmptyState
          icon="briefcase-outline"
          title="No applications"
          body="Add a job you're interested in to start your pipeline."
          action={{ label: 'Add application', onPress: noop }}
        />
      </Section>
      <Section title="ErrorState">
        <ErrorState error={{ kind: 'network' }} onRetry={noop} />
        <ErrorState error={{ kind: 'context_too_long' }} onRetry={noop} />
      </Section>
    </>
  );
}

function Gallery({ scheme, onToggle }: { scheme: ColorScheme; onToggle: () => void }) {
  return (
    <Screen
      title="Design system"
      scroll
      headerRight={
        <Button
          label={scheme === 'light' ? 'Dark' : 'Light'}
          icon={scheme === 'light' ? 'moon-outline' : 'sunny-outline'}
          variant="secondary"
          accessibilityHint="Switches the gallery theme"
          onPress={onToggle}
        />
      }
    >
      <Stack gap={6}>
        <ColorTokens />
        <ScaleTokens />
        <Components />
      </Stack>
    </Screen>
  );
}

function DevGallery() {
  const system = useColorScheme();
  const [scheme, setScheme] = useState<ColorScheme>(system === 'dark' ? 'dark' : 'light');
  return (
    <ThemeProvider preference={scheme}>
      <Gallery
        scheme={scheme}
        onToggle={() => setScheme((s) => (s === 'light' ? 'dark' : 'light'))}
      />
    </ThemeProvider>
  );
}

export default function DesignSystemRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevGallery />;
}
