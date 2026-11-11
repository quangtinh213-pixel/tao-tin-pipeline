/**
 * registry.ts — Template registry.
 *
 * Maps template IDs to their metadata and asset manifest paths.
 * The coder agent reads this to validate templateId and locate assets.
 *
 * To add a new template:
 *   1. Create src/templates/<category>/<template-name>/
 *   2. Add an entry here with fixed, hybrid, or creative behavior
 *   3. Create public/assets/<category>/manifest.json
 *   4. Create docs/templates/<category>/<template-name>.md
 */

export interface TemplateRegistryEntry {
  /** Unique template ID used in --template flag and spec.json */
  id: string;
  /** Determines how much visual freedom the coder agent receives */
  behavior: "fixed" | "hybrid" | "creative";
  /** Human-readable name */
  name: string;
  /** Category / industry grouping */
  category: string;
  /** Short description */
  description: string;
  /** Aspect ratio supported */
  aspectRatio: "9:16" | "16:9";
  /** Path to asset manifest, relative to project root */
  assetManifestPath: string | null;
  /**
   * Default background music path for this template.
   * When omitted or null, the template default is voice-only unless an explicit
   * audio mode enables music.
   */
  defaultBgMusic?: string | null;
  /** Path to AI instruction doc for Spec step */
  specDocPath: string;
  /**
   * Voice configuration for TTS (Step 4).
   * If set, overrides .env ELEVENLABS_VOICE_ID for this template.
   * Falls back to .env → ElevenLabs default if not set.
   */
  voice?: {
    /** VieNeu-TTS preset voice name (local, tried first when set) */
    vieneuVoice?: string;
    /** ElevenLabs voice ID for this template */
    elevenLabsVoiceId?: string;
    /** Gemini TTS voice name for this template (fallback if ElevenLabs unavailable) */
    geminiVoice?: string;
    /** Speech rate multiplier (e.g. 1.15 for fast, energetic short-form pacing) */
    speed?: number;
  };
}

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  {
      id: "creative/free-style",
      behavior: "creative",
      name: "Free Style",
      category: "creative",
      description:
        "No fixed visual system. Content-driven scenes, colors, animations, and transitions, with default watermark and subtitle safe zones.",
      aspectRatio: "9:16",
      assetManifestPath: null,
      specDocPath: "docs/templates/creative/free-style.md",
    },
  {
      id: "creative/free-style-sfx",
      behavior: "creative",
      name: "Free Style + Audio SFX",
      category: "creative",
      description:
        "Free-style creative direction with background music and a transition sound at every scene entry.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/creative/manifest.json",
      defaultBgMusic: "assets/news/music/sonican-tech-news-information.mp3",
      specDocPath: "docs/templates/creative/free-style-sfx.md",
    },
  {
      id: "creative/pixel-style",
      behavior: "creative",
      name: "Pixel Style",
      category: "creative",
      description:
        "Content-driven creative scenes with modern pixel-editorial typography, grid-based geometry, stepped motion, and Vietnamese-safe pixel fonts.",
      aspectRatio: "9:16",
      assetManifestPath: null,
      specDocPath: "docs/templates/creative/pixel-style.md",
    },
  {
      id: "creative/pixel-style-sfx",
      behavior: "creative",
      name: "Pixel Style + Audio SFX",
      category: "creative",
      description:
        "Modern pixel-editorial creative direction with Vietnamese-safe typography, background music, and one transition sound at every scene entry.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/creative/manifest.json",
      defaultBgMusic: "assets/news/music/the_mountain-news-news-music.mp3",
      specDocPath: "docs/templates/creative/pixel-style-sfx.md",
    },
  {
      id: "creative/demo-scroll",
      behavior: "creative",
      name: "Demo Scroll",
      category: "creative",
      description:
        "Free-style creative direction with a muted 9:16 browser recording that starts at the first narration mention of the demo.",
      aspectRatio: "9:16",
      assetManifestPath: null,
      specDocPath: "docs/templates/creative/demo-scroll.md",
    },
  {
      id: "creative/demo-scroll-sfx",
      behavior: "creative",
      name: "Demo Scroll + Audio SFX",
      category: "creative",
      description:
        "Free-style creative direction with a muted 9:16 browser demo recording, background music, and a transition sound at every scene entry.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/creative/manifest.json",
      defaultBgMusic: "assets/news/music/sonican-tech-news-information.mp3",
      specDocPath: "docs/templates/creative/demo-scroll.md",
    },
  {
      id: "creative/article-video-demo",
      behavior: "creative",
      name: "Article Video Demo",
      category: "creative",
      description:
        "Free-style introduction followed by the complete video embedded in a required article URL, preserving source audio when available. Stops when the article has no usable video.",
      aspectRatio: "9:16",
      assetManifestPath: null,
      specDocPath: "docs/templates/creative/article-video-demo.md",
    },
  {
      id: "creative/source-led-light",
      behavior: "creative",
      name: "Source Led Light",
      category: "creative",
      description:
        "Light creative storytelling driven by article context and relevant source images or muted video excerpts, with per-scene free-style fallback and visible attribution.",
      aspectRatio: "9:16",
      assetManifestPath: null,
      specDocPath: "docs/templates/creative/source-led.md",
    },
  {
      id: "creative/source-led-dark",
      behavior: "creative",
      name: "Source Led Dark",
      category: "creative",
      description:
        "Dark creative storytelling driven by article context and relevant source images or muted video excerpts, with per-scene free-style fallback and visible attribution.",
      aspectRatio: "9:16",
      assetManifestPath: null,
      specDocPath: "docs/templates/creative/source-led.md",
    },
  {
      id: "creative/source-led-light-sfx",
      behavior: "creative",
      name: "Source Led Light + Audio SFX",
      category: "creative",
      description:
        "Light source-led creative storytelling with attributed article evidence, per-scene free-style fallback, background music, and transition SFX.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/creative/manifest.json",
      defaultBgMusic: "assets/news/music/sonican-tech-news-information.mp3",
      specDocPath: "docs/templates/creative/source-led.md",
    },
  {
      id: "creative/source-led-dark-sfx",
      behavior: "creative",
      name: "Source Led Dark + Audio SFX",
      category: "creative",
      description:
        "Dark source-led creative storytelling with attributed article evidence, per-scene free-style fallback, background music, and transition SFX.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/creative/manifest.json",
      defaultBgMusic: "assets/news/music/sonican-tech-news-information.mp3",
      specDocPath: "docs/templates/creative/source-led.md",
    },
  {
      id: "news/current-affairs-light",
      behavior: "fixed",
      name: "Current Affairs Light",
      category: "news",
      description:
        "Thời sự chính trị, kỷ nguyên mới, dân sinh, việc làm, giao thông. Nền giấy sáng, accent đỏ son và navy.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/news-ambient-01.mp3",
      specDocPath: "docs/templates/news/current-affairs-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/tech-dark",
      behavior: "fixed",
      name: "Tech News Dark",
      category: "news",
      description:
        "Tin tức công nghệ. Nền tối sâu, tiêu đề gradient cyan-xanh, đốm sáng góc, particle network.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/news-ambient-01.mp3",
      specDocPath: "docs/templates/news/tech-dark.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/tech-light",
      behavior: "fixed",
      name: "Tech News Light",
      category: "news",
      description:
        "Tin tức công nghệ. Nền trắng sạch, headline lớn đậm, accent đỏ, ảnh có ghi nguồn.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/news-ambient-01.mp3",
      specDocPath: "docs/templates/news/tech-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/current-affairs-dark",
      behavior: "fixed",
      name: "Current Affairs Dark",
      category: "news",
      description:
        "Thời sự nghiêm túc với nền tối briefing room, phù hợp chính sách, giao thông, biến động xã hội.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/news-ambient-01.mp3",
      specDocPath: "docs/templates/news/current-affairs-dark.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/real-estate-civic-light",
      behavior: "fixed",
      name: "Real Estate Civic Light",
      category: "news",
      description:
        "Bản tin bất động sản dân sinh/quy hoạch xã hội. Nền hồng phấn, headline nặng, timeline, quote và ảnh có nguồn.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/real-estate-civic-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/real-estate-civic-dark",
      behavior: "fixed",
      name: "Real Estate Civic Dark",
      category: "news",
      description:
        "Bản tin bất động sản dân sinh/quy hoạch xã hội. Nền đêm đô thị, accent vàng/cyan, ảnh mở dạng shutter và timeline sắc nét.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/real-estate-civic-dark.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/entertainment-magazine-light",
      behavior: "fixed",
      name: "Entertainment Magazine Light",
      category: "news",
      description:
        "Tin giải trí tone sáng kiểu tạp chí: âm nhạc, phim, nhân vật, sách, thời trang với ảnh nguồn, quote, timeline và ranking.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/entertainment-magazine-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/entertainment-premiere-dark",
      behavior: "fixed",
      name: "Entertainment Premiere Dark",
      category: "news",
      description:
        "Tin giải trí tone tối kiểu premiere/sân khấu, không top bar: phim, nhạc, nhân vật, awards với poster, quote, timeline và ranking.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/news-ambient-01.mp3",
      specDocPath: "docs/templates/news/entertainment-premiere-dark.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/sports-arena-dark",
      behavior: "fixed",
      name: "Sports Arena Dark",
      category: "news",
      description:
        "Tin thể thao tone tối kiểu sân vận động: scoreboard, ảnh/video nguồn, tỉ số, timeline, stat board, quote và lịch đấu.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/sonican-flash-news.mp3",
      specDocPath: "docs/templates/news/sports-arena-dark.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/sports-briefing-light",
      behavior: "fixed",
      name: "Sports Briefing Light",
      category: "news",
      description:
        "Tin thể thao tone sáng, ổn định: nền giấy editorial, scoreboard sạch, ảnh/video nguồn, stat board, timeline và quote.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/sports-briefing-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/health-briefing-light",
      behavior: "fixed",
      name: "Health Briefing Light",
      category: "news",
      description:
        "Tin tức sức khoẻ sáng, sạch, source-led: ảnh/video nguồn, số liệu, khuyến cáo, triệu chứng và timeline y tế.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/health-briefing-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/health-public-alert",
      behavior: "fixed",
      name: "Health Public Alert",
      category: "news",
      description:
        "Cảnh báo sức khoẻ dạng bulletin: mức độ rủi ro, nhóm ảnh hưởng, checklist triệu chứng, hành động nên/không nên làm.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/news-ambient-01.mp3",
      specDocPath: "docs/templates/news/health-public-alert.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/business-terminal-dark",
      behavior: "fixed",
      name: "Business Terminal Dark",
      category: "news",
      description:
        "Bản tin kinh doanh/tài chính tone tối kiểu market terminal: ticker, số liệu lớn, biểu đồ, rủi ro và triển vọng.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/news-ambient-01.mp3",
      specDocPath: "docs/templates/news/business-terminal-dark.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/business-ledger-light",
      behavior: "fixed",
      name: "Business Ledger Light",
      category: "news",
      description:
        "Bản tin kinh doanh/tài chính tone sáng kiểu financial newspaper: giấy ngà, ledger table, serif headline, chỉ số và memo kinh tế.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/business-ledger-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/travel-postcard-light",
      behavior: "fixed",
      name: "Travel Postcard Light",
      category: "news",
      description:
        "Bản tin du lịch sáng kiểu tạp chí postcard: ảnh nguồn, tem địa điểm, route strip, boarding-pass fact và lưu ý địa phương.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/travel-postcard-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/travel-guide-light",
      behavior: "fixed",
      name: "Travel Guide Light",
      category: "news",
      description:
        "Bản tin hướng dẫn du lịch sáng, thực dụng: chi phí, lịch trình, checklist, mùa đi và nên/không nên.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/miromaxmusic-music-promotion.mp3",
      specDocPath: "docs/templates/news/travel-guide-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/auto-showroom-dark",
      behavior: "fixed",
      name: "Auto Showroom Dark",
      category: "news",
      description:
        "Bản tin xe tone tối kiểu showroom/road test: ánh đèn, spec cards, gauge, compare board, recall và road-ahead checklist.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/sonican-flash-news.mp3",
      specDocPath: "docs/templates/news/auto-showroom-dark.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/auto-market-light",
      behavior: "fixed",
      name: "Auto Market Light",
      category: "news",
      description:
        "Bản tin thị trường xe tone sáng: ra mắt, khai tử, xu hướng xe điện, giá bán, chính sách, vòng đời mẫu xe và hành vi người mua.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/auto-market-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/education-briefing-light",
      behavior: "fixed",
      name: "Education Briefing Light",
      category: "news",
      description:
        "Bản tin giáo dục sáng, không top bar: tuyển sinh, du học, đổi mới, chân dung, deadline, checklist và dữ liệu học thuật.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/education-briefing-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "news/education-campus-light",
      behavior: "fixed",
      name: "Education Campus Light",
      category: "news",
      description:
        "Bản tin giáo dục sáng kiểu campus bulletin: nền sky, vertical rail, notebook cards, coral deadline và mint insight.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/miromaxmusic-music-promotion.mp3",
      specDocPath: "docs/templates/news/education-campus-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },

  {
      id: "news/beauty-editorial-light",
      behavior: "fixed",
      name: "Beauty Editorial Light",
      category: "news",
      description: "Bản tin làm đẹp và thẩm mỹ kiểu tạp chí cao cấp: nền kem phấn, serif thanh lịch, rose accent, media có nguồn và block thông tin an toàn.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/beauty-editorial-light.md",
      voice: {
        elevenLabsVoiceId: "A5w1fw5x0uXded1LDvZp",
        geminiVoice: "Erinome",
      },
    },

  {
      id: "news/beauty-luxury-noir",
      behavior: "fixed",
      name: "Beauty Luxury Noir",
      category: "news",
      description: "Chia sẻ thông tin, kiến thức beauty phong cách luxury noir: nền espresso-plum, champagne gold, silk curves, ảnh vòm và glass card mỹ phẩm cao cấp.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/beauty-luxury-noir.md",
      voice: {
        elevenLabsVoiceId: "A5w1fw5x0uXded1LDvZp",
        geminiVoice: "Erinome",
      },
    },

  {
      id: "news/media-showcase",
      behavior: "fixed",
      name: "News Media Showcase",
      category: "news",
      description: "Bản tin trình chiếu ảnh và video từ URL nguồn trong khung đỏ-trắng, kèm ngày đăng, tiêu đề và attribution.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/media-showcase.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
        speed: 1.1,
      },
    },

  {
      id: "news/long-explainer",
      behavior: "fixed",
      name: "News Long Explainer",
      category: "news",
      description: "Video giải thích dài 16:9 (8–12 phút) chia chương, nhiều nguồn: đổi hình 3–6s giữa ảnh chụp bài báo có highlight, số liệu động, chữ động, collage ảnh và trích dẫn; phụ đề SRT, mốc chương YouTube.",
      aspectRatio: "16:9",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/long-explainer.md",
      voice: {
        vieneuVoice: "Thùy Dung",
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
        speed: 1.0,
      },
    },

  {
      id: "news/modern-news-canvas",
      behavior: "fixed",
      name: "Modern News Canvas",
      category: "news",
      description: "Bản tin editorial nền sáng với khung media nguồn chiếm ưu thế, metadata gọn và điểm nhấn cam hiện đại.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/modern-news-canvas.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },

  {
      id: "news/real-estate-plex-light",
      behavior: "fixed",
      name: "Real Estate Plex Light",
      category: "news",
      description: "Bản tin bất động sản sáng, tối giản bằng IBM Plex Sans: nền grid trắng-xanh, headline lớn, ảnh báo, bảng trạng thái và subtitle đáy.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/news/manifest.json",
      defaultBgMusic: "assets/news/music/nastelbom-soft-music.mp3",
      specDocPath: "docs/templates/news/real-estate-plex-light.md",
      voice: {
        elevenLabsVoiceId: "K7ewtjKRNtwwt3lKQ6M0",
        geminiVoice: "Achird",
      },
    },
  {
      id: "commerce/storytelling-showcase",
      behavior: "fixed",
      name: "TikTok Shop Storytelling Showcase",
      category: "commerce",
      description:
        "Video quảng cáo sản phẩm TikTok Shop tinh tế theo phong cách kể chuyện (Soft-selling), mở đầu bằng Hook giữ chân, trình diễn sản phẩm và kêu gọi mua hàng khéo léo.",
      aspectRatio: "9:16",
      assetManifestPath: "public/assets/commerce/manifest.json",
      defaultBgMusic: "assets/news/music/miromaxmusic-music-promotion.mp3",
      specDocPath: "docs/templates/commerce/storytelling-showcase.md",
      voice: {
        elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
        geminiVoice: "Aoede",
        speed: 1.15,
      },
    },
];

/** Look up a template entry by ID. Returns undefined if not found. */
export function getTemplate(id: string): TemplateRegistryEntry | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

/** Return the configured default background music for a template. */
export function getTemplateDefaultBgMusic(id: string): string | null {
  return getTemplate(id)?.defaultBgMusic ?? null;
}

/** List all available template IDs */
export function listTemplateIds(): string[] {
  return TEMPLATE_REGISTRY.map((t) => t.id);
}
