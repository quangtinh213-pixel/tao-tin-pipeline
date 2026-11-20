import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {useWindowedAudioData, visualizeAudio} from '@remotion/media-utils';
import {loadFont as loadBeVietnam} from '@remotion/google-fonts/BeVietnamPro';
import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';

const {fontFamily: FONT_CARD} = loadBeVietnam('normal', {weights: ['600', '800'], subsets: ['vietnamese', 'latin']});
const {fontFamily: FONT_AMBIENT} = loadMontserrat('normal', {weights: ['500', '700'], subsets: ['vietnamese', 'latin']});

export type Word = {w: string; start: number; end: number};
export type Chunk = {start: number; end: number; words: Word[]};
export type Shot = {src: string; start: number; end: number};
export type PodcastConfig = {
  variant: 'card' | 'ambient';
  kicker: string;
  title: string;
  cta: string;
  music: string;
  musicVolume: number;
  voiceDuration: number;
  endCard: number;
  shots: Shot[];
  chunks: Chunk[];
};

export type PodcastProps = {slug: string};

const loadConfig = (slug: string): PodcastConfig => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cfg = require(`../../public/${slug}/podcast.json`);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const subs = require(`../../public/${slug}/subs.json`);
  return {...cfg, chunks: subs.chunks};
};

// ───────────────────────── audio-reactive helpers ─────────────────────────
const useBands = (slug: string, n: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {audioData, dataOffsetInSeconds} = useWindowedAudioData({
    src: staticFile(`${slug}/voice.mp3`),
    frame,
    fps,
    windowInSeconds: 10,
  });
  if (!audioData) return new Array(n).fill(0);
  const v = visualizeAudio({fps, frame, audioData, numberOfSamples: 64, optimizeFor: 'speed', dataOffsetInSeconds});
  // voice energy lives in the low/mid bins; spread them across n bars
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor((i / n) * 28) + 1;
    out.push(Math.min(1, Math.pow(v[idx] ?? 0, 0.5) * 2.4));
  }
  return out;
};

const Waveform: React.FC<{slug: string; width: number; height: number; color: string; bars: number; dotted?: boolean}> = ({
  slug,
  width,
  height,
  color,
  bars,
  dotted,
}) => {
  const bands = useBands(slug, Math.ceil(bars / 2));
  // mirror so loudest sits in the middle
  const half = bands.slice().reverse();
  const values = [...half, ...bands].slice(0, bars);
  const gap = width / bars;
  return (
    <svg width={width} height={height} style={{overflow: 'visible'}}>
      {values.map((v, i) => {
        const x = i * gap + gap / 2;
        if (dotted) {
          const h = 3 + v * height * 0.9;
          return <rect key={i} x={x - 2} y={height / 2 - h / 2} width={4} height={h} rx={2} fill={color} opacity={0.35 + v * 0.65} />;
        }
        const h = Math.max(4, v * height);
        return <rect key={i} x={x - gap * 0.22} y={height / 2 - h / 2} width={gap * 0.44} height={h} rx={gap * 0.22} fill={color} />;
      })}
    </svg>
  );
};

// ───────────────────────── karaoke subtitle ─────────────────────────
const useChunk = (chunks: Chunk[], t: number) => {
  let idx = -1;
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].start <= t + 0.05) idx = i;
    else break;
  }
  if (idx < 0) return null;
  const c = chunks[idx];
  if (t > c.end + 0.05) return null;
  return {c, idx};
};

const Karaoke: React.FC<{
  chunks: Chunk[];
  font: string;
  size: number;
  align: 'left' | 'center';
  spoken: string;
  current: string;
  upcoming: string;
  glow?: boolean;
  letterSpacing?: number;
  weight: number;
}> = ({chunks, font, size, align, spoken, current, upcoming, glow, letterSpacing = 0, weight}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const hit = useChunk(chunks, t);
  if (!hit) return null;
  const {c} = hit;
  const local = (t - c.start) * fps;
  const enter = spring({frame: local, fps, config: {damping: 18, stiffness: 160}});
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.2,
        textTransform: 'uppercase',
        textAlign: align,
        letterSpacing,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 24}px)`,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.28,
      }}
    >
      {c.words.map((w, i) => {
        const isNow = t >= w.start && t < w.end + 0.02;
        const done = t >= w.end;
        const color = isNow ? current : done ? spoken : upcoming;
        const pop = isNow ? interpolate(t, [w.start, w.start + 0.12], [1.08, 1], {extrapolateRight: 'clamp'}) : 1;
        return (
          <span
            key={i}
            style={{
              color,
              display: 'inline-block',
              transform: `scale(${pop})`,
              textShadow: glow && (isNow || done) ? '0 0 18px rgba(170,230,255,0.45)' : '0 3px 14px rgba(0,0,0,0.45)',
              transition: 'none',
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

// ───────────────────────── shots ─────────────────────────
const Shots: React.FC<{shots: Shot[]; slug: string; kenBurns: number; fade: number}> = ({shots, slug, kenBurns, fade}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{isolation: 'isolate'}}>
      {shots.map((s, i) => {
        if (t < s.start - 0.01 || t > s.end + fade) return null;
        const inOp = i === 0 ? 1 : interpolate(t, [s.start, s.start + fade], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const p = interpolate(t, [s.start, s.end + fade], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const dir = i % 2 === 0 ? 1 : -1;
        const scale = 1.04 + kenBurns * p;
        const tx = dir * kenBurns * 140 * (p - 0.5);
        const ty = -kenBurns * 60 * p;
        return (
          <AbsoluteFill key={i} style={{opacity: inOp, zIndex: i}}>
            <Img
              src={staticFile(`${slug}/${s.src}`)}
              style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${tx}px, ${ty}px) scale(${scale})`}}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// ───────────────────────── end card ─────────────────────────
