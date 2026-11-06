import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import type { IconName } from './icons';
import { Text } from './Text';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  body: string;
  action?: EmptyStateAction;
}

const useStyles = makeStyles((t) => ({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[3],
    paddingHorizontal: t.space[6],
    paddingVertical: t.space[10],
  },
}));

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons
        name={icon}
        size={48}
        color={theme.color.text.tertiary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text variant="display" align="center">
        {title}
      </Text>
      <Text color="secondary" align="center">
        {body}
      </Text>
      {action !== undefined ? <Button label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}
