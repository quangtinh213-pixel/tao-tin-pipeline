import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  Video,
} from 'remotion';
import {BeautyBackground} from './Layout';
import {
  COLORS,
  FONT_DISPLAY,
  FONT_DISPLAY_ITALIC,
  FONT_MAIN,
  LAYOUT,
  TYPOGRAPHY,
} from './tokens';
import type {
  BeautyComparisonItem,
  BeautyMedia,
  BeautyMetric,
  BeautySceneProps,
} from './types';

export interface BeautySceneRenderProps extends BeautySceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const appear = (frame: number, delay: number, distance = 16, duration = 28) => {
  const local = frame - delay;
  const progress = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
};

const resolveMedia = (media: BeautyMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src)
    ? media.src
    : staticFile(media.src);

const highlightText = (text: string, accentWords: string[] = []) => {
  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return text;

  return text.split(new RegExp(`(${escaped.join('|')})`, 'gi')).map((part, index) => {
    const active = accentWords.some((word) => word.toLocaleLowerCase() === part.toLocaleLowerCase());
    return active ? (
      <span
        key={`${part}-${index}`}
        style={{color: COLORS.rose, fontFamily: FONT_DISPLAY_ITALIC, fontWeight: 600}}
      >
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const SectionPill: React.FC<{label: string; category: string}> = ({label, category}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{...appear(frame, 0, 8, 22), display: 'flex', alignItems: 'center', gap: 14}}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          height: 45,
          padding: '0 19px',
          borderRadius: 999,
          background: 'linear-gradient(120deg, rgba(255,255,255,.92), rgba(243,218,221,.82))',
          border: '1px solid rgba(184,84,107,.24)',
          boxShadow: '0 10px 26px rgba(112,47,67,.09)',
          color: COLORS.wine,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.section,
          fontWeight: 850,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            width: 13,
            height: 18,
            borderRadius: '70% 30% 65% 35% / 65% 55% 45% 35%',
            background: `linear-gradient(145deg, ${COLORS.blush}, ${COLORS.rose})`,
            transform: 'rotate(28deg)',
          }}
        />
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT_MAIN,
          fontSize: 18,
          fontWeight: 800,
          color: COLORS.rose,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {category.replace(/-/g, ' ')}
      </div>
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  hero?: boolean;
  compact?: boolean;
}> = ({text, accentWords, hero = false, compact = false}) => {
  const frame = useCurrentFrame();
  const lines = text.includes('\n') ? text.split('\n').filter(Boolean) : [text];
  const size = hero
    ? TYPOGRAPHY.headlineHero
    : compact
      ? TYPOGRAPHY.headlineSmall
      : TYPOGRAPHY.headline;

  return (
    <div
      style={{
        marginTop: 25,
        maxWidth: 920,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 1.01,
        fontWeight: 700,
        letterSpacing: '-0.018em',
        color: COLORS.ink,
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={appear(frame, 14 + index * 7, 20, 30)}>
          {highlightText(line, accentWords)}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{text?: string; delay?: number; small?: boolean}> = ({
  text,
  delay = 44,
  small = false,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;
  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: 25,
        maxWidth: 900,
        fontFamily: FONT_MAIN,
        fontSize: small ? TYPOGRAPHY.bodySmall : TYPOGRAPHY.body,
        lineHeight: 1.38,
        fontWeight: 600,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

const MediaCard: React.FC<{
  media?: BeautyMedia;
  height: number;
  durationFrames: number;
  delay?: number;
}> = ({media, height, durationFrames, delay = 48}) => {
  const frame = useCurrentFrame();
  if (!media) return null;
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.055, 1.01], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });

  return (
    <div style={{...appear(frame, delay, 22, 34), marginTop: 36}}>
      <div
        style={{
          position: 'relative',
          height,
          overflow: 'hidden',
          borderRadius: '78px 78px 34px 34px',
          background: `radial-gradient(circle at 50% 82%, ${COLORS.champagneSoft}, ${COLORS.paperWarm} 48%, ${COLORS.paper})`,
          border: `8px solid rgba(255,253,252,.92)`,
          boxShadow: `0 30px 72px ${COLORS.shadow}, inset 0 0 0 1px rgba(184,84,107,.12)`,
        }}
      >
        {isVideo ? (
          <Video
            src={resolveMedia(media)}
            muted
            loop
            style={{
              width: '100%',
              height: '100%',
              objectFit: media.fit ?? 'cover',
              objectPosition: media.position ?? 'center',
            }}
          />
        ) : (
          <Img
            src={resolveMedia(media)}
            alt={media.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: media.fit ?? 'cover',
              objectPosition: media.position ?? 'center',
              transform: `scale(${scale})`,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            padding: '8px 13px',
            borderRadius: 999,
            background: 'rgba(255,253,252,.9)',
            color: COLORS.wine,
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          {media.mediaType ?? (isVideo ? 'VIDEO' : 'ẢNH')}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '18%',
            right: '18%',
            bottom: -28,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(197,164,109,.18)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: TYPOGRAPHY.caption,
          fontWeight: 650,
          color: COLORS.muted,
        }}
      >
        Nguồn: {media.credit}
      </div>
    </div>
  );
};

const toneColors = (tone?: BeautyMetric['tone']) => {
  if (tone === 'sage') return [COLORS.sage, COLORS.sageSoft] as const;
  if (tone === 'clinical') return [COLORS.clinical, COLORS.clinicalSoft] as const;
  if (tone === 'warning') return [COLORS.warning, COLORS.warningSoft] as const;
  return [COLORS.rose, COLORS.roseSoft] as const;
};

const MetricGrid: React.FC<{metrics?: BeautyMetric[]; delay?: number}> = ({
  metrics = [],
  delay = 54,
}) => {
  const frame = useCurrentFrame();
  if (metrics.length === 0) return null;
  return (
    <div style={{marginTop: 35, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16}}>
      {metrics.slice(0, 4).map((metric, index) => {
        const [accent, surface] = toneColors(metric.tone);
        return (
          <div
            key={`${metric.label}-${index}`}
            style={{
              ...appear(frame, delay + index * 7, 12, 26),
              minHeight: 144,
              padding: '24px 25px',
              borderRadius: '34px 34px 34px 10px',
              background: `linear-gradient(145deg, rgba(255,255,255,.86), ${surface})`,
              border: `1px solid ${accent}33`,
              boxShadow: '0 14px 32px rgba(78,45,53,.07)',
            }}
          >
            <div style={{fontSize: 18, fontWeight: 850, color: accent, textTransform: 'uppercase'}}>
              {metric.label}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: FONT_DISPLAY,
                fontSize: TYPOGRAPHY.metric,
                lineHeight: 0.95,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {metric.value}
            </div>
            {metric.note ? (
              <div style={{marginTop: 9, fontSize: 19, lineHeight: 1.25, color: COLORS.body}}>
                {metric.note}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const IngredientGrid: React.FC<{ingredients?: BeautySceneProps['ingredients']}> = ({
  ingredients = [],
}) => {
  const frame = useCurrentFrame();
  if (ingredients.length === 0) return null;
  return (
    <div style={{marginTop: 36, display: 'grid', gap: 14}}>
      {ingredients.slice(0, 4).map((ingredient, index) => {
        const accent =
          ingredient.tone === 'sage'
            ? COLORS.sage
            : ingredient.tone === 'clinical'
              ? COLORS.clinical
              : ingredient.tone === 'neutral'
                ? COLORS.champagne
                : COLORS.rose;
        return (
          <div
            key={`${ingredient.name}-${index}`}
            style={{
              ...appear(frame, 50 + index * 8, 12, 26),
              display: 'grid',
              gridTemplateColumns: '62px 1fr',
              gap: 18,
              padding: '21px 23px',
              borderRadius: index % 2 === 0 ? '42px 20px 42px 20px' : '20px 42px 20px 42px',
              background: 'linear-gradient(120deg, rgba(255,255,255,.92), rgba(255,253,252,.72))',
              border: `1px solid ${COLORS.line}`,
              boxShadow: `0 14px 32px ${COLORS.shadow}`,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '56% 44% 62% 38% / 68% 58% 42% 32%',
                display: 'grid',
                placeItems: 'center',
                background: `${accent}24`,
                border: `1px solid ${accent}66`,
                color: accent,
                fontWeight: 900,
              }}
            >
              {index + 1}
            </div>
            <div>
              <div style={{fontSize: TYPOGRAPHY.cardTitle, fontWeight: 850, color: COLORS.ink}}>
                {ingredient.name}
              </div>
              <div style={{marginTop: 5, fontSize: TYPOGRAPHY.cardBody, lineHeight: 1.3, color: COLORS.body}}>
                {ingredient.role}
              </div>
              {ingredient.note ? (
                <div style={{marginTop: 6, fontSize: 18, color: accent, fontWeight: 700}}>
                  {ingredient.note}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StepRail: React.FC<{steps?: BeautySceneProps['steps']; warning?: boolean}> = ({
  steps = [],
  warning = false,
}) => {
  const frame = useCurrentFrame();
  if (steps.length === 0) return null;
  const accent = warning ? COLORS.warning : COLORS.rose;
  const progress = interpolate(frame, [42, 86], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return (
    <div style={{position: 'relative', marginTop: 37, display: 'grid', gap: 13}}>
      <div
        style={{
          position: 'absolute',
          left: 24,
          top: 26,
          width: 2,
          height: `${Math.max(0, steps.slice(0, 5).length - 1) * 103 * progress}px`,
          background: accent,
          opacity: 0.55,
        }}
      />
      {steps.slice(0, 5).map((step, index) => (
        <div
          key={`${step.label}-${index}`}
          style={{
            ...appear(frame, 44 + index * 8, 10, 25),
            display: 'grid',
            gridTemplateColumns: '52px 1fr auto',
            gap: 18,
            alignItems: 'center',
            minHeight: 88,
            padding: '17px 21px 17px 0',
            borderRadius: '38px 18px 38px 18px',
            background:
              index === 0
                ? warning
                  ? `linear-gradient(120deg, ${COLORS.warningSoft}, rgba(255,255,255,.9))`
                  : `linear-gradient(120deg, ${COLORS.roseSoft}, rgba(255,255,255,.9))`
                : 'rgba(255,253,252,.78)',
            border: `1px solid ${COLORS.line}`,
            boxShadow: '0 11px 28px rgba(78,45,53,.06)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '58% 42% 62% 38% / 64% 55% 45% 36%',
              display: 'grid',
              placeItems: 'center',
              background: accent,
              color: COLORS.white,
              fontWeight: 900,
              zIndex: 2,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div>
            <div style={{fontSize: 27, fontWeight: 850, color: COLORS.ink}}>{step.label}</div>
            {step.detail ? (
              <div style={{marginTop: 5, fontSize: 21, lineHeight: 1.28, color: COLORS.body}}>
                {step.detail}
              </div>
            ) : null}
          </div>
          {step.meta ? (
            <div style={{fontSize: 18, fontWeight: 850, color: accent, textAlign: 'right'}}>
              {step.meta}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const ComparisonGrid: React.FC<{items?: BeautyComparisonItem[]; mythFact?: boolean}> = ({
  items = [],
  mythFact = false,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;
  const surface = (item: BeautyComparisonItem, index: number) => {
    if (item.tone === 'risk' || (mythFact && index === 0)) return [COLORS.warning, COLORS.warningSoft];
    if (item.tone === 'benefit' || mythFact) return [COLORS.sage, COLORS.sageSoft];
    return [COLORS.clinical, COLORS.clinicalSoft];
  };
  return (
    <div style={{marginTop: 38, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16}}>
      {items.slice(0, 4).map((item, index) => {
        const [accent, bg] = surface(item, index);
        return (
          <div
            key={`${item.label}-${index}`}
            style={{
              ...appear(frame, 48 + index * 8, 15, 28),
              minHeight: items.length <= 2 ? 330 : 220,
              padding: '28px 26px',
              borderRadius: index % 2 === 0 ? '58px 24px 58px 24px' : '24px 58px 24px 58px',
              background: `linear-gradient(145deg, rgba(255,255,255,.86), ${bg})`,
              border: `1px solid ${accent}44`,
              boxShadow: '0 18px 40px rgba(78,45,53,.07)',
            }}
          >
            <div style={{fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', color: accent}}>
              {item.label.toUpperCase()}
            </div>
            <div
              style={{
                marginTop: 18,
                fontFamily: FONT_DISPLAY,
                fontSize: items.length <= 2 ? 44 : 34,
                lineHeight: 1.08,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {item.value}
            </div>
            {item.detail ? (
              <div style={{marginTop: 15, fontSize: 21, lineHeight: 1.34, color: COLORS.body}}>
                {item.detail}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const QuoteCard: React.FC<{quote?: BeautySceneProps['quote']}> = ({quote}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;
  return (
    <div
      style={{
        ...appear(frame, 48, 18, 32),
        marginTop: 42,
        padding: '42px 42px 38px',
        borderRadius: '72px 24px 72px 24px',
        background: 'linear-gradient(145deg, rgba(255,255,255,.96), rgba(247,231,234,.82))',
        border: `1px solid ${COLORS.line}`,
        boxShadow: `16px 18px 0 rgba(217,143,157,.16), 0 24px 54px ${COLORS.shadow}`,
      }}
    >
      <div style={{fontFamily: FONT_DISPLAY, fontSize: 84, lineHeight: 0.5, color: COLORS.blush}}>“</div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: TYPOGRAPHY.quote,
          lineHeight: 1.13,
          fontWeight: 650,
          color: COLORS.ink,
        }}
      >
        {quote.text}
      </div>
      <div style={{marginTop: 26, height: 2, width: 80, background: COLORS.rose}} />
      <div style={{marginTop: 18, fontSize: 24, fontWeight: 850, color: COLORS.wine}}>
        {quote.source}
      </div>
      {quote.context ? (
        <div style={{marginTop: 7, fontSize: 20, lineHeight: 1.3, color: COLORS.muted}}>
          {quote.context}
        </div>
      ) : null}
    </div>
  );
};

const Gallery: React.FC<{
  media?: BeautyMedia[];
  durationFrames: number;
}> = ({media = [], durationFrames}) => {
  const frame = useCurrentFrame();
  if (media.length === 0) return null;
  return (
    <div style={{marginTop: 36, display: 'grid', gridTemplateColumns: '1.3fr .9fr', gap: 14}}>
      {media.slice(0, 3).map((item, index) => {
        const isVideo = item.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(item.src);
        const scale = interpolate(frame, [40 + index * 7, durationFrames], [1.06, 1.01], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={`${item.src}-${index}`}
            style={{
              ...appear(frame, 42 + index * 7, 18, 30),
              position: 'relative',
              height: index === 0 ? 620 : 296,
              gridRow: index === 0 ? 'span 2' : undefined,
              overflow: 'hidden',
              borderRadius: index === 0 ? '110px 30px 30px 30px' : '30px 70px 30px 30px',
              background: `linear-gradient(145deg, ${COLORS.paper}, ${COLORS.paperWarm})`,
              border: '5px solid rgba(255,253,252,.9)',
              boxShadow: '0 18px 42px rgba(78,45,53,.10)',
            }}
          >
            {isVideo ? (
              <Video src={resolveMedia(item)} muted loop style={{width: '100%', height: '100%', objectFit: item.fit ?? 'cover'}} />
            ) : (
              <Img
                src={resolveMedia(item)}
                alt={item.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: item.fit ?? 'cover',
                  objectPosition: item.position ?? 'center',
                  transform: `scale(${scale})`,
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 12,
                padding: '9px 12px',
                borderRadius: 12,
                background: 'rgba(36,28,29,.72)',
                color: COLORS.white,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Nguồn: {item.credit}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SafetyNotice: React.FC<{items?: string[]; sourceNote?: string}> = ({
  items = [],
  sourceNote,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0 && !sourceNote) return null;
  return (
    <div
      style={{
        ...appear(frame, 50, 16, 30),
        marginTop: 34,
        padding: '28px 30px',
        borderRadius: '46px 20px 46px 20px',
        background: `linear-gradient(140deg, rgba(255,255,255,.90), ${COLORS.warningSoft})`,
        border: `1px solid ${COLORS.warning}55`,
        boxShadow: '0 18px 42px rgba(199,107,81,.09)',
      }}
    >
      <div style={{fontSize: 19, fontWeight: 900, color: COLORS.warning, letterSpacing: '0.1em'}}>
        LƯU Ý AN TOÀN
      </div>
      {items.slice(0, 4).map((item, index) => (
        <div
          key={`${item}-${index}`}
          style={{marginTop: 14, display: 'grid', gridTemplateColumns: '18px 1fr', gap: 12}}
        >
          <div style={{width: 8, height: 8, marginTop: 10, borderRadius: 999, background: COLORS.warning}} />
          <div style={{fontSize: 23, lineHeight: 1.34, fontWeight: 650, color: COLORS.body}}>{item}</div>
        </div>
      ))}
      {sourceNote ? (
        <div style={{marginTop: 18, fontSize: 18, lineHeight: 1.3, color: COLORS.muted}}>
          {sourceNote}
        </div>
      ) : null}
    </div>
  );
};

const SceneMotif: React.FC<{variant: BeautySceneProps['variant']}> = ({variant}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 150], [0, 18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const isIngredient = variant === 'ingredientDecode' || variant === 'productFocus';
  const isRoutine = variant === 'routineSteps' || variant === 'treatmentTimeline';
  const isEditorial = variant === 'trendBoard' || variant === 'expertQuote';

  if (isIngredient) {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
        <div
          style={{
            position: 'absolute',
            right: 48,
            top: 580 + drift,
            width: 132,
            height: 172,
            borderRadius: '62% 38% 58% 42% / 70% 62% 38% 30%',
            border: '2px solid rgba(184,84,107,.13)',
            background: 'radial-gradient(circle at 36% 28%, rgba(255,255,255,.7), rgba(217,143,157,.08))',
            transform: 'rotate(22deg)',
          }}
        />
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              right: 92 + index * 60,
              top: 790 + (index % 2) * 70 - drift * 0.4,
              width: 30 + index * 13,
              height: 30 + index * 13,
              borderRadius: 999,
              border: '1px solid rgba(100,137,150,.18)',
              background: 'rgba(255,255,255,.28)',
            }}
          />
        ))}
      </div>
    );
  }

  if (isRoutine) {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              right: -130 - index * 54,
              bottom: 310 - index * 44,
              width: 390 + index * 120,
              height: 390 + index * 120,
              borderRadius: 999,
              border: `1px solid rgba(217,143,157,${0.13 - index * 0.025})`,
              transform: `translateY(${drift * 0.35}px)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (isEditorial) {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: 34 + index * 58,
              bottom: 280 + (index % 2) * 52,
              width: 54,
              height: 88,
              borderRadius: '70% 30% 70% 30% / 72% 42% 58% 28%',
              background: index % 2 === 0 ? 'rgba(217,143,157,.10)' : 'rgba(197,164,109,.10)',
              border: `1px solid ${index % 2 === 0 ? 'rgba(184,84,107,.14)' : 'rgba(197,164,109,.16)'}`,
              transform: `rotate(${-32 + index * 19}deg) translateY(${drift * 0.25}px)`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: -120,
        bottom: 300 + drift * 0.3,
        width: 420,
        height: 270,
        borderRadius: '50%',
        border: '1px solid rgba(197,164,109,.12)',
        transform: 'rotate(-18deg)',
        pointerEvents: 'none',
      }}
    />
  );
};

const contentStyle: React.CSSProperties = {
  position: 'absolute',
  left: LAYOUT.paddingX,
  right: LAYOUT.paddingX,
  top: LAYOUT.top,
  bottom: LAYOUT.contentBottom,
  zIndex: 2,
};

export const BeautyScene: React.FC<BeautySceneRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const {
    variant,
    category,
    section,
    eyebrow,
    headline,
    accentWords,
    body,
    body2,
    media,
    gallery,
    mediaHeight,
    ingredients,
    steps,
    metrics,
    comparison,
    quote,
    cautions,
    sourceNote,
    cta,
    hashtags,
    durationFrames,
  } = props;
  const isOpening = variant === 'beautyOpening';
  const compactHeadline = ['expertQuote', 'benefitRisk', 'mythFact', 'safetyAlert'].includes(variant);
  const showPrimaryMedia = ['beautyOpening', 'productFocus', 'beforeAfterEvidence'].includes(variant);

  return (
    <AbsoluteFill>
      <BeautyBackground />
      <SceneMotif variant={variant} />
      <div style={contentStyle}>
        <SectionPill label={section} category={category} />
        {eyebrow ? (
          <div
            style={{
              ...appear(frame, 9, 8, 24),
              marginTop: 23,
              fontSize: TYPOGRAPHY.eyebrow,
              fontWeight: 850,
              color: COLORS.rose,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <Headline
          text={headline}
          accentWords={accentWords}
          hero={isOpening}
          compact={compactHeadline}
        />
        {body && !isOpening ? <Body text={body} /> : null}

        {showPrimaryMedia ? (
          <MediaCard
            media={media}
            height={mediaHeight ?? (isOpening ? 600 : 500)}
            durationFrames={durationFrames}
          />
        ) : null}
        {variant === 'trendBoard' ? <Gallery media={gallery ?? (media ? [media] : [])} durationFrames={durationFrames} /> : null}
        {variant === 'ingredientDecode' ? <IngredientGrid ingredients={ingredients} /> : null}
        {variant === 'routineSteps' || variant === 'treatmentTimeline' ? <StepRail steps={steps} /> : null}
        {variant === 'productFocus' || variant === 'beforeAfterEvidence' ? <MetricGrid metrics={metrics} delay={62} /> : null}
        {variant === 'benefitRisk' ? <ComparisonGrid items={comparison} /> : null}
        {variant === 'mythFact' ? <ComparisonGrid items={comparison} mythFact /> : null}
        {variant === 'expertQuote' ? <QuoteCard quote={quote} /> : null}
        {variant === 'safetyAlert' ? <SafetyNotice items={cautions} sourceNote={sourceNote} /> : null}
        {variant === 'beautyClosing' ? (
          <>
            <MetricGrid metrics={metrics} />
            <StepRail steps={steps} />
            {cta ? (
              <div
                style={{
                  ...appear(frame, 76, 10, 28),
                  marginTop: 35,
                  display: 'inline-flex',
                  padding: '20px 30px',
                  borderRadius: 999,
                  background: COLORS.wine,
                  color: COLORS.white,
                  fontSize: 27,
                  fontWeight: 850,
                  boxShadow: `9px 9px 0 ${COLORS.blushSoft}`,
                }}
              >
                {cta}
              </div>
            ) : null}
          </>
        ) : null}

        {isOpening && body ? <Body text={body} delay={68} small /> : null}
        {body2 ? <Body text={body2} delay={88} small /> : null}
        {sourceNote && variant !== 'safetyAlert' ? (
          <div
            style={{
              ...appear(frame, 88, 8, 24),
              marginTop: 22,
              fontSize: 18,
              lineHeight: 1.3,
              fontWeight: 650,
              color: COLORS.muted,
            }}
          >
            {sourceNote}
          </div>
        ) : null}
      </div>

      {hashtags ? (
        <div
          style={{
            position: 'absolute',
            left: LAYOUT.paddingX,
            right: LAYOUT.paddingX,
            bottom: 125,
            textAlign: 'center',
            fontSize: 21,
            fontWeight: 750,
            color: COLORS.wine,
            opacity: 0.48,
          }}
        >
          {hashtags}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
