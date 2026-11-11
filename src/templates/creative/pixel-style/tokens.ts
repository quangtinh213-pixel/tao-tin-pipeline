import {loadFont as loadBeVietnamPro} from '@remotion/google-fonts/BeVietnamPro';
import {loadFont as loadHandjet} from '@remotion/google-fonts/Handjet';
import {loadFont as loadVT323} from '@remotion/google-fonts/VT323';

export const {fontFamily: PIXEL_FONT_DISPLAY} = loadHandjet('normal', {
  weights: ['400', '700', '900'],
  subsets: ['latin', 'vietnamese'],
});

export const {fontFamily: PIXEL_FONT_TERMINAL} = loadVT323('normal', {
  weights: ['400'],
  subsets: ['latin', 'vietnamese'],
});

export const {fontFamily: PIXEL_FONT_BODY} = loadBeVietnamPro('normal', {
  weights: ['400', '700'],
  subsets: ['latin', 'vietnamese'],
});

export const PIXEL_STYLE_COLORS = {
  background: '#101018',
  surface: '#202038',
  surfaceRaised: '#302C52',
  text: '#FFF8D6',
  muted: '#B9B4CF',
  green: '#59F176',
  cyan: '#45D9FF',
  warning: '#FF5A5F',
  gold: '#FFD166',
  shadow: '#050508',
} as const;

export const PIXEL_UNIT = 4;
export const PIXEL_BORDER_WIDTH = PIXEL_UNIT;
export const PIXEL_SHADOW = `${PIXEL_UNIT * 2}px ${PIXEL_UNIT * 2}px 0 ${PIXEL_STYLE_COLORS.shadow}`;
