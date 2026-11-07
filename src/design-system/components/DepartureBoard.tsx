import { Text as RNText, View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import type { LineIndex } from '../tokens/semantic';
import { Badge } from './Badge';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { LineRoundel } from './LineRoundel';
import { Text } from './Text';

export interface DepartureBoardAction {
  label: string;
  onPress: () => void;
}

export interface DepartureBoardProps {
  /** Yellow board text, e.g. "NEXT DEPARTURE" or "NEXT STEP". */
  eyebrow: string;
  /** Right-aligned board text, e.g. "1 TODAY". */
  count?: string;
  line?: { index: LineIndex; letter: string };
  title: string;
  subtitle?: string;
  /** Shown as an urgent badge ("Due tomorrow" renders as DUE TOMORROW). */
  urgentLabel?: string;
  action?: DepartureBoardAction;
  /** Round check button that marks the step done. */
  onDone?: () => void;
  /** Accessible name for the done button; defaults to "Mark <title> done". */
  onDoneLabel?: string;
}

const useStyles = makeStyles((t) => ({
  board: {
    backgroundColor: t.color.sign.bg,
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
  eyebrow: { ...t.type.board, color: t.color.urgent.bg, flexShrink: 1 },
  count: { ...t.type.board, color: t.color.sign.fgSecondary },
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
}));

/** Dark sign panel announcing the next step (B1 "Next departure", B2 "Next step"). */
export function DepartureBoard({
  eyebrow,
  count,
  line,
  title,
  subtitle,
  urgentLabel,
  action,
  onDone,
  onDoneLabel,
}: DepartureBoardProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.board}>
      <View style={styles.top}>
        <RNText style={styles.eyebrow} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.board}>
          {eyebrow}
        </RNText>
        {count !== undefined ? (
          <RNText style={styles.count} maxFontSizeMultiplier={theme.maxFontSizeMultiplier.board}>
            {count}
          </RNText>
        ) : null}
      </View>
      <View style={styles.main}>
        {line !== undefined ? (
          <LineRoundel line={line.index} letter={line.letter} size="lg" surface="sign" />
        ) : null}
        <View style={styles.titles}>
          <Text variant="departure" color="onSign">
            {title}
          </Text>
          {subtitle !== undefined ? (
            <Text variant="bodySmall" color="onSignSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onDone !== undefined ? (
          <IconButton
            icon="checkmark"
            variant="onSign"
            accessibilityLabel={onDoneLabel ?? `Mark ${title} done`}
            onPress={onDone}
          />
        ) : null}
      </View>
      {urgentLabel !== undefined || action !== undefined ? (
        <View style={styles.bottom}>
          <View style={styles.badgeWrap}>
            {urgentLabel !== undefined ? <Badge tone="urgent" label={urgentLabel} /> : null}
          </View>
          {action !== undefined ? (
            <Button
              label={action.label}
              onPress={action.onPress}
              variant="onSign"
              trailingIcon="arrow-forward"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
