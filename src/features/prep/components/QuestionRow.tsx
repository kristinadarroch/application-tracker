import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { makeStyles, Text, useTheme } from '@/design-system';

import type { PrepQuestion } from '../schema';

export interface QuestionRowProps {
  question: PrepQuestion;
  onToggle: () => void;
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.space[3],
    minHeight: t.size.minTouchTarget,
    paddingVertical: t.space[2],
    paddingHorizontal: t.space[1],
    borderRadius: t.radius.md,
  },
  pressed: { backgroundColor: t.color.bg.subtle },
  text: { flex: 1 },
}));

/** A prep question as a checkbox: tap marks it practiced (PREP-2). */
export function QuestionRow({ question, onToggle }: QuestionRowProps) {
  const styles = useStyles();
  const theme = useTheme();
  const practiced = question.practiced;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={question.text}
      accessibilityState={{ checked: practiced }}
      accessibilityHint={
        practiced ? 'Marks this question as not practiced' : 'Marks this question as practiced'
      }
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <Ionicons
        name={practiced ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={practiced ? theme.color.text.link : theme.color.text.tertiary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={styles.text}>
        <Text color={practiced ? 'secondary' : 'primary'}>{question.text}</Text>
      </View>
    </Pressable>
  );
}
