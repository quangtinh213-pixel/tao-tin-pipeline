import { loadFont } from '@remotion/google-fonts/BeVietnamPro';

export const { fontFamily: FONT_MAIN } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  sky: '#EEF8FF',
  paper: '#FFFFFF',
  paperWarm: '#FFFDF5',
  ink: '#20304D',
  body: '#536177',
  muted: '#8793A5',
  line: 'rgba(32, 48, 77, 0.13)',
  ruled: 'rgba(43, 124, 164, 0.09)',
  indigo: '#2B3A67',
  blue: '#2F80B7',
  mint: '#46A980',
  coral: '#E85D75',
  yellow: '#F4C84B',
  lilac: '#8A78D6',
  blueSoft: 'rgba(47, 128, 183, 0.12)',
  coralSoft: 'rgba(232, 93, 117, 0.14)',
  mintSoft: 'rgba(70, 169, 128, 0.14)',
  yellowSoft: 'rgba(244, 200, 75, 0.22)',
  shadow: 'rgba(30, 54, 80, 0.14)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  railX: 44,
  contentX: 120,
  right: 70,
  top: 110,
  subtitleBottom: 198,
  radius: 8,
} as const;

export const TYPOGRAPHY = {
  rail: 18,
  meta: 20,
  eyebrow: 18,
  headlineHero: 96,
  headline: 78,
  headlineSmall: 64,
  body: 30,
  bodySmall: 23,
  caption: 17,
  metric: 116,
  metricUnit: 40,
  cardTitle: 30,
  listText: 32,
  quote: 50,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/education-campus-light',
  name: 'Education Campus Light',
  category: 'news',
  description:
    'Bản tin giáo dục sáng kiểu campus bulletin: nền sky, vertical rail, notebook cards, coral deadline và mint insight.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
