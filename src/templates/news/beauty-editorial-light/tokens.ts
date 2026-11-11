import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadNewsreader} from '@remotion/google-fonts/Newsreader';

export const {fontFamily: FONT_MAIN} = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const {fontFamily: FONT_DISPLAY} = loadNewsreader('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const {fontFamily: FONT_DISPLAY_ITALIC} = loadNewsreader('italic', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  canvas: '#F8F2EE',
  paper: '#FFFDFC',
  paperWarm: '#F0E3DD',
  ink: '#241C1D',
  body: '#574A4C',
  muted: '#8C7D80',
  blush: '#D98F9D',
  blushSoft: '#F3DADD',
  rose: '#B8546B',
  roseSoft: '#F7E7EA',
  wine: '#702F43',
  champagne: '#C5A46D',
  champagneSoft: '#F1E7D4',
  sage: '#849982',
  sageSoft: '#E8EEE6',
  clinical: '#648996',
  clinicalSoft: '#E4EEF1',
  line: '#E6D7D3',
  warning: '#C76B51',
  warningSoft: '#F7E3DC',
  white: '#FFFFFF',
  shadow: 'rgba(78, 45, 53, 0.13)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 72,
  top: 118,
  contentBottom: 390,
  subtitleBottom: 196,
  radius: 28,
  imageRadius: 32,
} as const;

export const TYPOGRAPHY = {
  section: 20,
  eyebrow: 24,
  headlineHero: 108,
  headline: 84,
  headlineSmall: 70,
  body: 31,
  bodySmall: 25,
  caption: 18,
  cardTitle: 28,
  cardBody: 22,
  metric: 62,
  quote: 52,
  subtitle: 33,
} as const;

export const TEMPLATE_META = {
  id: 'news/beauty-editorial-light',
  name: 'Beauty Editorial Light',
  category: 'news',
  description:
    'Bản tin làm đẹp và thẩm mỹ kiểu tạp chí cao cấp: nền kem phấn, serif thanh lịch, rose accent, media có nguồn và block thông tin an toàn.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
