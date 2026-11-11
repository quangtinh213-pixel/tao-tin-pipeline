import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { COLORS, FONT_MAIN } from './tokens';
import { HealthSubtitles } from './HealthSubtitles';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const HealthBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 88% 8%, rgba(14, 143, 131, 0.16), rgba(14, 143, 131, 0) 30%),` +
          `radial-gradient(circle at 4% 82%, rgba(232, 93, 117, 0.12), rgba(232, 93, 117, 0) 34%),` +
          `linear-gradient(180deg, ${COLORS.paper} 0%, ${COLORS.paper} 58%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.56,
        backgroundImage:
          `linear-gradient(${COLORS.grid} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
        backgroundSize: '54px 54px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        background: `linear-gradient(90deg, ${COLORS.teal} 0%, ${COLORS.blue} 58%, ${COLORS.coral} 100%)`,
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
    {showSubtitles ? <HealthSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
