import { lineFor } from '../lines';

describe('lineFor', () => {
  it('gives an application the same line every time', () => {
    expect(lineFor('app_123', 'Acme Health')).toEqual(lineFor('app_123', 'Acme Health'));
  });

  it('spreads applications across all four lines', () => {
    const indexes = new Set(
      Array.from({ length: 40 }, (_, i) => lineFor(`app_${i}`, 'Acme').index),
    );
    expect([...indexes].sort()).toEqual([0, 1, 2, 3]);
  });

  it("letters the roundel with the company's first letter or digit", () => {
    expect(lineFor('a', 'northwind labs').letter).toBe('N');
    expect(lineFor('a', '  3M').letter).toBe('3');
    expect(lineFor('a', 'Évora Health').letter).toBe('É');
  });

  it('falls back to a dot when the company has no letters', () => {
    expect(lineFor('a', ' — ').letter).toBe('•');
  });
});
