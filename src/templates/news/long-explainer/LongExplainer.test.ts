import {describe, expect, it} from 'vitest';
import {collageSlots, evidenceZoom, tiltFor} from './Beats';
import {formatViNumber} from './Graphic';
import {getChapterIndex} from './Layout';
import {getLongExplainerSfx} from './sfx';
import type {LongExplainerBeat} from './types';

describe('long explainer v2', () => {
  it('finds the chapter playing at a frame', () => {
    const chapters = [{title: 'a', startFrame: 0}, {title: 'b', startFrame: 300}, {title: 'c', startFrame: 900}];
    expect([0, 299, 300, 899, 5000].map((f) => getChapterIndex(f, chapters))).toEqual([0, 0, 1, 1, 2]);
  });

  it('formats Vietnamese numbers', () => {
    expect(formatViNumber(390000)).toBe('390.000');
    expect(formatViNumber(28.5, 1)).toBe('28,5');
  });

  it('keeps collage tilt within ±2.5° and slots inside the stage', () => {
    for (let s = 0; s < 40; s += 1) expect(Math.abs(tiltFor(s))).toBeLessThanOrEqual(2.5);
    for (const n of [1, 2, 3]) {
      const slots = collageSlots(n);
      expect(slots).toHaveLength(n);
      for (const [left, , width] of slots) expect(left + width).toBeLessThanOrEqual(1920 - 160 + 1);
    }
  });

  it('zooms evidence so the quoted sentence spans about 70% of the card, capped at 2.4x', () => {
    expect(evidenceZoom({width: 1600, focus: {x: 0, y: 0, w: 800, h: 60}}, 1500).scale).toBeCloseTo(1.4);
    expect(evidenceZoom({width: 1600, focus: {x: 0, y: 0, w: 100, h: 20}}, 1500).scale).toBe(2.4);
    expect(evidenceZoom({width: 1600, focus: {x: 0, y: 0, w: 1600, h: 900}}, 1500).scale).toBe(1);
  });

  it('derives SFX from beats and keeps chapter cards clean', () => {
    const beat = (startFrame: number, visual: LongExplainerBeat['visual']): LongExplainerBeat => ({startFrame, durationFrames: 150, chapterIndex: 0, text: '', visual});
    const sfx = getLongExplainerSfx(
      [
        beat(0, {type: 'evidence', shotId: 'a'}),
        beat(150, {type: 'data', graphic: {kind: 'bigNumber', value: 1, unit: 'đ', label: 'x', source: 's'}}),
        beat(300, {type: 'kinetic', text: 'x'}),
      ],
      [{title: 'a', startFrame: 0}, {title: 'b', startFrame: 300}],
    );
    expect(sfx.map((e) => [e.frame, e.name])).toEqual([[0, 'pageTurn'], [22, 'marker'], [186, 'ding'], [300, 'whoosh']]);
  });
});
