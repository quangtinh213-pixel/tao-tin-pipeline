const state = {
  videos: [],
  jobs: [],
  productionConfig: null,
  query: '',
  toastTimer: null,
  jobsTimer: null,
  expandedLogs: new Set(),
};

const elements = {
  count: document.querySelector('#video-count'),
  list: document.querySelector('#video-list'),
  loading: document.querySelector('#loading-state'),
  empty: document.querySelector('#empty-state'),
  error: document.querySelector('#error-state'),
  errorMessage: document.querySelector('#error-message'),
  search: document.querySelector('#dashboard-search'),
  syncStatus: document.querySelector('#sync-status'),
  refresh: document.querySelector('#refresh-button'),
  retry: document.querySelector('#retry-button'),
  toast: document.querySelector('#toast'),
  form: document.querySelector('#production-form'),
  context: document.querySelector('#production-context'),
  template: document.querySelector('#production-template'),
  model: document.querySelector('#production-model'),
  audio: document.querySelector('#production-audio'),
  produce: document.querySelector('#produce-button'),
  produceText: document.querySelector('#produce-button-text'),
  batchCounter: document.querySelector('#batch-counter'),
  apiDot: document.querySelector('#api-dot'),
  apiStatus: document.querySelector('#api-status'),
  apiModel: document.querySelector('#api-model'),
  concurrencyChip: document.querySelector('#concurrency-chip'),
  jobsSection: document.querySelector('#jobs-section'),
  jobsList: document.querySelector('#job-list'),
  activeJobCount: document.querySelector('#active-job-count'),
  themeToggle: document.querySelector('#theme-toggle'),
  themeIcon: document.querySelector('#theme-icon'),
  themeLabel: document.querySelector('#theme-label'),
};

const STATUS_LABELS = {
  queued: 'Chờ xử lý',
  running: 'Đang chạy',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
  cancelled: 'Đã huỷ',
};

const PIPELINE_STEPS = [
  {id: 'setup', short: 'Khởi tạo'},
  {id: 'acquire', short: 'Media'},
  {id: 'planner', short: 'Kế hoạch'},
  {id: 'teller', short: 'Kịch bản'},
  {id: 'audio', short: 'Voice'},
  {id: 'transcribe', short: 'Căn âm'},
  {id: 'spec', short: 'Đặc tả'},
  {id: 'caption', short: 'Caption'},
  {id: 'coder', short: 'Dựng cảnh'},
  {id: 'render', short: 'Render'},
  {id: 'verify', short: 'Kiểm tra'},
];

function getInitialTheme() {
  const saved = localStorage.getItem('studio_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return 'light'; // Default to modern light theme
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('studio_theme', theme);
  if (elements.themeIcon) {
    elements.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
  if (elements.themeLabel) {
    elements.themeLabel.textContent = theme === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function extractFirstUrl(text) {
  const match = String(text ?? '').match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : String(text ?? '').trim();
}

function looksLikeTikTokShopUrl(value) {
  try {
    const url = new URL(extractFirstUrl(value));
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      (url.hostname.includes('tiktok.com') ||
        url.hostname.includes('tiktokv.com') ||
        url.hostname.includes('byteimg.com'))
    );
  } catch {
    return false;
  }
}

function looksLikeArticleUrl(value) {
  try {
    const url = new URL(extractFirstUrl(value));
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname) &&
      !looksLikeTikTokShopUrl(value)
    );
  } catch {
    return false;
  }
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Kích thước chưa rõ';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRenderedAt(value) {
  if (!value) return 'Chưa rõ thời gian';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Chưa rõ thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove('visible'), 2800);
}

function setView({loading = false, error = null, empty = false} = {}) {
  elements.loading.classList.toggle('hidden', !loading);
  elements.error.classList.toggle('hidden', !error);
  elements.empty.classList.toggle('hidden', !empty);
  elements.list.classList.toggle('hidden', loading || Boolean(error) || empty);
  elements.list.setAttribute('aria-busy', loading ? 'true' : 'false');
  if (error) elements.errorMessage.textContent = error;
}

function makeMetaItem(text) {
  const item = document.createElement('span');
  item.className = 'meta-item';
  item.textContent = text;
  return item;
}

function makeSeparator() {
  const separator = document.createElement('span');
  separator.className = 'meta-separator';
  separator.setAttribute('aria-hidden', 'true');
  return separator;
}

