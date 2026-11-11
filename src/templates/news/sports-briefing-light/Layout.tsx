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

export const SportsBriefingBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 88% 8%, rgba(228, 61, 48, 0.12), rgba(228, 61, 48, 0) 32%),` +
          `radial-gradient(circle at 6% 78%, rgba(36, 84, 166, 0.10), rgba(36, 84, 166, 0) 34%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paper} 58%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.72,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '54px 54px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 12,
        background: COLORS.accent,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 46,
        height: 2,
        background: `linear-gradient(90deg, ${COLORS.accent}, rgba(228,61,48,0), ${COLORS.blue}55)`,
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
    {showSubtitles ? (
      <Subtitles slug={slug} activeColor={COLORS.accent} fontSize={34} maxWords={7} />
    ) : null}
  </AbsoluteFill>
);
