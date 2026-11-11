import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { PlexSubtitles } from './PlexSubtitles';
import { COLORS, FONT_MAIN } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const GridBackground: React.FC = () => (
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
          `radial-gradient(circle at 89% 7%, rgba(18, 101, 255, 0.12), rgba(18, 101, 255, 0) 30%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paper} 56%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.42,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(${COLORS.gridStrong} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.gridStrong} 1px, transparent 1px)`,
        backgroundSize: '60px 60px, 60px 60px, 240px 240px, 240px 240px',
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
    {showSubtitles ? <PlexSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
