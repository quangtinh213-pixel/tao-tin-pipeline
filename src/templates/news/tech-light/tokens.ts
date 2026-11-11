/**
 * tokens.ts — Design tokens for news/tech-light template.
 * Exports COLORS, TYPOGRAPHY, LAYOUT, FONT_MAIN, and the composed THEME object
 * that is passed to all shared components.
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
  bg:             '#F5F4F2',
  text:           '#1A1A2E',
  accent:         '#CC1B1B',
  accent2:        '#1A2744',
  muted:          '#888888',
  border:         'rgba(0,0,0,0.08)',
  cardBg:         '#FFFFFF',
  subtitleAccent: '#CC1B1B',
} as const;

export const TYPOGRAPHY = {
  headlineLarge:  88,
  headlineMedium: 64,
  body:           26,
  caption:        20,
  badge:          18,
  subtitleSize:   36,
} as const;

export const LAYOUT = {
  width:         1080,
  height:        1920,
  paddingH:      56,
  paddingV:      120,
  dividerWidth:  64,
  dividerHeight: 5,
  cardRadius:    16,
} as const;

/** Composed theme object — pass this to all shared components */
export const THEME: NewsTheme = {
  colors:             { ...COLORS },
  typography:         TYPOGRAPHY,
  layout:             LAYOUT,
  fontFamily:         FONT_MAIN,
  useGradientAccent:  false,
};

export const TEMPLATE_META = {
  id:          'news/tech-light',
  name:        'Tech News Light',
  category:    'news',
  description: 'Tin tức công nghệ. Nền trắng sạch, headline lớn đậm, accent đỏ, ảnh có ghi nguồn.',
  aspectRatio: '9:16' as const,
  fps:          30,
} as const;
