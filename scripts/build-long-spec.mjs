import fs from 'node:fs';
import path from 'node:path';

const slug = '2026-11-09-quoc-hoi-chot-80400-ti-cai-cach-tien-luong-2027';
const timing = JSON.parse(fs.readFileSync(`videos/${slug}/scene-timing.json`, 'utf8'));
const shots = JSON.parse(fs.readFileSync(`public/${slug}/evidence-shots/shots.json`, 'utf8'));

// Prepare evidence shots with labels
const evidenceShots = shots.map((s) => {
  let label = 'Tuổi Trẻ Online · 9/11/2026';
  if (s.url.includes('dantri')) label = 'Dân Trí · 9/11/2026';
  if (s.url.includes('znews')) label = 'ZNews · 9/11/2026';
  return { ...s, label };
});

// Prepare media assets
const mediaAssets = [
  {
    id: 's1-image-02',
    kind: 'image',
    src: '2026-11-09-quoc-hoi-chot-80400-ti-cai-cach-tien-luong-2027/evidence/image-02.jpg',
    credit: 'Ảnh: QUỐC HỘI · Tuổi Trẻ',
    width: 730,
    height: 487,
    storage: 'local',
  },
  {
    id: 's1-image-04',
    kind: 'image',
    src: '2026-11-09-quoc-hoi-chot-80400-ti-cai-cach-tien-luong-2027/evidence/image-04.jpg',
    credit: 'Ảnh: QUỐC HỘI · Tuổi Trẻ',
    width: 730,
    height: 487,
    storage: 'local',
  },
  {
    id: 's1-image-06',
    kind: 'image',
    src: '2026-11-09-quoc-hoi-chot-80400-ti-cai-cach-tien-luong-2027/evidence/image-06.jpg',
    credit: 'Ảnh: QUỐC HỘI · Tuổi Trẻ',
    width: 730,
    height: 487,
    storage: 'local',
  },
  {
    id: 's2-image-01',
    kind: 'image',
    src: '2026-11-09-quoc-hoi-chot-80400-ti-cai-cach-tien-luong-2027-src2/evidence/image-01.jpg',
    credit: 'Ảnh: Minh Châu · Dân Trí',
    width: 1020,
    height: 680,
    storage: 'local',
  },
];

// Split any long beat (> 210 frames, ~7s) so no beat exceeds 7-8s
let rawBeats = timing.beats;
let splitBeats = [];
for (let b of rawBeats) {
  if (b.startFrame < 900) {
    // In the first 30s (frames 0-900), split beats to 50-70 frames (1.6 - 2.3s) for snappy hook pacing
    let curStart = b.startFrame;
    const pieces = Math.ceil(b.durationFrames / 65);
    const pieceFrames = Math.floor(b.durationFrames / pieces);
    for (let p = 0; p < pieces; p++) {
      const dur = p === pieces - 1 ? (b.startFrame + b.durationFrames - curStart) : pieceFrames;
      splitBeats.push({
        startFrame: curStart,
        durationFrames: dur,
        chapterIndex: b.chapterIndex,
        text: b.text,
      });
      curStart += dur;
    }
  } else if (b.durationFrames > 220) {
    const half = Math.floor(b.durationFrames / 2);
    splitBeats.push({
      startFrame: b.startFrame,
      durationFrames: half,
      chapterIndex: b.chapterIndex,
      text: b.text,
    });
    splitBeats.push({
      startFrame: b.startFrame + half,
      durationFrames: b.durationFrames - half,
      chapterIndex: b.chapterIndex,
      text: b.text,
    });
  } else {
    splitBeats.push({ ...b });
  }
}

// Ensure beats tile 0..totalFrames
let expectedFrame = 0;
splitBeats.forEach((b) => {
  b.startFrame = expectedFrame;
  expectedFrame += b.durationFrames;
});
if (splitBeats.length) {
  splitBeats[splitBeats.length - 1].durationFrames = timing.totalFrames - splitBeats[splitBeats.length - 1].startFrame;
}

// Content-aware visual mapper
const evList = ['ev-01', 'ev-02', 'ev-03', 'ev-04', 'ev-05', 'ev-06', 'ev-08', 'ev-09', 'ev-10'];
let evIdx = 0;

function getEvidenceForText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('4.073') || lower.includes('4 triệu')) return 'ev-02';
  if (lower.includes('80.400') || lower.includes('khoản chi cải cách')) return 'ev-03';
  if (lower.includes('nguồn tích lũy') || lower.includes('lương hưu') || lower.includes('điều 4')) return 'ev-04';
  if (lower.includes('tiết kiệm') || lower.includes('khâu phân bổ')) return 'ev-05';
  if (lower.includes('9,1%') || lower.includes('9.1') || lower.includes('tăng thu')) return 'ev-06';
  if (lower.includes('3.334') || lower.includes('tổng thu')) return 'ev-08';
  if (lower.includes('739.597') || lower.includes('bội chi')) return 'ev-09';
  if (lower.includes('mở rộng phạm vi')) return 'ev-10';
  const id = evList[evIdx % evList.length];
  evIdx++;
  return id;
}

