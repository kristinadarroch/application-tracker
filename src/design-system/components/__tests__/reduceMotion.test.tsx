import { render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';

import { Skeleton, ThemeProvider } from '@/design-system';

function spyOnPulse() {
  const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  const loop = jest.spyOn(Animated, 'loop').mockReturnValue(animation);
  return { loop, animation };
}

async function renderSkeleton(reduceMotion: boolean) {
  const resolved = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(reduceMotion);
  await render(
    <ThemeProvider preference="light">
      <Skeleton width={120} height={16} />
    </ThemeProvider>,
  );
  await waitFor(() => expect(resolved).toHaveBeenCalled());
}

describe('Skeleton and Reduce Motion (UX-4)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps pulsing when Reduce Motion is off', async () => {
    const { loop, animation } = spyOnPulse();
    await renderSkeleton(false);
    expect(loop).toHaveBeenCalledTimes(1);
    expect(animation.start).toHaveBeenCalled();
    expect(animation.stop).not.toHaveBeenCalled();
  });

  it('stops the pulse and stays static once Reduce Motion is on', async () => {
    const { loop, animation } = spyOnPulse();
    await renderSkeleton(true);
    await waitFor(() => expect(animation.stop).toHaveBeenCalled());
    expect(loop).toHaveBeenCalledTimes(1);
  });
});
