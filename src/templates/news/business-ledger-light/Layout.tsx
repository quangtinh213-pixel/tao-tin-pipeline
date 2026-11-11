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

export const LedgerBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 88% 8%, rgba(184, 133, 44, 0.18), rgba(184, 133, 44, 0) 31%),` +
          `radial-gradient(circle at 10% 82%, rgba(40, 94, 142, 0.11), rgba(40, 94, 142, 0) 34%),` +
          `linear-gradient(180deg, ${COLORS.paper3} 0%, ${COLORS.paper} 60%, ${COLORS.paper2} 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.8,
        backgroundImage:
          `linear-gradient(${COLORS.rule} 1px, transparent 1px),` +
          `linear-gradient(90deg, ${COLORS.rule} 1px, transparent 1px)`,
        backgroundSize: '72px 72px',
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
      <Subtitles slug={slug} activeColor={COLORS.red} fontSize={34} maxWords={7} />
    ) : null}
  </AbsoluteFill>
);
