import { prepAccessibilityText, prepProgressText, prepRowText } from '../prepProgress';

describe('prep progress text', () => {
  it('reads "Prep not started" with no questions and no mock interviews', () => {
    const summary = { practiced: 0, total: 0, mockCount: 0 };
    expect(prepProgressText(summary)).toBe('Prep not started');
    expect(prepRowText(summary)).toBe('Prep not started');
    expect(prepAccessibilityText(summary)).toBe('Prep: not started');
  });

  it('pluralises questions and mock interviews', () => {
    expect(prepProgressText({ practiced: 4, total: 10, mockCount: 1 })).toBe(
      '4 of 10 questions practiced · 1 mock interview',
    );
    expect(prepProgressText({ practiced: 1, total: 1, mockCount: 2 })).toBe(
      '1 of 1 question practiced · 2 mock interviews',
    );
    expect(prepRowText({ practiced: 4, total: 10, mockCount: 1 })).toBe(
      '4 of 10 practiced · 1 mock',
    );
    expect(prepRowText({ practiced: 0, total: 5, mockCount: 3 })).toBe(
      '0 of 5 practiced · 3 mocks',
    );
  });

  it('leaves out a part that has nothing in it', () => {
    expect(prepProgressText({ practiced: 0, total: 10, mockCount: 0 })).toBe(
      '0 of 10 questions practiced',
    );
    expect(prepProgressText({ practiced: 0, total: 0, mockCount: 1 })).toBe('1 mock interview');
    expect(prepAccessibilityText({ practiced: 4, total: 10, mockCount: 0 })).toBe(
      'Prep: 4 of 10 questions practiced',
    );
    expect(prepAccessibilityText({ practiced: 4, total: 10, mockCount: 2 })).toBe(
      'Prep: 4 of 10 questions practiced, 2 mock interviews',
    );
  });
});
