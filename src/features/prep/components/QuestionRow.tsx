import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { makeStyles, Text, useTheme, type LineIndex } from '@/design-system';

import type { PrepQuestion } from '../schema';

export interface QuestionRowProps {
  question: PrepQuestion;
  /** The application's line: the track and practiced markers use its color. */
  line: LineIndex;
  /** `end` stops the track at this question's marker (the last stop of its section). */
  track: 'continues' | 'end';
  onToggle: () => void;
}

const MARKER = 22;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: t.space[3],
    minHeight: t.size.minTouchTarget,
    borderRadius: t.radius.md,
  },
  pressed: { backgroundColor: t.color.bg.subtle },
  rail: { width: t.space[8], alignItems: 'center' },
  // Above the marker the track always runs (it joins the previous stop or the section header).
  trackTop: { width: 4, height: t.space[3] },
  trackBottom: { width: 4, flex: 1 },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: t.radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.bg.surface,
  },
  text: { flex: 1, paddingTop: t.space[3], paddingBottom: t.space[4] },
  line0: { backgroundColor: t.color.line[0].bg, borderColor: t.color.line[0].bg },
  line1: { backgroundColor: t.color.line[1].bg, borderColor: t.color.line[1].bg },
  line2: { backgroundColor: t.color.line[2].bg, borderColor: t.color.line[2].bg },
  line3: { backgroundColor: t.color.line[3].bg, borderColor: t.color.line[3].bg },
  border0: { borderColor: t.color.line[0].bg },
  border1: { borderColor: t.color.line[1].bg },
  border2: { borderColor: t.color.line[2].bg },
  border3: { borderColor: t.color.line[3].bg },
}));

const FILL = ['line0', 'line1', 'line2', 'line3'] as const;
const BORDER = ['border0', 'border1', 'border2', 'border3'] as const;

/**
 * A prep question as a stop on the application's line, and a checkbox: tap marks it practiced
 * (PREP-2). Practiced stops are filled with a check; unpracticed ones are hollow rings.
 */
export function QuestionRow({ question, line, track, onToggle }: QuestionRowProps) {
  const styles = useStyles();
  const theme = useTheme();
  const practiced = question.practiced;
  const fill = styles[FILL[line]];
  return (
    <Pressable
      testID="prep-question"
      accessibilityRole="checkbox"
      accessibilityLabel={question.text}
      accessibilityState={{ checked: practiced }}
      accessibilityHint={
        practiced ? 'Marks this question as not practiced' : 'Marks this question as practiced'
      }
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View
        style={styles.rail}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={[styles.trackTop, fill]} />
        <View style={[styles.marker, practiced ? fill : styles[BORDER[line]]]}>
          {practiced ? (
            <Ionicons name="checkmark" size={14} color={theme.color.line[line].fg} />
          ) : null}
        </View>
        {track === 'continues' ? <View style={[styles.trackBottom, fill]} /> : null}
      </View>
      <View style={styles.text}>
        <Text color={practiced ? 'secondary' : 'primary'}>{question.text}</Text>
      </View>
    </Pressable>
  );
}
