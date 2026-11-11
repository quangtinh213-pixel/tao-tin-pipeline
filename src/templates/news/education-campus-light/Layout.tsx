import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { COLORS, FONT_MAIN } from './tokens';
import { CampusSubtitles } from './CampusSubtitles';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const CampusBackground: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.sky, overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 88% 12%, ${COLORS.yellowSoft}, rgba(244,200,75,0) 32%),` +
          `radial-gradient(circle at 4% 78%, ${COLORS.coralSoft}, rgba(232,93,117,0) 34%),` +
          `linear-gradient(180deg, ${COLORS.sky} 0%, #F8FCFF 55%, #EFF9F3 100%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.9,
        backgroundImage:
          `repeating-linear-gradient(0deg, transparent 0, transparent 52px, ${COLORS.ruled} 53px),` +
          `linear-gradient(90deg, rgba(232,93,117,0.18) 1px, transparent 1px)`,
        backgroundSize: '100% 54px, 88px 100%',
        backgroundPosition: '0 28px, 86px 0',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 76,
        top: 0,
        bottom: 0,
        width: 2,
        background: 'rgba(232, 93, 117, 0.28)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: -80,
        top: 210,
        width: 260,
        height: 260,
        borderRadius: 999,
        border: `28px solid ${COLORS.blueSoft}`,
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
      background: COLORS.sky,
      color: COLORS.ink,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />
    {children}
    {showSubtitles ? <CampusSubtitles slug={slug} /> : null}
  </AbsoluteFill>
);
