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

export const BusinessTerminalBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 84% 10%, rgba(63, 219, 131, 0.15), rgba(63, 219, 131, 0) 30%),` +
          `radial-gradient(circle at 12% 78%, rgba(233, 185, 91, 0.12), rgba(233, 185, 91, 0) 34%),` +
          `linear-gradient(180deg, ${COLORS.bg2} 0%, ${COLORS.bg} 52%, #05080B 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.92,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '54px 54px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.045), rgba(255,255,255,0) 15%, rgba(255,255,255,0) 85%, rgba(255,255,255,0.035))',
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
      <Subtitles slug={slug} activeColor={COLORS.amber} fontSize={34} maxWords={7} />
    ) : null}
  </AbsoluteFill>
);
