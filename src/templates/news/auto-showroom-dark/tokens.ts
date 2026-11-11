import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadRobotoCondensed } from '@remotion/google-fonts/RobotoCondensed';
import { loadFont as loadRobotoMono } from '@remotion/google-fonts/RobotoMono';

export const { fontFamily: FONT_MAIN } = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_DISPLAY } = loadRobotoCondensed('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_MONO } = loadRobotoMono('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  bg: '#070A0E',
  bg2: '#101720',
  floor: '#151A20',
  panel: 'rgba(15, 22, 30, 0.9)',
  panel2: 'rgba(8, 12, 17, 0.94)',
  ink: '#F4F7F8',
  body: '#C7D0D5',
  muted: '#7F8C95',
  faint: 'rgba(213, 228, 235, 0.14)',
  grid: 'rgba(213, 228, 235, 0.07)',
  chrome: '#B8C7CF',
  chrome2: '#E9F2F6',
  blue: '#35C6FF',
  blueDim: '#0E3042',
  red: '#F04A3E',
  redDim: '#3E1816',
  amber: '#F2B84B',
  amberDim: '#443115',
  green: '#4BE18C',
  black: '#020304',
  shadow: 'rgba(0, 0, 0, 0.46)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 66,
  top: 86,
  subtitleBottom: 198,
  radius: 14,
  panelRadius: 12,
} as const;

export const TYPOGRAPHY = {
  badge: 18,
  eyebrow: 22,
  headlineHero: 104,
  headline: 80,
  headlineSmall: 64,
  body: 29,
  bodySmall: 23,
  specValue: 64,
  specLabel: 17,
  table: 23,
  caption: 18,
  quote: 43,
} as const;

export const TEMPLATE_META = {
  id: 'news/auto-showroom-dark',
  name: 'Auto Showroom Dark',
  category: 'news',
  description:
    'Bản tin xe tone tối kiểu showroom/road test: ánh đèn, spec cards, gauge, compare board, recall và road-ahead checklist.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
