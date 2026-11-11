export const COLORS = {
  // Backgrounds & Surfaces (Cyber Dark / High-End Studio)
  bgDark: '#0A0C12',
  bgDarkDeep: '#05070B',
  bgCardDark: 'rgba(20, 24, 35, 0.78)',
  bgCardGlass: 'rgba(255, 255, 255, 0.07)',
  bgCardLight: 'rgba(255, 255, 255, 0.96)',
  bgGlassBorder: 'rgba(255, 255, 255, 0.16)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textDark: '#0F172A',

  // Commerce Accents (High-Voltage Neon & TikTok Brand Colors)
  accentYellow: '#FFE600', // TikTok Flash Deal Neon Yellow
  accentRed: '#FF004F', // TikTok Viral Red / Attention Grabber
  accentCyan: '#00F2FE', // TikTok Cyber Cyan
  accentEmerald: '#10B981', // Verified / Authentic Green
  accentGold: '#FBBF24', // Star Rating Gold
  accentPurple: '#8B5CF6', // RGB Gradient Purple

  // Borders & Glow Shadows
  borderGlass: 'rgba(255, 255, 255, 0.14)',
  borderGlowCyan: 'rgba(0, 242, 254, 0.45)',
  borderGlowRed: 'rgba(255, 0, 79, 0.45)',
  borderGlowYellow: 'rgba(255, 230, 0, 0.5)',
  shadowHero: '0 30px 90px rgba(0, 0, 0, 0.65)',
  shadowGlowCyan: '0 0 40px rgba(0, 242, 254, 0.35)',
  shadowGlowRed: '0 0 45px rgba(255, 0, 79, 0.4)',
  shadowGlowYellow: '0 0 35px rgba(255, 230, 0, 0.35)',
};

export const FONTS = {
  main: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  display: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  editorial: "'Newsreader', 'Playfair Display', Georgia, serif",
};

export const TIKTOK_SAFE_ZONE = {
  top: 170, // Avoid top search & header
  bottom: 340, // Avoid bottom caption & yellow shopping cart tag
  left: 64, // Left safe padding
  right: 128, // Avoid right action bar (Like, Comment, Share)
  contentWidth: 1080 - 64 - 128, // 888px width
};

export const TYPOGRAPHY = {
  heroHook: 64,
  sceneHeadline: 52,
  subheadline: 32,
  body: 28,
  badge: 22,
  price: 44,
  small: 20,
};
