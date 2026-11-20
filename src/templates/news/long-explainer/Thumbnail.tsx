import React, {useMemo} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {COLORS, FONT_HEADING, FONT_MAIN} from './tokens';
import type {
  LongExplainerAsset,
  LongExplainerEvidenceShot,
  LongExplainerSpec,
  LongExplainerThumbnailSpec,
} from './types';

export interface ThumbnailProps {
  slug: string;
}

const resolveSrc = (src: string) => (/^https?:\/\//i.test(src) ? src : staticFile(src));

/**
 * Smartly extract punchy thumbnail text and visual cues if spec.thumbnail is not provided
 */
function deriveThumbnailData(spec: any): LongExplainerThumbnailSpec {
  if (spec?.thumbnail && spec.thumbnail.bigText) {
    return spec.thumbnail;
  }

  // Look for a bigNumber graphic in beats
  let bigMetric = '';
  if (Array.isArray(spec?.beats)) {
    for (const b of spec.beats) {
      if (b.visual?.type === 'data' && b.visual.graphic?.kind === 'bigNumber') {
        const g = b.visual.graphic;
        const valStr = typeof g.value === 'number' ? g.value.toLocaleString('vi-VN') : String(g.value);
        bigMetric = `${g.prefix || ''}${valStr} ${g.unit || ''}`.trim();
        break;
      }
    }
  }

  // Format short punchy title
  const rawTitle = spec?.video?.title || 'BẢN TIN PHÂN TÍCH ĐẶC BIỆT';
  const cleanTitle = rawTitle.replace(/[#?]/g, '').trim();

  // Try to find numbers or strong keywords in title
  let bigText = '';
  let subText = '';

  if (bigMetric) {
    bigText = bigMetric.toUpperCase();
    subText = cleanTitle.slice(0, 45).toUpperCase();
  } else {
    const parts = cleanTitle.split(/[:–—\-]/);
    if (parts.length >= 2) {
      bigText = parts[0].trim().toUpperCase();
      subText = parts.slice(1).join(' ').trim().toUpperCase();
    } else {
      const words = cleanTitle.split(/\s+/);
      if (words.length > 5) {
        bigText = words.slice(0, 4).join(' ').toUpperCase();
        subText = words.slice(4, 10).join(' ').toUpperCase();
      } else {
        bigText = cleanTitle.toUpperCase();
        subText = 'PHÂN TÍCH CHUYÊN SÂU';
      }
    }
  }

  const primarySource = spec?.sources?.[0]?.publisher || 'TIN NÓNG 24H';

  return {
    badge: `BẢN TIN ĐẶC BIỆT · ${primarySource.toUpperCase()}`,
    badgeColor: 'red',
    bigText,
    subText,
    layout: 'split-contrast',
  };
}

export const LongExplainerThumbnail: React.FC<ThumbnailProps> = ({slug}) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const spec = useMemo(() => {
    try {
      return require(`../../../../videos/${slug}/spec.json`) as LongExplainerSpec;
    } catch {
      return null;
    }
  }, [slug]);

  const thumbSpec = useMemo(() => deriveThumbnailData(spec), [spec]);

  // Find featured media asset or evidence shot
  const featuredAsset: LongExplainerAsset | undefined = useMemo(() => {
    if (!spec?.mediaAssets || spec.mediaAssets.length === 0) return undefined;
    if (thumbSpec.mainAssetId) {
      const matched = spec.mediaAssets.find((a) => a.id === thumbSpec.mainAssetId);
      if (matched) return matched;
    }
    // Prefer wide landscape photos
    return spec.mediaAssets.find((a) => (a.width || 0) >= (a.height || 0)) || spec.mediaAssets[0];
  }, [spec, thumbSpec.mainAssetId]);

  const featuredShot: LongExplainerEvidenceShot | undefined = useMemo(() => {
    if (!spec?.evidenceShots || spec.evidenceShots.length === 0) return undefined;
    if (thumbSpec.evidenceShotId) {
      return spec.evidenceShots.find((s) => s.id === thumbSpec.evidenceShotId);
    }
    return spec.evidenceShots.find((s) => s.found) || spec.evidenceShots[0];
  }, [spec, thumbSpec.evidenceShotId]);

  const badgeBg =
    thumbSpec.badgeColor === 'yellow'
      ? COLORS.highlight
      : thumbSpec.badgeColor === 'emerald'
        ? '#10B981'
        : thumbSpec.badgeColor === 'blue'
          ? '#2563EB'
          : COLORS.red;

  const badgeText = thumbSpec.badgeColor === 'yellow' ? '#111827' : '#FFFFFF';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#070D18',
        color: '#FFFFFF',
        fontFamily: FONT_MAIN,
        width: 1280,
        height: 720,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. Background Grid & Atmospheric Radial Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.8,
        }}
      />

      {/* Radial backlight behind right focal subject */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 800,
          height: 800,
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.28) 0%, rgba(250, 204, 21, 0.12) 40%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Dark vignette gradient on the left to guarantee 100% text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #070D18 0%, #070D18 42%, rgba(7, 13, 24, 0.85) 65%, rgba(7, 13, 24, 0.4) 100%)',
          zIndex: 1,
        }}
      />

      {/* 2. Right Side: Visual Focal Point (Image / Evidence Shot) */}
      <div
        style={{
          position: 'absolute',
          right: 36,
          top: 40,
          width: 650,
          height: 560,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {featuredAsset ? (
          <div
            style={{
              position: 'relative',
              width: 580,
              height: 480,
              borderRadius: 16,
              overflow: 'hidden',
              border: '4px solid #FFFFFF',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(250, 204, 21, 0.25)',
              transform: 'rotate(2.2deg)',
            }}
          >
            <Img
              src={resolveSrc(featuredAsset.src)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Credit Tag */}
            {featuredAsset.credit ? (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  padding: '16px 14px 8px',
                  color: '#CBD5E1',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {featuredAsset.credit}
              </div>
            ) : null}
          </div>
        ) : featuredShot ? (
          <div
            style={{
              position: 'relative',
              width: 580,
              height: 440,
              borderRadius: 14,
              overflow: 'hidden',
              border: '3px solid #E2E8F0',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95)',
              transform: 'rotate(-1.8deg)',
              background: '#FFFFFF',
            }}
          >
            <Img
              src={resolveSrc(featuredShot.src)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : (
          /* Abstract News Shield / Icon Graphic fallback */
          <div
            style={{
              width: 520,
              height: 420,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '2px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{fontSize: 72, marginBottom: 12}}>📰</div>
            <div style={{fontFamily: FONT_HEADING, fontSize: 32, color: COLORS.highlight, fontWeight: 700}}>
              VN NEWS 24/7
            </div>
          </div>
        )}

        {/* Floating Verification Badge */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 20,
            background: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid #FACC15',
            borderRadius: 30,
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
            transform: 'rotate(-1deg)',
          }}
        >
          <span style={{color: '#FACC15', fontSize: 18}}>⚡</span>
          <span style={{fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF'}}>
            NGUỒN XÁC THỰC
          </span>
        </div>
      </div>

      {/* 3. Left Side: High-Impact Typography Zone */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 60,
          bottom: 50,
          width: 680,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top: Category Badge */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: badgeBg,
              color: badgeText,
              fontFamily: FONT_HEADING,
              fontSize: 22,
              fontWeight: 800,
              padding: '6px 18px',
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
              marginBottom: 20,
            }}
          >
            <span>●</span>
            <span>{thumbSpec.badge || 'TIÊU ĐIỂM CHÍNH SÁCH'}</span>
          </div>

          {/* Core Big Hook Text */}
          <div
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 74,
              lineHeight: 0.98,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              textShadow: '0 6px 20px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)',
              marginTop: 4,
              wordBreak: 'break-word',
            }}
          >
            {thumbSpec.highlightWord ? (
              thumbSpec.bigText.split(new RegExp(`(${thumbSpec.highlightWord})`, 'gi')).map((chunk, idx) =>
                chunk.toLowerCase() === thumbSpec.highlightWord?.toLowerCase() ? (
                  <span key={idx} style={{color: COLORS.highlight, textShadow: '0 0 25px rgba(250, 204, 21, 0.6)'}}>
                    {chunk}
                  </span>
                ) : (
                  chunk
                )
              )
            ) : (
              thumbSpec.bigText
            )}
          </div>

          {/* Sub Hook Question Banner */}
          {thumbSpec.subText ? (
            <div
              style={{
                marginTop: 22,
                display: 'inline-block',
                background: 'linear-gradient(90deg, #FACC15 0%, #F59E0B 100%)',
                color: '#0F172A',
                fontFamily: FONT_HEADING,
                fontSize: 34,
                fontWeight: 800,
                padding: '8px 22px',
                borderRadius: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.35)',
                maxWidth: 640,
              }}
            >
              {thumbSpec.subText}
            </div>
          ) : null}
        </div>

        {/* Bottom Strip: Channel Identity / Reliability Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: 16,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              boxShadow: '0 0 10px #EF4444',
            }}
          />
          <div
            style={{
              fontFamily: FONT_MAIN,
              fontSize: 16,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.75)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            BẢN TIN PHÂN TÍCH CHUYÊN SÂU · DỮ LIỆU ĐÃ KIỂM CHỨNG
          </div>
        </div>
      </div>

      {/* Note: Bottom Right (width ~200px, height ~80px) is intentionally preserved clean for YouTube duration badge */}
    </AbsoluteFill>
  );
};
