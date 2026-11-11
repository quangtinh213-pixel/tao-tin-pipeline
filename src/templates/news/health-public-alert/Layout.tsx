import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { AlertSubtitles } from './AlertSubtitles';
import { COLORS, FONT_MAIN } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const AlertBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 86% 8%, rgba(242, 167, 27, 0.24), rgba(242, 167, 27, 0) 30%),` +
          `radial-gradient(circle at 2% 84%, rgba(227, 66, 85, 0.16), rgba(227, 66, 85, 0) 34%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paper} 54%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.62,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 12,
        background: `linear-gradient(90deg, ${COLORS.coral} 0%, ${COLORS.amber} 52%, ${COLORS.green} 100%)`,
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
    {showSubtitles ? <AlertSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
