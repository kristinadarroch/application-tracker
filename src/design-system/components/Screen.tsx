import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles } from '../theme/makeStyles';
import { IconButton } from './IconButton';
import { Text } from './Text';

export interface ScreenProps {
  title?: string;
  headerRight?: ReactNode;
  /** Renders a "Back" button at the start of the header row. */
  onBack?: () => void;
  scroll?: boolean;
  children: ReactNode;
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.color.bg.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space[3],
    paddingHorizontal: t.space[4],
    paddingTop: t.space[2],
    paddingBottom: t.space[3],
  },
  titleWrap: { flex: 1 },
  body: { flex: 1, paddingHorizontal: t.space[4] },
  scrollContent: { paddingHorizontal: t.space[4], paddingBottom: t.space[6], gap: t.space[3] },
}));

/** Safe-area aware screen shell. The title is rendered as a header for screen readers. */
export function Screen({ title, headerRight, onBack, scroll = false, children }: ScreenProps) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {title !== undefined || headerRight !== undefined || onBack !== undefined ? (
        <View style={styles.header}>
          {onBack !== undefined ? (
            <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={onBack} />
          ) : null}
          <View style={styles.titleWrap}>
            {title !== undefined ? <Text variant="title">{title}</Text> : null}
          </View>
          {headerRight}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </SafeAreaView>
  );
}