const EndCard: React.FC<{cfg: PodcastConfig; font: string; accent: string}> = ({cfg, font, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = cfg.voiceDuration * fps;
  if (frame < start - 6) return null;
  const s = spring({frame: frame - start, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{background: `rgba(6,12,14,${0.78 * s})`, justifyContent: 'center', padding: '0 150px 0 80px'}}>
      <div style={{opacity: s, transform: `translateY(${(1 - s) * 40}px)`}}>
        <div style={{width: 90, height: 8, background: accent, borderRadius: 4, marginBottom: 36}} />
        <div style={{fontFamily: font, fontWeight: 700, fontSize: 64, lineHeight: 1.25, color: 'white'}}>{cfg.cta}</div>
        <div style={{fontFamily: font, fontWeight: 600, fontSize: 36, marginTop: 40, color: accent, letterSpacing: 2}}>
          ↓ BÌNH LUẬN GÓC NHÌN CỦA BẠN
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Sound: React.FC<{slug: string; cfg: PodcastConfig}> = ({slug, cfg}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const fadeOut = 2.5 * fps;
  return (
    <>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Audio
        src={staticFile(cfg.music)}
        loop
        volume={(f) =>
          cfg.musicVolume *
          interpolate(f, [0, fps * 1.5, durationInFrames - fadeOut, durationInFrames], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }) *
          (f > cfg.voiceDuration * fps ? 2.2 : 1)
        }
      />
    </>
  );
};

// ───────────────────────── variant A: static bg + image card ─────────────────────────
const CardLayout: React.FC<{slug: string; cfg: PodcastConfig}> = ({slug, cfg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const intro = spring({frame, fps, config: {damping: 200}, durationInFrames: 25});
  const green = '#0d3b2e';
  const yellow = '#FFD83D';
  return (
    <AbsoluteFill style={{background: green}}>
      {/* static backdrop */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 70% at 20% 85%, #155443 0%, ${green} 55%, #082a20 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* image card */}
      <div style={{position: 'absolute', top: 250, left: 0, width: 1080, height: 640, overflow: 'hidden', opacity: intro}}>
        <Shots shots={cfg.shots} slug={slug} kenBurns={0.05} fade={0.6} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(13,59,46,0.85) 100%)'}} />
        <div
          style={{
            position: 'absolute',
            top: 22,
            left: 28,
            fontFamily: FONT_CARD,
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 22,
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          }}
        >
          *Hình ảnh minh họa
        </div>
      </div>
      {/* kicker */}
      <div style={{position: 'absolute', top: 905, left: 70, display: 'flex', alignItems: 'center', gap: 16, opacity: intro}}>
        <div style={{background: yellow, color: green, fontFamily: FONT_CARD, fontWeight: 800, fontSize: 26, padding: '8px 18px', borderRadius: 6, letterSpacing: 1}}>
          {cfg.kicker}
        </div>
        <div style={{fontFamily: FONT_CARD, fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,0.8)'}}>{cfg.title}</div>
      </div>
      {/* subtitle block with accent bar */}
      <div style={{position: 'absolute', top: 985, left: 70, width: 6, height: 300, background: 'white', borderRadius: 3, opacity: intro}} />
      <div style={{position: 'absolute', top: 990, left: 104, width: 776, height: 300, display: 'flex', alignItems: 'flex-start'}}>
        <Karaoke
          chunks={cfg.chunks}
          font={FONT_CARD}
          size={66}
          weight={800}
          align="left"
          spoken="#ffffff"
          current={yellow}
          upcoming="rgba(255,255,255,0.42)"
        />
      </div>
      <div style={{position: 'absolute', top: 1315, left: 100, opacity: intro}}>
        <Waveform slug={slug} width={460} height={90} color="white" bars={40} />
      </div>
      <EndCard cfg={cfg} font={FONT_CARD} accent={yellow} />
      <Sound slug={slug} cfg={cfg} />
    </AbsoluteFill>
  );
};

// ───────────────────────── variant B: moving ambient bg ─────────────────────────
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const pts = useMemo(
    () =>
      new Array(38).fill(0).map((_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return {x: r(1) * 1080, y: r(2) * 1920, s: 2 + r(3) * 4, v: 0.25 + r(4) * 0.8, ph: r(5) * 6.28};
      }),
    [],
  );
  return (
    <AbsoluteFill>
      {pts.map((p, i) => {
        const y = (p.y - frame * p.v + 1920 * 4) % 1920;
        const x = p.x + Math.sin(frame / 50 + p.ph) * 20;
        const o = 0.18 + 0.25 * (0.5 + 0.5 * Math.sin(frame / 30 + p.ph));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: p.s, height: p.s, borderRadius: '50%', background: '#bfe9ff', opacity: o, filter: 'blur(0.6px)'}} />;
      })}
    </AbsoluteFill>
  );
};

const Emblem: React.FC<{slug: string}> = ({slug}) => {
  const frame = useCurrentFrame();
  const bands = useBands(slug, 8);
  const level = bands.reduce((a, b) => a + b, 0) / bands.length;
  const pulse = 1 + level * 0.06;
  const rot = frame * 0.3;
  return (
    <div style={{width: 200, height: 200, position: 'relative', transform: `scale(${pulse})`}}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        <circle cx={100} cy={100} r={92} fill="none" stroke="white" strokeWidth={4} style={{filter: 'drop-shadow(0 0 10px #7fe3ff)'}} />
        <circle cx={100} cy={100} r={72} fill="none" stroke="white" strokeWidth={3} strokeDasharray="6 10" transform={`rotate(${rot} 100 100)`} opacity={0.85} />
        {/* clock with a "closed" bar */}
        <circle cx={100} cy={100} r={38} fill="none" stroke="#ff3b3b" strokeWidth={4} />
        <line x1={100} y1={100} x2={100} y2={74} stroke="#ff3b3b" strokeWidth={4} strokeLinecap="round" />
        <line x1={100} y1={100} x2={118} y2={110} stroke="#ff3b3b" strokeWidth={4} strokeLinecap="round" />
        <line x1={64} y1={136} x2={136} y2={64} stroke="#ff3b3b" strokeWidth={5} strokeLinecap="round" />
      </svg>
    </div>
  );
};

const AmbientLayout: React.FC<{slug: string; cfg: PodcastConfig}> = ({slug, cfg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const intro = spring({frame, fps, config: {damping: 200}, durationInFrames: 30});
  const teal = '#5fd3e6';
  return (
    <AbsoluteFill style={{background: '#05090c'}}>
      <Shots shots={cfg.shots} slug={slug} kenBurns={0.14} fade={1.2} />
      <AbsoluteFill style={{background: 'rgba(4,10,14,0.62)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(80% 55% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%)'}} />
      <Particles />
      {/* top label */}
      <div style={{position: 'absolute', top: 222, width: 1080, textAlign: 'center', opacity: intro}}>
        <div style={{fontFamily: FONT_AMBIENT, fontWeight: 500, fontSize: 26, letterSpacing: 12, color: 'rgba(255,255,255,0.88)'}}>{cfg.kicker}</div>
        <div style={{width: 70, height: 4, background: teal, margin: '16px auto 0', borderRadius: 2, opacity: 0.8}} />
      </div>
      <div style={{position: 'absolute', top: 360, width: 1080, display: 'flex', justifyContent: 'center', opacity: intro}}>
        <Emblem slug={slug} />
      </div>
      {/* subtitle */}
      <div style={{position: 'absolute', top: 660, left: 110, width: 780, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Karaoke
          chunks={cfg.chunks}
          font={FONT_AMBIENT}
          size={60}
          weight={700}
          align="center"
          spoken="#ffffff"
          current="#ffffff"
          upcoming="rgba(255,255,255,0.32)"
          glow
          letterSpacing={2}
        />
      </div>
      <div style={{position: 'absolute', top: 1075, left: 230, opacity: intro}}>
        <Waveform slug={slug} width={540} height={70} color="white" bars={54} dotted />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1185,
          width: 1080,
          textAlign: 'center',
          fontFamily: FONT_AMBIENT,
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: 4,
          color: 'rgba(255,255,255,0.55)',
          opacity: intro,
        }}
      >
        {cfg.title}
      </div>
      <EndCard cfg={cfg} font={FONT_AMBIENT} accent={teal} />
      <Sound slug={slug} cfg={cfg} />
    </AbsoluteFill>
  );
};

export const PodcastVideo: React.FC<PodcastProps> = ({slug}) => {
  const cfg = loadConfig(slug);
  return cfg.variant === 'card' ? <CardLayout slug={slug} cfg={cfg} /> : <AmbientLayout slug={slug} cfg={cfg} />;
};

export const podcastDuration = (slug: string, fps: number) => {
  const cfg = loadConfig(slug);
  return Math.ceil((cfg.voiceDuration + cfg.endCard) * fps);
};
