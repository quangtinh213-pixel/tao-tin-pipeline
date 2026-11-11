import {describe, expect, it} from 'vitest';
import {normalizeWordTimestamps} from './transcribe-helpers.mjs';

describe('transcription word timestamps', () => {
  it('clamps a small backward word start to the previous word end', () => {
    const words = normalizeWordTimestamps([
      {word: 'TikTok', start: 39.12, end: 39.38},
      {word: 'để', start: 39.04, end: 39.82},
    ]);

    expect(words).toEqual([
      {word: 'TikTok', start: 39.12, end: 39.38},
      {word: 'để', start: 39.38, end: 39.82},
    ]);
  });
});
