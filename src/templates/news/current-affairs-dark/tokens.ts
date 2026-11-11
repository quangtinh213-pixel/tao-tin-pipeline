/**
 * tokens.ts — Design tokens for news/current-affairs-dark template.
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
  bg: '#08111C',
  text: '#F3F0E8',
  accent: '#F0B429',
  accent2: '#38BDF8',
  muted: '#9AA6B2',
  border: 'rgba(255,255,255,0.11)',
  cardBg: '#111B27',
  subtitleAccent: '#F0B429',
  gradientA: '#F0B429',
  gradientB: '#38BDF8',
  grid: 'rgba(148,163,184,0.11)',
  glowA: 'rgba(240,180,41,0.14)',
  glowB: 'rgba(56,189,248,0.10)',
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
  useGradientAccent: true,
};

export const TEMPLATE_META = {
  id: 'news/current-affairs-dark',
  name: 'Current Affairs Dark',
  category: 'news',
  description: 'Thời sự chính trị, dân sinh, việc làm, giao thông. Nền tối briefing room, accent vàng và cyan.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
