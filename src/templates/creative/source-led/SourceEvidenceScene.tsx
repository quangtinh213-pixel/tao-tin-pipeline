import {Video} from '@remotion/media';
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {
  SourceLedEvidenceAsset,
  SourceLedMode,
} from './types';

export interface SourceEvidenceSceneProps {
  mode: SourceLedMode;
  evidence: SourceLedEvidenceAsset;
  headline: string;
  summary?: string;
  eyebrow?: string;
  accent?: string;
  accent2?: string;
  fit?: 'cover' | 'contain';
  presentation?: 'framed' | 'full-bleed' | 'split';
  clipStartSeconds?: number;
  clipEndSeconds?: number;
  showCaption?: boolean;
}

const resolveSrc = (src: string) =>
  /^https?:\/\//i.test(src) ? src : staticFile(src);

const sourceHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const THEMES = {
  dark: {
    background: '#05070D',
    text: '#F8FAFC',
    muted: 'rgba(226,232,240,0.72)',
    panel: 'rgba(5,7,13,0.82)',
    border: 'rgba(255,255,255,0.20)',
    shadow: '0 34px 90px rgba(0,0,0,0.48)',
  },
  light: {
    background: '#F3EEDF',
    text: '#172033',
    muted: 'rgba(23,32,51,0.68)',
    panel: 'rgba(255,252,244,0.88)',
    border: 'rgba(23,32,51,0.18)',
    shadow: '0 28px 70px rgba(88,72,44,0.20)',
  },
} as const;

export const SourceEvidenceScene: React.FC<SourceEvidenceSceneProps> = ({
  mode,
  evidence,
  headline,
  summary,
  eyebrow = 'DẪN CHỨNG TỪ NGUỒN',
  accent = mode === 'dark' ? '#50E3C2' : '#B53A2E',
  accent2 = mode === 'dark' ? '#8B5CF6' : '#D89B28',
  fit = 'cover',
  presentation = 'framed',
  clipStartSeconds = 0,
  clipEndSeconds,
  showCaption = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const theme = THEMES[mode];
  const reveal = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const mediaScale = interpolate(frame, [0, 180], [1.045, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fullBleed = presentation === 'full-bleed';
  const split = presentation === 'split';
  const mediaHeight = split ? 760 : 900;
  const credit = evidence.credit.replace(/^Nguồn:\s*/i, '');

  const media = evidence.kind === 'video' ? (
    <Video
      src={resolveSrc(evidence.src)}
      muted
      volume={0}
      trimBefore={Math.max(0, Math.round(clipStartSeconds * fps))}
      trimAfter={
        clipEndSeconds === undefined
          ? undefined
          : Math.max(1, Math.round(clipEndSeconds * fps))
      }
      style={{
        width: '100%',
        height: '100%',
        objectFit: fit,
        background: '#000',
        transform: `scale(${mediaScale})`,
      }}
    />
  ) : (
    <Img
      src={resolveSrc(evidence.src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: fit,
        transform: `scale(${mediaScale})`,
      }}
    />
  );

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        color: theme.text,
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          opacity: mode === 'dark' ? 0.65 : 0.45,
          backgroundImage: `linear-gradient(90deg, ${theme.border} 1px, transparent 1px), linear-gradient(0deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 82% 18%, ${accent}25, transparent 34%), radial-gradient(circle at 18% 78%, ${accent2}1E, transparent 38%)`,
        }}
      />

      {fullBleed ? (
        <>
          <AbsoluteFill style={{transform: `scale(${1 + (1 - reveal) * 0.03})`}}>
            {media}
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              background:
                mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(5,7,13,0.50), rgba(5,7,13,0.20) 38%, rgba(5,7,13,0.94) 78%)'
                  : 'linear-gradient(180deg, rgba(243,238,223,0.48), rgba(243,238,223,0.18) 38%, rgba(243,238,223,0.96) 78%)',
            }}
          />
        </>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          top: 270,
          bottom: 450,
          display: 'grid',
          gridTemplateRows: fullBleed ? '1fr auto' : split ? 'auto 1fr' : 'auto auto',
          alignContent: fullBleed ? 'end' : 'start',
          gap: 24,
          opacity: reveal,
          transform: `translateY(${(1 - reveal) * 28}px)`,
        }}
      >
        {!fullBleed ? (
          <div
            style={{
              position: 'relative',
              height: mediaHeight,
              overflow: 'hidden',
              borderRadius: mode === 'dark' ? 24 : 8,
              border: `1px solid ${theme.border}`,
              background: '#000',
              boxShadow: theme.shadow,
            }}
          >
            {media}
            <div
              style={{
                position: 'absolute',
                left: 18,
                top: 18,
                padding: '9px 13px',
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                color: accent,
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              {evidence.kind === 'video' ? 'VIDEO NGUỒN · TẮT ÂM' : 'ẢNH NGUỒN'}
            </div>
          </div>
        ) : (
          <div />
        )}

        <div
          style={{
            padding: fullBleed ? '28px 30px' : '0 4px',
            background: fullBleed ? theme.panel : undefined,
            border: fullBleed ? `1px solid ${theme.border}` : undefined,
            backdropFilter: fullBleed ? 'blur(14px)' : undefined,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: accent,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '0.12em',
            }}
          >
            <span style={{width: 42, height: 3, background: accent}} />
            {eyebrow}
          </div>
          <div
            style={{
              marginTop: 14,
              maxWidth: 920,
              fontSize: fullBleed ? 64 : 54,
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: '-0.035em',
            }}
          >
            {headline}
          </div>
          {summary ? (
            <div
              style={{
                marginTop: 16,
                maxWidth: 860,
                color: theme.muted,
                fontSize: 25,
                lineHeight: 1.35,
                fontWeight: 650,
              }}
            >
              {summary}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          bottom: 374,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 14,
          alignItems: 'start',
          paddingTop: 14,
          borderTop: `1px solid ${theme.border}`,
          color: theme.muted,
          fontSize: 20,
          lineHeight: 1.25,
          opacity: reveal,
        }}
      >
        <div
          style={{
            color: accent,
            fontWeight: 900,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          NGUỒN · {sourceHost(evidence.sourcePageUrl)}
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontWeight: 800}}>{credit}</div>
          {showCaption && evidence.caption ? (
            <div style={{marginTop: 5}}>{evidence.caption}</div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
