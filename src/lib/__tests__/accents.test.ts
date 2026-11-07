import { accentFor } from '../accents';

describe('accentFor', () => {
  it('gives an application the same accent every time', () => {
    expect(accentFor('app_123', 'Acme Health')).toEqual(accentFor('app_123', 'Acme Health'));
  });

  it('spreads applications across all four accents', () => {
    const indexes = new Set(
      Array.from({ length: 40 }, (_, i) => accentFor(`app_${i}`, 'Acme').index),
    );
    expect([...indexes].sort()).toEqual([0, 1, 2, 3]);
  });

  it("letters the badge with the company's first letter or digit", () => {
    expect(accentFor('a', 'northwind labs').letter).toBe('N');
    expect(accentFor('a', '  3M').letter).toBe('3');
    expect(accentFor('a', 'Évora Health').letter).toBe('É');
  });

  it('falls back to a dot when the company has no letters', () => {
    expect(accentFor('a', ' — ').letter).toBe('•');
  });
});
