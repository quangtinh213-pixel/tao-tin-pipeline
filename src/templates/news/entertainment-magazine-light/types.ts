export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface EntertainmentMedia {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'POSTER' | 'BÌA SÁCH' | 'LOOKBOOK';
}

export interface EntertainmentFact {
  label: string;
  value: string;
  note?: string;
}

export interface EntertainmentTimelineItem {
  time: string;
  label: string;
  detail?: string;
}

export interface EntertainmentQuote {
  text: string;
  source: string;
  context?: string;
}

export interface EntertainmentRating {
  label: string;
  value: string;
  note?: string;
}

export interface EntertainmentSceneProps {
  variant:
    | 'opening'
    | 'profile'
    | 'release'
    | 'media'
    | 'quote'
    | 'timeline'
    | 'rank'
    | 'review'
    | 'gallery'
    | 'closing';
  section: string;
  headline: string;
  accentWords?: string[];
  kicker?: string;
  body?: string;
  body2?: string;
  media?: EntertainmentMedia;
  mediaHeight?: number;
  facts?: EntertainmentFact[];
  timeline?: EntertainmentTimelineItem[];
  quote?: EntertainmentQuote;
  rating?: EntertainmentRating;
  tags?: string[];
  cta?: string;
  hashtags?: string;
}

export interface EntertainmentMagazineLightScene {
  type: 'entertainmentMagazineLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  entertainment: EntertainmentSceneProps;
}

export interface EntertainmentMagazineLightSpec {
  templateId: 'news/entertainment-magazine-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: EntertainmentMagazineLightScene[];
}
