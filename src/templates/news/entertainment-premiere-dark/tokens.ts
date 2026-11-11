/**
 * tokens.ts - Design tokens for news/entertainment-premiere-dark template.
 */

import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadNewsreader } from '@remotion/google-fonts/Newsreader';

export const { fontFamily: FONT_MAIN } = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_DISPLAY } = loadNewsreader('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  bg: '#0D0A10',
  bg2: '#17101A',
  ink: '#FFF7EC',
  body: '#D8C9BE',
  muted: '#9D8791',
  faint: 'rgba(255, 247, 236, 0.14)',
  panel: 'rgba(31, 20, 34, 0.78)',
  panel2: 'rgba(255, 247, 236, 0.08)',
  black: '#080609',
  gold: '#F2C66D',
  amber: '#FF9F45',
  coral: '#F15D72',
  wine: '#5A1F37',
  violet: '#7C5CBF',
  teal: '#6ED0C7',
  shadow: 'rgba(0, 0, 0, 0.42)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 70,
  top: 118,
  subtitleBottom: 208,
  radius: 18,
  imageRadius: 22,
} as const;

export const TYPOGRAPHY = {
  section: 20,
  kicker: 25,
  headlineHero: 112,
  headline: 86,
  headlineSmall: 72,
  body: 31,
  bodySmall: 25,
  caption: 18,
  factValue: 52,
  factLabel: 17,
  quote: 52,
  quoteSource: 23,
  timelineTime: 25,
  timelineLabel: 31,
  tag: 20,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/entertainment-premiere-dark',
  name: 'Entertainment Premiere Dark',
  category: 'news',
  description:
    'Bản tin giải trí tone tối kiểu premiere: nền sân khấu không top bar, poster/ảnh nguồn, quote, timeline, ranking và review.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
