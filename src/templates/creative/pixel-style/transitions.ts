import {linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {flip} from '@remotion/transitions/flip';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';

export const DEFAULT_PIXEL_TRANSITION_FRAMES = 16;

type PixelDirection =
  | 'from-left'
  | 'from-right'
  | 'from-top'
  | 'from-bottom';

const timing = (durationInFrames: number) =>
  linearTiming({durationInFrames});

export const pixelStyleTransition = {
  pixelDissolve: (durationInFrames = DEFAULT_PIXEL_TRANSITION_FRAMES) => ({
    presentation: fade(),
    timing: timing(durationInFrames),
  }),
  tileWipe: (
    direction: PixelDirection = 'from-left',
    durationInFrames = DEFAULT_PIXEL_TRANSITION_FRAMES,
  ) => ({
    presentation: wipe({direction}),
    timing: timing(durationInFrames),
  }),
  screenScroll: (
    direction: PixelDirection = 'from-bottom',
    durationInFrames = 18,
  ) => ({
    presentation: slide({direction}),
    timing: timing(durationInFrames),
  }),
  glitchCut: (
    direction: PixelDirection = 'from-right',
    durationInFrames = 12,
  ) => ({
    presentation: flip({direction}),
    timing: timing(durationInFrames),
  }),
} as const;
