/**
 * tokens.ts - Design tokens for news/real-estate-plex-light template.
 */

import { loadFont } from '@remotion/google-fonts/IBMPlexSans';

export const { fontFamily: FONT_PLEX } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const FONT_MAIN = FONT_PLEX;

export const COLORS = {
  paper: '#FCFDFF',
  paper2: '#F6F9FF',
  ink: '#1F2023',
  body: '#55575C',
  muted: '#85878C',
  faint: '#B8BBC1',
  accent: '#1265FF',
  accentSoft: 'rgba(18, 101, 255, 0.08)',
  rule: 'rgba(31, 32, 35, 0.2)',
  grid: 'rgba(20, 34, 55, 0.04)',
  gridStrong: 'rgba(18, 101, 255, 0.026)',
  white: '#FFFFFF',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 74,
  top: 144,
  subtitleBottom: 214,
  imageRadius: 0,
} as const;

export const TYPOGRAPHY = {
  meta: 21,
  headlineHero: 128,
  headline: 104,
  headlineSmall: 88,
  body: 32,
  bodySmall: 27,
  caption: 17,
  metric: 178,
  metricUnit: 58,
  rowTitle: 62,
  rowMeta: 22,
  listIndex: 25,
  listText: 41,
  quoteMark: 88,
  quote: 64,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/real-estate-plex-light',
  name: 'Real Estate Plex Light',
  category: 'news',
  description:
    'Bản tin bất động sản sáng, tối giản bằng IBM Plex Sans: nền grid trắng-xanh, headline lớn, ảnh báo, bảng thông tin và subtitle đáy.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
