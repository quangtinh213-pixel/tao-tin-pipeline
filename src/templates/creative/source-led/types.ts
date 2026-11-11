import type {TransitionSfxName} from '../free-style-sfx';

export type SourceLedTemplateId =
  | 'creative/source-led-light'
  | 'creative/source-led-dark'
  | 'creative/source-led-light-sfx'
  | 'creative/source-led-dark-sfx';

export type SourceLedMode = 'light' | 'dark';
export type SourceLedAudioMode = 'silent' | 'sfx';

export interface SourceLedEvidenceAsset {
  id: string;
  kind: 'image' | 'video';
  /** Remote URL, or a path relative to public/. */
  src: string;
  storage: 'local' | 'remote';
  sourcePageUrl: string;
  sourceMediaUrl: string;
  credit: string;
  caption?: string | null;
  alt?: string | null;
  nearbyText?: string | null;
  poster?: string | null;
  width: number;
  height: number;
  duration?: number;
}

export interface SourceLedEvidenceSelection {
  assetId: string;
  relevanceReason: string;
  clipStartSeconds?: number;
  clipEndSeconds?: number;
  fit?: 'cover' | 'contain';
  presentation?: 'framed' | 'full-bleed' | 'split';
}

export interface SourceLedSceneSpec {
  type: 'hook' | 'body' | 'ending';
  startFrame: number;
  durationFrames: number;
  audioSegment: {
    start: number;
    end: number;
    text: string;
  };
  evidence?: SourceLedEvidenceSelection | null;
  fallbackToFreeStyle: boolean;
  visibleText?: string[];
  visualConcept: string;
  coreIdea: string;
  dominantElement: string;
  informationOrder: string[];
  motionIntent: string;
  safeAreaNotes: string;
  entrySfx?: {
    name: TransitionSfxName;
    volume?: number;
    reason: string;
  };
}

export interface SourceLedSpec {
  templateId: SourceLedTemplateId;
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    bgMusic: string | null;
  };
  source: {
    articleUrl: string;
    evidenceManifest: string;
    usableAssetCount: number;
  };
  creativeDirection: {
    mode: SourceLedMode;
    concept: string;
    tone: string;
    palette: {
      background: string;
      text: string;
      accent: string;
      accent2: string;
    };
    motionLanguage: string[];
    transitionLanguage: string;
    font: string;
    subtitleAccent: string;
  };
  audioDesign: {
    mode: SourceLedAudioMode;
    sfxPalette?: Array<{name: TransitionSfxName; reason: string}>;
    sfxRules: string;
  };
  evidenceAssets: SourceLedEvidenceAsset[];
  scenes: SourceLedSceneSpec[];
}
