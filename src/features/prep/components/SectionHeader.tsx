import { View } from 'react-native';

import { Text } from '@/design-system';

/** Section caption in the `overline` style, exposed as a header so screen readers can jump to it. */
export function SectionHeader({ label }: { label: string }) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={label}>
      <Text variant="overline" color="secondary">
        {label}
      </Text>
    </View>
  );
}
