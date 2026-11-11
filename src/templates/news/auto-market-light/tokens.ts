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
  paper: '#F4F7F4',
  paper2: '#E8EEE8',
  paperWarm: '#FBF3E4',
  ink: '#101820',
  body: '#37444A',
  muted: '#718086',
  rule: 'rgba(16, 24, 32, 0.14)',
  ruleStrong: 'rgba(16, 24, 32, 0.28)',
  grid: 'rgba(16, 24, 32, 0.07)',
  card: '#FFFFFF',
  cardCool: '#EEF5F4',
  blue: '#1E6FA8',
  cyan: '#148BA0',
  green: '#17875A',
  red: '#D54438',
  amber: '#C98521',
  navy: '#12314A',
  shadow: 'rgba(20, 32, 38, 0.14)',
  white: '#FFFFFF',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 68,
  top: 82,
  subtitleBottom: 196,
  radius: 10,
} as const;

export const TYPOGRAPHY = {
  label: 18,
  eyebrow: 22,
  headlineHero: 96,
  headline: 78,
  headlineSmall: 62,
  body: 29,
  bodySmall: 23,
  metricValue: 62,
  metricLabel: 17,
  table: 23,
  quote: 43,
  caption: 18,
} as const;

export const TEMPLATE_META = {
  id: 'news/auto-market-light',
  name: 'Auto Market Light',
  category: 'news',
  description:
    'Bản tin thị trường xe tone sáng: ra mắt, khai tử, xu hướng xe điện, giá bán, chính sách, vòng đời mẫu xe và hành vi người mua.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
