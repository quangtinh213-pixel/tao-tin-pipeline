import {describe, expect, it} from 'vitest';
import {buildLongExplainerBeats, buildLongExplainerTiming, splitIntoBeats} from './long-explainer-timing.mjs';

const word = (w, start) => ({word: w, start, end: start + 0.4});
const timeline = {
  duration: 12,
  words: ['a', 'b', 'c', 'd', 'e', 'f'].map((w, i) => word(w, i * 2)),
  segments: [{start: 0}, {start: 3.8}, {start: 8.1}],
};

describe('buildLongExplainerTiming', () => {
  it('maps entries to snapped sentence starts and sums scene frames to the total', () => {
    const result = buildLongExplainerTiming({
      chapters: [{title: 'Mở đầu'}, {title: 'Chi tiết'}],
      script: [
        {text: 'a b', chapter: 0},
        {text: 'c d', chapter: 1},
        {text: 'e f', chapter: 1},
      ],
      timeline,
    });
    expect(result.scenes.map((s) => s.startFrame)).toEqual([0, 114, 243]);
    expect(result.scenes.reduce((sum, s) => sum + s.durationFrames, 0)).toBe(result.totalFrames);
    expect(result.chapters).toEqual([{title: 'Mở đầu', startFrame: 0}, {title: 'Chi tiết', startFrame: 114}]);
  });

  it('rejects a chapter with no script entry', () => {
    expect(() => buildLongExplainerTiming({
      chapters: [{title: 'A'}, {title: 'B'}],
      script: [{text: 'a b c', chapter: 0}],
      timeline,
    })).toThrow(/Chapter 1/);
  });
});

describe('beats', () => {
  const w = (word, start, end) => ({word, start, end: end ?? start + 0.5});
  it('merges short sentences and splits long ones at the middle comma', () => {
    const short = [w('Một.', 0), w('Hai.', 0.6), w('Ba', 1.2), w('bốn.', 3.6)];
    expect(splitIntoBeats(short).map((g) => g.length)).toEqual([4]);
    const long = [w('a', 0), w('b,', 2), w('c', 4), w('d,', 5), w('e', 7), w('f.', 9)];
    expect(splitIntoBeats(long).map((g) => g.map((x) => x.word).join(' '))).toEqual(['a b, c d,', 'e f.']);
  });

  it('tiles each entry scene exactly', () => {
    const timeline = {words: [w('Một', 0), w('câu.', 1), w('Câu', 4), w('hai', 5), w('dài', 6), w('hơn.', 6.5), w('Ba.', 8)]};
    const beats = buildLongExplainerBeats({scenes: [{startFrame: 0, durationFrames: 300, chapterIndex: 0}], timeline});
    expect(beats.reduce((a, b) => a + b.durationFrames, 0)).toBe(300);
    expect(beats[0].startFrame).toBe(0);
    expect(beats.every((b) => b.chapterIndex === 0)).toBe(true);
  });
});
