import { loadFont } from '@remotion/google-fonts/BeVietnamPro';

export const { fontFamily: FONT_MAIN } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  paper: '#FBFCF7',
  paper2: '#F1F7F0',
  ink: '#172033',
  body: '#465064',
  muted: '#7B8494',
  faint: '#C7D0D8',
  rule: 'rgba(23, 32, 51, 0.14)',
  grid: 'rgba(38, 88, 119, 0.055)',
  gridStrong: 'rgba(44, 116, 92, 0.07)',
  navy: '#17345C',
  green: '#2F7D5A',
  teal: '#1E8A8A',
  gold: '#D69A22',
  coral: '#DB604C',
  blueSoft: 'rgba(23, 52, 92, 0.08)',
  greenSoft: 'rgba(47, 125, 90, 0.1)',
  goldSoft: 'rgba(214, 154, 34, 0.16)',
  white: '#FFFFFF',
  shadow: 'rgba(20, 40, 55, 0.13)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 72,
  top: 128,
  subtitleBottom: 204,
  imageRadius: 8,
} as const;

export const TYPOGRAPHY = {
  meta: 20,
  eyebrow: 18,
  headlineHero: 104,
  headline: 82,
  headlineSmall: 68,
  body: 30,
  bodySmall: 25,
  caption: 17,
  metric: 132,
  metricUnit: 45,
  rowTitle: 35,
  rowMeta: 21,
  listText: 34,
  quote: 55,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/education-briefing-light',
  name: 'Education Briefing Light',
  category: 'news',
  description:
    'Bản tin giáo dục sáng, không top bar: tuyển sinh, du học, đổi mới, chân dung, deadline, checklist và dữ liệu học thuật.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
