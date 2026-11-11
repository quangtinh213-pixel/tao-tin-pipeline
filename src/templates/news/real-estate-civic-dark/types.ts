export interface CivicImage {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
}

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface CivicTimelineItem {
  label: string;
  text: string;
}

export interface CivicQuote {
  text: string;
  attribution: string;
}

export interface CivicSceneProps {
  variant:
    | 'opening'
    | 'timeline'
    | 'legal'
    | 'stat'
    | 'text'
    | 'chips'
    | 'quote'
    | 'closing';
  meta: string;
  headline: string;
  kicker?: string;
  body?: string;
  body2?: string;
  highlightWords?: string[];
  image?: CivicImage;
  imageHeight?: number;
  timeline?: CivicTimelineItem[];
  chips?: string[];
  quote?: CivicQuote;
  cta?: string;
  hashtags?: string;
}

export interface RealEstateCivicDarkScene {
  type: 'civic';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  civic: CivicSceneProps;
}

export interface RealEstateCivicDarkSpec {
  templateId: 'news/real-estate-civic-dark';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: RealEstateCivicDarkScene[];
}
