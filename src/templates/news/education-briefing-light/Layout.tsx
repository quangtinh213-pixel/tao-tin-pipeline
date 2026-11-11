import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { COLORS, FONT_MAIN } from './tokens';
import { EducationSubtitles } from './EducationSubtitles';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const EducationBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 88% 10%, ${COLORS.greenSoft}, rgba(47,125,90,0) 31%),` +
          `radial-gradient(circle at 5% 82%, ${COLORS.goldSoft}, rgba(214,154,34,0) 34%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paper} 58%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.78,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(${COLORS.gridStrong} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.gridStrong} 1px, transparent 1px)`,
        backgroundSize: '54px 54px, 54px 54px, 216px 216px, 216px 216px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 42,
        top: 70,
        width: 78,
        height: 78,
        border: `3px solid ${COLORS.gold}`,
        opacity: 0.16,
        transform: 'rotate(-9deg)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: 56,
        bottom: 180,
        width: 160,
        height: 2,
        background: COLORS.green,
        opacity: 0.18,
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
    {showSubtitles ? <EducationSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
