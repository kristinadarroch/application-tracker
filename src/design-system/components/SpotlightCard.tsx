import { Text as RNText, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import type { AccentIndex } from '../tokens/semantic';
import { Badge } from './Badge';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { CompanyBadge } from './CompanyBadge';
import { Text } from './Text';

export interface SpotlightCardAction {
  label: string;
  onPress: () => void;
}

export interface SpotlightCardProps {
  /** Yellow mono text, e.g. "UP NEXT" or "NEXT STEP". */
  eyebrow: string;
  /** Right-aligned mono text, e.g. "1 TODAY". */
  count?: string;
  accent?: { index: AccentIndex; letter: string };
  title: string;
  subtitle?: string;
  /** One more line under the subtitle, e.g. prep progress. */
  body?: string;
  /** Shown as an urgent badge ("Due tomorrow" renders as DUE TOMORROW). */
  urgentLabel?: string;
  /** Main action; shows a trailing arrow. */
  action?: SpotlightCardAction;
  /** Second action after the main one, without the arrow. */
  secondaryAction?: SpotlightCardAction;
  /** Round check button that marks the step done. */
  onDone?: () => void;
  /** Accessible name for the done button; defaults to "Mark <title> done". */
  onDoneLabel?: string;
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.color.panel.bg,
    borderRadius: t.radius.lg,
    paddingTop: 14,
    paddingBottom: t.space[4],
    paddingHorizontal: t.space[4],
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space[2],
  },
  eyebrow: { ...t.type.mono, color: t.color.urgent.bg, flexShrink: 1 },
  count: { ...t.type.mono, color: t.color.panel.fgSecondary },
  main: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  titles: { flex: 1 },
  badgeWrap: { alignSelf: 'stretch', justifyContent: 'center', flexShrink: 1 },
  bottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2], flexShrink: 1 },
}));

/** Dark panel spotlighting one item: the next Next Step ("Up next") or the next interview. */
export function SpotlightCard({
  eyebrow,
  count,
  accent,
  title,
  subtitle,
  body,
  urgentLabel,
  action,
  secondaryAction,
  onDone,
  onDoneLabel,
}: SpotlightCardProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <RNText
          style={styles.eyebrow}
          maxFontSizeMultiplier={theme.maxFontSizeMultiplier.mono}
          accessibilityRole="header"
        >
          {eyebrow}
        </RNText>
        {count !== undefined ? (
          <RNText style={styles.count} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.mono}>
            {count}
          </RNText>
        ) : null}
      </View>
      <View style={styles.main}>
        {accent !== undefined ? (
          <CompanyBadge accent={accent.index} letter={accent.letter} size="lg" surface="panel" />
        ) : null}
        <View style={styles.titles}>
          <Text variant="feature" color="onPanel">
            {title}
          </Text>
          {subtitle !== undefined ? (
            <Text variant="bodySmall" color="onPanelSecondary">
              {subtitle}
            </Text>
          ) : null}
          {body !== undefined ? (
            <Text variant="bodySmall" color="onPanel">
              {body}
            </Text>
          ) : null}
        </View>
        {onDone !== undefined ? (
          <IconButton
            icon="checkmark"
            variant="onPanel"
            accessibilityLabel={onDoneLabel ?? `Mark ${title} done`}
            onPress={onDone}
          />
        ) : null}
      </View>
      {urgentLabel !== undefined || action !== undefined || secondaryAction !== undefined ? (
        <View style={styles.bottom}>
          <View style={styles.badgeWrap}>
            {urgentLabel !== undefined ? <Badge tone="urgent" label={urgentLabel} /> : null}
          </View>
          <View style={styles.actions}>
            {action !== undefined ? (
              <Button
                label={action.label}
                onPress={action.onPress}
                variant="onPanel"
                trailingIcon="arrow-forward"
              />
            ) : null}
            {secondaryAction !== undefined ? (
              <Button
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                variant="onPanel"
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
