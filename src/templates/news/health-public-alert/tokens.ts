import { loadFont } from '@remotion/google-fonts/Inter';
import { loadFont as loadRobotoCondensed } from '@remotion/google-fonts/RobotoCondensed';

export const { fontFamily: FONT_INTER } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_CONDENSED } = loadRobotoCondensed('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const FONT_MAIN = FONT_INTER;
export const FONT_DISPLAY = FONT_CONDENSED;

export const COLORS = {
  paper: '#FFF9F2',
  paper2: '#F3F5F4',
  ink: '#1F2523',
  body: '#4E5B58',
  muted: '#89938F',
  white: '#FFFFFF',
  black: '#111614',
  amber: '#F2A71B',
  amberDark: '#B97800',
  amberSoft: 'rgba(242, 167, 27, 0.14)',
  coral: '#E34255',
  coralDark: '#9B1E2C',
  coralSoft: 'rgba(227, 66, 85, 0.1)',
  green: '#12856F',
  greenSoft: 'rgba(18, 133, 111, 0.1)',
  blue: '#2A68B8',
  rule: 'rgba(31, 37, 35, 0.16)',
  grid: 'rgba(31, 37, 35, 0.045)',
  shadow: 'rgba(60, 38, 16, 0.16)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 70,
  top: 102,
  subtitleBottom: 212,
  radius: 22,
  imageRadius: 18,
} as const;

export const TYPOGRAPHY = {
  alertLabel: 28,
  meta: 22,
  headlineHero: 108,
  headline: 90,
  headlineSmall: 76,
  body: 31,
  bodySmall: 25,
  caption: 18,
  risk: 78,
  cardTitle: 35,
  cardBody: 26,
  quote: 48,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/health-public-alert',
  name: 'Health Public Alert',
  category: 'news',
  description:
    'Cảnh báo sức khoẻ dạng bulletin: mức độ rủi ro, nhóm ảnh hưởng, checklist triệu chứng, hành động nên/không nên làm.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
