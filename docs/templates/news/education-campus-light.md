# news/education-campus-light

Fixed template for Vietnamese education news videos with a different visual
system from `news/education-briefing-light`. It is bright, campus-like, and
notebook-inspired, with a left vertical section rail, sky background, white
paper sheets, coral deadline accents, and mint/blue insight accents.

## Input Contract

Use only facts, images, dates, quotes, scores, tuition figures, deadlines,
school names, country names, and attribution found in the user-provided context
or public article. Do not fabricate media URLs, source credits, policy details,
fees, deadlines, rankings, names, or achievements.

Prefer this template when the story needs a more youthful, campus-bulletin feel:

- admissions, exams, benchmark scores, and enrollment guidance;
- study abroad, scholarship, visa, or application checklists;
- school innovation, digital classrooms, edtech, and curriculum change;
- portraits of teachers, students, alumni, schools, or programs.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Bright sky-blue background with notebook ruled lines.
- A left vertical rail identifies the section; do not use a top bar.
- Main content appears on white paper sheets/postcards.
- Palette: indigo text, blue information, coral deadlines/urgency, mint
  positive outcomes, yellow highlights.
- Rounded rectangles use 8px radius.
- Typography uses `Be Vietnam Pro`.
- Media appears as a slightly rotated postcard with source credit underneath.

## Step 6 Output

Write `videos/<slug>/spec.json` as:

```ts
interface EducationCampusLightSpec {
  templateId: "news/education-campus-light";
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
    type: "educationCampusLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    campus: {
      variant: "opening" | "deadline" | "timeline" | "stats" | "checklist" | "profile" | "quote" | "media" | "closing";
      topic?: "admissions" | "study-abroad" | "policy" | "innovation" | "profile" | "school-life" | "exam" | "scholarship" | "other";
      tone?: "neutral" | "urgent" | "positive" | "warning";
      section: string;
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
`"assets/news/music/miromaxmusic-music-promotion.mp3"`.

## Scene Guidance

Use 6-9 scenes for a typical 45-75 second video.

- `opening`: key education issue with a campus-bulletin framing.
- `deadline`: application deadlines, exam dates, tuition windows, scholarship
  cutoffs.
- `timeline`: process from registration to result, application to visa, or
  policy rollout.
- `stats`: key figures, scores, tuition, scholarship values, program scale.
- `checklist`: action steps for students, parents, schools, or applicants.
- `profile`: person/program/institution portrait.
- `quote`: official or expert quote with context.
- `media`: image/video evidence from the source article.
- `closing`: useful takeaway and CTA.

Rules:

- `section` should be short, such as `Admissions`, `Study Abroad`, `Policy`,
  `Scholarship`, or `Campus`.
- Keep `video.title` at most 8 Vietnamese words.
- Use manual `\n` line breaks for big headlines.
- Put highlighted words in `accentWords`.
- Keep body fields under about 140 Vietnamese characters each.
- Every media item must include a real compatible URL/path and `credit`.
- Do not use `.gif` or fabricated media.
