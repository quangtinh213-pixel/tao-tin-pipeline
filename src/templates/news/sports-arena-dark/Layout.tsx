import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { COLORS, FONT_MAIN, getSportAccent } from './tokens';
import { SportsSubtitles } from './SportsSubtitles';
import type { SportKind } from './types';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  sport?: SportKind;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const ArenaBackground: React.FC<{ sport?: SportKind }> = ({ sport = 'other' }) => {
  const accent = getSportAccent(sport);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 50% -9%, ${accent}42, rgba(8,10,15,0) 31%),` +
            `radial-gradient(circle at 9% 24%, ${accent}24, rgba(8,10,15,0) 29%),` +
            `radial-gradient(circle at 92% 68%, rgba(65, 217, 255, 0.18), rgba(8,10,15,0) 32%),` +
            `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bg2} 55%, #05070B 100%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: -220,
          top: 110,
          width: 720,
          height: 1800,
          transform: 'rotate(-19deg)',
          background: `linear-gradient(90deg, ${accent}1F, rgba(255,255,255,0))`,
          filter: 'blur(3px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -260,
          top: 80,
          width: 760,
          height: 1800,
          transform: 'rotate(17deg)',
          background: 'linear-gradient(270deg, rgba(255,255,255,0.10), rgba(255,255,255,0))',
          filter: 'blur(4px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.18,
          backgroundImage:
            `linear-gradient(90deg, ${COLORS.line} 1px, transparent 1px),` +
            `linear-gradient(${COLORS.line} 1px, transparent 1px)`,
          backgroundSize: '108px 108px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.50), rgba(0,0,0,0.20))',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: -40,
          right: -40,
          bottom: 0,
          height: 520,
          opacity: 0.3,
          background:
            `linear-gradient(90deg, transparent 49.8%, ${accent} 50%, transparent 50.2%),` +
            `radial-gradient(ellipse at center bottom, transparent 0 38%, ${accent} 39%, transparent 40%),` +
            `linear-gradient(180deg, rgba(8,10,15,0), rgba(0,0,0,0.72))`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 10,
          background: `linear-gradient(90deg, rgba(255,255,255,0.08), ${accent}, rgba(255,255,255,0.08))`,
          boxShadow: `0 0 34px ${accent}80`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Layout: React.FC<LayoutProps> = ({
  slug,
  bgMusic = null,
  sport = 'other',
  showSubtitles = true,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: COLORS.bg,
      color: COLORS.ink,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />
    {children}
    {showSubtitles ? <SportsSubtitles slug={slug} sport={sport} /> : null}
  </AbsoluteFill>
);
