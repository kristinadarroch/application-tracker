import { render, screen, within } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';

import { IconButton, Screen, Text, ThemeProvider, type ScreenHeader } from '@/design-system';

function withFontScale(fontScale: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 400, height: 800, scale: 3, fontScale });
}

type HostNode = ReturnType<typeof screen.getByText>;

/** The closest host ancestor laid out as a row, or null when the title sits in no row. */
function rowAround(node: HostNode): HostNode | null {
  for (let current = node.parent; current !== null; current = current.parent) {
    if (typeof current.type !== 'string') continue;
    const style = StyleSheet.flatten(
      current.props.style as Parameters<typeof StyleSheet.flatten>[0],
    );
    if (style?.flexDirection === 'row') return current;
  }
  return null;
}

async function renderHeader(header: ScreenHeader) {
  await render(
    <ThemeProvider preference="light">
      <Screen
        header={header}
        title="Pipeline"
        headerRight={
          <IconButton icon="add" accessibilityLabel="Add application" onPress={jest.fn()} />
        }
      >
        <Text>Body</Text>
      </Screen>
    </ThemeProvider>,
  );
}

/** Whether the title shares a row with the header button, so it must fit beside it. */
function titleSharesRowWithButton(): boolean {
  const row = rowAround(screen.getByText('Pipeline'));
  if (row === null) return false;
  return within(row).queryByLabelText('Add application') !== null;
}

describe('screen headers at large text sizes (WCAG 1.4.4, UX-2)', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each<ScreenHeader>(['panel', 'plain'])(
    '%s header keeps the title beside its buttons at default size',
    async (header) => {
      withFontScale(1);
      await renderHeader(header);
      expect(titleSharesRowWithButton()).toBe(true);
    },
  );

  it.each<ScreenHeader>(['panel', 'plain'])(
    '%s header gives the title the full width at large sizes',
    async (header) => {
      withFontScale(2);
      await renderHeader(header);
      expect(titleSharesRowWithButton()).toBe(false);
      expect(screen.getByRole('button', { name: 'Add application' })).toBeOnTheScreen();
      expect(screen.getByRole('header', { name: 'Pipeline' })).toBeOnTheScreen();
    },
  );
});
