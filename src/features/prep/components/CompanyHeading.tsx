import { View } from 'react-native';

import { CompanyBadge, makeStyles, Text } from '@/design-system';
import type { Application } from '@/features/applications/model';
import { accentFor } from '@/lib/accents';

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  text: { flex: 1 },
}));

/** The application's company badge next to "role · company", under a prep screen title. */
export function CompanyHeading({ application }: { application: Application }) {
  const styles = useStyles();
  const accent = accentFor(application.id, application.company);
  return (
    <View style={styles.row}>
      <CompanyBadge accent={accent.index} letter={accent.letter} size="sm" />
      <View style={styles.text}>
        <Text color="secondary">{`${application.role} · ${application.company}`}</Text>
      </View>
    </View>
  );
}
