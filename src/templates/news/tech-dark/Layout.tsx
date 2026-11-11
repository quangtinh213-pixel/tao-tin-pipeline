/**
 * Layout.tsx — Persistent frame for news/tech-dark template.
 *
 * Layers (bottom → top):
 *   1. Deep space background (#0B0C10)
 *   2. GlowBackground — ambient radial blobs at corners
 *   3. ParticleNetwork — cyan/blue particle network in top 15%
 *   4. Top accent bar — cyan→blue gradient line
 *   5. Scene content (children)
 *   6. Subtitles overlay
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { Subtitles } from '../../../components/Subtitles';
import { COLORS, LAYOUT, TYPOGRAPHY } from './tokens';
import { GlowBackground } from './GlowBackground';
import { ParticleNetwork } from './ParticleNetwork';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ slug, bgMusic = null, children }) => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>

      {/* ── Background music ─────────────────────────────────────────────── */}
      <BackgroundMusic src={bgMusic} />

      {/* ── Ambient glow blobs ───────────────────────────────────────────── */}
      <GlowBackground />

      {/* ── Particle network — top 15% only ─────────────────────────────── */}
      <ParticleNetwork />

      {/* ── Top accent bar — cyan→blue gradient ─────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accent2} 100%)`,
        zIndex: 20,
        boxShadow: `0 0 20px ${COLORS.accent}60`,
      }} />

      {/* ── Scene content area ───────────────────────────────────────────── */}
      <AbsoluteFill style={{
        paddingTop: LAYOUT.paddingV,
        paddingBottom: LAYOUT.paddingV,
        paddingLeft: LAYOUT.paddingH,
        paddingRight: LAYOUT.paddingH,
        boxSizing: 'border-box',
      }}>
        {children}
      </AbsoluteFill>

      {/* ── Subtitles — bottom overlay ───────────────────────────────────── */}
      <Subtitles
        slug={slug}
        activeColor={COLORS.subtitleAccent}
        fontSize={TYPOGRAPHY.subtitleSize}
      />

    </AbsoluteFill>
  );
};
