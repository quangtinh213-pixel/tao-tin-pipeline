import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MAIN, MEDIA_FRAME} from './tokens';

export interface HookCardProps {
  value: string;
  label: string;
  durationFrames: number;
}

// A/B "hook-card": the card covers the hook only, where most viewers leave (VN News Analytics 11/2026).
export const HOOK_CARD_START_FRAME = 6;
export const HOOK_CARD_MAX_FRAMES = 150;
const EXIT_FRAMES = 10;
const SOURCE_STRIP_HEIGHT = 42;

export const getHookCardFrames = (hookSceneFrames: number) =>
  Math.max(45, Math.min(HOOK_CARD_MAX_FRAMES, hookSceneFrames - HOOK_CARD_START_FRAME));

export const HookCard: React.FC<HookCardProps> = ({value, label, durationFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 170}});
  const exit = interpolate(frame, [durationFrames - EXIT_FRAMES, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const pop = spring({frame: frame - 4, fps, config: {damping: 9, stiffness: 220}});
  const underline = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 44,
        maxWidth: 1080 - 88,
        top: MEDIA_FRAME.top + MEDIA_FRAME.height - SOURCE_STRIP_HEIGHT - 34,
        transform: `translateY(calc(-100% + ${(1 - enter) * 90 + exit * 60}px))`,
        opacity: Math.min(enter, 1 - exit),
        display: 'flex',
        background: COLORS.panel,
        border: `5px solid ${COLORS.border}`,
        boxShadow: '0 18px 0 rgba(17,17,17,0.85)',
        fontFamily: FONT_MAIN,
      }}
    >
      <div style={{width: 22, background: COLORS.red, flexShrink: 0}} />
      <div style={{padding: '26px 34px 30px', minWidth: 0}}>
        <div
          style={{
            display: 'inline-block',
            color: COLORS.red,
            fontSize: value.length > 8 ? 112 : 148,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            transform: `scale(${interpolate(pop, [0, 1], [1.35, 1])})`,
            transformOrigin: 'left bottom',
          }}
        >
          {value}
          <div
            style={{
              height: 10,
              marginTop: 10,
              background: COLORS.border,
              transform: `scaleX(${underline})`,
              transformOrigin: 'left center',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 16,
            color: COLORS.text,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
