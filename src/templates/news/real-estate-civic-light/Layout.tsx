import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { CivicSubtitles } from './CivicSubtitles';
import { COLORS, FONT_MAIN } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  slug,
  bgMusic = null,
  showSubtitles = true,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: COLORS.background,
      color: COLORS.text,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 88% 10%, ${COLORS.background2} 0%, rgba(255,229,236,0) 33%),` +
          `linear-gradient(180deg, ${COLORS.background} 0%, #FFF6F8 58%, #FFEFF3 100%)`,
      }}
    />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.88,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(${COLORS.gridStrong} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.gridStrong} 1px, transparent 1px)`,
        backgroundSize: '48px 48px, 48px 48px, 240px 240px, 240px 240px',
      }}
    />

    {children}

    {showSubtitles ? <CivicSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
