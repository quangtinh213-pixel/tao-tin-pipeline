export interface VideoConfig {
  aspectRatio: '9:16' | '16:9';
  theme: 'dark' | 'light';
  width: number;
  height: number;
  showSubtitles: boolean;
}

export function parseAspectRatio(value: string | undefined): '9:16' | '16:9' {
  if (value === '16:9') return '16:9';
  if (value && value !== '9:16') {
    console.warn(`Invalid ASPECT_RATIO "${value}", falling back to 9:16`);
  }
  return '9:16';
}

export function parseTheme(value: string | undefined): 'dark' | 'light' {
  if (value === 'light') return 'light';
  if (value && value !== 'dark') {
    console.warn(`Invalid THEME "${value}", falling back to dark`);
  }
  return 'dark';
}

export function getDimensions(aspectRatio: '9:16' | '16:9'): { width: number; height: number } {
  return aspectRatio === '16:9'
    ? { width: 1920, height: 1080 }
    : { width: 1080, height: 1920 };
}

export function parseShowSubtitles(value: string | undefined): boolean {
  if (value === 'false' || value === '0') return false;
  // Default true — subtitles are on unless explicitly disabled
  return true;
}

export function loadConfig(): VideoConfig {
  const aspectRatio = parseAspectRatio(process.env.ASPECT_RATIO);
  const theme = parseTheme(process.env.THEME);
  const { width, height } = getDimensions(aspectRatio);
  const showSubtitles = parseShowSubtitles(process.env.SHOW_SUBTITLES);
  return { aspectRatio, theme, width, height, showSubtitles };
}
