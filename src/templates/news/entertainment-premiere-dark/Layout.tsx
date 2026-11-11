import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { EntertainmentSubtitles } from './EntertainmentSubtitles';
import { COLORS, FONT_MAIN } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const PremiereBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      background: COLORS.bg,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 50% -8%, rgba(242, 198, 109, 0.28), rgba(242, 198, 109, 0) 31%),` +
          `radial-gradient(circle at 18% 24%, rgba(241, 93, 114, 0.18), rgba(241, 93, 114, 0) 29%),` +
          `radial-gradient(circle at 86% 62%, rgba(124, 92, 191, 0.2), rgba(124, 92, 191, 0) 30%),` +
          `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bg2} 54%, #09070B 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: -170,
        top: 210,
        width: 520,
        height: 1620,
        transform: 'rotate(-18deg)',
        background: 'linear-gradient(90deg, rgba(242,198,109,0.13), rgba(242,198,109,0))',
        filter: 'blur(4px)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: -190,
        top: 120,
        width: 520,
        height: 1680,
        transform: 'rotate(16deg)',
        background: 'linear-gradient(270deg, rgba(241,93,114,0.12), rgba(241,93,114,0))',
        filter: 'blur(4px)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.18,
        backgroundImage:
          `linear-gradient(90deg, ${COLORS.faint} 1px, transparent 1px),` +
          `linear-gradient(${COLORS.faint} 1px, transparent 1px)`,
        backgroundSize: '120px 120px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.42), rgba(0,0,0,0.16))',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 420,
        background: 'linear-gradient(180deg, rgba(13,10,16,0), rgba(0,0,0,0.62))',
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
    {showSubtitles ? <EntertainmentSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
