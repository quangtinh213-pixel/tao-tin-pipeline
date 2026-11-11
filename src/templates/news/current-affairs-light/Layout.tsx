/**
 * Layout.tsx — Persistent frame for news/current-affairs-light template.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { Subtitles } from '../../../components/Subtitles';
import { COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  children?: React.ReactNode;
}

const CivicPaperBackground: React.FC = () => (
  <AbsoluteFill style={{ overflow: 'hidden' }}>
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(180deg, ${COLORS.bg} 0%, #EFE5D4 100%)`,
    }} />
    <div style={{
      position: 'absolute',
      inset: 0,
      opacity: 0.48,
      backgroundImage: `
        linear-gradient(90deg, ${COLORS.mapLine} 1px, transparent 1px),
        linear-gradient(0deg, ${COLORS.mapLine} 1px, transparent 1px)
      `,
      backgroundSize: '72px 72px',
    }} />
    <div style={{
      position: 'absolute',
      top: 110,
      right: -180,
      width: 520,
      height: 520,
      borderRadius: '50%',
      border: `2px solid ${COLORS.rule}`,
    }} />
    <div style={{
      position: 'absolute',
      top: 186,
      right: -104,
      width: 368,
      height: 368,
      borderRadius: '50%',
      border: `1px solid ${COLORS.rule}`,
    }} />
    <div style={{
      position: 'absolute',
      left: 56,
      right: 56,
      bottom: 270,
      height: 1,
      background: COLORS.border,
    }} />
  </AbsoluteFill>
);

export const Layout: React.FC<LayoutProps> = ({ slug, bgMusic = null, children }) => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <BackgroundMusic src={bgMusic} />

    <CivicPaperBackground />

    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 8,
      background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accent2} 100%)`,
      zIndex: 20,
    }} />

    <div style={{
      position: 'absolute',
      top: 30,
      left: LAYOUT.paddingH,
      right: LAYOUT.paddingH,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: FONT_MAIN,
      fontSize: 17,
      fontWeight: 800,
      color: COLORS.muted,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      zIndex: 10,
    }}>
      <span>Thời Sự</span>
      <span>Chính trị · Dân sinh · Giao thông</span>
    </div>

    <AbsoluteFill style={{
      paddingTop: LAYOUT.paddingV,
      paddingBottom: LAYOUT.paddingV,
      paddingLeft: LAYOUT.paddingH,
      paddingRight: LAYOUT.paddingH,
      boxSizing: 'border-box',
    }}>
      {children}
    </AbsoluteFill>

    <Subtitles
      slug={slug}
      activeColor={COLORS.subtitleAccent}
      fontSize={TYPOGRAPHY.subtitleSize}
    />
  </AbsoluteFill>
);
