import { Pressable, View } from 'react-native';

import { Badge, CompanyBadge, StageProgress, makeStyles, Text } from '@/design-system';
import { accentFor } from '@/lib/accents';
import { STAGE_LABELS } from '@/lib/stage';

import { prepAccessibilityText, prepRowText } from '../prepProgress';
import type { Application } from '../schema';
import type { PrepSummary } from '../selectors';

export interface ApplicationRowProps {
  application: Application;
  /** Set when the application has an urgent open Next Step, e.g. "Due tomorrow". */
  urgentLabel: string | undefined;
  /** Prep progress; shown only while the application is Interviewing. */
  prep: PrepSummary;
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
 * One application: company badge, company, role, prep progress while Interviewing, and its
 * stage progress strip. Text wraps instead of truncating so large text never hides the company,
 * role, or stage (UX-2); the strip is decorative, so the accessible label carries the stage.
 */
export function ApplicationRow({ application, urgentLabel, prep, onPress }: ApplicationRowProps) {
  const styles = useStyles();
  const { id, company, role, location, stage } = application;
  const accent = accentFor(id, company);
  const closed = stage === 'rejected' || stage === 'withdrawn';
  const interviewing = stage === 'interviewing';
  const accessibilityLabel = [
    company,
    role,
    location,
    `Stage: ${STAGE_LABELS[stage]}`,
    urgentLabel === undefined ? undefined : `Urgent: ${urgentLabel}`,
    interviewing ? prepAccessibilityText(prep) : undefined,
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
      <CompanyBadge accent={accent.index} letter={accent.letter} size="md" />
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
        {interviewing ? (
          <Text variant="bodySmall" color="secondary">
            {prepRowText(prep)}
          </Text>
        ) : null}
        <StageProgress stage={stage} accent={accent.index} />
        {closed || urgentLabel !== undefined ? (
          <View style={styles.footer}>
            {closed ? (
              <Text variant="overline" color="secondary">
                {stage === 'rejected' ? 'Closed: rejected' : 'Closed: withdrawn'}
              </Text>
            ) : null}
            {urgentLabel !== undefined ? <Badge tone="urgent" label={urgentLabel} /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