function createActionButton(label, className, handler, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button ${className}`;
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener('click', handler);
  return button;
}

function createPipelineStepper(job) {
  const stepper = document.createElement('div');
  stepper.className = 'pipeline-stepper';

  const currentStageIndex = PIPELINE_STEPS.findIndex((s) => s.id === job.stage);
  const isCompleted = job.status === 'completed';
  const isFailed = ['failed', 'cancelled'].includes(job.status);

  PIPELINE_STEPS.forEach((step, index) => {
    const item = document.createElement('div');
    item.className = 'step-item';

    const bullet = document.createElement('span');
    bullet.className = 'step-bullet';

    const label = document.createElement('span');
    label.className = 'step-label';
    label.textContent = step.short;

    if (isCompleted) {
      item.classList.add('completed');
      bullet.textContent = '✓';
    } else if (index < currentStageIndex) {
      item.classList.add('completed');
      bullet.textContent = '✓';
    } else if (index === currentStageIndex) {
      if (isFailed) {
        item.classList.add('failed');
        bullet.textContent = '✕';
      } else {
        item.classList.add('active');
        bullet.textContent = '●';
      }
    } else {
      bullet.textContent = String(index + 1);
    }

    item.append(bullet, label);
    stepper.append(item);
  });

  return stepper;
}

function createJobCard(job) {
  const card = document.createElement('article');
  card.className = `job-card ${job.status}`;

  const head = document.createElement('div');
  head.className = 'job-head';
  const titleWrap = document.createElement('div');
  titleWrap.className = 'job-title';
  const title = document.createElement('strong');
  title.textContent = job.context;
  title.title = job.context;
  const meta = document.createElement('div');
  meta.className = 'job-meta';
  meta.textContent = `${job.stageLabel} · ${job.templateId} · ${job.audioMode}`;
  titleWrap.append(title, meta);

  const actions = document.createElement('div');
  actions.className = 'job-actions';
  const pill = document.createElement('span');
  pill.className = `status-pill ${job.status}`;
  pill.textContent = STATUS_LABELS[job.status] || job.status;
  actions.append(pill);
  if (['queued', 'running'].includes(job.status)) {
    actions.append(createActionButton('Huỷ', 'button-quiet', () => cancelJob(job.id)));
  } else if (['failed', 'cancelled'].includes(job.status)) {
    actions.append(createActionButton('Thử lại', 'button-primary', () => retryJob(job.id)));
  }
  head.append(titleWrap, actions);

  const stepper = createPipelineStepper(job);

  const progress = document.createElement('div');
  progress.className = 'job-progress';
  const bar = document.createElement('span');
  bar.style.width = `${Math.max(2, job.progress || 0)}%`;
  progress.append(bar);

  const message = document.createElement('p');
  message.className = 'job-message';
  message.textContent = job.error || job.message;

  card.append(head, stepper, progress, message);

  if (job.logs?.length) {
    const isExpanded = state.expandedLogs.has(job.id) || ['running', 'failed'].includes(job.status);
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'job-toggle-log';
    toggleBtn.textContent = isExpanded ? 'Thu gọn nhật ký ▴' : `Nhật ký (${job.logs.length} dòng) ▾`;

    const log = document.createElement('pre');
    log.className = `job-log ${isExpanded ? '' : 'hidden'}`;
    log.textContent = job.logs.slice(-12).map((entry) => entry.message).join('\n');

    toggleBtn.addEventListener('click', () => {
      if (state.expandedLogs.has(job.id)) {
        state.expandedLogs.delete(job.id);
        log.classList.add('hidden');
        toggleBtn.textContent = `Nhật ký (${job.logs.length} dòng) ▾`;
      } else {
        state.expandedLogs.add(job.id);
        log.classList.remove('hidden');
        toggleBtn.textContent = 'Thu gọn nhật ký ▴';
      }
    });

    card.append(toggleBtn, log);
  }
  return card;
}

function renderJobs() {
  elements.jobsSection.classList.toggle('hidden', state.jobs.length === 0);
  elements.jobsList.replaceChildren(...state.jobs.map(createJobCard));

  const active = state.jobs.filter((job) => ['queued', 'running'].includes(job.status));
  const running = active.filter((j) => j.status === 'running').length;
  const queued = active.filter((j) => j.status === 'queued').length;

  if (elements.activeJobCount) {
    elements.activeJobCount.textContent = `${running} đang chạy · ${queued} chờ lượt`;
  }

  window.clearTimeout(state.jobsTimer);
  if (active.length > 0) state.jobsTimer = window.setTimeout(loadJobs, 1800);
}

function updateBatchState() {
  const raw = elements.context.value;
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tiktokUrls = lines.filter(looksLikeTikTokShopUrl);
  const articleUrls = lines.filter(looksLikeArticleUrl);

  if (tiktokUrls.length > 0) {
    elements.template.value = 'commerce/storytelling-showcase';
    elements.audio.value = 'full';
  } else if (articleUrls.length > 0) {
    elements.template.value = 'news/media-showcase';
    elements.audio.value = 'full';
  }

  if (lines.length > 1) {
    if (elements.batchCounter) {
      elements.batchCounter.classList.remove('hidden');
      elements.batchCounter.textContent = `${lines.length} tác vụ song song`;
    }
    if (elements.produceText) {
      elements.produceText.textContent = `Sản xuất ${lines.length} video song song`;
    }
  } else {
    if (elements.batchCounter) elements.batchCounter.classList.add('hidden');
    if (elements.produceText) elements.produceText.textContent = 'Bắt đầu sản xuất';
  }
}

async function loadProductionConfig() {
  try {
    const response = await fetch('/api/production-config');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể đọc cấu hình sản xuất.');
    state.productionConfig = payload;
    elements.template.replaceChildren(...payload.templates.map((template) => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = `${template.name} · ${template.behavior}`;
      return option;
    }));
    elements.template.value = 'creative/free-style';
    elements.apiDot.className = `connection-dot ${payload.api.connected ? 'connected' : 'disconnected'}`;
    elements.apiStatus.textContent = payload.api.connected ? 'ChatGPT API đã kết nối' : 'Chưa cấu hình OPENAI_API_KEY';
    elements.apiModel.textContent = payload.api.model;
    if (elements.concurrencyChip) {
      elements.concurrencyChip.textContent = `Song song: ${payload.api.concurrency || 2} luồng`;
    }
    elements.produce.disabled = !payload.api.connected;
  } catch (error) {
    elements.apiDot.className = 'connection-dot disconnected';
    elements.apiStatus.textContent = error.message;
    elements.produce.disabled = true;
  }
}

async function loadJobs() {
  try {
    const response = await fetch('/api/jobs');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể tải hàng đợi.');
    state.jobs = payload.jobs || [];
    renderJobs();
    if (state.jobs.some((job) => job.status === 'completed')) loadVideos();
  } catch (error) {
    showToast(error.message || 'Không thể tải hàng đợi sản xuất');
  }
}

async function createProduction(event) {
  event.preventDefault();
  const raw = elements.context.value.trim();
  if (!raw) return;
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return;

  elements.produce.disabled = true;
  try {
    let payload;
    if (lines.length === 1) {
      const isTikTok = looksLikeTikTokShopUrl(lines[0]);
      const isArticle = looksLikeArticleUrl(lines[0]);
      const defaultTpl = isTikTok ? 'commerce/storytelling-showcase' : isArticle ? 'news/media-showcase' : elements.template.value;
      const defaultAud = (isTikTok || isArticle) ? 'full' : elements.audio.value;

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          context: lines[0],
          templateId: elements.template.value || defaultTpl,
          audioMode: elements.audio.value || defaultAud,
          model: elements.model?.value || undefined,
        }),
      });
      payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể bắt đầu sản xuất.');
      state.jobs.unshift(payload.job);
      showToast('Đã đưa video vào hàng đợi sản xuất');
    } else {
      const items = lines.map((context) => {
        const isTikTok = looksLikeTikTokShopUrl(context);
        const isArticle = looksLikeArticleUrl(context);
        return {
          context,
          templateId: isTikTok ? 'commerce/storytelling-showcase' : isArticle ? 'news/media-showcase' : elements.template.value,
          audioMode: (isTikTok || isArticle) ? 'full' : elements.audio.value,
          model: elements.model?.value || undefined,
        };
      });
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({batch: items}),
      });
      payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể bắt đầu sản xuất lô.');
      const created = payload.jobs || [];
      state.jobs.unshift(...created);
      showToast(`Đã đưa ${created.length} video vào hàng đợi sản xuất song song`);
    }
    elements.context.value = '';
    updateBatchState();
    renderJobs();
  } catch (error) {
    showToast(error.message || 'Không thể bắt đầu sản xuất');
  } finally {
    elements.produce.disabled = !state.productionConfig?.api?.connected;
  }
}

async function cancelJob(id) {
  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(id)}/cancel`, {method: 'POST'});
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể huỷ tác vụ.');
    await loadJobs();
    showToast('Đã huỷ tác vụ sản xuất');
  } catch (error) {
    showToast(error.message || 'Không thể huỷ tác vụ');
  }
}

