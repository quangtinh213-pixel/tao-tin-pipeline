/**
 * Layout.tsx — Persistent frame for news/current-affairs-dark template.
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

const BriefingBackground: React.FC = () => (
  <AbsoluteFill style={{ overflow: 'hidden' }}>
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(circle at 15% 16%, ${COLORS.glowB} 0%, transparent 34%),
        radial-gradient(circle at 86% 24%, ${COLORS.glowA} 0%, transparent 30%),
        linear-gradient(180deg, ${COLORS.bg} 0%, #050A12 100%)`,
    }} />
    <div style={{
      position: 'absolute',
      inset: 0,
      opacity: 0.54,
      backgroundImage: `
        linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px),
        linear-gradient(0deg, ${COLORS.grid} 1px, transparent 1px)
      `,
      backgroundSize: '80px 80px',
    }} />
    <div style={{
      position: 'absolute',
      left: -110,
      top: 250,
      width: 440,
      height: 440,
      borderRadius: '50%',
      border: `1px solid ${COLORS.border}`,
    }} />
    <div style={{
      position: 'absolute',
      right: -60,
      bottom: 320,
      width: 280,
      height: 280,
      borderRadius: '50%',
      border: `1px solid ${COLORS.border}`,
    }} />
  </AbsoluteFill>
);

export const Layout: React.FC<LayoutProps> = ({ slug, bgMusic = null, children }) => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <BackgroundMusic src={bgMusic} />

    <BriefingBackground />

    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 8,
      background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accent2} 100%)`,
      boxShadow: `0 0 24px ${COLORS.accent}55`,
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
      <span>Current Affairs</span>
      <span>Briefing · Civic Desk</span>
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
