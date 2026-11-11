import {loadFont} from '@remotion/google-fonts/BeVietnamPro';
import {Easing, interpolate} from 'remotion';
import type {TransitionSfxName} from '../templates/creative/free-style-sfx';

export const {fontFamily} = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  bg: '#F3EEDF',
  paper: '#FFFDF7',
  text: '#172033',
  muted: '#647083',
  accent: '#B53A2E',
  accent2: '#D89B28',
  line: '#D8CAB2',
  dark: '#243348',
  green: '#4D7B63',
} as const;

// Kept for legacy generated scene files that remain in the workspace.
export const C = {
  bg: '#081821',
  ink: '#F0F5EC',
  lime: '#B9F36C',
  cyan: '#73D6E8',
  muted: '#9CB4BC',
  panel: '#102B36',
  line: '#2B4851',
} as const;

export const SCENE_STARTS = [0, 197, 470, 834, 1119, 1384, 1594] as const;
export const SCENE_DURATIONS = [197, 273, 364, 285, 265, 210, 416] as const;
export const durations = [...SCENE_DURATIONS];

export const SCENE_ENTRY_SFX: Array<{
  frame: number;
  name: TransitionSfxName;
  volume: number;
}> = [
  {frame: 0, name: 'whoosh', volume: 0.18},
  {frame: 197, name: 'pageTurn', volume: 0.2},
  {frame: 470, name: 'whip', volume: 0.15},
  {frame: 834, name: 'whoosh', volume: 0.18},
  {frame: 1119, name: 'pageTurn', volume: 0.2},
  {frame: 1384, name: 'whip', volume: 0.15},
  {frame: 1594, name: 'pageTurn', volume: 0.2},
];

export const p = (frame: number, start: number, length = 30) =>
  interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

export const reveal = (frame: number, length = 24) => p(frame, 0, length);
