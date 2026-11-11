import {describe, expect, it} from 'vitest';
import {
  addTransitionHandles,
  freeStyleTransition,
} from './transitions';

describe('free-style transitions', () => {
  it('preserves the audio-derived total duration after transition overlap', () => {
    const audioDurations = [240, 300, 210];
    const transitionDurations = [18, 20];
    const sequenceDurations = addTransitionHandles(
      audioDurations,
      transitionDurations,
    );

    const transitionSeriesDuration =
      sequenceDurations.reduce((sum, duration) => sum + duration, 0) -
      transitionDurations.reduce((sum, duration) => sum + duration, 0);

    expect(sequenceDurations).toEqual([258, 320, 210]);
    expect(transitionSeriesDuration).toBe(750);
  });

  it('rejects missing transition durations', () => {
    expect(() => addTransitionHandles([240, 300, 210], [18])).toThrow(
      'Expected one transition duration between each pair of scenes',
    );
  });

  it('creates presets with the requested duration', () => {
    const transition = freeStyleTransition.directionalWipe('from-left', 16);

    expect(transition.timing.getDurationInFrames({fps: 30})).toBe(16);
  });
});
