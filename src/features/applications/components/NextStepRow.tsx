import { View } from 'react-native';

import { Badge, IconButton, makeStyles, Text } from '@/design-system';
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
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  text: { flex: 1, gap: t.space[1] },
}));

/** One Next Step: toggle done, title with due date (warning badge when urgent), delete. */
export function NextStepRow({ applicationId, step, now }: NextStepRowProps) {
  const dispatch = useAppDispatch();
  const styles = useStyles();
  const due = dueLabel(step.dueDate, now);
  return (
    <View style={styles.row}>
      <IconButton
        icon={step.done ? 'checkmark-circle' : 'ellipse-outline'}
        accessibilityLabel={
          step.done ? `Mark “${step.title}” not done` : `Mark “${step.title}” done`
        }
        onPress={() =>
          dispatch(nextStepToggled({ applicationId, id: step.id, now: new Date().toISOString() }))
        }
      />
      <View style={styles.text}>
        <Text>{step.title}</Text>
        {step.done ? (
          <Text variant="bodySmall" color="secondary">
            Done
          </Text>
        ) : isUrgent(step.dueDate, now) ? (
          <Badge tone="warning" label={due} />
        ) : (
          <Text variant="bodySmall" color="secondary">
            {due}
          </Text>
        )}
      </View>
      <IconButton
        icon="trash-outline"
        accessibilityLabel={`Delete “${step.title}”`}
        onPress={() => dispatch(nextStepRemoved({ applicationId, id: step.id }))}
      />
    </View>
  );
}
