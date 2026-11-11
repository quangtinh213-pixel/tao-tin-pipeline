import {loadFont} from '@remotion/google-fonts/BeVietnamPro';

export const {fontFamily: FONT_MAIN} = loadFont('normal', {
  weights: ['400', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const COLORS = {
  background: '#F2F2F0',
  panel: '#FFFFFF',
  text: '#111111',
  muted: '#646464',
  red: '#D92343',
  redDark: '#92152A',
  border: '#151515',
  dateBackground: '#A7A7A7',
  dateText: '#FFFFFF',
} as const;

// Media viewport bottom stays at 1084 so title + subtitles end above ~1560,
// leaving the bottom ~360px free for the Shorts title/channel overlay.
export const MEDIA_FRAME = {top: 84, height: 1000} as const;

export const TEMPLATE_META = {
  id: 'news/media-showcase',
  name: 'News Media Showcase',
  category: 'news',
  description: 'Khung bản tin đỏ-trắng ưu tiên trình chiếu ảnh và video từ URL nguồn.',
  aspectRatio: '9:16' as const,
  fps: 30,
} as const;
