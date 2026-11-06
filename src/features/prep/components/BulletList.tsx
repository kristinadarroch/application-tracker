import { Stack, Text } from '@/design-system';

export interface BulletListProps {
  title: string;
  items: string[];
  /** Shown instead of the list when there are no items. */
  emptyText: string;
}

export function BulletList({ title, items, emptyText }: BulletListProps) {
  return (
    <Stack gap={1}>
      <Text variant="bodyStrong">{title}</Text>
      {items.length === 0 ? (
        <Text color="secondary">{emptyText}</Text>
      ) : (
        items.map((item) => <Text key={item}>{`• ${item}`}</Text>)
      )}
    </Stack>
  );
}
