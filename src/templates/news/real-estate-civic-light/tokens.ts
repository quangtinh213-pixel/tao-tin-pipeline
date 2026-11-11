/**
 * tokens.ts — Design tokens for news/real-estate-civic-light template.
 */

import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto';
import { loadFont as loadRobotoCondensed } from '@remotion/google-fonts/RobotoCondensed';

export const { fontFamily: FONT_HEADLINE } = loadRobotoCondensed('normal', {
  weights: ['700'],
  subsets: ['latin', 'vietnamese'],
});

export const { fontFamily: FONT_BODY } = loadInter('normal', {
  weights: ['400', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const { fontFamily: FONT_META } = loadRoboto('normal', {
  weights: ['500', '700', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const FONT_MAIN = FONT_BODY;

export const COLORS = {
  background: '#FFF0F4',
  background2: '#FFE5EC',
  text: '#1F151D',
  body: '#4B2C39',
  muted: '#83777D',
  faint: '#B5A8AE',
  accent: '#F04F64',
  accentDark: '#D83D51',
  accentSoft: '#FFD8E0',
  imageCaption: '#9B6673',
  subtitle: '#8C8589',
  subtitlePast: '#B9AEB3',
  subtitleActive: '#1F151D',
  grid: 'rgba(240, 79, 100, 0.045)',
  gridStrong: 'rgba(240, 79, 100, 0.075)',
  white: '#FFFFFF',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 72,
  top: 172,
  subtitleBottom: 214,
  imageRadius: 12,
} as const;

export const TYPOGRAPHY = {
  meta: 26,
  headlineHuge: 86,
  headlineLarge: 74,
  headlineMedium: 64,
  body: 35,
  bodySmall: 31,
  caption: 20,
  subtitle: 33,
  chip: 21,
} as const;

export const TEMPLATE_META = {
  id: 'news/real-estate-civic-light',
  name: 'Real Estate Civic Light',
  category: 'news',
  description:
    'Bản tin bất động sản dân sinh/quy hoạch xã hội. Nền hồng phấn, headline nặng, ảnh có nguồn, timeline và quote rõ ràng.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
