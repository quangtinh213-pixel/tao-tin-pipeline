import {describe, expect, it} from 'vitest';
import {getSceneEntrySfxEvents} from './Layout';

describe('scene-entry transition SFX', () => {
  it('creates one event at the start of every scene', () => {
    const events = getSceneEntrySfxEvents([
      {
        startFrame: 0,
        entrySfx: {name: 'whoosh', volume: 0.18, reason: 'Opening scene'},
      },
      {
        startFrame: 240,
        entrySfx: {name: 'whip', volume: 0.15, reason: 'Fast scene change'},
      },
      {
        startFrame: 540,
        entrySfx: {name: 'whoosh', volume: 0.18, reason: 'Next scene'},
      },
    ]);

    expect(events.map((event) => event.frame)).toEqual([0, 240, 540]);
  });

  it('applies the default volume for each transition sound', () => {
    const events = getSceneEntrySfxEvents([
      {startFrame: 0, entrySfx: {name: 'whoosh', reason: 'Opening scene'}},
      {startFrame: 240, entrySfx: {name: 'whip', reason: 'Fast scene change'}},
      {startFrame: 480, entrySfx: {name: 'pageTurn', reason: 'Chapter change'}},
    ]);

    expect(events.map((event) => event.volume)).toEqual([0.18, 0.15, 0.2]);
  });

  it('rejects a scene without an entry transition SFX', () => {
    expect(() =>
      getSceneEntrySfxEvents([
        {
          startFrame: 0,
          entrySfx: {name: 'whoosh', volume: 0.18, reason: 'Opening scene'},
        },
        {startFrame: 240},
      ]),
    ).toThrow('entrySfx on every scene');
  });

});
