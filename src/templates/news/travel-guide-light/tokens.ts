/**
 * tokens.ts - Design tokens for news/travel-guide-light template.
 */

import { loadFont } from '@remotion/google-fonts/BeVietnamPro';

export const { fontFamily: FONT_MAIN } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  bg: '#EDF1F5',
  bg2: '#F8FAFC',
  panel: '#FFFFFF',
  ink: '#101828',
  body: '#475467',
  muted: '#667085',
  faint: '#CBD5E1',
  green: '#101828',
  blue: '#008C95',
  coral: '#FF7A1A',
  yellow: '#D7FF43',
  red: '#C2413B',
  line: 'rgba(16, 24, 40, 0.13)',
  grid: 'rgba(16, 24, 40, 0.055)',
  shadow: 'rgba(16, 24, 40, 0.14)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 66,
  top: 112,
  subtitleBottom: 200,
} as const;

export const TYPOGRAPHY = {
  meta: 19,
  headlineHero: 96,
  headline: 80,
  headlineSmall: 68,
  body: 30,
  cardTitle: 27,
  cardText: 25,
  bigNumber: 118,
  subtitle: 33,
} as const;

export const TEMPLATE_META = {
  id: 'news/travel-guide-light',
  name: 'Travel Guide Light',
  category: 'news',
  description:
    'Bản tin hướng dẫn du lịch sáng, thực dụng: chi phí, lịch trình, checklist, mùa đi và nên/không nên.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
