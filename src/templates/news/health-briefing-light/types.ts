export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface HealthMedia {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface HealthItem {
  label: string;
  text: string;
}

export interface HealthTimelineItem {
  time: string;
  label: string;
  detail?: string;
}

export interface HealthStat {
  value: string;
  unit?: string;
  label: string;
  note?: string;
}

export interface HealthQuote {
  text: string;
  source: string;
  context?: string;
}

export interface HealthSceneProps {
  variant:
    | 'opening'
    | 'evidence'
    | 'stat'
    | 'symptoms'
    | 'recommendation'
    | 'timeline'
    | 'quote'
    | 'closing';
  meta: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  media?: HealthMedia;
  mediaHeight?: number;
  stat?: HealthStat;
  items?: HealthItem[];
  timeline?: HealthTimelineItem[];
  quote?: HealthQuote;
  notice?: string;
  cta?: string;
  hashtags?: string;
}

export interface HealthBriefingLightScene {
  type: 'healthBriefingLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  health: HealthSceneProps;
}

export interface HealthBriefingLightSpec {
  templateId: 'news/health-briefing-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: HealthBriefingLightScene[];
}
