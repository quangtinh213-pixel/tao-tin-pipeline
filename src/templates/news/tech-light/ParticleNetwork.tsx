/**
 * ParticleNetwork.tsx — tech-light wrapper.
 * Configures shared ParticleNetwork with light theme settings.
 */
import React from 'react';
import { ParticleNetwork as SharedPN } from '../shared/ParticleNetwork';
import { COLORS, LAYOUT } from './tokens';

export const ParticleNetwork: React.FC = () => (
  <SharedPN
    width={LAYOUT.width}
    height={LAYOUT.height}
    zoneFraction={0.15}
    numParticles={12}
    connectionDist={280}
    particleOpacity={0.18}
    lineMaxOpacity={0.09}
    particleSizeMin={5}
    particleSizeMax={9}
    colorA={COLORS.accent}
    strokeWidth={1.5}
  />
);
