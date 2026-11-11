import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { EntertainmentSubtitles } from './EntertainmentSubtitles';
import { COLORS, FONT_MAIN } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const MagazineBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      background: COLORS.paper,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 16% 8%, rgba(230, 79, 106, 0.16), rgba(230, 79, 106, 0) 28%),` +
          `radial-gradient(circle at 88% 14%, rgba(185, 154, 229, 0.24), rgba(185, 154, 229, 0) 28%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paper} 55%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: -120,
        top: 520,
        width: 1320,
        height: 420,
        transform: 'rotate(-8deg)',
        background: 'rgba(255, 255, 255, 0.46)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.24,
        backgroundImage:
          `linear-gradient(90deg, ${COLORS.faint} 1px, transparent 1px),` +
          `linear-gradient(${COLORS.faint} 1px, transparent 1px)`,
        backgroundSize: '108px 108px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.08) 62%, rgba(0,0,0,0.22))',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 18,
        background: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.lilac}, ${COLORS.citron})`,
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
      background: COLORS.paper,
      color: COLORS.ink,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />
    {children}
    {showSubtitles ? <EntertainmentSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
