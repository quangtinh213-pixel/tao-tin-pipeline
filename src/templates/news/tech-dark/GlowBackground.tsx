/**
 * GlowBackground.tsx — Ambient glow blobs for news/tech-dark template.
 *
 * Renders 4 radial gradient blobs at the corners + center that slowly
 * pulse/breathe. Gives depth to the dark background without being distracting.
 * Pure CSS — no canvas, no SVG, Remotion-friendly.
 */

import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, LAYOUT } from './tokens';

const W = LAYOUT.width;
const H = LAYOUT.height;

export const GlowBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // Each blob has an independent slow pulse
  const pulse = (phase: number, speed = 0.008) =>
    interpolate(Math.sin(frame * speed + phase), [-1, 1], [0.7, 1.0]);

  const blobs = [
    // Top-left — cyan
    {
      x: -80, y: -60,
      size: 560,
      color: COLORS.glowA,
      scale: pulse(0),
    },
    // Top-right — blue
    {
      x: W - 300, y: -80,
      size: 520,
      color: COLORS.glowB,
      scale: pulse(Math.PI * 0.7),
    },
    // Bottom-left — blue
    {
      x: -120, y: H - 400,
      size: 480,
      color: COLORS.glowB,
      scale: pulse(Math.PI * 1.3),
    },
    // Bottom-right — cyan
    {
      x: W - 260, y: H - 350,
      size: 500,
      color: COLORS.glowA,
      scale: pulse(Math.PI * 0.4),
    },
    // Center-top subtle — keeps middle from looking completely flat
    {
      x: W / 2 - 200, y: 200,
      size: 400,
      color: COLORS.glowC,
      scale: pulse(Math.PI * 1.8, 0.005),
    },
  ];

  return (
    <>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            transform: `scale(${b.scale})`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
};