function getDataGraphicForText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('80.400') || lower.includes('80400') || lower.includes('80 .400')) {
    return { kind: 'bigNumber', value: 80400, unit: 'tỉ đồng', label: 'Chi cải cách tiền lương', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('4.073') || lower.includes('4 triệu') || lower.includes('073.935')) {
    return { kind: 'bigNumber', value: 4073935, unit: 'tỉ đồng', label: 'Tổng chi ngân sách 2027', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('2.061') || lower.includes('2 triệu') || lower.includes('thường xuyên')) {
    return { kind: 'bigNumber', value: 2061313, unit: 'tỉ đồng', label: 'Chi thường xuyên 2027', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('3.334') || lower.includes('334.338') || lower.includes('tổng thu')) {
    return { kind: 'bigNumber', value: 3334338, unit: 'tỉ đồng', label: 'Dự toán thu ngân sách', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('739') || lower.includes('bội chi')) {
    return { kind: 'bigNumber', value: 739597, unit: 'tỉ đồng', label: 'Bội chi ngân sách nhà nước', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('1.279') || lower.includes('tổng mức vay') || lower.includes('vay')) {
    return { kind: 'bigNumber', value: 1279717, unit: 'tỉ đồng', label: 'Tổng mức vay năm 2027', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('9,1') || lower.includes('9.1')) {
    return { kind: 'bigNumber', value: 9.1, unit: '%', label: 'Mục tiêu tăng thu ngân sách', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('10%') || lower.includes('10 %')) {
    return { kind: 'bigNumber', value: 10, unit: '%', label: 'Tiết kiệm chi thường xuyên', source: 'Tuổi Trẻ' };
  }
  if (lower.includes('5%') || lower.includes('5 %')) {
    return { kind: 'bigNumber', value: 5, unit: '%', label: 'Tiết kiệm chi đầu tư công', source: 'Tuổi Trẻ' };
  }
  return { kind: 'bigNumber', value: 80400, unit: 'tỉ đồng', label: 'Ngân sách cải cách lương', source: 'Tuổi Trẻ' };
}

function getKineticForText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('lương hưu') || lower.includes('hưu trí')) return { text: 'Điều chỉnh lương hưu', highlight: 'lương hưu', icon: 'HeartHandshake' };
  if (lower.includes('bảo hiểm') || lower.includes('trợ cấp')) return { text: 'Trợ cấp bảo hiểm xã hội', highlight: 'bảo hiểm', icon: 'ShieldCheck' };
  if (lower.includes('người có công')) return { text: 'Ưu đãi người có công', highlight: 'người có công', icon: 'Award' };
  if (lower.includes('tinh giản')) return { text: 'Nguồn lực tinh giản biên chế', highlight: 'biên chế', icon: 'Users' };
  if (lower.includes('kỷ luật') || lower.includes('nghiêm ngặt')) return { text: 'Kỷ luật tài chính nghiêm ngặt', highlight: 'kỷ luật', icon: 'Scale' };
  if (lower.includes('loại trừ') || lower.includes('tiền đất')) return { text: 'Kiểm soát chặt nguồn thu', highlight: 'nguồn thu', icon: 'Lock' };
  if (lower.includes('hoàn trả')) return { text: 'Hoàn trả quỹ tích lũy', highlight: 'hoàn trả', icon: 'RefreshCw' };
  if (lower.includes('công chức') || lower.includes('viên chức')) return { text: 'Bảo đảm thu nhập công chức', highlight: 'công chức', icon: 'Briefcase' };
  if (lower.includes('giáo viên') || lower.includes('y tế')) return { text: 'Ưu tiên giáo viên, y tế', highlight: 'y tế', icon: 'HeartPulse' };
  if (lower.includes('thất thu') || lower.includes('thương mại điện tử')) return { text: 'Chống thất thu thuế số', highlight: 'thuế', icon: 'TrendingUp' };
  if (lower.includes('bình ổn') || lower.includes('giá cả')) return { text: 'Kiểm soát lạm phát, giá cả', highlight: 'giá cả', icon: 'CircleDollarSign' };
  if (lower.includes('27') && lower.includes('7')) return { text: 'Nghỉ lễ 27/7 hưởng nguyên lương', highlight: '27/7', icon: 'Calendar' };
  return { text: 'Chốt 80.400 tỷ đồng lương 2027', highlight: '80.400 tỷ', icon: 'Banknote' };
}

function getCollageForText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('hoàng thanh tùng') || lower.includes('bộ trưởng bộ tư pháp')) {
    return { photos: [{ assetId: 's1-image-06' }], kicker: 'Bộ trưởng Hoàng Thanh Tùng' };
  }
  if (lower.includes('đại biểu') || lower.includes('biểu quyết')) {
    return { photos: [{ assetId: 's1-image-04' }], kicker: 'Đại biểu Quốc hội' };
  }
  if (lower.includes('dân trí') || lower.includes('chiều 9/11')) {
    return { photos: [{ assetId: 's2-image-01' }], kicker: 'Kỳ họp Quốc hội' };
  }
  return { photos: [{ assetId: 's1-image-02' }], kicker: 'Quốc hội khóa XVI' };
}

// Assign visuals with strict alternation: never 3 identical in a row
const finalBeats = [];
for (let i = 0; i < splitBeats.length; i++) {
  const b = splitBeats[i];
  const lower = b.text.toLowerCase();

  let vType = 'kinetic';
  if (i === 0) {
    b.visual = { type: 'evidence', shotId: 'hd-1' };
    finalBeats.push(b);
    continue;
  }
  if (i === 1) {
    b.visual = { type: 'data', graphic: { kind: 'bigNumber', value: 80400, unit: 'tỉ đồng', label: 'Chi cải cách tiền lương', source: 'Tuổi Trẻ' } };
    finalBeats.push(b);
    continue;
  }
  if (i === 2) {
    b.visual = { type: 'evidence', shotId: 'hd-2' };
    finalBeats.push(b);
    continue;
  }
  if (i === 3) {
    b.visual = { type: 'kinetic', text: 'Túi tiền ai sẽ thay đổi?', highlight: 'thay đổi', icon: 'HelpCircle' };
    finalBeats.push(b);
    continue;
  }
  if (i === 4) {
    b.visual = { type: 'evidence', shotId: 'hd-3' };
    finalBeats.push(b);
    continue;
  }

  // Determine ideal type from content
  const hasNumber = /\d{2,}/u.test(b.text);
  const mentionsOfficial = lower.includes('nghị quyết') || lower.includes('phụ lục') || lower.includes('điều 4') || lower.includes('báo cáo');
  const mentionsPerson = lower.includes('đại biểu') || lower.includes('hoàng thanh tùng') || lower.includes('phiên họp');

  if (mentionsOfficial) vType = 'evidence';
  else if (hasNumber) vType = 'data';
  else if (mentionsPerson) vType = 'collage';
  else vType = 'kinetic';

  // Prevent 3 in a row
  const prev1 = finalBeats[i - 1]?.visual?.type;
  const prev2 = finalBeats[i - 2]?.visual?.type;
  if (vType === prev1 && vType === prev2) {
    const cycle = ['evidence', 'data', 'kinetic', 'collage'];
    vType = cycle.find((t) => t !== prev1) || 'evidence';
  }

  if (vType === 'evidence') {
    b.visual = { type: 'evidence', shotId: getEvidenceForText(b.text) };
  } else if (vType === 'data') {
    b.visual = { type: 'data', graphic: getDataGraphicForText(b.text) };
  } else if (vType === 'collage') {
    const col = getCollageForText(b.text);
    b.visual = { type: 'collage', photos: col.photos, kicker: col.kicker };
  } else {
    const kin = getKineticForText(b.text);
    b.visual = { type: 'kinetic', text: kin.text, highlight: kin.highlight, icon: kin.icon };
  }

  finalBeats.push(b);
}

// Align chapters directly with timing.chapters
// Ensure every chapter startFrame matches exactly a beat startFrame
const chapters = timing.chapters.map((ch, idx) => {
  if (idx === 0) return { title: ch.title, startFrame: 0 };
  const matchedBeat = finalBeats.find((b) => b.startFrame >= ch.startFrame) || finalBeats[finalBeats.length - 1];
  return {
    title: ch.title,
    startFrame: matchedBeat.startFrame,
  };
});

const spec = {
  templateId: 'news/long-explainer',
  slug,
  fps: 30,
  totalFrames: timing.totalFrames,
  video: {
    title: 'Quốc hội chốt 80.400 tỷ cải cách tiền lương 2027: Ai được tăng?',
    date: '9.11.2026',
    bgMusic: 'assets/news/music/nastelbom-soft-music.mp3',
    sfx: false,
    width: 1920,
    height: 1080,
  },
  sources: [
    {
      url: 'https://tuoitre.vn/quoc-hoi-chot-ngan-sach-2027-bo-tri-80400-ti-dong-cai-cach-tien-luong-100261109090409531.htm',
      publisher: 'Tuổi Trẻ Online',
      evidenceSlug: slug,
    },
    {
      url: 'https://dantri.com.vn/thoi-su/quoc-hoi-chot-chi-80400-ty-dong-cho-cai-cach-tien-luong-20261109144341037.htm',
      publisher: 'Dân Trí',
      evidenceSlug: `${slug}-src2`,
    },
    {
      url: 'https://znews.vn/quoc-hoi-bo-tri-80400-ty-dong-cho-cai-cach-tien-luong-nam-2027-post1695140.html',
      publisher: 'ZNews',
      evidenceSlug: `${slug}-src3`,
    },
  ],
  chapters,
  mediaAssets,
  evidenceShots,
  beats: finalBeats,
};

fs.writeFileSync(`videos/${slug}/spec.json`, JSON.stringify(spec, null, 2), 'utf8');
console.log(`Rebuilt videos/${slug}/spec.json with ${finalBeats.length} beats, totalFrames=${timing.totalFrames}.`);
