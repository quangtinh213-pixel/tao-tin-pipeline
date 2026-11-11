export type EducationTopic =
  | 'admissions'
  | 'study-abroad'
  | 'policy'
  | 'innovation'
  | 'profile'
  | 'school-life'
  | 'exam'
  | 'scholarship'
  | 'other';

export type EducationTone = 'neutral' | 'urgent' | 'positive' | 'warning';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface EducationMedia {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface EducationMetric {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  tone?: EducationTone;
}

export interface EducationTimelineItem {
  time: string;
  label: string;
  detail?: string;
}

export interface EducationChecklistItem {
  label?: string;
  text: string;
  tone?: EducationTone;
}

export interface EducationProfile {
  name: string;
  role?: string;
  institution?: string;
  achievement?: string;
}

export interface EducationQuote {
  text: string;
  source: string;
  context?: string;
}

export interface EducationSceneProps {
  variant:
    | 'opening'
    | 'deadline'
    | 'timeline'
    | 'stats'
    | 'checklist'
    | 'profile'
    | 'quote'
    | 'media'
    | 'closing';
  topic?: EducationTopic;
  tone?: EducationTone;
  meta: string;
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  media?: EducationMedia;
  mediaHeight?: number;
  metrics?: EducationMetric[];
  timeline?: EducationTimelineItem[];
  checklist?: EducationChecklistItem[];
  profile?: EducationProfile;
  quote?: EducationQuote;
  tags?: string[];
  cta?: string;
  hashtags?: string;
}

export interface EducationBriefingLightScene {
  type: 'educationBriefingLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  education: EducationSceneProps;
}

export interface EducationBriefingLightSpec {
  templateId: 'news/education-briefing-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: EducationTopic;
  };
  scenes: EducationBriefingLightScene[];
}
