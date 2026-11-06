import { render, screen } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';

import { Button, StagePill, ThemeProvider } from '@/design-system';

function withFontScale(fontScale: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 400, height: 800, scale: 3, fontScale });
}

/** Vector icons render as glyph text that opts out of font scaling; their font size is the icon size. */
function iconSizes(): number[] {
  const sizes: number[] = [];
  const visit = (node: ReactTestRendererJSON | string) => {
    if (typeof node === 'string') return;
    if (node.type === 'Text' && node.props.allowFontScaling === false) {
      const { fontSize } = StyleSheet.flatten(node.props.style);
      if (typeof fontSize === 'number') sizes.push(fontSize);
    }
    node.children?.forEach(visit);
  };
  const tree = screen.toJSON();
  (Array.isArray(tree) ? tree : tree === null ? [] : [tree]).forEach(visit);
  return sizes;
}

async function renderPair() {
  await render(
    <ThemeProvider preference="light">
      <Button label="Save" icon="checkmark" onPress={() => undefined} />
      <StagePill stage="applied" />
    </ThemeProvider>,
  );
}

describe('icons follow the text size (UX-2)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps base sizes at the default text size', async () => {
    withFontScale(1);
    await renderPair();
    expect(iconSizes()).toEqual(expect.arrayContaining([18, 14]));
  });

  it('grows with large text but stops at the label cap (caption 1.6x) or 2x', async () => {
    withFontScale(3.1);
    await renderPair();
    const sizes = iconSizes();
    expect(sizes).toContain(36); // button: 18 × 2 (icon cap; body text is uncapped)
    expect(sizes).toContain(22); // stage pill: 14 × 1.6 (same cap as the caption label)
  });

  it('never shrinks below the base size when the user picks smaller text', async () => {
    withFontScale(0.8);
    await renderPair();
    expect(iconSizes()).toEqual(expect.arrayContaining([18, 14]));
  });
});
