import { Alert, View } from 'react-native';

import { Badge, Card, IconButton, makeStyles, Text } from '@/design-system';
import { isUrgent } from '@/lib/dates';
import type { ApplicationId } from '@/lib/ids';
import { useAppDispatch } from '@/store/hooks';

import { dueLabel } from '../nextStepDue';
import type { NextStep } from '../schema';
import { nextStepRemoved, nextStepToggled } from '../slice';

export interface NextStepRowProps {
  applicationId: ApplicationId;
  step: NextStep;
  now: Date;
  /** Panel eyebrow for open steps: "Next step" for the soonest, "Then" for the rest. */
  eyebrow?: string;
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  text: { flex: 1, gap: t.space[1] },
  due: { flexDirection: 'row', flexWrap: 'wrap' },
}));

/**
 * One Next Step. Open steps are dark panels (urgent yellow badge within
 * 48 hours); completed steps are plain rows. Both toggle done and delete.
 */
export function NextStepRow({ applicationId, step, now, eyebrow }: NextStepRowProps) {
  const dispatch = useAppDispatch();
  const styles = useStyles();
  const due = dueLabel(step.dueDate, now);
  const toggle = () =>
    dispatch(nextStepToggled({ applicationId, id: step.id, now: new Date().toISOString() }));
  const remove = () =>
    Alert.alert(
      'Delete this next step?',
      `“${step.title}” will be removed. This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            dispatch(
              nextStepRemoved({ applicationId, id: step.id, now: new Date().toISOString() }),
            ),
        },
      ],
    );

  if (step.done) {
    return (
      <View style={styles.row}>
        <IconButton
          icon="checkmark-circle"
          variant="ghost"
          accessibilityLabel={`Mark “${step.title}” not done`}
          onPress={toggle}
        />
        <View style={styles.text}>
          <Text>{step.title}</Text>
          <Text variant="bodySmall" color="secondary">
            Done
          </Text>
        </View>
        <IconButton
          icon="trash-outline"
          variant="ghost"
          accessibilityLabel={`Delete “${step.title}”`}
          onPress={remove}
        />
      </View>
    );
  }

  return (
    <Card variant="panel">
      <View style={styles.row}>
        <View style={styles.text}>
          {eyebrow !== undefined ? (
            <Text variant="mono" color="onPanelSecondary">
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="feature" color="onPanel">
            {step.title}
          </Text>
          <View style={styles.due}>
            {isUrgent(step.dueDate, now) ? (
              <Badge tone="urgent" label={due} />
            ) : (
              <Text variant="mono" color="onPanelSecondary">
                {due}
              </Text>
            )}
          </View>
        </View>
        <IconButton
          icon="checkmark"
          variant="onPanel"
          accessibilityLabel={`Mark “${step.title}” done`}
          onPress={toggle}
        />
        <IconButton
          icon="trash-outline"
          variant="onPanel"
          accessibilityLabel={`Delete “${step.title}”`}
          onPress={remove}
        />
      </View>
    </Card>
  );
}
