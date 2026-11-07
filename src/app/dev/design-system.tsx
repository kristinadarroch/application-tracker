import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import {
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  DepartureBoard,
  EmptyState,
  ErrorState,
  FloatingTabBar,
  IconButton,
  LineRoundel,
  LineStrip,
  LineStripLegend,
  ListItem,
  makeStyles,
  ProgressStops,
  ProposalCard,
  RouteStation,
  Screen,
  Skeleton,
  Stack,
  StagePill,
  StationMarker,
  StatTile,
  Text,
  TextField,
  ThemeProvider,
  useTheme,
  type BadgeTone,
  type BannerTone,
  type ButtonVariant,
  type ColorScheme,
  type IconButtonVariant,
  type LineIndex,
  type Theme,
  type TypographyVariant,
} from '@/design-system';
import { STAGE_LABELS, STAGES } from '@/lib/stage';

const TYPE_VARIANTS: { variant: TypographyVariant; sample: string }[] = [
  { variant: 'display', sample: 'Today' },
  { variant: 'title', sample: 'Acme Health' },
  { variant: 'departure', sample: 'Book the onsite' },
  { variant: 'heading', sample: 'Your lines' },
  { variant: 'body', sample: 'Senior React Native Engineer · Austin, TX' },
  { variant: 'bodyStrong', sample: 'Recruiter screen went well' },
  { variant: 'bodySmall', sample: 'Applied 28 Oct · via link' },
  { variant: 'caption', sample: 'Shown on the pipeline card' },
  { variant: 'station', sample: 'Saved · Applied · Interview · Offer' },
  { variant: 'board', sample: 'Due tomorrow · Sat 7 Nov' },
];
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive'];
const ICON_VARIANTS: IconButtonVariant[] = ['primary', 'secondary', 'ghost'];
const BADGE_TONES: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const BANNER_TONES: BannerTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const STATION_STATES = ['passed', 'current', 'future'] as const;
const LINES: { index: LineIndex; letter: string; company: string }[] = [
  { index: 0, letter: 'A', company: 'Acme Health' },
  { index: 1, letter: 'N', company: 'Northwind Labs' },
  { index: 2, letter: 'G', company: 'Globex' },
  { index: 3, letter: 'I', company: 'Initech' },
];

const noop = () => undefined;

