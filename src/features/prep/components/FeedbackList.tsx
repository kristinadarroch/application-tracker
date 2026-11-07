import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { makeStyles, Stack, Text, useTheme } from '@/design-system';
import { assertNever } from '@/lib/assertNever';

export type FeedbackKind = 'strengths' | 'gaps';

export interface FeedbackListProps {
  kind: FeedbackKind;
  items: string[];
  /** Shown instead of the list when there are no items. */
  emptyText: string;
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] },
  // Shape differs as well as color: a circle for what to keep, a square for what to add.
  strengths: {
    width: 28,
    height: 28,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.feedback.success.fg,
  },
  gaps: {
    width: 28,
    height: 28,
    borderRadius: t.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.feedback.warning.fg,
  },
  text: { flex: 1 },
}));

function copyFor(kind: FeedbackKind): { title: string; icon: 'checkmark' | 'add' } {
  switch (kind) {
    case 'strengths':
      return { title: 'Strengths', icon: 'checkmark' };
    case 'gaps':
      return { title: 'Gaps', icon: 'add' };
    default:
      return assertNever(kind);
  }
}

/** Strengths (what to keep) or Gaps (what to add) of Answer Feedback, as a marked row of bullets. */
export function FeedbackList({ kind, items, emptyText }: FeedbackListProps) {
  const styles = useStyles();
  const theme = useTheme();
  const { title, icon } = copyFor(kind);
  return (
    <View style={styles.row}>
      <View
        style={styles[kind]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name={icon} size={18} color={theme.color.text.inverse} />
      </View>
      <View style={styles.text}>
        <Stack gap={1}>
          <Text variant="bodyStrong">{title}</Text>
          {items.length === 0 ? (
            <Text color="secondary">{emptyText}</Text>
          ) : (
            items.map((item) => <Text key={item}>{`• ${item}`}</Text>)
          )}
        </Stack>
      </View>
    </View>
  );
}
