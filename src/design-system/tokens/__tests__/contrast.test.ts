import { contrastRatio } from '../contrast';
import { darkColors, lightColors, type AccentIndex, type SemanticColors } from '../semantic';

type Pair = [name: string, fg: string, bg: string];

const ACCENTS: AccentIndex[] = [0, 1, 2, 3];
const TONES = ['success', 'warning', 'danger', 'info'] as const;

/** Text pairs in use (WCAG 1.4.3, ≥ 4.5:1). Mirrors the audit's contrast table. */
function textPairs(c: SemanticColors): Pair[] {
  const grounds: [string, string][] = [
    ['canvas', c.bg.canvas],
    ['surface', c.bg.surface],
    ['subtle', c.bg.subtle],
    ['hatch', c.proposal.hatchB],
  ];
  const pairs: Pair[] = [];
  for (const [role, fg] of [
    ['text.primary', c.text.primary],
    ['text.secondary', c.text.secondary],
    ['text.tertiary', c.text.tertiary],
    ['feedback.danger.fg', c.feedback.danger.fg],
  ] as const) {
    for (const [ground, bg] of grounds) pairs.push([`${role} on ${ground}`, fg, bg]);
  }
  pairs.push(
    ['text.link on canvas', c.text.link, c.bg.canvas],
    ['text.link on surface', c.text.link, c.bg.surface],
    ['action.primary.fg on bg', c.action.primary.fg, c.action.primary.bg],
    ['action.primary.fg on bgPressed', c.action.primary.fg, c.action.primary.bgPressed],
    ['panel.fg on panel.bg', c.panel.fg, c.panel.bg],
    ['panel.fgSecondary on panel.bg', c.panel.fgSecondary, c.panel.bg],
    ['urgent.bg as text on panel.bg', c.urgent.bg, c.panel.bg],
    ['urgent.fg on urgent.bg', c.urgent.fg, c.urgent.bg],
  );
  for (const tone of TONES) {
    pairs.push([`feedback.${tone}.fg on bg`, c.feedback[tone].fg, c.feedback[tone].bg]);
  }
  for (const i of ACCENTS) pairs.push([`accent.${i}.fg on bg`, c.accent[i].fg, c.accent[i].bg]);
  return pairs;
}

/** Meaningful non-text marks (WCAG 1.4.11, ≥ 3:1). */
function nonTextPairs(c: SemanticColors): Pair[] {
  const pairs: Pair[] = [];
  for (const [ground, bg] of [
    ['surface', c.bg.surface],
    ['canvas', c.bg.canvas],
    ['hatch', c.proposal.hatchB],
  ] as const) {
    pairs.push([`border.strong (input border) on ${ground}`, c.border.strong, bg]);
    pairs.push([`focus.ring on ${ground}`, c.focus.ring, bg]);
  }
  pairs.push([
    'feedback.danger.fg (invalid border) on surface',
    c.feedback.danger.fg,
    c.bg.surface,
  ]);
  for (const [ground, bg] of [
    ['surface', c.bg.surface],
    ['canvas', c.bg.canvas],
    ['subtle', c.bg.subtle],
    ['panel', c.panel.bg],
  ] as const) {
    pairs.push([`stage.future on ${ground}`, c.stage.future, bg]);
  }
  for (const i of ACCENTS) {
    pairs.push([`accent.${i} (stage/progress fill) on surface`, c.accent[i].bg, c.bg.surface]);
    pairs.push([`accent.${i} (stage/progress fill) on canvas`, c.accent[i].bg, c.bg.canvas]);
    pairs.push([`accent.${i} on panel.badgePlate`, c.accent[i].bg, c.panel.badgePlate]);
  }
  for (const tone of TONES) {
    pairs.push([`feedback.${tone}.fg (icon) on surface`, c.feedback[tone].fg, c.bg.surface]);
  }
  pairs.push(['urgent.bg (FAB icon, practiced steps) on panel.bg', c.urgent.bg, c.panel.bg]);
  return pairs;
}

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as const)('%s theme contrast', (_theme, colors) => {
  it.each(textPairs(colors))('text: %s ≥ 4.5:1', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(nonTextPairs(colors))('non-text: %s ≥ 3:1', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white and null for non-hex input', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    expect(contrastRatio('rgba(0,0,0,1)', '#FFFFFF')).toBeNull();
  });
});
