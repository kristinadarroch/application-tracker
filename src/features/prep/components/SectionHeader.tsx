import { View } from 'react-native';

import { Text } from '@/design-system';

/** Section caption in the `station` style, exposed as a header so screen readers can jump to it. */
export function SectionHeader({ label }: { label: string }) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={label}>
      <Text variant="station" color="secondary">
        {label}
      </Text>
    </View>
  );
}
