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

export const AutoMarketBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 86% 8%, rgba(30, 111, 168, 0.13), rgba(30, 111, 168, 0) 30%),` +
          `radial-gradient(circle at 8% 78%, rgba(201, 133, 33, 0.13), rgba(201, 133, 33, 0) 35%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paper} 58%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.86,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 44,
        right: 44,
        top: 44,
        bottom: 44,
        border: `1px solid ${COLORS.rule}`,
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: 70,
        top: 190,
        width: 180,
        height: 180,
        borderRadius: '50%',
        border: `1px solid ${COLORS.rule}`,
        opacity: 0.55,
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
      <Subtitles slug={slug} activeColor={COLORS.blue} fontSize={34} maxWords={7} />
    ) : null}
  </AbsoluteFill>
);
