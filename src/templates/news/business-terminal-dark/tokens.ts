import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadRobotoCondensed } from '@remotion/google-fonts/RobotoCondensed';
import { loadFont as loadRobotoMono } from '@remotion/google-fonts/RobotoMono';

export const { fontFamily: FONT_MAIN } = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_HEADLINE } = loadRobotoCondensed('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_MONO } = loadRobotoMono('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  bg: '#080D11',
  bg2: '#111820',
  panel: 'rgba(17, 25, 31, 0.92)',
  panel2: 'rgba(11, 17, 22, 0.94)',
  panelWarm: 'rgba(25, 22, 16, 0.92)',
  ink: '#F5F1E7',
  body: '#D4D9D6',
  muted: '#8C9896',
  faint: 'rgba(216, 225, 220, 0.13)',
  grid: 'rgba(202, 215, 210, 0.065)',
  gridStrong: 'rgba(202, 215, 210, 0.13)',
  green: '#3FDB83',
  greenDim: '#173E2C',
  red: '#F25A52',
  redDim: '#4B1C1C',
  amber: '#E9B95B',
  amberDim: '#493619',
  cyan: '#69D3D7',
  blue: '#6C93FF',
  white: '#FFFFFF',
  black: '#030608',
  shadow: 'rgba(0, 0, 0, 0.38)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 66,
  top: 86,
  radius: 12,
  panelRadius: 10,
  subtitleBottom: 196,
} as const;

export const TYPOGRAPHY = {
  marketLabel: 18,
  ticker: 21,
  eyebrow: 22,
  headlineHero: 104,
  headline: 78,
  headlineSmall: 62,
  body: 29,
  bodySmall: 23,
  caption: 18,
  metricValue: 76,
  metricLabel: 18,
  tableText: 23,
  quote: 42,
  monoSmall: 19,
} as const;

export const TEMPLATE_META = {
  id: 'news/business-terminal-dark',
  name: 'Business Terminal Dark',
  category: 'news',
  description:
    'Bản tin kinh doanh/tài chính tone tối kiểu market terminal: ticker, số liệu lớn, biểu đồ, rủi ro và triển vọng.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
