export type EducationCampusTopic =
  | 'admissions'
  | 'study-abroad'
  | 'policy'
  | 'innovation'
  | 'profile'
  | 'school-life'
  | 'exam'
  | 'scholarship'
  | 'other';

export type EducationCampusTone = 'neutral' | 'urgent' | 'positive' | 'warning';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface CampusMedia {
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface CampusMetric {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  tone?: EducationCampusTone;
}

export interface CampusTimelineItem {
  time: string;
  label: string;
  detail?: string;
}

export interface CampusChecklistItem {
  label?: string;
  text: string;
  tone?: EducationCampusTone;
}

export interface CampusProfile {
  name: string;
  role?: string;
  institution?: string;
  achievement?: string;
}

export interface CampusQuote {
  text: string;
  source: string;
  context?: string;
}

export interface CampusSceneProps {
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
  topic?: EducationCampusTopic;
  tone?: EducationCampusTone;
  section: string;
  meta: string;
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  media?: CampusMedia;
  mediaHeight?: number;
  metrics?: CampusMetric[];
  timeline?: CampusTimelineItem[];
  checklist?: CampusChecklistItem[];
  profile?: CampusProfile;
  quote?: CampusQuote;
  tags?: string[];
  cta?: string;
  hashtags?: string;
}

export interface EducationCampusLightScene {
  type: 'educationCampusLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  campus: CampusSceneProps;
}

export interface EducationCampusLightSpec {
  templateId: 'news/education-campus-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: EducationCampusTopic;
  };
  scenes: EducationCampusLightScene[];
}
