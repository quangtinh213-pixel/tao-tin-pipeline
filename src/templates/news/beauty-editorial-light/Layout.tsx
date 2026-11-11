import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {Subtitles} from '../../../components/Subtitles';
import {COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY} from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

const BotanicalLineArt: React.FC = () => (
  <svg
    viewBox="0 0 360 720"
    style={{
      position: 'absolute',
      right: -42,
      top: 168,
      width: 340,
      height: 680,
      opacity: 0.18,
    }}
  >
    <path
      d="M180 700 C160 560 188 430 174 300 C166 220 130 126 155 24"
      fill="none"
      stroke={COLORS.rose}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path d="M173 536 C105 500 72 442 90 390 C142 403 177 453 173 536Z" fill="none" stroke={COLORS.blush} strokeWidth="3" />
    <path d="M176 442 C243 407 276 350 258 298 C208 311 174 361 176 442Z" fill="none" stroke={COLORS.champagne} strokeWidth="3" />
    <path d="M169 326 C112 294 86 248 102 207 C145 218 173 256 169 326Z" fill="none" stroke={COLORS.sage} strokeWidth="3" />
    <path d="M162 218 C217 187 240 143 224 105 C184 116 158 151 162 218Z" fill="none" stroke={COLORS.rose} strokeWidth="3" />
  </svg>
);

export const BeautyBackground: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.canvas, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(ellipse at 7% 5%, rgba(217,143,157,0.34), rgba(217,143,157,0) 32%),` +
          `radial-gradient(ellipse at 96% 30%, rgba(197,164,109,0.20), rgba(197,164,109,0) 34%),` +
          `radial-gradient(ellipse at 18% 88%, rgba(132,153,130,0.15), rgba(132,153,130,0) 30%),` +
          `linear-gradient(155deg, #FFFDFC 0%, ${COLORS.canvas} 48%, #F7EAE6 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        width: 640,
        height: 480,
        left: -250,
        top: 300,
        borderRadius: '42% 58% 63% 37% / 46% 35% 65% 54%',
        background: 'linear-gradient(145deg, rgba(243,218,221,.82), rgba(255,253,252,.08))',
        border: '1px solid rgba(217,143,157,.22)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        width: 500,
        height: 610,
        right: -290,
        bottom: 180,
        borderRadius: '68% 32% 43% 57% / 52% 60% 40% 48%',
        background: 'linear-gradient(160deg, rgba(228,238,241,.58), rgba(255,253,252,.04))',
        border: '1px solid rgba(100,137,150,.16)',
      }}
    />
    <BotanicalLineArt />
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        top: 30,
        height: 150,
        borderRadius: '0 0 80px 80px',
        background: 'linear-gradient(180deg, rgba(255,255,255,.58), rgba(255,255,255,0))',
      }}
    />
    {[0, 1, 2, 3, 4].map((index) => (
      <div
        key={index}
        style={{
          position: 'absolute',
          width: 18 + index * 7,
          height: 18 + index * 7,
          left: 46 + index * 54,
          bottom: 235 + (index % 2) * 52,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,.92), rgba(217,143,157,${0.2 + index * 0.025}))`,
          border: '1px solid rgba(255,255,255,.78)',
          boxShadow: '0 10px 28px rgba(184,84,107,.10)',
        }}
      />
    ))}
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: 9,
        width: '100%',
        background: `linear-gradient(90deg, ${COLORS.wine}, ${COLORS.blush} 55%, ${COLORS.champagne})`,
      }}
    />
  </AbsoluteFill>
);

export const Layout: React.FC<LayoutProps> = ({
  slug,
  bgMusic = null,
  showSubtitles = true,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: COLORS.canvas,
      color: COLORS.ink,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />
    {children}
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      <Img src={staticFile('watermark.png')} style={{height: 68, width: 'auto', opacity: 0.9}} />
    </div>
    {showSubtitles ? (
      <Subtitles
        slug={slug}
        activeColor={COLORS.rose}
        fontSize={TYPOGRAPHY.subtitle}
        maxWords={8}
      />
    ) : null}
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.paddingX,
        right: LAYOUT.paddingX,
        bottom: 88,
        height: 1,
        background: COLORS.line,
        opacity: 0.72,
      }}
    />
  </AbsoluteFill>
);
