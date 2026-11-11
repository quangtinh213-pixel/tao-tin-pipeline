import {describe, expect, it} from 'vitest';
import {addTransitionHandles} from '../free-style';
import {pixelStyleTransition} from './transitions';

describe('pixel-style transitions', () => {
  it('creates deterministic frame durations for stepped pixel transitions', () => {
    const transition = pixelStyleTransition.tileWipe('from-left', 16);

    expect(transition.timing.getDurationInFrames({fps: 30})).toBe(16);
  });

  it('preserves the audio-derived duration when transitions overlap', () => {
    const durations = addTransitionHandles([180, 240, 210], [16, 12]);

    expect(durations).toEqual([196, 252, 210]);
    expect(durations.reduce((sum, value) => sum + value, 0) - 28).toBe(630);
  });
});
