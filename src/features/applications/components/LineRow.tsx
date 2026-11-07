import { Pressable, View } from 'react-native';

import { Badge, LineRoundel, LineStrip, makeStyles, Text } from '@/design-system';
import { lineFor } from '@/lib/lines';
import { STAGE_LABELS } from '@/lib/stage';

import type { Application } from '../schema';

export interface LineRowProps {
  application: Application;
  /** Set when the application has an urgent open Next Step, e.g. "Due tomorrow". */
  urgentLabel: string | undefined;
  onPress: () => void;
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.space[3],
    paddingVertical: t.space[2],
    borderRadius: t.radius.md,
  },
  pressed: { backgroundColor: t.color.bg.subtle },
  body: { flex: 1, gap: t.space[1] },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space[2] },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.space[2] },
}));

/**
 * One application as a transit line: roundel, company, role, and its strip of stations.
 * Text wraps instead of truncating so large text never hides the company, role, or stage (UX-2);
 * the strip is decorative, so the accessible label carries the stage.
 */
export function LineRow({ application, urgentLabel, onPress }: LineRowProps) {
  const styles = useStyles();
  const { id, company, role, location, stage } = application;
  const line = lineFor(id, company);
  const closed = stage === 'rejected' || stage === 'withdrawn';
  const accessibilityLabel = [
    company,
    role,
    location,
    `Stage: ${STAGE_LABELS[stage]}`,
    urgentLabel === undefined ? undefined : `Urgent: ${urgentLabel}`,
  ]
    .filter((part) => part !== undefined)
    .join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens the application"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <LineRoundel line={line.index} letter={line.letter} size="md" />
      <View style={styles.body}>
        <Text variant="bodyStrong">{company}</Text>
        <View style={styles.meta}>
          <Text variant="bodySmall" color="secondary">
            {role}
          </Text>
          {location !== undefined ? (
            <Text variant="bodySmall" color="tertiary">
              {location}
            </Text>
          ) : null}
        </View>
        <LineStrip stage={stage} line={line.index} />
        {closed || urgentLabel !== undefined ? (
          <View style={styles.footer}>
            {closed ? (
              <Text variant="station" color="secondary">
                {stage === 'rejected' ? 'Route complete' : 'Left the line'}
              </Text>
            ) : null}
            {urgentLabel !== undefined ? <Badge tone="urgent" label={urgentLabel} /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
