import {CHAPTER_CARD_FRAMES, COUNT_UP_FRAMES, EVIDENCE_HIGHLIGHT_FRAME} from './tokens';
import type {LongExplainerBeat, LongExplainerChapter} from './types';

export const SFX_URLS = {
  whoosh: 'https://remotion.media/whoosh.wav',
  pageTurn: 'https://remotion.media/page-turn.wav',
  marker: 'https://remotion.media/switch.wav',
  ding: 'https://remotion.media/ding.wav',
  click: 'https://remotion.media/mouse-click.wav',
} as const;

export interface SfxEvent {
  frame: number;
  name: keyof typeof SFX_URLS;
  volume: number;
}

/** Narration-safe cues derived from beat types: page turn + marker on evidence, ding when a count-up lands, whoosh into chapters. */
export const getLongExplainerSfx = (beats: LongExplainerBeat[], chapters: LongExplainerChapter[]): SfxEvent[] => {
  const events: SfxEvent[] = chapters.slice(1).map((c) => ({frame: c.startFrame, name: 'whoosh', volume: 0.16}));
  const inChapterCard = (frame: number) => chapters.slice(1).some((c) => frame >= c.startFrame && frame < c.startFrame + CHAPTER_CARD_FRAMES);
  for (const beat of beats) {
    const v = beat.visual;
    if (v.type === 'evidence') {
      events.push({frame: beat.startFrame, name: 'pageTurn', volume: 0.14});
      events.push({frame: beat.startFrame + EVIDENCE_HIGHLIGHT_FRAME, name: 'marker', volume: 0.1});
    } else if (v.type === 'data' && v.graphic.kind === 'bigNumber') {
      events.push({frame: beat.startFrame + COUNT_UP_FRAMES, name: 'ding', volume: 0.12});
    } else if (v.type === 'kinetic') {
      events.push({frame: beat.startFrame, name: 'click', volume: 0.1});
    }
  }
  // Chapter whoosh owns its first frames; drop beat cues hidden under the card.
  return events.filter((e) => e.name === 'whoosh' || !inChapterCard(e.frame)).sort((a, b) => a.frame - b.frame);
};
