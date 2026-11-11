export interface TravelImage {
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

export interface TravelFact {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export interface TravelRouteStop {
  label: string;
  detail?: string;
  time?: string;
}

export interface TravelNoteItem {
  label: string;
  text: string;
}

export interface TravelSceneProps {
  variant: 'opening' | 'experience' | 'fact' | 'route' | 'note' | 'gallery' | 'closing';
  meta: string;
  destination?: string;
  stamp?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  image?: TravelImage;
  imageHeight?: number;
  secondaryImage?: TravelImage;
  fact?: TravelFact;
  route?: TravelRouteStop[];
  notes?: TravelNoteItem[];
  tags?: string[];
  cta?: string;
  hashtags?: string;
}

export interface TravelPostcardLightScene {
  type: 'travelPostcardLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  travel: TravelSceneProps;
}

export interface TravelPostcardLightSpec {
  templateId: 'news/travel-postcard-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: TravelPostcardLightScene[];
}
