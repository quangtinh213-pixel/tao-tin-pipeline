/**
 * tokens.ts - Design tokens for news/travel-postcard-light template.
 */

import { loadFont as loadBeVietnamPro } from '@remotion/google-fonts/BeVietnamPro';
import { loadFont as loadPlayfairDisplay } from '@remotion/google-fonts/PlayfairDisplay';

export const { fontFamily: FONT_SANS } = loadBeVietnamPro('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const { fontFamily: FONT_SERIF } = loadPlayfairDisplay('normal', {
  weights: ['600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  paper: '#F7F8F4',
  paperWarm: '#FFF5E8',
  paperCool: '#E9F4F0',
  ink: '#17312B',
  body: '#46564D',
  muted: '#7D8A82',
  faint: '#B8C0B9',
  forest: '#1F5B4D',
  sea: '#2B8EA3',
  coral: '#E75D45',
  coralSoft: 'rgba(231, 93, 69, 0.12)',
  sand: '#E9DCC5',
  stamp: '#B84E3D',
  white: '#FFFFFF',
  rule: 'rgba(23, 49, 43, 0.16)',
  grid: 'rgba(31, 91, 77, 0.055)',
  shadow: 'rgba(38, 50, 44, 0.16)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 72,
  top: 124,
  subtitleBottom: 204,
  postcardRadius: 28,
} as const;

export const TYPOGRAPHY = {
  meta: 20,
  stamp: 28,
  headlineHero: 104,
  headline: 88,
  headlineSmall: 74,
  body: 31,
  bodySmall: 25,
  caption: 18,
  factValue: 132,
  factUnit: 44,
  routeTitle: 25,
  routeStop: 30,
  listIndex: 22,
  listText: 34,
  subtitle: 33,
} as const;

export const TEMPLATE_META = {
  id: 'news/travel-postcard-light',
  name: 'Travel Postcard Light',
  category: 'news',
  description:
    'Bản tin du lịch sáng kiểu tạp chí postcard: ảnh nguồn, tem địa điểm, route strip, boarding-pass fact và lưu ý địa phương.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
