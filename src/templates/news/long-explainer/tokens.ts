import {loadFont as loadCondensed} from '@remotion/google-fonts/BarlowCondensed';

export {FONT_MAIN} from '../media-showcase/tokens';

export const {fontFamily: FONT_HEADING} = loadCondensed('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
});

// Documentary look agreed with Antigravity (11/2026): dark slate + faint grid, red accent, marker yellow.
export const COLORS = {
  background: '#0F172A',
  grid: 'rgba(255,255,255,0.05)',
  text: '#F8FAFC',
  muted: 'rgba(248,250,252,0.62)',
  red: '#EF4444',
  redDark: '#B91C1C',
  highlight: '#FACC15',
  paper: '#FBFAF6',
  ink: '#111111',
  inkMuted: '#646464',
} as const;

export const CANVAS = {width: 1920, height: 1080} as const;
export const TOP_BAR_HEIGHT = 64;
// Beat visuals sit below the top bar with a margin.
export const STAGE = {left: 80, top: TOP_BAR_HEIGHT + 36, right: 80, bottom: 56} as const;

export const CHAPTER_CARD_FRAMES = 60;
// Highlight sweep in evidence beats starts after the zoom-in settles.
export const EVIDENCE_HIGHLIGHT_FRAME = 22;
// bigNumber count-up length; the "ding" SFX lands when it ends.
export const COUNT_UP_FRAMES = 36;

export const TEMPLATE_META = {
  id: 'news/long-explainer',
  name: 'News Long Explainer',
  category: 'news',
  description: 'Video giải thích dài 16:9: beat 3-6s, ảnh chụp bài báo có highlight, collage, chữ động, số liệu.',
  aspectRatio: '16:9' as const,
  fps: 30,
} as const;
