/**
 * ParticleNetwork.tsx — tech-dark wrapper.
 * Dual-color cyan+blue particles, slightly higher opacity on dark bg.
 */
import React from 'react';
import { ParticleNetwork as SharedPN } from '../shared/ParticleNetwork';
import { COLORS, LAYOUT } from './tokens';

export const ParticleNetwork: React.FC = () => (
  <SharedPN
    width={LAYOUT.width}
    height={LAYOUT.height}
    zoneFraction={0.15}
    numParticles={14}
    connectionDist={300}
    particleOpacity={0.30}
    lineMaxOpacity={0.14}
    particleSizeMin={4}
    particleSizeMax={8}
    colorA={COLORS.accent}
    colorB={COLORS.accent2}
    strokeWidth={1.5}
  />
);
