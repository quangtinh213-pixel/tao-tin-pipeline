import type {MediaShowcaseAsset} from '../media-showcase/types';

export type LongExplainerAsset = MediaShowcaseAsset;

/** Full-stage animated data graphic. Every number must come from a source file. */
export type LongExplainerGraphic =
  | {
      kind: 'bars';
      title: string;
      source: string;
      fromLabel?: string;
      toLabel?: string;
      rows: Array<{label: string; from?: number; fromText?: string; to: number; toText: string}>;
    }
  | {kind: 'bigNumber'; value: number; decimals?: number; prefix?: string; unit: string; kicker?: string; label: string; source: string}
  | {kind: 'equation'; title: string; source: string; note?: string; steps: Array<{label: string; value: string; op?: string}>; result: {label: string; value: string}}
  | {kind: 'document'; issuer: string; number: string; docType: string; title: string; lines: string[]; stamp: string; source: string}
  | {kind: 'calendar'; day: string; month: string; year: string; label: string; source: string}
  | {kind: 'timeline'; title: string; source: string; events: Array<{date: string; label: string; current?: boolean}>};

/** What one beat shows. */
export type LongExplainerVisual =
  | {type: 'collage'; photos: Array<{assetId: string}>; kicker?: string}
  | {type: 'evidence'; shotId: string}
  | {type: 'kinetic'; text: string; highlight?: string; icon?: string}
  | {type: 'data'; graphic: LongExplainerGraphic}
  | {type: 'quote'; text: string; speaker: string; source: string; portraitAssetId?: string};

/** Article screenshot from scripts/capture-evidence.mjs (rects/focus in screenshot pixels). */
export interface LongExplainerEvidenceShot {
  id: string;
  src: string;
  url: string;
  width: number;
  height: number;
  found: boolean;
  rects: Array<{x: number; y: number; w: number; h: number}>;
  focus: {x: number; y: number; w: number; h: number};
  /** e.g. "VnExpress · 3/11/2026" */
  label: string;
}

export interface LongExplainerChapter {
  title: string;
  startFrame: number;
}

export interface LongExplainerBeat {
  startFrame: number;
  durationFrames: number;
  chapterIndex: number;
  text: string;
  visual: LongExplainerVisual;
}

export interface LongExplainerSource {
  url: string;
  publisher: string;
  /** Slug folder that holds this source's evidence: public/<evidenceSlug>/source-evidence.json */
  evidenceSlug: string;
}

export interface LongExplainerSpec {
  templateId: 'news/long-explainer';
  slug: string;
  fps: 30;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    bgMusic: string | null;
    width: 1920;
    height: 1080;
  };
  sources: LongExplainerSource[];
  chapters: LongExplainerChapter[];
  mediaAssets: LongExplainerAsset[];
  evidenceShots: LongExplainerEvidenceShot[];
  beats: LongExplainerBeat[];
}
