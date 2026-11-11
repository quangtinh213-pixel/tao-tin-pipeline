export interface PlexImage {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit?: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
}

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface PlexStatusRow {
  label: string;
  status: string;
  accent?: boolean;
}

export interface PlexListItem {
  label: string;
  text: string;
}

export interface PlexMetric {
  value: string;
  unit?: string;
  caption?: string;
}

export interface PlexQuote {
  text: string;
  name: string;
  title?: string;
}

export interface PlexSceneProps {
  variant: 'image' | 'text' | 'route' | 'status' | 'list' | 'quote' | 'closing';
  meta: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  image?: PlexImage;
  imageHeight?: number;
  rows?: PlexStatusRow[];
  items?: PlexListItem[];
  metric?: PlexMetric;
  quote?: PlexQuote;
  cta?: string;
  hashtags?: string;
}

export interface RealEstatePlexLightScene {
  type: 'realEstatePlexLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  plex: PlexSceneProps;
}

export interface RealEstatePlexLightSpec {
  templateId: 'news/real-estate-plex-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: RealEstatePlexLightScene[];
}
