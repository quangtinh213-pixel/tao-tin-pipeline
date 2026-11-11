import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COLORS, FONTS, TIKTOK_SAFE_ZONE} from './tokens';
import type {ProductMedia, ProductSceneProps} from './types';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveMediaSrc = (media?: ProductMedia) => {
  if (!media?.src) return null;
  return media.storage === 'remote' || /^https?:\/\//i.test(media.src)
    ? media.src
    : staticFile(media.src);
};

export const ProductScene: React.FC<{scene: ProductSceneProps; index: number}> = ({
  scene,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Multi-media cycling: rotate through mediaList every 60 frames (~2s)
  const media = scene.mediaList?.length
    ? scene.mediaList
    : scene.media
      ? [scene.media]
      : [];
  const cycleInterval = 60;
  const activeMedia = media.length
    ? media[Math.floor(frame / cycleInterval) % media.length]
    : undefined;
  const mediaSrc = resolveMediaSrc(activeMedia);

  // Smooth entrance & subtle Ken Burns motion
  const entrance = spring({
    frame,
    fps,
    config: {damping: 14, stiffness: 120},
  });
  const titleY = interpolate(frame, [0, 16], [30, 0], {
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const localCycleFrame = frame % cycleInterval;
  const imageScale = interpolate(localCycleFrame, [0, cycleInterval], [1.0, 1.07], {
    extrapolateRight: 'clamp',
  });
  const pulse = 1 + Math.sin(frame / 7) * 0.03;

  const titleStyle: React.CSSProperties = {
    margin: 0,
    color: '#FFFFFF',
    fontFamily: FONTS.display,
    fontWeight: 900,
    fontSize: scene.type === 'hook' ? 54 : scene.type === 'socialProofCta' ? 44 : 48,
    lineHeight: 1.14,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '-0.01em',
    textShadow: '0 4px 24px rgba(0,0,0,0.85), 0 0 30px rgba(0, 242, 254, 0.25)',
  };

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* ── 1. Ambient Blurred Backdrop ── */}
      {mediaSrc ? (
        <>
          <Img
            src={mediaSrc}
            style={{
              position: 'absolute',
              inset: -40,
              width: 'calc(100% + 80px)',
              height: 'calc(100% + 80px)',
              objectFit: 'cover',
              filter: 'blur(50px) brightness(0.22) saturate(1.3)',
              transform: `scale(${1.15 + Math.sin(frame / 50) * 0.03})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 35%, rgba(10,12,18,0.2) 0%, rgba(5,7,12,0.85) 100%), ' +
                'linear-gradient(180deg, rgba(5,7,11,0.8) 0%, rgba(5,7,11,0.25) 45%, rgba(5,7,11,0.96) 100%)',
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: COLORS.bgDarkDeep,
          }}
        />
      )}

      {/* ── 2. Foreground Content in TikTok Safe Zone ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          paddingTop: TIKTOK_SAFE_ZONE.top,
          paddingBottom: TIKTOK_SAFE_ZONE.bottom,
          paddingLeft: TIKTOK_SAFE_ZONE.left,
          paddingRight: TIKTOK_SAFE_ZONE.right,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          zIndex: 10,
        }}
      >
        {/* Headline & Subheadline */}
        <div
          style={{
            transform: `translateY(${titleY}px) scale(${Math.max(0, entrance)})`,
            width: '100%',
            maxWidth: 860,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <h1 style={titleStyle}>{scene.headline}</h1>
          {scene.subheadline && (
            <div
              style={{
                fontFamily: FONTS.main,
                color: '#E2E8F0',
                fontSize: 24,
                fontWeight: 600,
                textAlign: 'center',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              {scene.subheadline}
            </div>
          )}
        </div>

        {/* ── Visual Media Container ── */}
        {mediaSrc && (
          <div
            style={{
              width: scene.type === 'socialProofCta' ? 620 : 840,
              height:
                scene.type === 'features'
                  ? 440
                  : scene.type === 'socialProofCta'
                    ? 500
                    : 680,
              borderRadius: 34,
              overflow: 'hidden',
              position: 'relative',
              transform: `scale(${Math.max(0, entrance)})`,
              border: `1.5px solid ${
                scene.type === 'pain'
                  ? 'rgba(255, 0, 79, 0.45)'
                  : 'rgba(0, 242, 254, 0.4)'
              }`,
              boxShadow: `0 25px 80px rgba(0,0,0,0.7), 0 0 40px ${
                scene.type === 'pain'
                  ? 'rgba(255, 0, 79, 0.25)'
                  : 'rgba(0, 242, 254, 0.22)'
              }`,
              backgroundColor: '#141823',
            }}
          >
            <Img
              src={mediaSrc}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${imageScale})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, transparent 55%, rgba(5,7,12,0.75) 100%)',
              }}
            />
          </div>
        )}

        {/* ── Specific Scene Add-ons ── */}

        {/* Scene Features: 3 Highlight cards */}
        {scene.type === 'features' && scene.features && scene.features.length > 0 && (
          <div
            style={{
              width: 840,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transform: `scale(${Math.max(0, entrance)})`,
            }}
          >
            {scene.features.slice(0, 3).map((feat, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 18px',
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    border: '1.5px solid #10B981',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
                <div style={{flex: 1}}>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 21,
                      fontWeight: 800,
                      color: '#FFFFFF',
                    }}
                  >
                    {feat.title}
                  </div>
                  {feat.description && (
                    <div
                      style={{
                        fontFamily: FONTS.main,
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#CBD5E1',
                        marginTop: 1,
                      }}
                    >
                      {feat.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scene Social Proof & CTA: High-conversion yellow button */}
        {scene.type === 'socialProofCta' && (
          <div
            style={{
              width: 840,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              transform: `scale(${Math.max(0, entrance)})`,
            }}
          >
            {scene.ratingText && (
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 22,
                  fontWeight: 800,
                  color: COLORS.accentGold,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>★★★★★</span>
                <span>{scene.ratingText}</span>
                {scene.soldText && (
                  <span style={{color: '#94A3B8', fontWeight: 600}}>
                    • {scene.soldText}
                  </span>
                )}
              </div>
            )}

            <div
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 26,
                backgroundColor: COLORS.accentYellow,
                color: '#07090E',
                textAlign: 'center',
                fontFamily: FONTS.display,
                fontSize: 25,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                transform: `scale(${pulse})`,
                boxShadow:
                  '0 15px 45px rgba(255, 230, 0, 0.4), 0 0 50px rgba(255, 230, 0, 0.25)',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <span style={{fontSize: 30}}>🛍️</span>
              <span>{scene.ctaText || 'Mở giỏ hàng góc trái xem deal ngay'}</span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
