import {loadFont} from '@remotion/google-fonts/BeVietnamPro';

export const {fontFamily: FONT_MAIN} = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  background: '#F7F4EE',
  surface: '#FFFFFF',
  mediaBackground: '#E9E5DE',
  text: '#171717',
  muted: '#6E6A63',
  line: '#D8D2C8',
  orange: '#F0642B',
  orangeDark: '#A93B12',
  orangeSoft: '#FFE3D4',
} as const;

export const TEMPLATE_META = {
  id: 'news/modern-news-canvas',
  name: 'Modern News Canvas',
  category: 'news',
  description:
    'Bố cục tin tức editorial sáng với điểm nhấn cam, ưu tiên tối đa diện tích cho media nguồn.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
