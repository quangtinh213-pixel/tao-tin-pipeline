/**
 * tokens.ts — Design tokens for news/tech-dark template.
 * Exports COLORS, TYPOGRAPHY, LAYOUT, FONT_MAIN, and the composed THEME object.
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
  bg:             '#0B0C10',
  text:           '#EEF0F8',
  accent:         '#00D4FF',
  accent2:        '#4F7FFF',
  muted:          '#7A7F9A',
  border:         'rgba(255,255,255,0.08)',
  cardBg:         '#13141A',
  subtitleAccent: '#00D4FF',
  /** Gradient stop A for clip-text / divider */
  gradientA:      '#00D4FF',
  /** Gradient stop B */
  gradientB:      '#4F7FFF',
  /** Glow blobs */
  glowA:          'rgba(0,212,255,0.12)',
  glowB:          'rgba(79,127,255,0.10)',
  glowC:          'rgba(0,212,255,0.06)',
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
  colors:            { ...COLORS },
  typography:        TYPOGRAPHY,
  layout:            LAYOUT,
  fontFamily:        FONT_MAIN,
  useGradientAccent: true,
};

export const TEMPLATE_META = {
  id:          'news/tech-dark',
  name:        'Tech News Dark',
  category:    'news',
  description: 'Tin tức công nghệ. Nền tối sâu, tiêu đề gradient cyan-xanh, đốm sáng góc.',
  aspectRatio: '9:16' as const,
  fps:          30,
} as const;
