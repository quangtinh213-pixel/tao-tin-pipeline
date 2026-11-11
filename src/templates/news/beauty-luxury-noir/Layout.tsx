import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {Subtitles} from '../../../components/Subtitles';
import {COLORS, FONT_SANS, TYPE} from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

const PeonyBloom: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin(frame * 0.012) * 7;
  const turn = Math.sin(frame * 0.008) * 1.4;

  return (
    <svg
      viewBox="0 0 520 620"
      style={{
        position: 'absolute',
        left: -142 + drift,
        top: 58,
        width: 510,
        height: 610,
        opacity: 0.62,
        transform: `rotate(${-13 + turn}deg)`,
        transformOrigin: '44% 42%',
      }}
    >
      <defs>
        <radialGradient id="noir-petal" cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#F5CED4" stopOpacity=".22" />
          <stop offset=".58" stopColor="#C98291" stopOpacity=".095" />
          <stop offset="1" stopColor="#7E4655" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="noir-stem" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#E1C58D" stopOpacity=".48" />
          <stop offset="1" stopColor="#C98291" stopOpacity=".14" />
        </linearGradient>
      </defs>
      <path d="M251 305 C225 405 225 500 285 628" fill="none" stroke="url(#noir-stem)" strokeWidth="2" />
      <path d="M252 408 C180 376 142 411 114 479 C184 479 232 456 252 408Z" fill="rgba(201,130,145,.055)" stroke="rgba(225,197,141,.24)" strokeWidth="1.5" />
      <path d="M267 477 C333 438 382 458 415 520 C349 530 299 515 267 477Z" fill="rgba(225,197,141,.035)" stroke="rgba(225,197,141,.19)" strokeWidth="1.5" />
      <g transform="translate(248 260)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse key={`outer-${angle}`} cx="0" cy="-92" rx="70" ry="126" transform={`rotate(${angle})`} fill="url(#noir-petal)" stroke="rgba(225,197,141,.22)" strokeWidth="1.35" />
        ))}
        {[22, 82, 142, 202, 262, 322].map((angle) => (
          <ellipse key={`inner-${angle}`} cx="0" cy="-54" rx="48" ry="82" transform={`rotate(${angle})`} fill="rgba(201,130,145,.065)" stroke="rgba(247,240,230,.18)" strokeWidth="1.2" />
        ))}
        <circle r="34" fill="rgba(225,197,141,.07)" stroke="rgba(225,197,141,.35)" strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <circle key={`seed-${angle}`} cx="0" cy="-18" r="3.2" transform={`rotate(${angle})`} fill="#E1C58D" opacity=".55" />
        ))}
      </g>
    </svg>
  );
};

const BotanicalSprig: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin(frame * 0.01 + 1.8) * 9;

  return (
    <svg
      viewBox="0 0 470 760"
      style={{
        position: 'absolute',
        right: -125,
        bottom: 46 + drift,
        width: 470,
        height: 760,
        opacity: 0.56,
        transform: 'rotate(5deg)',
      }}
    >
      <path d="M384 760 C356 596 287 465 210 339 C157 252 132 158 151 10" fill="none" stroke="rgba(225,197,141,.35)" strokeWidth="2.2" />
      {[
        {x: 332, y: 600, r: -38, flip: 1},
        {x: 294, y: 515, r: 42, flip: -1},
        {x: 252, y: 430, r: -42, flip: 1},
        {x: 207, y: 342, r: 38, flip: -1},
        {x: 174, y: 250, r: -34, flip: 1},
        {x: 151, y: 156, r: 28, flip: -1},
      ].map((leaf, index) => (
        <g key={index} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r}) scale(${leaf.flip} 1)`}>
          <path d="M0 0 C30 -56 76 -72 119 -59 C96 -17 56 8 0 0Z" fill="rgba(155,168,143,.055)" stroke="rgba(225,197,141,.27)" strokeWidth="1.5" />
          <path d="M8 -2 C43 -23 75 -40 109 -55" fill="none" stroke="rgba(237,225,212,.16)" strokeWidth="1" />
        </g>
      ))}
      <g transform="translate(151 76)">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse key={angle} cx="0" cy="-41" rx="25" ry="54" transform={`rotate(${angle})`} fill="rgba(201,130,145,.075)" stroke="rgba(225,197,141,.25)" strokeWidth="1.3" />
        ))}
        <circle r="10" fill="rgba(225,197,141,.34)" />
      </g>
    </svg>
  );
};

export const NoirBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame * 0.018) * 16;
  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(ellipse at 15% 7%, rgba(201,130,145,.20), transparent 30%),` +
            `radial-gradient(ellipse at 94% 36%, rgba(205,174,115,.13), transparent 34%),` +
            `linear-gradient(155deg, ${COLORS.plum} 0%, ${COLORS.espresso} 44%, ${COLORS.black} 100%)`,
        }}
      />
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        <path
          d={`M-120 ${620 + breathe} C250 430, 420 810, 730 620 S1110 420, 1210 760 L1210 1050 C850 840, 540 1020, 210 850 S-80 920,-120 860Z`}
          fill="rgba(201,130,145,.055)"
          stroke="rgba(201,130,145,.16)"
          strokeWidth="2"
        />
        <path
          d={`M-160 ${1370 - breathe} C210 1120, 430 1510, 720 1280 S1090 1110, 1210 1420`}
          fill="none"
          stroke="rgba(225,197,141,.17)"
          strokeWidth="2"
        />
        <path
          d={`M-120 ${1420 - breathe} C220 1210, 455 1560, 750 1340 S1090 1190, 1200 1480`}
          fill="none"
          stroke="rgba(225,197,141,.08)"
          strokeWidth="42"
        />
      </svg>
      <PeonyBloom frame={frame} />
      <BotanicalSprig frame={frame} />
      <div
        style={{
          position: 'absolute',
          right: -160,
          top: 230,
          width: 460,
          height: 700,
          borderRadius: '50%',
          border: '1px solid rgba(225,197,141,.16)',
          transform: 'rotate(18deg)',
        }}
      />
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: 48 + index * 54,
            bottom: 225 + (index % 3) * 36,
            width: 5 + (index % 2) * 3,
            height: 5 + (index % 2) * 3,
            borderRadius: 999,
            background: COLORS.gold,
            boxShadow: `0 0 18px ${COLORS.gold}`,
            opacity: 0.45,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 26,
          border: '1px solid rgba(225,197,141,.10)',
          borderRadius: 34,
        }}
      />
    </AbsoluteFill>
  );
};

export const Layout: React.FC<LayoutProps> = ({slug, bgMusic = null, showSubtitles = true, children}) => (
  <AbsoluteFill style={{background: COLORS.black, color: COLORS.ivory, fontFamily: FONT_SANS}}>
    <BackgroundMusic src={bgMusic} />
    {children}
    <div style={{position: 'absolute', top: 58, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 30}}>
      <Img src={staticFile('watermark.png')} style={{height: 66, width: 'auto', filter: 'brightness(1.4)', opacity: 0.86}} />
    </div>
    {showSubtitles ? <Subtitles slug={slug} activeColor={COLORS.gold} fontSize={TYPE.subtitle} maxWords={8} /> : null}
  </AbsoluteFill>
);
