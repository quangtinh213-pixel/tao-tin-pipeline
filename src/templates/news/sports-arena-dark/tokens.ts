/**
 * tokens.ts - Design tokens for news/sports-arena-dark template.
 */

import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadRobotoCondensed } from '@remotion/google-fonts/RobotoCondensed';
import type { SportKind } from './types';

export const { fontFamily: FONT_MAIN } = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_SCOREBOARD } = loadRobotoCondensed('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  bg: '#080A0F',
  bg2: '#10141C',
  bg3: '#151B25',
  ink: '#F8FAFC',
  body: '#D6DEE8',
  muted: '#8F9BAD',
  line: 'rgba(248, 250, 252, 0.13)',
  panel: 'rgba(12, 17, 26, 0.82)',
  panel2: 'rgba(248, 250, 252, 0.075)',
  black: '#05070B',
  green: '#62E06E',
  orange: '#FF9F2E',
  red: '#FF4B55',
  teal: '#2FE6C8',
  cyan: '#41D9FF',
  violet: '#A976FF',
  gold: '#F4C95D',
  shadow: 'rgba(0, 0, 0, 0.48)',
} as const;

export const SPORT_ACCENTS: Record<SportKind, string> = {
  football: COLORS.green,
  basketball: COLORS.orange,
  mma: COLORS.red,
  boxing: COLORS.red,
  tennis: COLORS.teal,
  racing: COLORS.cyan,
  esports: COLORS.violet,
  other: COLORS.gold,
};

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 70,
  top: 104,
  subtitleBottom: 202,
  radius: 18,
  imageRadius: 20,
} as const;

export const TYPOGRAPHY = {
  section: 20,
  kicker: 25,
  headlineHero: 112,
  headline: 86,
  headlineSmall: 70,
  body: 31,
  bodySmall: 25,
  caption: 18,
  scoreTeam: 28,
  scoreValue: 86,
  statValue: 58,
  statLabel: 18,
  quote: 48,
  quoteSource: 22,
  timelineTime: 25,
  timelineLabel: 30,
  tag: 19,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/sports-arena-dark',
  name: 'Sports Arena Dark',
  category: 'news',
  description:
    'Tin thể thao tone tối kiểu sân vận động: scoreboard, ảnh/video nguồn, tỉ số, timeline, stat board, quote và lịch đấu.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;

export const getSportAccent = (sport: SportKind = 'other') => SPORT_ACCENTS[sport] ?? COLORS.gold;