/** WCAG 2.x contrast ratio of two `#RRGGBB` colors, or `null` for any other format. */
function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function relativeLuminance(hex: string): number | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (match === null) return null;
  const [r, g, b] = match.slice(1, 4).map((part) => {
    const c = parseInt(part, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

interface SwatchSpec {
  role: string;
  value: string;
  /** The background this color is read against, for the contrast figure. */
  on?: { role: string; value: string };
}

function swatchesFor(color: Theme['color']): SwatchSpec[] {
  const canvas = { role: 'bg.canvas', value: color.bg.canvas };
  const surface = { role: 'bg.surface', value: color.bg.surface };
  const sign = { role: 'sign.bg', value: color.sign.bg };
  return [
    { role: 'bg.canvas', value: color.bg.canvas },
    { role: 'bg.surface', value: color.bg.surface },
    { role: 'bg.subtle', value: color.bg.subtle },
    { role: 'sign.bg', value: color.sign.bg },
    { role: 'sign.fg', value: color.sign.fg, on: sign },
    { role: 'sign.fgSecondary', value: color.sign.fgSecondary, on: sign },
    { role: 'text.primary', value: color.text.primary, on: canvas },
    { role: 'text.secondary', value: color.text.secondary, on: canvas },
    { role: 'text.tertiary', value: color.text.tertiary, on: surface },
    { role: 'text.link', value: color.text.link, on: surface },
    {
      role: 'action.primary.fg',
      value: color.action.primary.fg,
      on: { role: 'action.primary.bg', value: color.action.primary.bg },
    },
    { role: 'border.strong', value: color.border.strong, on: surface },
    { role: 'border.subtle', value: color.border.subtle },
    { role: 'focus.ring', value: color.focus.ring, on: surface },
    { role: 'urgent.bg', value: color.urgent.bg, on: sign },
    {
      role: 'urgent.fg',
      value: color.urgent.fg,
      on: { role: 'urgent.bg', value: color.urgent.bg },
    },
    { role: 'proposal.hatchB', value: color.proposal.hatchB },
    { role: 'station.future', value: color.station.future, on: surface },
    ...LINES.map(({ index }) => ({
      role: `line.${index}`,
      value: color.line[index].bg,
      on: surface,
    })),
    ...(['success', 'warning', 'danger', 'info'] as const).map((tone) => ({
      role: `feedback.${tone}.fg`,
      value: color.feedback[tone].fg,
      on: { role: `feedback.${tone}.bg`, value: color.feedback[tone].bg },
    })),
  ];
}

const useStyles = makeStyles((t) => ({
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
  },
  swatchText: { flex: 1 },
  typeRow: {
    gap: t.space[1],
    paddingVertical: t.space[2],
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.subtle,
  },
  radiusBox: {
    width: 56,
    height: 44,
    backgroundColor: t.color.bg.surface,
    borderWidth: 2,
    borderColor: t.color.border.strong,
  },
  stationCell: { width: 44, alignItems: 'center' },
  stationLabel: { flex: 1 },
  tabBarFrame: { minHeight: 96, justifyContent: 'flex-end' },
  spaceBar: { height: 8, borderRadius: t.radius.pill, backgroundColor: t.color.text.primary },
  elevationBox: {
    width: 96,
    minHeight: 56,
    padding: t.space[2],
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Text variant="station" color="secondary">
          {eyebrow}
        </Text>
        <Text variant="heading">{title}</Text>
      </Stack>
      {children}
    </Stack>
  );
}

function Concept() {
  return (
    <Card variant="sign">
      <Stack gap={2}>
        <Text color="onSign">
          Every application is a line. Stages are stations, the next step is a departure, and a
          closed application is a completed route: the trip still counts.
        </Text>
        <Text variant="board" color="onSignSecondary">
          Overpass · wayfinding display and body
        </Text>
        <Text variant="board" color="onSignSecondary">
          Overpass Mono · boards, dates, codes
        </Text>
      </Stack>
    </Card>
  );
}

function Palette() {
  const { color, scheme } = useTheme();
  const styles = useStyles();
  return (
    <Section
      eyebrow="Palette"
      title={scheme === 'light' ? 'Light · “Platform”' : 'Dark · “Night service”'}
    >
      <Card>
        <Stack gap={3}>
          {swatchesFor(color).map(({ role, value, on }) => {
            const ratio = on === undefined ? null : contrastRatio(value, on.value);
            return (
              <View key={role} style={styles.swatchRow}>
                <View style={[styles.swatch, { backgroundColor: value }]} />
                <View style={styles.swatchText}>
                  <Text variant="bodyStrong">{role}</Text>
                  <Text variant="board" color="secondary">
                    {ratio === null || on === undefined
                      ? value
                      : `${value} · ${ratio.toFixed(2)}:1 on ${on.role}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </Stack>
      </Card>
    </Section>
  );
}

function TypeScale() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Section eyebrow="Type scale" title="Signage weights">
      <Card>
        {TYPE_VARIANTS.map(({ variant, sample }) => {
          const spec = theme.type[variant];
          return (
            <View key={variant} style={styles.typeRow}>
              <Text variant="board" color="tertiary">
                {`${variant} ${spec.fontSize ?? ''}/${spec.lineHeight ?? ''} · ${spec.fontFamily ?? ''}`}
              </Text>
              <Text variant={variant}>{sample}</Text>
            </View>
          );
        })}
      </Card>
    </Section>
  );
}

function Shape() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Section eyebrow="Shape" title="Spacing, radii, elevation, motion">
      {Object.entries(theme.space).map(([key, value]) => (
        <Stack key={key} direction="row" gap={3} align="center">
          <Text variant="board" color="secondary">
            {`space.${key} ${value}`}
          </Text>
          <View style={[styles.spaceBar, { width: value }]} />
        </Stack>
      ))}
      <Stack direction="row" gap={4} wrap="wrap">
        {Object.entries(theme.radius).map(([key, value]) => (
          <Stack key={key} gap={1} align="center">
            <View style={[styles.radiusBox, { borderRadius: value }]} />
            <Text variant="board" color="secondary">
              {`${key} ${value}`}
            </Text>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" gap={4} wrap="wrap">
        {([0, 1, 2] as const).map((level) => (
          <View key={level} style={[styles.elevationBox, theme.elevation[level]]}>
            <Text variant="board">{`elevation.${level}`}</Text>
          </View>
        ))}
      </Stack>
      <Text variant="bodySmall" color="secondary">
        {`Cards ${theme.radius.lg}, inner boards and inputs ${theme.radius.md}, every control fully round. Flat surfaces; only floating controls cast a shadow (elevation 2). Motion ${theme.motion.fast}/${theme.motion.base}/${theme.motion.slow} ms${theme.reduceMotion ? ' (Reduce Motion on)' : ''}.`}
      </Text>
    </Section>
  );
}

function Stations() {
  const styles = useStyles();
  return (
    <Section eyebrow="Station markers · all 6 stages" title="Passed · current · future">
      <Card>
        <Stack gap={3}>
          {STAGES.map((stage, i) => (
            <Stack key={stage} direction="row" gap={2} align="center">
              {STATION_STATES.map((state) => (
                <View key={state} style={styles.stationCell}>
                  <StationMarker stage={stage} state={state} line={LINES[i % 4]?.index ?? 0} />
                </View>
              ))}
              <View style={styles.stationLabel}>
                <StagePill stage={stage} />
              </View>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Section>
  );
}

function Lines() {
  return (
    <Section eyebrow="Lines" title="Color + shape + letter">
      <Card>
        <Stack gap={3}>
          {LINES.map(({ index, letter, company }) => (
            <Stack key={index} direction="row" gap={3} align="center">
              <LineRoundel line={index} letter={letter} size="sm" />
              <LineRoundel line={index} letter={letter} size="md" />
              <LineRoundel line={index} letter={letter} size="lg" />
              <Text variant="bodyStrong">{`Line ${index} · ${company}`}</Text>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Section>
  );
}

function Strips() {
  return (
    <Section eyebrow="LineStrip" title="One strip per stage">
      <Card>
        <Stack gap={3}>
          <LineStripLegend />
          {STAGES.map((stage, i) => (
            <Stack key={stage} gap={1}>
              <Text variant="caption" color="secondary">
                {STAGE_LABELS[stage]}
              </Text>
              <LineStrip stage={stage} line={LINES[i % 4]?.index ?? 0} />
            </Stack>
          ))}
        </Stack>
      </Card>
    </Section>
  );
}

function Route() {
  const [selected, setSelected] = useState<string>('interviewing');
  return (
    <Section eyebrow="RouteStation" title="Application timeline">
      <Card>
        <RouteStation
          stage="saved"
          state="passed"
          line={0}
          label="Saved"
          meta="21 Oct"
          selected={selected === 'saved'}
          onPress={() => setSelected('saved')}
        />
        <RouteStation
          stage="applied"
          state="passed"
          line={0}
          label="Applied"
          meta="28 Oct"
          selected={selected === 'applied'}
          onPress={() => setSelected('applied')}
        />
        <RouteStation
          stage="interviewing"
          state="current"
          line={0}
          label="Interviewing"
          meta="4 Nov"
          tag="You are here"
          selected={selected === 'interviewing'}
          onPress={() => setSelected('interviewing')}
        >
          <ProposalCard eyebrow="Proposed · from email" onDevice>
            <Text variant="bodyStrong">Book the onsite</Text>
          </ProposalCard>
        </RouteStation>
        <RouteStation stage="offer" state="future" line={0} label="Offer" last />
      </Card>
    </Section>
  );
}

function Boards() {
  return (
    <Section eyebrow="Departures and proposals" title="Board · proposal vs confirmed">
      <DepartureBoard
        eyebrow="Next departure"
        count="1 today"
        line={{ index: 0, letter: 'A' }}
        title="Book the onsite"
        subtitle="Acme Health · Senior React Native Engineer"
        urgentLabel="Due tomorrow"
        action={{ label: 'Board →', onPress: noop }}
        onDone={noop}
        onDoneLabel="Mark done"
      />
      <ProposalCard eyebrow="Proposed · from email" onDevice>
        <Stack gap={1}>
          <Text variant="heading">Prep a 20-min system design walkthrough</Text>
          <Text variant="bodySmall" color="secondary">
            Planned works: shown hatched, like a line under construction.
          </Text>
          <Stack direction="row" gap={2} wrap="wrap">
            <Button label="Accept" onPress={noop} />
            <Button label="Dismiss" variant="secondary" onPress={noop} />
          </Stack>
        </Stack>
      </ProposalCard>
      <Card variant="sign">
        <Stack gap={1}>
          <Text variant="board" color="onSignSecondary">
            Next step · confirmed
          </Text>
          <Text variant="heading" color="onSign">
            Prep a 20-min system design walkthrough
          </Text>
        </Stack>
      </Card>
      <Card onPress={noop} accessibilityLabel="Pressable surface card">
        <Stack gap={1}>
          <Text variant="heading">Surface card, pressable</Text>
          <StagePill stage="offer" />
        </Stack>
      </Card>
      <Card variant="proposal">
        <Text>Proposal card variant, without the header</Text>
      </Card>
    </Section>
  );
}

function Controls() {
  const [text, setText] = useState('');
  const [chip, setChip] = useState('Today');
  return (
    <>
      <Section eyebrow="Badges" title="Urgent is the only yellow">
        <Stack direction="row" gap={2} wrap="wrap">
          <Badge tone="urgent" label="Due tomorrow" />
          <Badge tone="info" label="On-device" icon="lock-closed-outline" />
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone} label={tone} />
          ))}
        </Stack>
      </Section>
      <Section eyebrow="Buttons" title="Every control fully round">
        {BUTTON_VARIANTS.map((variant) => (
          <Stack key={variant} direction="row" gap={2} wrap="wrap">
            <Button label={variant} variant={variant} onPress={noop} />
            <Button label="Large" variant={variant} size="lg" icon="add" onPress={noop} />
            <Button label="Loading" variant={variant} loading onPress={noop} />
            <Button label="Disabled" variant={variant} disabled onPress={noop} />
          </Stack>
        ))}
        <Card variant="sign">
          <Stack direction="row" gap={2} align="center" wrap="wrap">
            <Button label="Board →" variant="onSign" onPress={noop} />
            <IconButton
              icon="settings-outline"
              variant="onSign"
              accessibilityLabel="Settings (onSign)"
              onPress={noop}
            />
          </Stack>
        </Card>
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
        </Stack>
      </Section>
      <Section eyebrow="Chips" title="Selected = ink fill">
        <Stack direction="row" gap={2} wrap="wrap">
          {['Today', 'Tomorrow', 'Next week'].map((label) => (
            <Chip
              key={label}
              label={label}
              selected={chip === label}
              onPress={() => setChip(label)}
            />
          ))}
          <Chip label="Offer" icon="trophy-outline" onPress={noop} />
        </Stack>
      </Section>
      <Section eyebrow="Text field" title="Inputs">
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
      <Section eyebrow="Banners" title="Flat, ruled in the tone color">
        {BANNER_TONES.map((tone) => (
          <Banner
            key={tone}
            tone={tone}
            title={`${tone} banner`}
            body="Supporting text explains what happened."
            {...(tone === 'danger' ? { action: { label: 'Try again', onPress: noop } } : {})}
          />
        ))}
      </Section>
    </>
  );
}

function Progress() {
  return (
    <Section eyebrow="Stats and practice" title="StatTile · ProgressStops">
      <Stack direction="row" gap={3}>
        <Stack flex={1}>
          <StatTile icon="git-branch-outline" value="4" label="Active lines" />
        </Stack>
        <Stack flex={1}>
          <StatTile icon="flag-outline" value="2" label="Routes complete" />
        </Stack>
      </Stack>
      <ProgressStops total={20} done={6} />
    </Section>
  );
}

function TabBarSample() {
  const styles = useStyles();
  const [tab, setTab] = useState('pipeline');
  const tabs = [
    { key: 'pipeline', label: 'Pipeline', icon: 'git-branch-outline' },
    { key: 'inbox', label: 'Inbox', icon: 'mail-outline', badge: '2' },
    { key: 'prep', label: 'Prep', icon: 'school-outline' },
  ] as const;
  return (
    <Section eyebrow="Navigation" title="FloatingTabBar">
      <View style={styles.tabBarFrame}>
        <FloatingTabBar
          tabs={tabs.map((t) => ({
            key: t.key,
            label: t.label,
            icon: t.icon,
            focused: tab === t.key,
            onPress: () => setTab(t.key),
            ...('badge' in t ? { badge: t.badge } : {}),
          }))}
          action={{ icon: 'add', accessibilityLabel: 'Add (sample)', onPress: noop }}
        />
      </View>
    </Section>
  );
}

function States() {
  return (
    <Section eyebrow="Rows and states" title="ListItem · Skeleton · Empty · Error">
      <Card>
        <ListItem
          title="Acme Health"
          subtitle="Senior React Native Engineer"
          leading={<LineRoundel line={0} letter="A" size="md" />}
          trailing={<StagePill stage="interviewing" />}
          onPress={noop}
        />
        <ListItem title="Static row" subtitle="Not pressable" />
      </Card>
      <Stack gap={2}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="100%" height={56} radius="lg" />
      </Stack>
      <EmptyState
        icon="git-branch-outline"
        title="No lines yet"
        body="Add a job you're interested in to start your first line."
        action={{ label: 'Add application', onPress: noop }}
      />
      <ErrorState error={{ kind: 'network' }} onRetry={noop} />
      <ErrorState error={{ kind: 'context_too_long' }} onRetry={noop} />
    </Section>
  );
}

function Gallery({ scheme, onToggle }: { scheme: ColorScheme; onToggle: () => void }) {
  const next = scheme === 'light' ? 'dark' : 'light';
  return (
    <Screen
      header="sign"
      eyebrow="Design system"
      title="Transit"
      scroll
      headerRight={
        <IconButton
          icon={scheme === 'light' ? 'moon-outline' : 'sunny-outline'}
          variant="onSign"
          accessibilityLabel={`Switch to ${next} theme`}
          onPress={onToggle}
        />
      }
    >
      <Stack gap={6}>
        <Concept />
        <Palette />
        <TypeScale />
        <Shape />
        <Stations />
        <Lines />
        <Strips />
        <Route />
        <Boards />
        <Controls />
        <Progress />
        <TabBarSample />
        <States />
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
