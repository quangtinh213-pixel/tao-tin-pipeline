import {describe, expect, it} from 'vitest';
import {groupTextChunks, normalizeForVieNeu} from './tts-chunks.mjs';

describe('groupTextChunks', () => {
  it('keeps a short script as one request', () => {
    expect(groupTextChunks(['Một.', 'Hai.'])).toEqual(['Một. Hai.']);
  });

  it('packs entries under the limit and splits an oversized entry at sentence ends', () => {
    const chunks = groupTextChunks(['aaaa.', 'bbbb.', 'cccc. dddd.'], 11);
    expect(chunks).toEqual(['aaaa. bbbb.', 'cccc. dddd.']);
    expect(groupTextChunks(['aaaa. bbbb. cccc.'], 11)).toEqual(['aaaa. bbbb.', 'cccc.']);
    expect(chunks.every((c) => c.length <= 11)).toBe(true);
  });
});

describe('normalizeForVieNeu', () => {
  it('spells Roman-numeral regions and leaves other text alone', () => {
    expect(normalizeForVieNeu('Vùng I tăng, vùng II, vùng III và vùng IV. Vùng IV cuối.')).toBe(
      'Vùng một tăng, vùng hai, vùng ba và vùng bốn. Vùng bốn cuối.',
    );
    expect(normalizeForVieNeu('Điều I của nghị định, vùng 1 và vùng Iceland')).toBe('Điều I của nghị định, vùng 1 và vùng Iceland');
  });
});
