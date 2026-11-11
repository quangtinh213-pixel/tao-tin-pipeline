import {describe, expect, it} from 'vitest';
import {validateLongExplainer} from './validate-long-explainer.mjs';

const beat = (startFrame, durationFrames, visual) => ({startFrame, durationFrames, chapterIndex: 0, text: '', visual});
const base = {
  totalFrames: 600,
  chapters: [{title: 'a', startFrame: 0}],
  mediaAssets: [{id: 'p1'}],
  evidenceShots: [{id: 'e1'}],
};

describe('validateLongExplainer', () => {
  it('passes a varied, sourced spec', () => {
    const spec = {...base, beats: [
      beat(0, 60, {type: 'evidence', shotId: 'e1'}),
      beat(60, 150, {type: 'data', graphic: {kind: 'bigNumber', value: 390000, unit: 'đồng', label: 'mức tăng', source: 'VnExpress'}}),
      beat(210, 150, {type: 'collage', photos: [{assetId: 'p1'}]}),
      beat(360, 240, {type: 'kinetic', text: 'Mức sàn'}),
    ]};
    expect(validateLongExplainer(spec, 'tăng 390.000 đồng').errors).toEqual([]);
  });

  it('catches gaps, long beats, repeats, unsourced numbers and missing evidence', () => {
    const spec = {...base, beats: [
      beat(0, 400, {type: 'kinetic', text: 'a'}),
      beat(400, 100, {type: 'kinetic', text: 'b'}),
      beat(500, 50, {type: 'kinetic', text: 'c'}),
      beat(560, 40, {type: 'data', graphic: {kind: 'bigNumber', value: 777, unit: 'đ', label: 'x', source: 'VnExpress'}}),
    ]};
    const {errors} = validateLongExplainer(spec, 'không có số');
    expect(errors.join('\n')).toMatch(/max 8s/u);
    expect(errors.join('\n')).toMatch(/third kinetic/u);
    expect(errors.join('\n')).toMatch(/expected 550/u);
    expect(errors.join('\n')).toMatch(/numbers not in sources: 777/u);
    expect(errors.join('\n')).toMatch(/evidence beats are 0%/u);
  });
});
