export interface GuideImage {
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

export interface GuideMetric {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export interface GuideItem {
  label: string;
  text: string;
  tone?: 'neutral' | 'good' | 'warn' | 'avoid';
}

export interface GuideScheduleItem {
  time: string;
  title: string;
  detail?: string;
}

export interface TravelGuideSceneProps {
  variant: 'opening' | 'budget' | 'itinerary' | 'checklist' | 'dosDonts' | 'season' | 'closing';
  meta: string;
  destination?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  image?: GuideImage;
  imageHeight?: number;
  metric?: GuideMetric;
  items?: GuideItem[];
  avoidItems?: GuideItem[];
  schedule?: GuideScheduleItem[];
  tags?: string[];
  cta?: string;
  hashtags?: string;
}

export interface TravelGuideLightScene {
  type: 'travelGuideLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  guide: TravelGuideSceneProps;
}

export interface TravelGuideLightSpec {
  templateId: 'news/travel-guide-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: TravelGuideLightScene[];
}
