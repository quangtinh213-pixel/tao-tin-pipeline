export type ModernNewsCanvasAssetKind = 'image' | 'video';

export interface ModernNewsCanvasAsset {
  id: string;
  kind: ModernNewsCanvasAssetKind;
  /** Remote URL, or a path relative to public/. */
  src: string;
  storage: 'local' | 'remote';
  sourcePageUrl: string;
  sourceMediaUrl: string;
  credit: string;
  caption?: string | null;
  alt?: string | null;
  width: number;
  height: number;
  duration?: number;
}

export interface ModernNewsCanvasSelection {
  assetId: string;
  fit?: 'cover' | 'contain';
  clipStartSeconds?: number;
  clipEndSeconds?: number;
}

export interface ModernNewsCanvasSceneSpec {
  startFrame: number;
  durationFrames: number;
  headline: string;
  audioSegment: {
    start: number;
    end: number;
    text: string;
  };
  media: ModernNewsCanvasSelection[];
}

export interface ModernNewsCanvasSpec {
  templateId: 'news/modern-news-canvas';
  slug: string;
  totalFrames: number;
  video: {
    date: string;
    bgMusic: string | null;
  };
  source: {
    articleUrl: string;
    publisher: string;
    evidenceManifest: string;
  };
  mediaAssets: ModernNewsCanvasAsset[];
  scenes: ModernNewsCanvasSceneSpec[];
}
