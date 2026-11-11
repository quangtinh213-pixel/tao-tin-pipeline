import { loadFont } from '@remotion/google-fonts/Inter';
import { loadFont as loadNewsreader } from '@remotion/google-fonts/Newsreader';

export const { fontFamily: FONT_INTER } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const { fontFamily: FONT_NEWSREADER } = loadNewsreader('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const FONT_MAIN = FONT_INTER;
export const FONT_DISPLAY = FONT_NEWSREADER;

export const COLORS = {
  paper: '#F8FCFA',
  paper2: '#EEF8F5',
  mint: '#DDF2EC',
  ink: '#17302D',
  body: '#415B57',
  muted: '#78908B',
  faint: '#D6E6E1',
  teal: '#0E8F83',
  tealDark: '#076A63',
  tealSoft: 'rgba(14, 143, 131, 0.1)',
  coral: '#E85D75',
  amber: '#D79A27',
  blue: '#2E7DD7',
  white: '#FFFFFF',
  rule: 'rgba(23, 48, 45, 0.14)',
  grid: 'rgba(14, 143, 131, 0.055)',
  shadow: 'rgba(18, 71, 65, 0.16)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 74,
  top: 126,
  subtitleBottom: 210,
  radius: 30,
  imageRadius: 24,
} as const;

export const TYPOGRAPHY = {
  meta: 22,
  kicker: 24,
  headlineHero: 104,
  headline: 86,
  headlineSmall: 72,
  body: 32,
  bodySmall: 27,
  caption: 18,
  stat: 150,
  statUnit: 44,
  itemTitle: 36,
  itemBody: 27,
  quote: 54,
  subtitle: 32,
} as const;

export const TEMPLATE_META = {
  id: 'news/health-briefing-light',
  name: 'Health Briefing Light',
  category: 'news',
  description:
    'Tin tức sức khoẻ sáng, sạch, source-led: ảnh/video nguồn, số liệu, khuyến cáo, triệu chứng và timeline y tế.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
