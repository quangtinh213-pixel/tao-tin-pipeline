/**
 * Layout.tsx — Persistent frame for news/tech-light template.
 *
 * Renders fixed elements across all scenes:
 *   - Off-white background #F5F4F2
 *   - Subtle top gradient bar (accent red, 4px)
 *   - Subtitles: word-by-word highlight in red at bottom
 *   - Optional background music at low volume
 *
 * Children (scene content) are rendered inside a padded content area.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundMusic } from '../../../components/BackgroundMusic';
import { Subtitles } from '../../../components/Subtitles';
import { COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
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

      {/* ── Top accent bar (4px red line) ────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accent2} 100%)`,
        zIndex: 20,
      }} />

      {/* ── Particle network background ──────────────────────────────────── */}
      <ParticleNetwork />

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
