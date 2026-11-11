import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { COLORS, FONT_SANS } from './tokens';
import { TravelSubtitles } from './TravelSubtitles';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const TravelPaperBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 14% 10%, ${COLORS.paperCool} 0%, rgba(233,244,240,0) 34%),` +
          `radial-gradient(circle at 89% 14%, ${COLORS.paperWarm} 0%, rgba(255,245,232,0) 32%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, #FBFAF3 56%, ${COLORS.paperCool} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.5,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '72px 72px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 9,
        background: `linear-gradient(90deg, ${COLORS.forest}, ${COLORS.sea}, ${COLORS.coral})`,
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
      fontFamily: FONT_SANS,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />
    {children}
    {showSubtitles ? <TravelSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
