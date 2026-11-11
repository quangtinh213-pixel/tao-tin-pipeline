import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadNewsreader } from '@remotion/google-fonts/Newsreader';
import { loadFont as loadRobotoMono } from '@remotion/google-fonts/RobotoMono';

export const { fontFamily: FONT_MAIN } = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_SERIF } = loadNewsreader('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_MONO } = loadRobotoMono('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  paper: '#F8F1E3',
  paper2: '#EFE3CC',
  paper3: '#FFF9ED',
  ink: '#14120E',
  body: '#3D382F',
  muted: '#827768',
  rule: 'rgba(20, 18, 14, 0.16)',
  ruleStrong: 'rgba(20, 18, 14, 0.32)',
  card: 'rgba(255, 250, 239, 0.92)',
  cardCool: '#EEF3F0',
  navy: '#17324D',
  blue: '#285E8E',
  green: '#16784B',
  red: '#B84332',
  gold: '#B9852C',
  goldSoft: '#E8D2A3',
  shadow: 'rgba(63, 45, 20, 0.14)',
  white: '#FFFFFF',
  black: '#080704',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 68,
  top: 82,
  subtitleBottom: 196,
  radius: 8,
} as const;

export const TYPOGRAPHY = {
  dateline: 18,
  section: 19,
  headlineHero: 96,
  headline: 78,
  headlineSmall: 62,
  body: 29,
  bodySmall: 23,
  metricValue: 60,
  metricLabel: 17,
  table: 23,
  quote: 43,
  caption: 18,
} as const;

export const TEMPLATE_META = {
  id: 'news/business-ledger-light',
  name: 'Business Ledger Light',
  category: 'news',
  description:
    'Bản tin kinh doanh/tài chính tone sáng kiểu financial newspaper: giấy ngà, ledger table, serif headline, chỉ số và memo kinh tế.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
