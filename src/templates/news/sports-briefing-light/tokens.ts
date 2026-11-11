import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadRobotoCondensed } from '@remotion/google-fonts/RobotoCondensed';

export const { fontFamily: FONT_MAIN } = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_HEADLINE } = loadRobotoCondensed('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  paper: '#F7F4EE',
  paper2: '#ECE7DD',
  ink: '#111827',
  navy: '#162033',
  body: '#3D4658',
  muted: '#788294',
  faint: 'rgba(22, 32, 51, 0.12)',
  grid: 'rgba(22, 32, 51, 0.075)',
  card: '#FFFFFF',
  cardWarm: '#FBF9F4',
  accent: '#E43D30',
  accentDark: '#B92820',
  blue: '#2454A6',
  green: '#17894D',
  gold: '#C58A18',
  shadow: 'rgba(17, 24, 39, 0.14)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 70,
  top: 108,
  subtitleBottom: 204,
  radius: 14,
  imageRadius: 16,
} as const;

export const TYPOGRAPHY = {
  section: 19,
  kicker: 24,
  headlineHero: 108,
  headline: 84,
  headlineSmall: 70,
  body: 30,
  bodySmall: 24,
  caption: 18,
  scoreTeam: 28,
  scoreValue: 82,
  statValue: 56,
  statLabel: 18,
  quote: 47,
  quoteSource: 22,
  timelineTime: 25,
  timelineLabel: 29,
  tag: 19,
} as const;

export const TEMPLATE_META = {
  id: 'news/sports-briefing-light',
  name: 'Sports Briefing Light',
  category: 'news',
  description:
    'Tin thể thao tone sáng, ổn định: nền giấy editorial, scoreboard sạch, ảnh/video nguồn, stat board, timeline và quote.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
