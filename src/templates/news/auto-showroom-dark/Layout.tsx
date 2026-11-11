import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { Subtitles } from '../../../components/Subtitles';
import { COLORS, FONT_MAIN } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const ShowroomBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 82% 10%, rgba(53, 198, 255, 0.18), rgba(53, 198, 255, 0) 32%),` +
          `radial-gradient(circle at 8% 74%, rgba(240, 74, 62, 0.12), rgba(240, 74, 62, 0) 34%),` +
          `linear-gradient(180deg, ${COLORS.bg2} 0%, ${COLORS.bg} 54%, #030507 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.8,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '58px 58px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: -120,
        right: -120,
        bottom: -180,
        height: 640,
        background:
          `radial-gradient(ellipse at center, rgba(184, 199, 207, 0.18), rgba(184, 199, 207, 0.02) 38%, rgba(0,0,0,0) 64%),` +
          `linear-gradient(180deg, rgba(21,26,32,0), ${COLORS.floor} 76%)`,
        transform: 'perspective(700px) rotateX(58deg)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 260,
        height: 2,
        background: `linear-gradient(90deg, rgba(53,198,255,0), ${COLORS.chrome}99, rgba(53,198,255,0))`,
        boxShadow: `0 0 34px ${COLORS.blue}`,
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
      background: COLORS.bg,
      color: COLORS.ink,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />
    {children}
    {showSubtitles ? (
      <Subtitles slug={slug} activeColor={COLORS.blue} fontSize={34} maxWords={7} />
    ) : null}
  </AbsoluteFill>
);
