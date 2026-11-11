import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadNewsreader} from '@remotion/google-fonts/Newsreader';

export const {fontFamily: FONT_SANS} = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const {fontFamily: FONT_SERIF} = loadNewsreader('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const {fontFamily: FONT_SERIF_ITALIC} = loadNewsreader('italic', {
  weights: ['400', '500', '600'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export const COLORS = {
  black: '#0B0809',
  espresso: '#171011',
  plum: '#28171E',
  plumSoft: '#3B232D',
  ivory: '#F7F0E6',
  pearl: '#EDE1D4',
  muted: '#B6A49E',
  champagne: '#CDAE73',
  gold: '#E1C58D',
  goldSoft: 'rgba(205,174,115,.14)',
  rose: '#C98291',
  roseSoft: 'rgba(201,130,145,.14)',
  sage: '#9BA88F',
  blue: '#8DA8B1',
  warning: '#D7846D',
  line: 'rgba(225,197,141,.25)',
  glass: 'rgba(255,248,239,.065)',
  glassStrong: 'rgba(255,248,239,.105)',
  shadow: 'rgba(0,0,0,.42)',
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 76,
  top: 126,
  contentBottom: 390,
  subtitleBottom: 196,
} as const;

export const TYPE = {
  section: 18,
  eyebrow: 22,
  hero: 108,
  headline: 82,
  compact: 68,
  body: 29,
  small: 22,
  cardTitle: 28,
  cardBody: 21,
  metric: 58,
  quote: 49,
  subtitle: 33,
} as const;

export const TEMPLATE_META = {
  id: 'news/beauty-luxury-noir',
  name: 'Beauty Luxury Noir',
  category: 'news',
  description:
    'Beauty knowledge in a luxury noir editorial system: espresso silk, champagne foil, pearl typography, arched media and refined glass cards.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