async function retryJob(id) {
  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(id)}/retry`, {method: 'POST'});
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể thử lại tác vụ.');
    await loadJobs();
    showToast('Đã đưa tác vụ vào hàng đợi để thử lại');
  } catch (error) {
    showToast(error.message || 'Không thể thử lại tác vụ');
  }
}

function createVideoCard(record, index) {
  const card = document.createElement('article');
  card.className = 'video-card';
  card.setAttribute('role', 'listitem');

  const main = document.createElement('div');
  main.className = 'card-main';

  const titleRow = document.createElement('div');
  titleRow.className = 'title-row';

  const number = document.createElement('span');
  number.className = 'index-number';
  number.textContent = String(index + 1).padStart(2, '0');
  number.setAttribute('aria-hidden', 'true');

  const title = document.createElement('h2');
  title.className = 'video-title';
  title.textContent = record.title;
  title.title = record.title;

  titleRow.append(number, title);

  const meta = document.createElement('div');
  meta.className = 'meta-row';
  if (record.date) meta.append(makeMetaItem(record.date));
  if (record.publisher) {
    if (meta.childElementCount > 0) meta.append(makeSeparator());
    meta.append(makeMetaItem(record.publisher));
  }
  if (meta.childElementCount > 0) meta.append(makeSeparator());
  meta.append(makeMetaItem(formatRenderedAt(record.renderedAt)));
  if (record.templateId) {
    if (meta.childElementCount > 0) meta.append(makeSeparator());
    const template = document.createElement('span');
    template.className = 'template-badge';
    template.textContent = record.templateId;
    meta.append(template);
  }
  if (record.youtube?.url) {
    if (meta.childElementCount > 0) meta.append(makeSeparator());
    const ytBadge = document.createElement('a');
    ytBadge.className = 'template-badge';
    ytBadge.style.background = '#fee2e2';
    ytBadge.style.color = '#b91c1c';
    ytBadge.style.textDecoration = 'none';
    ytBadge.href = record.youtube.url;
    ytBadge.target = '_blank';
    ytBadge.rel = 'noreferrer';
    ytBadge.textContent = '▶ YouTube VNNews';
    meta.append(ytBadge);
  }

  const pathRow = document.createElement('div');
  pathRow.className = 'path-row';
  const pathLabel = document.createElement('span');
  pathLabel.className = 'path-label';
  pathLabel.textContent = 'FILE';
  const path = document.createElement('span');
  path.className = 'video-path';
  path.textContent = record.videoPath;
  path.title = record.videoPath;
  pathRow.append(pathLabel, path);

  main.append(titleRow, meta, pathRow);

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const revealButton = createActionButton('Mở trong Finder', 'button-primary', () => revealVideo(record));
  const copyButton = createActionButton(
    record.scriptAvailable ? 'Sao chép kịch bản' : 'Kịch bản chưa có',
    'button-quiet',
    () => copyScript(record),
    !record.scriptAvailable,
  );
  copyButton.title = record.scriptAvailable ? 'Sao chép toàn bộ kịch bản' : 'Video này chưa có script.json';
  const captionButton = createActionButton(
    record.captionAvailable ? 'Sao chép caption' : 'Caption chưa có',
    'button-quiet',
    () => copyCaption(record),
    !record.captionAvailable,
  );
  captionButton.title = record.captionAvailable
    ? 'Sao chép caption để đăng lên mạng xã hội'
    : 'Video này chưa có caption.txt';

  let youtubeButton;
  if (record.youtube?.url) {
    youtubeButton = createActionButton('Xem YouTube', 'button-quiet', () => {
      window.open(record.youtube.url, '_blank');
    });
    youtubeButton.title = 'Mở video trên YouTube';
  } else {
    youtubeButton = createActionButton('Upload YouTube', 'button-quiet', async () => {
      youtubeButton.textContent = 'Đang tải lên...';
      youtubeButton.disabled = true;
      try {
        const response = await fetch(`/api/videos/${encodeURIComponent(record.slug)}/youtube-upload`, {
          method: 'POST',
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Upload thất bại.');
        showToast('Upload lên YouTube thành công!');
        await loadVideos();
      } catch (err) {
        showToast(err.message || 'Lỗi khi upload lên YouTube.');
        youtubeButton.textContent = 'Upload YouTube';
        youtubeButton.disabled = false;
      }
    });
    youtubeButton.title = 'Tải video này lên kênh YouTube VNNews';
  }

  actions.append(revealButton, copyButton, captionButton, youtubeButton);

  card.append(main, actions);
  return card;
}

function filteredVideos() {
  const query = state.query.trim().toLocaleLowerCase('vi');
  if (!query) return state.videos;
  return state.videos.filter((record) => [
    record.title,
    record.slug,
    record.templateId,
    record.publisher,
  ].filter(Boolean).some((value) => value.toLocaleLowerCase('vi').includes(query)));
}

function renderVideos() {
  const videos = filteredVideos();
  elements.count.textContent = String(state.videos.length);
  elements.list.replaceChildren(...videos.map(createVideoCard));
  setView({empty: videos.length === 0});

  if (state.videos.length > 0 && videos.length === 0) {
    elements.empty.querySelector('h2').textContent = 'Không có kết quả phù hợp';
    elements.empty.querySelector('p').textContent = 'Thử tìm với tiêu đề, template hoặc nguồn khác.';
  } else {
    elements.empty.querySelector('h2').textContent = 'Chưa tìm thấy video';
    const description = elements.empty.querySelector('p');
    const code = document.createElement('code');
    code.textContent = 'videos/*/output/video.mp4';
    description.replaceChildren('Dashboard chỉ hiển thị các file đã render tại ', code, '.');
  }
}

async function loadVideos() {
  setView({loading: true});
  elements.syncStatus.textContent = 'Đang đồng bộ thư viện...';
  try {
    const response = await fetch('/api/videos');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể tải danh sách video.');
    state.videos = Array.isArray(payload.videos) ? payload.videos : [];
    renderVideos();
    elements.syncStatus.textContent = `Cập nhật lúc ${new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())}`;
  } catch (error) {
    elements.syncStatus.textContent = 'Chưa đồng bộ được';
    setView({error: error.message || 'Không thể tải danh sách video.'});
  }
}

async function revealVideo(record) {
  try {
    const response = await fetch(`/api/videos/${encodeURIComponent(record.slug)}/reveal`, {method: 'POST'});
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể mở Finder.');
    showToast('Đã mở Finder và chọn video');
  } catch (error) {
    showToast(error.message || 'Không thể mở Finder');
  }
}

async function copyScript(record) {
  try {
    const response = await fetch(`/api/videos/${encodeURIComponent(record.slug)}/script`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể đọc kịch bản.');
    await navigator.clipboard.writeText(payload.script);
    showToast('Đã sao chép kịch bản');
  } catch (error) {
    showToast(error.message || 'Không thể sao chép kịch bản');
  }
}

async function copyCaption(record) {
  try {
    const response = await fetch(`/api/videos/${encodeURIComponent(record.slug)}/caption`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể đọc caption.');
    await navigator.clipboard.writeText(payload.caption);
    showToast('Đã sao chép caption');
  } catch (error) {
    showToast(error.message || 'Không thể sao chép caption');
  }
}

// Event Listeners
if (elements.themeToggle) {
  elements.themeToggle.addEventListener('click', toggleTheme);
}
elements.search.addEventListener('input', (event) => {
  state.query = event.target.value;
  renderVideos();
});
elements.form.addEventListener('submit', createProduction);
elements.context.addEventListener('input', updateBatchState);
elements.refresh.addEventListener('click', loadVideos);
elements.retry.addEventListener('click', loadVideos);
window.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== elements.search) {
    event.preventDefault();
    elements.search.focus();
  }
});

// Initialize
setTheme(getInitialTheme());
Promise.all([loadProductionConfig(), loadJobs(), loadVideos()]);
