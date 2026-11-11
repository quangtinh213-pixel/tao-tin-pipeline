/**
 * tokens.ts — Design tokens for news/real-estate-civic-dark template.
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
  background: '#091014',
  background2: '#111D24',
  panel: '#101A20',
  text: '#F6F1E7',
  body: '#D7DFE0',
  muted: '#7E9096',
  faint: '#3B4A50',
  accent: '#F2B84B',
  accent2: '#4FC3D7',
  accentDark: '#C9821C',
  accentSoft: 'rgba(242, 184, 75, 0.15)',
  imageCaption: '#A9B7B9',
  subtitle: '#9CA9AC',
  subtitlePast: '#626F73',
  subtitleActive: '#F6F1E7',
  grid: 'rgba(79, 195, 215, 0.06)',
  gridStrong: 'rgba(242, 184, 75, 0.10)',
  white: '#FFFFFF',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 72,
  top: 150,
  subtitleBottom: 214,
  imageRadius: 6,
} as const;

export const TYPOGRAPHY = {
  meta: 25,
  headlineHuge: 88,
  headlineLarge: 76,
  headlineMedium: 64,
  body: 34,
  bodySmall: 30,
  caption: 20,
  subtitle: 33,
  chip: 21,
} as const;

export const TEMPLATE_META = {
  id: 'news/real-estate-civic-dark',
  name: 'Real Estate Civic Dark',
  category: 'news',
  description:
    'Bản tin bất động sản dân sinh/quy hoạch xã hội với nền đêm đô thị, khung ảnh shutter reveal, accent vàng pháp lý và cyan bản đồ.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
