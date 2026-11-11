import {describe, expect, it} from 'vitest';
import {
  DEFAULT_BG_MUSIC_VOLUME,
  getBgMusicVolume,
} from './backgroundMusic';

describe('getBgMusicVolume', () => {
  it('resolves a manually configured track volume', () => {
    expect(
      getBgMusicVolume('assets/news/music/news-ambient-01.mp3'),
    ).toBe(0.09);
  });

  it('uses 0.1 when a path is not registered or has no volume', () => {
    expect(getBgMusicVolume('assets/music/unregistered.mp3')).toBe(
      DEFAULT_BG_MUSIC_VOLUME,
    );
  });
});
