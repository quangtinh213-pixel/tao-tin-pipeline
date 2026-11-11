# SCRIPT_RULES

Base rules for writing `plan.json` (Planner) and `script/script.json`
(Teller). These rules govern narration content and structure only; they do not
change the JSON schemas defined in `docs/gen-video/common-pipeline.md`.

## 0. How to read this folder

- Always read `START_HERE.md` first.
- This file is the base rule. It overrides every pattern or style file.
- Read `SCRIPT_PATTERNS.md` to choose the narrative arc for the segments.
- Read `STYLE_INDEX.md` only if a specific voice/persona is needed, then open
  exactly one style file.
- A style file may never override a rule in this file.

## 1. Job to be done

- Rewrite the source topic so a Vietnamese viewer understands fast, stays
  hooked, and watches to the end.
- The narration must sound like someone telling the story out loud, not
  someone reading notes.
- Do not cram every fact from the source into the script. Anyone who wants
  depth can read the source article themselves.
- When the context is a news article, thread, or source page: write directly
  about the actual subject. The source is evidence for the story, not an
  excuse to open with "bài báo này nói" or "theo nguồn tin".
- Never narrate production internals: fetching media, template IDs, JSON
  fields, scene/segment structure, subtitles, voice provider, or how the
  pipeline works. Those stay in `plan.json`/internal artifacts, never in
  spoken `text`.

## 2. Hook (`plan.json.hook`, rendered as the first `script.json` entry)

- The opening line must make clear what is changing or why the viewer should
  keep watching.
- Prefer short, immediately clear sentences over wordplay.
- A good hook is understood within one breath.
- The hook carries exactly one idea. Do not use it to explain mechanism,
  long background, or every piece of evidence at once.
- Target length is about 12-26 words (news: **at most 22 words**, enforced by
  `scripts/script-rules.mjs`; the viewer decides to swipe or stay in the first
  seconds). A template may set a stricter limit. If it needs more than 2
  numbers, 2 subordinate clauses, or several commas, move the proof to the
  next segment.
- No greeting, no channel intro, no scene-setting before the hook. The most
  striking verified detail comes first.
- Formula: **main subject + what's new/surprising + why it matters now**.
- Avoid meta-framing openers: "video này nói", "bài này nói về", "hôm nay mình
  sẽ", "dành cho ai chưa biết", or restating the source before the actual
  story.
- Do not restate the video title (the article headline / `spec.video.title`).
  The viewer has already read it on screen. The title says WHAT happened; the
  hook says WHY to keep watching: open on the strangest concrete detail, the
  sharpest image, or the consequence the title leaves out.
  - Title: "Hà Nội: Khởi tố người phụ nữ ném mắm tôm vào chủ tiệm bánh ngọt"
  - Bad hook: "Hành vi ném mắm tôm vào chủ tiệm bánh ngọt vừa khiến một phụ nữ
    bị khởi tố."
  - Good hook: "Chỉ vì một buổi livestream, người phụ nữ này giờ đang bị tạm
    giam."
- Keep dates, agency names and legal articles out of the first ~5 seconds;
  they belong in Segment 1. Never open with "Vào ngày...", "Mới đây...",
  "Theo [báo]..." or a place/agency name before the action.
- A question hook is allowed when the source answers it within the video:
  "Vì sao 118 người lại chọn đúng khách sạn này làm sào huyệt lừa đảo?". Never
  ask a question the video cannot answer.
- Economic, business or policy stories: hook on the consequence for an
  ordinary viewer (wallet, daily life, risk), not on the company or agency
  announcement. Bad: "Doanh nghiệp X báo lãi kỷ lục quý 3." Good: "Mỗi ngày
  doanh nghiệp này lãi hơn 10 tỷ đồng, phần lớn đến từ một mặt hàng ai cũng
  mua." Every number and claim must still come from the source; vague teasers
  like "điều không ai ngờ tới" are not allowed.

### 2.1 News hook rules from VN News Analytics (10/2026)

Measured on 96 Shorts with 100+ views: hooks that broke these rules held a
median ~45% average view percentage versus ~52% for the rest; videos that
broke out (1,500+ views) held ~73%. `node scripts/script-rules.mjs` enforces
rules 1-4 after Teller; rules 5-6 are judged by the writer.

1. **Never reveal the outcome.** Banned in the hook: "may mắn", "kịp thời",
   "không (có) thương vong", "không thiệt hại", "thoát nạn", "đã được cứu",
   "cứu thành công", "đã an toàn", "bình an vô sự". The rescue/survival/result
   is the payoff and belongs in the last body segment or `ending`.
   - Bad (29%): "Chỉ trong một buổi chiều ở Nghệ An, hai vụ cháy xảy ra cách
     nhau gần 3 giờ, may mắn không có thương vong."
   - Better: "Hai đám cháy bùng lên cùng một buổi chiều ở Nghệ An, cách nhau
     chưa đầy 3 giờ."
2. **No hype label before a colon.** No "Cảnh báo y tế khẩn:", "Bước đi đột
   phá:", "Tin nóng 24 giờ qua:". Say the fact itself.
3. **No agency, date, "Mới đây" or "Theo..." opener.** Put the person, the
   number or the action first; the agency goes to Segment 1. A place opener
   ("Tại Cà Mau, ...") is allowed.
4. **At most 22 words.**
5. **Carry one surprising or contradictory detail.** The best hooks held
   99-140% because of one strange concrete detail, not because of the event
   type:
   - "Trộm chiếc Rolex hơn 1,4 tỉ đồng của bạn cùng nhà, một thanh niên vẫn
     thản nhiên cùng nạn nhân đi kiểm tra camera." (irony)
   - "118 người thuộc nhiều quốc tịch thuê trọn một khách sạn để vận hành
     đường dây lừa đảo." (scale)
   - "Một bộ hài cốt liệt sĩ vừa được phát hiện ngay trong khu vườn của một
     hộ dân." (unexpected place)
