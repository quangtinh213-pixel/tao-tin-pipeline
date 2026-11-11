import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT_HEADING} from './tokens';

/** Full-frame chapter opener for CHAPTER_CARD_FRAMES. */
export const ChapterCard: React.FC<{index: number; title: string; durationFrames: number}> = ({index, title, durationFrames}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6, durationFrames - 8, durationFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slide = interpolate(frame, [0, 16], [80, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{opacity, background: COLORS.background, justifyContent: 'center', padding: '0 160px'}}>
      <div style={{fontFamily: FONT_HEADING, fontSize: 300, fontWeight: 800, color: 'transparent', WebkitTextStroke: `3px ${COLORS.red}`, lineHeight: 0.9, transform: `translateX(${-slide}px)`}}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div style={{width: interpolate(frame, [6, 22], [0, 220], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), height: 10, background: COLORS.red, margin: '26px 0 30px'}} />
      <div style={{fontFamily: FONT_HEADING, fontSize: title.length > 40 ? 100 : 124, fontWeight: 800, color: COLORS.text, textTransform: 'uppercase', lineHeight: 1.02, maxWidth: 1500, transform: `translateX(${slide}px)`}}>
        {title}
      </div>
    </AbsoluteFill>
  );
};
