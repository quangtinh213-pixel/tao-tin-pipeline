import {icons} from 'lucide-react';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Graphic} from './Graphic';
import {CANVAS, COLORS, EVIDENCE_HIGHLIGHT_FRAME, FONT_HEADING, FONT_MAIN, STAGE} from './tokens';
import type {LongExplainerAsset, LongExplainerEvidenceShot, LongExplainerVisual} from './types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const resolveSrc = (src: string) => (/^https?:\/\//i.test(src) ? src : staticFile(src));
const STAGE_W = CANVAS.width - STAGE.left - STAGE.right;
const STAGE_H = CANVAS.height - STAGE.top - STAGE.bottom;
const HARD_SHADOW = '0 12px 28px -4px rgba(0,0,0,0.45), 0 8px 10px -6px rgba(0,0,0,0.3)';

/** Deterministic tilt within ±2.5° so a re-render never changes the layout. */
export const tiltFor = (seed: number) => (((seed * 37) % 11) - 5) / 2;

/** Collage frames for 1-3 photos: [left, top, width] in stage pixels. */
export const collageSlots = (count: number): Array<[number, number, number]> => {
  if (count <= 1) return [[STAGE_W * 0.14, 10, STAGE_W * 0.72]];
  if (count === 2) return [[0, 40, STAGE_W * 0.56], [STAGE_W * 0.42, 150, STAGE_W * 0.56]];
  return [[0, 30, STAGE_W * 0.46], [STAGE_W * 0.28, 210, STAGE_W * 0.44], [STAGE_W * 0.54, 0, STAGE_W * 0.46]];
};

