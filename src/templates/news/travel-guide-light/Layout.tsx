import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { COLORS, FONT_MAIN } from './tokens';
import { GuideSubtitles } from './GuideSubtitles';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const GuideBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 12% 12%, rgba(215, 255, 67, 0.24), transparent 26%),` +
          `radial-gradient(circle at 88% 20%, rgba(0, 140, 149, 0.14), transparent 30%),` +
          `linear-gradient(180deg, ${COLORS.bg2}, ${COLORS.bg})`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.58,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(135deg, rgba(0, 140, 149, 0.05) 0 1px, transparent 1px 54px)`,
        backgroundSize: '64px 64px, 64px 64px, 54px 54px',
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
    {showSubtitles ? <GuideSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
