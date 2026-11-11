/**
 * tokens.ts - Design tokens for news/entertainment-magazine-light template.
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
  paper: '#FFF8F3',
  paper2: '#FBE7DF',
  ink: '#20161E',
  plum: '#4A233D',
  body: '#5B4A52',
  muted: '#927E86',
  faint: 'rgba(32, 22, 30, 0.16)',
  white: '#FFFFFF',
  coral: '#E64F6A',
  coralDark: '#B92748',
  citron: '#D6D84B',
  lilac: '#B99AE5',
  blush: '#F6C7D0',
  ticket: '#FFF1B8',
  shadow: 'rgba(74, 35, 61, 0.15)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 70,
  top: 116,
  subtitleBottom: 208,
  radius: 18,
  imageRadius: 28,
} as const;

export const TYPOGRAPHY = {
  section: 21,
  kicker: 26,
  headlineHero: 116,
  headline: 88,
  headlineSmall: 74,
  body: 31,
  bodySmall: 25,
  caption: 18,
  factValue: 54,
  factLabel: 17,
  quote: 54,
  quoteSource: 23,
  timelineTime: 25,
  timelineLabel: 31,
  tag: 20,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/entertainment-magazine-light',
  name: 'Entertainment Magazine Light',
  category: 'news',
  description:
    'Bản tin giải trí tone sáng kiểu tạp chí: ảnh/poster/bìa nguồn, headline serif, ticket strip, quote, timeline, ranking và gallery.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
