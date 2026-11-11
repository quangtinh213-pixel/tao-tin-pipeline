# news/education-briefing-light

Fixed template for Vietnamese education news videos. It is designed for
admissions, exams, study abroad, scholarships, education policy, school
innovation, teacher/student portraits, and practical guidance for students or
parents.

## Input Contract

Use only facts, images, dates, quotes, scores, tuition figures, deadlines,
school names, country names, and attribution found in the user-provided context
or public article. Do not fabricate media URLs, source credits, policy details,
fees, deadlines, rankings, names, or achievements.

Prefer this template when the story is about:

- admissions, exam rules, benchmark scores, tuition, or enrollment deadlines;
- study abroad, visa/scholarship/application guidance;
- education policy, curriculum reform, school innovation, digital learning;
- student, teacher, founder, school, or alumni profiles;
- practical explainers for learners and parents.

Do not use it for general politics unless the education impact is the main
story.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- No top bar, no persistent header strip, and no top accent band.
- Warm off-white paper background with subtle academic grid and quiet corner
  marks.
- Palette: navy for authority, green/teal for learning, gold highlight for
  deadlines and important terms, coral only for urgent warnings.
- Rounded rectangles are restrained at 8px radius.
- Typography uses `Be Vietnam Pro` for Vietnamese-safe educational clarity.
- Source media appears inside a clean evidence card with `Ảnh: <credit>`.
- Voice subtitles sit near the bottom; active spoken words turn navy.

## Motion

Use calm academic briefing motion:

- meta label fades/slides first;
- eyebrow, headline lines, body, cards, and media stagger upward;
- media gently zooms while staying inside the evidence frame;
- cards enter with short, readable motion;
- avoid playful school graphics, bouncing stickers, aggressive breaking-news
  transitions, or decorative top bars.

## Step 6 Output

Write `videos/<slug>/spec.json` as:

```ts
interface EducationBriefingLightSpec {
  templateId: "news/education-briefing-light";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: "admissions" | "study-abroad" | "policy" | "innovation" | "profile" | "school-life" | "exam" | "scholarship" | "other";
  };
  scenes: Array<{
    type: "educationBriefingLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    education: {
      variant: "opening" | "deadline" | "timeline" | "stats" | "checklist" | "profile" | "quote" | "media" | "closing";
      topic?: "admissions" | "study-abroad" | "policy" | "innovation" | "profile" | "school-life" | "exam" | "scholarship" | "other";
      tone?: "neutral" | "urgent" | "positive" | "warning";
      meta: string;
      eyebrow?: string;
      headline: string;
      accentWords?: string[];
      body?: string;
      body2?: string;
      media?: {
        src: string;
        storage?: "local" | "remote";
        credit: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
        mediaType?: "ẢNH" | "VIDEO" | "INFOGRAPHIC";
      };
      mediaHeight?: number;
      metrics?: Array<{ label: string; value: string; unit?: string; note?: string; tone?: "neutral" | "urgent" | "positive" | "warning" }>;
      timeline?: Array<{ time: string; label: string; detail?: string }>;
      checklist?: Array<{ label?: string; text: string; tone?: "neutral" | "urgent" | "positive" | "warning" }>;
      profile?: { name: string; role?: string; institution?: string; achievement?: string };
      quote?: { text: string; source: string; context?: string };
      tags?: string[];
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

For omitted `--audio`, set `video.bgMusic` to
`"assets/news/music/nastelbom-soft-music.mp3"`.

## Scene Guidance

Use 6-9 scenes for a typical 45-75 second video.

- `opening`: main fact and framing. Use an article image when available.
- `deadline`: one or more key dates, fees, exam dates, enrollment windows, or
  scholarship deadlines. Put key numbers in `metrics`.
- `timeline`: application/exam/policy rollout steps.
- `stats`: enrollment numbers, scores, scholarship values, school counts, or
  survey figures.
- `checklist`: practical steps for students, parents, schools, or applicants.
- `profile`: person or institution portrait.
- `quote`: official quote, expert quote, student/teacher quote, or article
  statement.
- `media`: evidence-led scene around a school, classroom, campus, chart, or
  infographic.
- `closing`: final takeaway and CTA.

Headline rules:

- Use manual line breaks in `headline` with `\n` for big openings.
- Put exact highlighted terms into `accentWords`.
- Keep headline lines short; avoid dense paragraphs inside headlines.
- Do not use sensational phrasing for students, schools, or public policy.

Body rules:

- Keep `body` and `body2` under about 140 Vietnamese characters each.
- Use `body` for context near the headline.
- Use `body2` for an extra note under cards/media.
- Do not duplicate subtitles in scene text.

Media rules:

- Use only public `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, or `.mov` URLs
  from the actual article or source context.
- Never use `.gif`.
- Every media item must include `credit`.
- If no reliable media exists, omit `media`.

Checklist before submitting:

- [ ] `templateId` is `"news/education-briefing-light"`.
- [ ] No scene requires or assumes a top bar.
- [ ] `video.title` is at most 8 Vietnamese words.
- [ ] Every scene has `type`, `startFrame`, `durationFrames`, and `audioSegment`.
- [ ] Every media URL is real, compatible, and credited.
- [ ] `totalFrames` equals the last scene's `startFrame + durationFrames`.
