import { stripBoilerplate, trimToTokenBudget } from '../budget';

describe('stripBoilerplate', () => {
  it('drops navigation and legal lines and collapses whitespace', () => {
    const page =
      'Skip to content\n  Senior   Engineer at Acme  \n\nAccept all cookies\n© 2026 Acme';
    expect(stripBoilerplate(page)).toBe('Senior Engineer at Acme');
  });
});

describe('trimToTokenBudget', () => {
  it('leaves text that fits untouched', () => {
    expect(trimToTokenBudget('Acme is hiring a React Native engineer.', 100)).toEqual({
      text: 'Acme is hiring a React Native engineer.',
      trimmed: false,
    });
  });

  it('keeps the beginning, cuts at a word boundary, and reports the trim', () => {
    const listing = `Acme Health — Senior React Native Engineer\n${'requirement '.repeat(500)}`;
    const result = trimToTokenBudget(listing, 50);
    expect(result.trimmed).toBe(true);
    expect(result.text.startsWith('Acme Health — Senior React Native Engineer')).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(150);
    expect(result.text.endsWith('requirement')).toBe(true);
  });
});
