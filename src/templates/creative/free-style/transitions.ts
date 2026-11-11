import {linearTiming, springTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {flip} from '@remotion/transitions/flip';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';

export const DEFAULT_TRANSITION_FRAMES = 18;

export const freeStyleTransition = {
  softFade: (durationInFrames = DEFAULT_TRANSITION_FRAMES) => ({
    presentation: fade(),
    timing: linearTiming({durationInFrames}),
  }),
  energeticSlide: (
    direction: 'from-left' | 'from-right' | 'from-top' | 'from-bottom' = 'from-right',
    durationInFrames = 20,
  ) => ({
    presentation: slide({direction}),
    timing: springTiming({
      durationInFrames,
      config: {damping: 200},
    }),
  }),
  directionalWipe: (
    direction: 'from-left' | 'from-right' | 'from-top' | 'from-bottom' = 'from-left',
    durationInFrames = 18,
  ) => ({
    presentation: wipe({direction}),
    timing: linearTiming({durationInFrames}),
  }),
  technicalFlip: (
    direction: 'from-left' | 'from-right' | 'from-top' | 'from-bottom' = 'from-right',
    durationInFrames = 20,
  ) => ({
    presentation: flip({direction}),
    timing: springTiming({
      durationInFrames,
      config: {damping: 200},
    }),
  }),
} as const;

/**
 * TransitionSeries overlaps adjacent scenes and therefore subtracts transition
 * frames from its total duration. Add each transition to the sequence before it
 * so the final video length and audio-derived scene start times stay unchanged.
 */
export const addTransitionHandles = (
  audioSceneDurations: readonly number[],
  transitionDurations: readonly number[],
): number[] => {
  if (transitionDurations.length !== Math.max(0, audioSceneDurations.length - 1)) {
    throw new Error('Expected one transition duration between each pair of scenes');
  }

  return audioSceneDurations.map((duration, index) =>
    index < transitionDurations.length
      ? duration + transitionDurations[index]
      : duration,
  );
};