const Collage: React.FC<{photos: LongExplainerAsset[]; kicker?: string; durationFrames: number; seed: number}> = ({photos, kicker, durationFrames, seed}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slots = collageSlots(photos.length);
  // Parallax: scale 1 → 1.03 and at most 15px drift across the beat.
  const progress = interpolate(frame, [0, durationFrames], [0, 1], clamp);
  return (
    <AbsoluteFill>
      {photos.map((asset, i) => {
        const [left, top, width] = slots[i];
        const height = Math.min(STAGE_H - top - 60, (width * Math.max(asset.height, 1)) / Math.max(asset.width, 1));
        const enter = spring({frame: frame - i * 7, fps, config: {damping: 18, stiffness: 120}});
        const drift = (i % 2 ? -1 : 1) * 15 * progress;
        return (
          <div
            key={`${asset.id}-${i}`}
            style={{
              position: 'absolute',
              left: STAGE.left + left + drift,
              top: STAGE.top + top,
              width,
              opacity: enter,
              transform: `translateY(${(1 - enter) * 60}px) rotate(${tiltFor(seed + i)}deg) scale(${1 + 0.03 * progress})`,
            }}
          >
            <div style={{border: '5px solid #FFFFFF', boxShadow: HARD_SHADOW, background: '#FFFFFF', height, overflow: 'hidden'}}>
              <Img src={resolveSrc(asset.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            <div style={{display: 'inline-block', background: '#FFFFFF', color: COLORS.ink, fontFamily: FONT_MAIN, fontSize: 18, fontWeight: 700, padding: '6px 12px', marginTop: -2}}>
              {asset.credit}
            </div>
          </div>
        );
      })}
      {kicker ? (
        <div style={{position: 'absolute', right: STAGE.right, bottom: STAGE.bottom + 10, maxWidth: 900, background: COLORS.red, color: '#FFFFFF', fontFamily: FONT_HEADING, fontSize: 48, fontWeight: 800, padding: '8px 22px', textTransform: 'uppercase', opacity: interpolate(frame, [10, 20], [0, 1], clamp)}}>
          {kicker}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Zoom target for an evidence shot: scale so the focus box spans ~70% of the card, centered. */
export const evidenceZoom = (shot: Pick<LongExplainerEvidenceShot, 'width' | 'focus'>, cardWidth: number) => {
  const base = cardWidth / shot.width;
  const scale = Math.min(2.4, Math.max(1, (cardWidth * 0.7) / Math.max(1, shot.focus.w * base)));
  return {base, scale};
};

const Evidence: React.FC<{shot: LongExplainerEvidenceShot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const cardW = 1500;
  const cardH = Math.round((cardW * shot.height) / shot.width);
  const {base, scale} = evidenceZoom(shot, cardW);
  const z = interpolate(frame, [0, EVIDENCE_HIGHLIGHT_FRAME], [1, scale], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const fx = (shot.focus.x + shot.focus.w / 2) * base;
  const fy = (shot.focus.y + shot.focus.h / 2) * base;
  // Keep the focus point moving toward the card center as the zoom grows.
  const tx = interpolate(z, [1, scale], [0, cardW / 2 - fx * scale], clamp);
  const ty = interpolate(z, [1, scale], [0, cardH / 2 - fy * scale], clamp);
  const enter = interpolate(frame, [0, 8], [0, 1], clamp);
  const sweepPerLine = 10;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingTop: STAGE.top - STAGE.bottom}}>
      <div style={{position: 'relative', width: cardW, height: cardH, overflow: 'hidden', background: COLORS.paper, boxShadow: HARD_SHADOW, border: '5px solid #FFFFFF', opacity: enter, transform: `rotate(${tiltFor(shot.id.length) / 3}deg)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: shot.width * base, height: shot.height * base, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})`}}>
          <Img src={resolveSrc(shot.src)} style={{width: '100%', height: '100%'}} />
          {shot.rects.map((r, i) => {
            const sweep = interpolate(frame, [EVIDENCE_HIGHLIGHT_FRAME + i * sweepPerLine, EVIDENCE_HIGHLIGHT_FRAME + (i + 1) * sweepPerLine], [0, 1], clamp);
            return (
              <div
                key={i}
                style={{position: 'absolute', left: r.x * base - 3, top: r.y * base - 2, width: (r.w * base + 6) * sweep, height: r.h * base + 4, background: COLORS.highlight, mixBlendMode: 'multiply', opacity: 0.85}}
              />
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: (CANVAS.width - cardW) / 2, bottom: STAGE.bottom - 18, background: COLORS.ink, color: '#FFFFFF', fontFamily: FONT_MAIN, fontSize: 22, fontWeight: 700, padding: '8px 16px', opacity: enter}}>
        Nguồn: {shot.label}
      </div>
    </AbsoluteFill>
  );
};

const Kinetic: React.FC<{text: string; highlight?: string; icon?: string}> = ({text, highlight, icon}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const Icon = icon ? icons[icon as keyof typeof icons] : undefined;
  const words = text.split(/\s+/u);
  const hl = (highlight ?? '').split(/\s+/u).filter(Boolean);
  const iconIn = spring({frame, fps, config: {damping: 12, stiffness: 150}});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: `${STAGE.top}px ${STAGE.left + 40}px ${STAGE.bottom}px`, flexDirection: 'row', gap: 70}}>
      {Icon ? (
        <div style={{flex: '0 0 auto', width: 240, height: 240, borderRadius: 120, background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${iconIn})`}}>
          <Icon size={130} color="#FFFFFF" strokeWidth={2.2} />
        </div>
      ) : null}
      <div style={{fontFamily: FONT_HEADING, fontSize: words.length > 9 ? 100 : 128, fontWeight: 800, lineHeight: 1.04, textTransform: 'uppercase', color: COLORS.text, maxWidth: Icon ? 1250 : 1600}}>
        {words.map((word, i) => {
          const show = spring({frame: frame - 4 - i * 3, fps, config: {damping: 16, stiffness: 160}});
          const isHl = hl.includes(word.replace(/[.,!?:;]$/u, ''));
          return (
            <span key={`${word}-${i}`} style={{display: 'inline-block', marginRight: '0.22em', opacity: show, transform: `translateY(${(1 - show) * 40}px)`, color: isHl ? COLORS.highlight : undefined}}>
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Quote: React.FC<{text: string; speaker: string; source: string; portrait?: LongExplainerAsset}> = ({text, speaker, source, portrait}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 120}});
  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: `${STAGE.top}px ${STAGE.left + 40}px ${STAGE.bottom}px`, gap: 80}}>
      {portrait ? (
        <div style={{flex: '0 0 520px', transform: `rotate(${tiltFor(3)}deg) translateY(${(1 - enter) * 50}px)`, opacity: enter}}>
          <div style={{border: '5px solid #FFFFFF', boxShadow: HARD_SHADOW, height: 620, overflow: 'hidden'}}>
            <Img src={resolveSrc(portrait.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div style={{display: 'inline-block', background: '#FFFFFF', color: COLORS.ink, fontSize: 18, fontWeight: 700, padding: '6px 12px'}}>{portrait.credit}</div>
        </div>
      ) : null}
      <div style={{flex: 1}}>
        <div style={{fontFamily: FONT_HEADING, fontSize: 220, lineHeight: 0.6, color: COLORS.red, fontWeight: 800}}>“</div>
        <div style={{fontFamily: FONT_MAIN, fontSize: text.length > 150 ? 50 : 60, fontWeight: 700, lineHeight: 1.3, color: COLORS.text, opacity: interpolate(frame, [6, 18], [0, 1], clamp)}}>{text}</div>
        <div style={{marginTop: 34, fontFamily: FONT_HEADING, fontSize: 44, fontWeight: 800, color: COLORS.highlight, textTransform: 'uppercase'}}>— {speaker}</div>
        <div style={{marginTop: 10, fontSize: 24, fontWeight: 700, color: COLORS.muted}}>Nguồn: {source}</div>
      </div>
    </AbsoluteFill>
  );
};

export interface BeatVisualProps {
  visual: LongExplainerVisual;
  assets: Map<string, LongExplainerAsset>;
  shots: Map<string, LongExplainerEvidenceShot>;
  durationFrames: number;
  seed: number;
}

const need = <T,>(map: Map<string, T>, id: string, what: string) => {
  const value = map.get(id);
  if (!value) throw new Error(`${what} not found: ${id}`);
  return value;
};

/** One beat: renders the visual its spec names, with a short fade-in so cuts are not harsh. */
export const BeatVisual: React.FC<BeatVisualProps> = ({visual, assets, shots, durationFrames, seed}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      {visual.type === 'collage' ? <Collage photos={visual.photos.map((p) => need(assets, p.assetId, 'Media asset'))} kicker={visual.kicker} durationFrames={durationFrames} seed={seed} /> : null}
      {visual.type === 'evidence' ? <Evidence shot={need(shots, visual.shotId, 'Evidence shot')} /> : null}
      {visual.type === 'kinetic' ? <Kinetic text={visual.text} highlight={visual.highlight} icon={visual.icon} /> : null}
      {visual.type === 'data' ? (
        <div style={{position: 'absolute', left: STAGE.left, right: STAGE.right, top: STAGE.top, bottom: STAGE.bottom}}>
          <Graphic graphic={visual.graphic} />
        </div>
      ) : null}
      {visual.type === 'quote' ? <Quote text={visual.text} speaker={visual.speaker} source={visual.source} portrait={visual.portraitAssetId ? need(assets, visual.portraitAssetId, 'Media asset') : undefined} /> : null}
    </AbsoluteFill>
  );
};
