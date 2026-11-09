import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles } from '../theme/makeStyles';
import { IconButton } from './IconButton';
import { Text } from './Text';

/** `plain`: title on the paper gray · `panel`: dark rounded panel (tab roots). */
export type ScreenHeader = 'plain' | 'panel';

export interface ScreenProps {
  title?: string;
  /** Small line above the title: a date on panel headers ("FRI 6 NOV"), context on plain ones. */
  eyebrow?: string;
  headerRight?: ReactNode;
  /** Renders a round "Back" button at the start of the header. */
  onBack?: () => void;
  scroll?: boolean;
  header?: ScreenHeader;
  /** Full-width content under the title row, inside the panel (e.g. `ProgressSteps`). */
  headerAccessory?: ReactNode;
  children: ReactNode;
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.color.bg.canvas },
  plain: {
    gap: t.space[2],
    paddingHorizontal: t.space[4],
    paddingTop: t.space[2],
    paddingBottom: t.space[3],
  },
  panel: {
    gap: t.space[3],
    marginHorizontal: t.space[4],
    marginTop: t.space[2],
    marginBottom: t.space[3],
    paddingVertical: t.space[3],
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.lg,
    backgroundColor: t.color.panel.bg,
  },
  panelWithBack: { paddingLeft: t.space[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWrap: { flex: 1 },
  body: { flex: 1, paddingHorizontal: t.space[4] },
  scrollContent: { paddingHorizontal: t.space[4], paddingBottom: t.space[6], gap: t.space[3] },
}));

/** Header pieces resolved by `Screen`; each may be absent. */
interface HeaderProps {
  title: string | undefined;
  eyebrow: string | undefined;
  headerRight: ReactNode;
  onBack: (() => void) | undefined;
  headerAccessory: ReactNode;
}

function PanelHeader({ title, eyebrow, headerRight, onBack, headerAccessory }: HeaderProps) {
  const styles = useStyles();
  return (
    <View style={[styles.panel, onBack !== undefined ? styles.panelWithBack : null]}>
      <View style={styles.row}>
        {onBack !== undefined ? (
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={onBack}
            variant="onPanel"
          />
        ) : null}
        <View style={styles.titleWrap}>
          {eyebrow !== undefined ? (
            <Text variant="mono" color="onPanelSecondary">
              {eyebrow}
            </Text>
          ) : null}
          {title !== undefined ? (
            <Text variant={onBack === undefined ? 'display' : 'title'} color="onPanel">
              {title}
            </Text>
          ) : null}
        </View>
        {headerRight}
      </View>
      {headerAccessory}
    </View>
  );
}

function PlainHeader({ title, eyebrow, headerRight, onBack, headerAccessory }: HeaderProps) {
  const styles = useStyles();
  const hasTitle = title !== undefined || eyebrow !== undefined;
  return (
    <View style={styles.plain}>
      {onBack !== undefined ? (
        <View style={styles.toolbar}>
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={onBack}
            variant="secondary"
          />
          {headerRight}
        </View>
      ) : null}
      {hasTitle || (onBack === undefined && headerRight !== undefined) ? (
        <View style={styles.row}>
          <View style={styles.titleWrap}>
            {eyebrow !== undefined ? (
              <Text variant="overline" color="secondary">
                {eyebrow}
              </Text>
            ) : null}
            {title !== undefined ? <Text variant="title">{title}</Text> : null}
          </View>
          {onBack === undefined ? headerRight : null}
        </View>
      ) : null}
      {headerAccessory}
    </View>
  );
}

/** Safe-area aware screen shell. The title is rendered as a header for screen readers. */
export function Screen({
  title,
  eyebrow,
  headerRight,
  onBack,
  scroll = false,
  header = 'plain',
  headerAccessory,
  children,
}: ScreenProps) {
  const styles = useStyles();
  const hasHeader =
    title !== undefined ||
    eyebrow !== undefined ||
    headerRight !== undefined ||
    onBack !== undefined ||
    headerAccessory !== undefined;
  const headerProps: HeaderProps = { title, eyebrow, headerRight, onBack, headerAccessory };
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {hasHeader ? (
        header === 'panel' ? (
          <PanelHeader {...headerProps} />
        ) : (
          <PlainHeader {...headerProps} />
        )
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
