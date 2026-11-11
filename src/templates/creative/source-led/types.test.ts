import {describe, expect, it} from 'vitest';
import type {
  SourceLedEvidenceAsset,
  SourceLedSpec,
} from './types';

const image: SourceLedEvidenceAsset = {
  id: 'image-01',
  kind: 'image',
  src: 'slug/evidence/image-01.jpg',
  storage: 'local',
  sourcePageUrl: 'https://example.com/story',
  sourceMediaUrl: 'https://cdn.example.com/image.jpg',
  credit: 'Nguồn: Example',
  width: 1600,
  height: 900,
};

describe('source-led spec contract', () => {
  it('supports evidence scenes and per-scene free-style fallback', () => {
    const spec: SourceLedSpec = {
      templateId: 'creative/source-led-light',
      slug: 'example',
      totalFrames: 300,
      video: {title: 'Ví dụ', date: '2026-06-21', bgMusic: null},
      source: {
        articleUrl: 'https://example.com/story',
        evidenceManifest: 'example/source-evidence.json',
        usableAssetCount: 1,
      },
      creativeDirection: {
        mode: 'light',
        concept: 'Source-led',
        tone: 'editorial',
        palette: {
          background: '#fff',
          text: '#111',
          accent: '#b53a2e',
          accent2: '#d89b28',
        },
        motionLanguage: ['evidence reveal'],
        transitionLanguage: 'semantic',
        font: 'BeVietnamPro',
        subtitleAccent: '#b53a2e',
      },
      audioDesign: {
        mode: 'silent',
        sfxPalette: [],
        sfxRules: 'Voiceover only.',
      },
      evidenceAssets: [image],
      scenes: [
        {
          type: 'body',
          startFrame: 0,
          durationFrames: 150,
          audioSegment: {start: 0, end: 5, text: 'Có dẫn chứng.'},
          evidence: {
            assetId: image.id,
            relevanceReason: 'Caption matches narration.',
          },
          fallbackToFreeStyle: false,
          visualConcept: 'Evidence card',
          coreIdea: 'Evidence',
          dominantElement: 'Image',
          informationOrder: ['Claim', 'Evidence'],
          motionIntent: 'Reveal at the claim.',
          safeAreaNotes: 'Credit above subtitles.',
        },
        {
          type: 'ending',
          startFrame: 150,
          durationFrames: 150,
          audioSegment: {start: 5, end: 10, text: 'Kết luận.'},
          evidence: null,
          fallbackToFreeStyle: true,
          visualConcept: 'Kinetic conclusion',
          coreIdea: 'Conclusion',
          dominantElement: 'Text',
          informationOrder: ['Conclusion'],
          motionIntent: 'Readable hold.',
          safeAreaNotes: 'Text above subtitles.',
        },
      ],
    };

    expect(spec.scenes[0].fallbackToFreeStyle).toBe(false);
    expect(spec.scenes[1].fallbackToFreeStyle).toBe(true);
  });
});
