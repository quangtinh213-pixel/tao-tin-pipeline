import {describe, expect, it} from 'vitest';
import {
  getImageMotion,
  getMediaSlideOpacity,
  getSlideOrder,
  MEDIA_SLIDE_MIN_OPACITY,
} from './MediaShowcaseScene';

describe('media showcase slide pacing', () => {
  it('cycles media so no slide holds longer than 3 seconds', () => {
    expect(getSlideOrder(2, 240, 30)).toEqual([0, 1, 0]);
    expect(getSlideOrder(3, 60, 30)).toEqual([0, 1, 2]);
  });

  it('keeps a single media item as one continuous slide', () => {
    expect(getSlideOrder(1, 240, 30)).toEqual([0]);
    expect(getSlideOrder(0, 240, 30)).toEqual([]);
  });
});

describe('media showcase slide fades', () => {
  it('keeps source media visible at both ends of a slide', () => {
    expect(getMediaSlideOpacity(0, 149)).toBeCloseTo(MEDIA_SLIDE_MIN_OPACITY);
    expect(getMediaSlideOpacity(74, 149)).toBeCloseTo(1);
    expect(getMediaSlideOpacity(149, 149)).toBeCloseTo(MEDIA_SLIDE_MIN_OPACITY);
  });
});

describe('media showcase image motion', () => {
  it('keeps the gentle zoom on short slides', () => {
    expect(getImageMotion(0, 75, 30)).toEqual({scale: 1.025, origin: '50% 45%'});
  });

  it('cuts to a new crop every 2.5 seconds on long slides', () => {
    const origins = [0, 75, 150, 225, 300].map((frame) => getImageMotion(frame, 360, 30).origin);
    expect(new Set(origins.slice(0, 4)).size).toBe(4);
    expect(origins[4]).toBe(origins[0]);
    expect(getImageMotion(75, 360, 30).scale).toBeCloseTo(1.06);
    expect(getImageMotion(149, 360, 30).scale).toBeGreaterThan(1.15);
  });
});
