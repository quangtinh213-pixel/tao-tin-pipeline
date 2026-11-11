/**
 * tokens.ts — Design tokens for news/current-affairs-light template.
 */

import { loadFont } from '@remotion/google-fonts/BeVietnamPro';
import type { NewsTheme } from '../shared/types';
import { BADGE_LABELS } from '../shared/types';

export { BADGE_LABELS };
export type { BadgeType, ImageSource, KenBurnsConfig, KenBurnsDirection } from '../shared/types';

export const { fontFamily: FONT_MAIN } = loadFont('normal', {
  weights: ['300', '400', '600', '700', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  bg: '#F7F2E8',
  text: '#171C26',
  accent: '#B3261E',
  accent2: '#183A59',
  muted: '#6D6A63',
  border: 'rgba(24,58,89,0.14)',
  cardBg: '#FFFDF7',
  subtitleAccent: '#B3261E',
  rule: 'rgba(179,38,30,0.22)',
  mapLine: 'rgba(24,58,89,0.08)',
} as const;

export const TYPOGRAPHY = {
  headlineLarge: 84,
  headlineMedium: 60,
  body: 26,
  caption: 20,
  badge: 18,
  subtitleSize: 36,
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingH: 56,
  paddingV: 120,
  dividerWidth: 64,
  dividerHeight: 5,
  cardRadius: 8,
} as const;

export const THEME: NewsTheme = {
  colors: { ...COLORS },
  typography: TYPOGRAPHY,
  layout: LAYOUT,
  fontFamily: FONT_MAIN,
  useGradientAccent: false,
};

export const TEMPLATE_META = {
  id: 'news/current-affairs-light',
  name: 'Current Affairs Light',
  category: 'news',
  description: 'Thời sự chính trị, dân sinh, việc làm, giao thông. Nền giấy sáng, accent đỏ son và navy.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
