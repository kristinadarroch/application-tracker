import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { describeError, type AppError } from '@/lib/errors';

import { useAnnounce } from '../a11y/useAnnounce';
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
  copy: { alignItems: 'center', gap: t.space[3] },
}));

/** Bodies longer than this are left for the user to read; the title alone is announced. */
const MAX_ANNOUNCED_BODY = 120;

/**
 * Plain-language copy from `describeError`; Retry only when retrying can help. Announced as a
 * status message when it appears or changes (WCAG 4.1.3): VoiceOver via `useAnnounce`, TalkBack
 * via the live region.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const styles = useStyles();
  const theme = useTheme();
  const copy = describeError(error);
  useAnnounce(copy.body.length <= MAX_ANNOUNCED_BODY ? `${copy.title}. ${copy.body}` : copy.title);
  return (
    <View style={styles.wrap}>
      <Ionicons
        name="alert-circle-outline"
        size={40}
        color={theme.color.feedback.danger.fg}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={styles.copy} accessibilityLiveRegion="polite">
        <Text variant="heading" align="center">
          {copy.title}
        </Text>
        <Text color="secondary" align="center">
          {copy.body}
        </Text>
      </View>
      {onRetry !== undefined && copy.retryable ? (
        <Button label="Retry" icon="refresh" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}
