import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { describeError, type AppError } from '@/lib/errors';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import { Text } from './Text';

export interface ErrorStateProps {
  error: AppError;
  onRetry?: () => void;
}

const useStyles = makeStyles((t) => ({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[3],
    paddingHorizontal: t.space[6],
    paddingVertical: t.space[8],
  },
}));

/** Plain-language copy from `describeError`; Retry only when retrying can help. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const styles = useStyles();
  const theme = useTheme();
  const copy = describeError(error);
  return (
    <View style={styles.wrap}>
      <Ionicons
        name="alert-circle-outline"
        size={40}
        color={theme.color.feedback.danger.fg}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text variant="heading" align="center">
        {copy.title}
      </Text>
      <Text color="secondary" align="center">
        {copy.body}
      </Text>
      {onRetry !== undefined && copy.retryable ? (
        <Button label="Retry" icon="refresh" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}
