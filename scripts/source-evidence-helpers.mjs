import dns from 'node:dns/promises';
import net from 'node:net';
const DECORATIVE_MEDIA_RE =
  /(^|[\s/_-])(logo|avatar|icon|sprite|advertisement|tracking|favicon)([\s/_.-]|$)/i;

const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export const resolveMediaUrl = (value, baseUrl) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^(?:data|blob):/i.test(trimmed)) return null;

  try {
    const resolved = new URL(trimmed, baseUrl);
    return ['http:', 'https:'].includes(resolved.protocol) ? resolved.href : null;
  } catch {
    return null;
  }
};

export const parseSrcset = (value, baseUrl) =>
  String(value || '')
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .map((candidate) => resolveMediaUrl(candidate, baseUrl))
    .filter(Boolean);

export const isDecorativeMedia = (value) => {
  const str = String(value || '');
  if (/(article|story|post|news)[_-]+avatar/i.test(str)) return false;
  return DECORATIVE_MEDIA_RE.test(str);
};

const candidateIdentity = (candidate, src) =>
  [
    src,
    candidate.alt,
    candidate.className,
    candidate.class,
    candidate.id,
  ]
    .filter(Boolean)
    .join(' ');

const normalizeCandidate = ({
  raw,
  value,
  baseUrl,
  kind,
  priority,
  sourceType,
  discoveryIndex,
  candidateSource,
}) => {
  const src = resolveMediaUrl(value, baseUrl);
  if (!src || isDecorativeMedia(candidateIdentity(raw, src))) return null;

  return {
    ...raw,
    src,
    kind,
    priority,
    sourceType,
    discoveryIndex,
    candidateSource,
    width: Number(raw.width) || 0,
    height: Number(raw.height) || 0,
  };
};

const dedupeAndSort = (candidates) => {
  const seen = new Set();
  return [...candidates]
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.priority - right.priority || left.discoveryIndex - right.discoveryIndex,
    )
    .filter((candidate) => {
      if (seen.has(candidate.src)) return false;
      seen.add(candidate.src);
      return true;
    });
};

export const expandImageCandidates = ({
  baseUrl,
  domImages = [],
  metadataImages = [],
  networkImages = [],
}) => {
  const candidates = [];
  let discoveryIndex = 0;

  const append = (rawValue, priority, sourceType) => {
    const raw = typeof rawValue === 'string' ? {src: rawValue} : rawValue || {};
    const sources = [
      ['currentSrc', raw.currentSrc],
      ['src', raw.src],
      ...parseSrcset(raw.srcset, baseUrl).map((src) => ['srcset', src]),
      ...asArray(raw.pictureSrcsets).flatMap((srcset) =>
        parseSrcset(srcset, baseUrl).map((src) => ['picture-srcset', src]),
      ),
      ...asArray(raw.lazySources).map((src) => ['lazy', src]),
    ];

    for (const [candidateSource, value] of sources) {
      const candidate = normalizeCandidate({
        raw,
        value,
        baseUrl,
        kind: 'image',
        priority,
        sourceType,
        discoveryIndex,
        candidateSource,
      });
      discoveryIndex += 1;
      if (candidate) candidates.push(candidate);
    }
  };

  domImages.forEach((image) => append(image, 10, 'article-image'));
  metadataImages.forEach((image) => append(image, 20, 'metadata-image'));
  networkImages.forEach((image) => append(image, 30, 'network-image'));

  return dedupeAndSort(candidates);
};

export const expandVideoCandidates = ({
  baseUrl,
  embeddedVideos = [],
  metadataVideos = [],
  networkVideos = [],
}) => {
  const candidates = [];
  let discoveryIndex = 0;

  const append = (rawValue, priority, sourceType) => {
    const raw = typeof rawValue === 'string' ? {src: rawValue} : rawValue || {};
    const sources = [
      ['src', raw.src],
      ...asArray(raw.sources).map((src) => ['source', src]),
    ];

    for (const [candidateSource, value] of sources) {
      const candidate = normalizeCandidate({
        raw,
        value,
        baseUrl,
        kind: 'video',
        priority,
        sourceType,
        discoveryIndex,
        candidateSource,
      });
      discoveryIndex += 1;
      if (candidate) candidates.push(candidate);
    }
  };

  embeddedVideos.forEach((video) => append(video, 0, 'embedded-video'));
  metadataVideos.forEach((video) => append(video, 1, 'metadata-video'));
  networkVideos.forEach((video) => append(video, 2, 'network-video'));

  return dedupeAndSort(candidates);
};

export const prioritizeMediaCandidates = ({videos = [], images = []}) => {
  const assets = dedupeAndSort([...videos, ...images]);
  return {
    assets,
    videos: assets.filter((asset) => asset.kind === 'video'),
    images: assets.filter((asset) => asset.kind === 'image'),
  };
};

export const prepareMediaCandidates = ({videos = [], images = []}) => ({
  videos: [...videos],
  images: images.filter(
    (candidate) =>
      !candidate.width ||
      !candidate.height ||
      (candidate.width <= 10 && candidate.height <= 10) ||
      (candidate.width >= 480 &&
        candidate.height >= 270 &&
        candidate.width * candidate.height >= 240_000),
  ),
});

const isPrivateIp = (address) => {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('::ffff:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('ff')
  );
};

export const assertPublicUrl = async (value) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Blocked URL protocol: ${url.protocol}`);
  }

  const addresses = await dns.lookup(url.hostname, {all: true});
  if (addresses.length === 0 || addresses.some(({address}) => isPrivateIp(address))) {
    throw new Error(`Blocked private or unresolved host: ${url.hostname}`);
  }

  return url;
};
