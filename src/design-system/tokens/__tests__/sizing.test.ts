import { minTouchTargetFor } from '../sizing';

describe('minTouchTargetFor', () => {
  it('meets Apple’s 44 pt minimum on iOS', () => {
    expect(minTouchTargetFor('ios')).toBe(44);
  });

  it('meets Material’s 48 dp minimum on Android', () => {
    expect(minTouchTargetFor('android')).toBe(48);
  });
});
