import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { CivicSubtitles } from './CivicSubtitles';
import { COLORS, FONT_MAIN } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  slug,
  bgMusic = null,
  showSubtitles = true,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: COLORS.background,
      color: COLORS.text,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 82% 6%, rgba(79, 195, 215, 0.28) 0%, rgba(79, 195, 215, 0) 30%),` +
          `radial-gradient(circle at 8% 82%, rgba(242, 184, 75, 0.18) 0%, rgba(242, 184, 75, 0) 34%),` +
          `linear-gradient(180deg, ${COLORS.background2} 0%, ${COLORS.background} 52%, #05090B 100%)`,
      }}
    />

    <div
      style={{
        position: 'absolute',
        inset: '0 0 auto 0',
        height: 250,
        background:
          'linear-gradient(180deg, rgba(246,241,231,0.08) 0%, rgba(246,241,231,0) 100%)',
      }}
    />

    {children}

    {showSubtitles ? <CivicSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
