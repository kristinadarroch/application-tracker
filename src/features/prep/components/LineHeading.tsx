import { View } from 'react-native';

import { LineRoundel, makeStyles, Text } from '@/design-system';
import type { Application } from '@/features/applications/model';
import { lineFor } from '@/lib/lines';

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  text: { flex: 1 },
}));

/** The application's line roundel next to "role · company", under a prep screen title. */
export function LineHeading({ application }: { application: Application }) {
  const styles = useStyles();
  const line = lineFor(application.id, application.company);
  return (
    <View style={styles.row}>
      <LineRoundel line={line.index} letter={line.letter} size="sm" />
      <View style={styles.text}>
        <Text color="secondary">{`${application.role} · ${application.company}`}</Text>
      </View>
    </View>
  );
}
