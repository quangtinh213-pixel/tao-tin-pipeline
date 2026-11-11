/**
 * ParticleNetwork.tsx — Shared tech particle SVG background.
 *
 * Deterministic particle network confined to top zone of frame.
 * Colors, opacity, and count passed via props — templates provide their own config.
 */

import React from 'react';
import { useCurrentFrame } from 'remotion';

export interface ParticleNetworkProps {
  width: number;
  height: number;
  /** Fraction of height to confine particles to (e.g. 0.15 = top 15%) */
  zoneFraction?: number;
  numParticles?: number;
  connectionDist?: number;
  particleOpacity?: number;
  lineMaxOpacity?: number;
  particleSizeMin?: number;
  particleSizeMax?: number;
  /** Primary particle/line color */
  colorA: string;
  /** Secondary particle color (alternates with colorA). Defaults to colorA. */
  colorB?: string;
  strokeWidth?: number;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

function wrap(v: number, max: number): number {
  return ((v % max) + max) % max;
}

export const ParticleNetwork: React.FC<ParticleNetworkProps> = ({
  width: W, height: H,
  zoneFraction = 0.15,
  numParticles = 12,
  connectionDist = 280,
  particleOpacity = 0.18,
  lineMaxOpacity = 0.09,
  particleSizeMin = 5,
  particleSizeMax = 9,
  colorA,
  colorB,
  strokeWidth = 1.5,
}) => {
  const frame = useCurrentFrame();
  const ZONE = H * zoneFraction;
  const C2 = colorB ?? colorA;

  // Build stable particle definitions (computed once per render tree mount)
  const particles = React.useMemo(() =>
    Array.from({ length: numParticles }, (_, i) => {
      const s = (n: number) => seededRand(i * 17 + n);
      return {
        x0: s(0) * W,
        y0: s(1) * ZONE,
        vx: (s(2) - 0.5) * 0.4,
        vy: (s(3) - 0.5) * 0.2,
        r:  particleSizeMin + s(4) * (particleSizeMax - particleSizeMin),
        phaseX: s(5) * Math.PI * 2,
        phaseY: s(6) * Math.PI * 2,
        useB: s(7) > 0.5,
      };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [numParticles, W, ZONE, particleSizeMin, particleSizeMax],
  );

  const positions = particles.map((p) => ({
    x: wrap(p.x0 + p.vx * frame + Math.sin(frame * 0.012 + p.phaseX) * 18, W),
    y: Math.abs((p.y0 + p.vy * frame + Math.sin(frame * 0.009 + p.phaseY) * 18) % (ZONE * 2) - ZONE),
    r: p.r,
    color: p.useB ? C2 : colorA,
  }));

  const lines: React.ReactNode[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < connectionDist) {
        lines.push(
          <line key={`${i}-${j}`}
            x1={positions[i].x} y1={positions[i].y}
            x2={positions[j].x} y2={positions[j].y}
            stroke={colorA} strokeWidth={strokeWidth}
            strokeOpacity={lineMaxOpacity * (1 - dist / connectionDist)}
          />,
        );
      }
    }
  }

  return (
    <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {lines}
      {positions.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.color} fillOpacity={particleOpacity} />
      ))}
    </svg>
  );
};