6. **Announcements and follow-ups need a viewer stake.**
   - Business/policy announcements (worst performers, 22-30%) hook on what
     changes for the viewer, never "X vừa thông báo/công bố/thông qua...".
   - Follow-up stories ("Thêm năm người vừa bị bắt...", 31%) restate the
     original shocking fact in the hook; the viewer has not seen the earlier
     video.

## 3. Sentence rhythm

- Each sentence carries exactly one idea.
- Mix short and medium sentences; avoid 4-5 sentences of identical length in a
  row, which reads like notes.
- Mentally read every sentence aloud. Rewrite anything that trips when spoken.
- If a sentence only works on paper but not spoken, cut it.
- Do not use the em dash `—` anywhere in `text` fields. Use commas, colons, or
  split into separate sentences so TTS reads naturally.

## 4. One segment, one main idea

- Each `body` segment in `plan.json` keeps exactly one central idea.
- Later sentences in that segment only clarify, exemplify, or state the
  consequence of that idea.
- If a segment needs to explain too much, split it into another segment
  (still within the 3-6 body segment budget from the common Planner
  contract).
- Do not over-pack a segment. More facts per segment lowers what the viewer
  retains.

## 5. Voice and tone

- Write like natural spoken Vietnamese, not like reading an analysis report.
- Natural connective words (`ngặt nỗi`, `cơ mà`, `nghĩa là`, `thành ra`) are
  fine when they fit the context.
- Avoid textbook-style openers: "Tức là", "Nó là", "Một bình luận nói rất
  đúng".
- Vietnamese is the default. Keep English only for names and terms that are
  genuinely hard to translate.

## 6. Vocabulary

- Vietnamese is the default language for every `text` field.
- Keep English only for proper nouns and hard-to-replace terms: `AI`,
  `agent`, brand names, product names.
- Prefer Vietnamese equivalents for common loanwords (`viral`, `engagement`,
  `follower`, `like`) when the meaning survives.
- Never let internal/draft markers leak into narration. Convert internal
  shorthand into natural spoken phrasing such as "điểm cần lưu ý", "giới
  hạn", "mặt trái", "tóm lại", or "chốt lại".
- If a more colloquial phrasing keeps the same meaning, choose it.

## 7. Structure for retention

- Prefer `vấn đề -> vì sao quan trọng -> cách hiểu/ứng dụng đúng` across the
  body segments.
- The hook opens.
- The first body segment should surface proof, a concrete fact, or the first
  strong visual beat quickly. If the hook promises evidence, the first body
  segment must deliver it, not delay it.
- Middle body segments carry mechanism, examples, figures, caveats, or
  practical application.
- For news (20-35 seconds), give the viewer a reason to stay to the last
  second: the hook opens a concrete question or tension, the first body
  segment gives enough to stay credible, and the real payoff (the outcome, the
  twist, the number that explains it, the verdict or next step) lands in the
  last body segment or the start of `ending`. Do not spend the answer in the
  hook. The payoff must come from the source; never tease a reveal the source
  does not contain.
- `ending` closes with a takeaway, a caution, or a perspective worth
  remembering. Never close on an empty slogan.
- For news videos, the **last sentence of `ending` is one open opinion
  question** that invites a comment, tied to the concrete story: "Bạn nghĩ mức
  phạt này đã đủ sức răn đe chưa?", "Theo bạn, nhà trường cần thay đổi gì sau
  vụ việc này?". Rules: no "like/đăng ký/theo dõi kênh" lines; no question that
  presumes guilt before a verdict, mocks a victim, or invites hate toward a
  person or group; for deaths or child victims ask about prevention or safety,
  not blame.

## 8. Rules for short-form social content

- Do not optimize only for "like"; prioritize content that earns a real
  reaction and gives a stranger a reason to keep watching this channel.
- If a rhetorical question is used, it must open real thought or a real
  experience, not a one-word bait question.
- Give the viewer a payoff for watching to the end: a new idea, a sharp
  example, or a memorable perspective.
- Keep tone and topic focus consistent enough that a returning viewer
  recognizes the channel's voice.
- Avoid bait-and-switch, topic drift, or writing that reads like generic AI
  output.

## 9. How to borrow from a style file correctly

- Borrow rhythm, tone color, sharpness, softness, and how it closes.
- Do not copy CTA wording, niche slang, or post structure if the context does
  not fit.
- If the topic is a tech explainer but the style source is finance/community
  slang, borrow only the sharpness and rhythm, not the slang itself.

## 10. Checklist before finalizing `plan.json` / `script.json`

- Is the hook immediately clear?
- Does every body segment carry exactly one main idea?
- Does every sentence read smoothly out loud?
- Does any sentence sound like an AI summary?
- Any leftover `—` in any `text` field?
- Any segment overloaded with English?
- Any sentence leaking production/internal detail (source folder, template
  ID, JSON fields, scene/segment mechanics, subtitle logic, voice provider)?
- Is the chosen style serving the content, or overpowering it?
- Does total narration still fit the target from the common Planner/Teller
  contract (20-35 seconds for `news/*`, about 75-125 words, never over 140)?
- Does the hook avoid opening with a date, "Mới đây" or an agency name, and
  is it at most 22 words?
- News: does `node scripts/script-rules.mjs videos/<slug>/script/script.json`
  pass, and does the hook carry one surprising detail without revealing the
  outcome (§2.1)?
- News: is the payoff held until the last body segment or the ending, rather
  than spent in the hook or the middle?
- News: does `ending` close with one open opinion question that follows the
  §7 rules?
