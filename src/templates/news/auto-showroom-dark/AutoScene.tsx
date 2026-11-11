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
import { ShowroomBackground } from './Layout';
import { COLORS, FONT_DISPLAY, FONT_MAIN, FONT_MONO, LAYOUT, TYPOGRAPHY } from './tokens';
import type {
  AutoCompareItem,
  AutoFeature,
  AutoIssue,
  AutoMedia,
  AutoSceneProps,
  AutoSpec,
  AutoTone,
} from './types';

export interface AutoSceneRenderProps extends AutoSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const toneColor: Record<AutoTone, string> = {
  electric: COLORS.blue,
  performance: COLORS.red,
  warning: COLORS.amber,
  neutral: COLORS.chrome,
};

const toneBg: Record<AutoTone, string> = {
  electric: COLORS.blueDim,
  performance: COLORS.redDim,
  warning: COLORS.amberDim,
  neutral: 'rgba(184, 199, 207, 0.12)',
};

const appear = (frame: number, delay: number, distance = 14, duration = 26) => {
  const f = frame - delay;
  return {
    opacity: interpolate(f, [0, duration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    }),
    transform: `translateY(${interpolate(f, [0, duration], [distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    })}px)`,
  };
};

const resolveSrc = (media: AutoMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const splitHeadline = (headline: string) =>
  headline.includes('\n') ? headline.split('\n').filter(Boolean) : [headline];

const highlightText = (text: string, accentWords: string[] = [], color: string = COLORS.blue) => {
  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return text;

  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    const isAccent = accentWords.some((word) => word.toLowerCase() === part.toLowerCase());
    return isAccent ? (
      <span key={`${part}-${index}`} style={{ color }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const Panel: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 28),
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${COLORS.faint}`,
        borderRadius: LAYOUT.panelRadius,
        background: COLORS.panel,
        boxShadow: `0 24px 70px ${COLORS.shadow}`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0) 26%, rgba(255,255,255,0.035) 100%)',
        }}
      />
      <div style={{ position: 'relative', height: '100%' }}>{children}</div>
    </div>
  );
};

const Badge: React.FC<{ label: string; tone?: AutoTone }> = ({ label, tone = 'electric' }) => {
  const frame = useCurrentFrame();
  const color = toneColor[tone];

  return (
    <div
      style={{
        ...appear(frame, 0, 8, 22),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        height: 42,
        padding: '0 16px',
        border: `1px solid ${color}99`,
        background: toneBg[tone],
        color,
        fontFamily: FONT_MONO,
        fontSize: TYPOGRAPHY.badge,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 26, height: 3, background: color, boxShadow: `0 0 18px ${color}` }} />
      {label}
    </div>
  );
};

const Headline: React.FC<{
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  tone?: AutoTone;
  hero?: boolean;
}> = ({ eyebrow, headline, accentWords, body, tone = 'electric', hero = false }) => {
  const frame = useCurrentFrame();
  const color = toneColor[tone];
  const lines = splitHeadline(headline);
  const sweep = interpolate(frame, [18, 62], [-120, 980], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <>
      {eyebrow && (
        <div
          style={{
            ...appear(frame, 12, 10, 22),
            marginTop: 28,
            fontFamily: FONT_MONO,
            fontSize: TYPOGRAPHY.eyebrow,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          marginTop: 18,
          maxWidth: 930,
          fontFamily: FONT_DISPLAY,
          fontSize: hero ? TYPOGRAPHY.headlineHero : TYPOGRAPHY.headline,
          lineHeight: 0.92,
          letterSpacing: 0,
          fontWeight: 700,
          color: COLORS.ink,
          textTransform: 'uppercase',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: sweep,
            width: 130,
            height: hero ? 210 : 150,
            background: `linear-gradient(90deg, rgba(255,255,255,0), ${color}55, rgba(255,255,255,0))`,
            filter: 'blur(10px)',
            transform: 'skewX(-18deg)',
            pointerEvents: 'none',
          }}
        />
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} style={{ ...appear(frame, 22 + index * 6, 20, 30) }}>
            {highlightText(line, accentWords, color)}
          </div>
        ))}
      </div>
      {body && (
        <div
          style={{
            ...appear(frame, 52, 12, 28),
            marginTop: 24,
            maxWidth: 890,
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.body,
            lineHeight: 1.38,
            fontWeight: 650,
            color: COLORS.body,
          }}
        >
          {body}
        </div>
      )}
    </>
  );
};

const MediaHero: React.FC<{
  media?: AutoMedia;
  height: number;
  durationFrames: number;
  delay?: number;
}> = ({ media, height, durationFrames, delay = 76 }) => {
  const frame = useCurrentFrame();
  if (!media) return <Silhouette height={height} delay={delay} />;

  const src = resolveSrc(media);
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const reveal = interpolate(frame - delay, [0, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.04, 1.01], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ ...appear(frame, delay, 18, 32), marginTop: 30 }}>
      <div
        style={{
          position: 'relative',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.panelRadius,
          border: `1px solid ${COLORS.faint}`,
          background: COLORS.panel2,
          clipPath: `inset(0 ${100 - reveal * 100}% 0 0 round ${LAYOUT.panelRadius}px)`,
          boxShadow: `0 30px 80px ${COLORS.shadow}`,
        }}
      >
        {isVideo ? (
          <Video
            src={src}
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
            src={src}
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
            left: 16,
            top: 16,
            padding: '8px 12px',
            background: COLORS.black,
            border: `1px solid ${COLORS.faint}`,
            color: COLORS.chrome2,
            fontFamily: FONT_MONO,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {media.mediaType ?? (isVideo ? 'VIDEO' : 'ẢNH')}
        </div>
      </div>
      <div style={{ marginTop: 10, fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.caption, color: COLORS.muted }}>
        Ảnh: {media.credit}
      </div>
    </div>
  );
};

const Silhouette: React.FC<{ height: number; delay?: number }> = ({ height, delay = 76 }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame - delay, [0, 50], [-220, 980], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <Panel delay={delay} style={{ marginTop: 30, height, background: COLORS.panel2 }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 88,
            right: 88,
            bottom: 78,
            height: 92,
            borderRadius: '64px 130px 42px 42px',
            border: `3px solid ${COLORS.chrome}66`,
            borderTopColor: COLORS.chrome2,
            boxShadow: `0 0 42px ${COLORS.blue}44`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 190,
            width: 210,
            bottom: 48,
            height: 62,
            borderRadius: '50%',
            border: `10px solid ${COLORS.chrome}77`,
            background: COLORS.black,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 190,
            width: 210,
            bottom: 48,
            height: 62,
            borderRadius: '50%',
            border: `10px solid ${COLORS.chrome}77`,
            background: COLORS.black,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: sweep,
            bottom: 114,
            width: 210,
            height: 18,
            background: `linear-gradient(90deg, rgba(255,255,255,0), ${COLORS.blue}, rgba(255,255,255,0))`,
            filter: 'blur(4px)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 26,
          top: 22,
          fontFamily: FONT_MONO,
          fontSize: 17,
          fontWeight: 700,
          color: COLORS.muted,
          textTransform: 'uppercase',
        }}
      >
        No source image · showroom silhouette
      </div>
    </Panel>
  );
};

const SpecGrid: React.FC<{ specs?: AutoSpec[]; delay?: number }> = ({ specs = [], delay = 82 }) => {
  if (specs.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: specs.length === 1 ? '1fr' : '1fr 1fr',
        gap: 14,
        marginTop: 28,
      }}
    >
      {specs.slice(0, 4).map((spec, index) => {
        const tone = spec.tone ?? 'neutral';
        return (
          <Panel key={`${spec.label}-${index}`} delay={delay + index * 6} style={{ padding: 20 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: TYPOGRAPHY.specLabel,
                color: COLORS.muted,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {spec.label}
            </div>
            <div
              style={{
                marginTop: 9,
                fontFamily: FONT_DISPLAY,
                fontSize: TYPOGRAPHY.specValue,
                lineHeight: 1,
                fontWeight: 700,
                color: toneColor[tone],
              }}
            >
              {spec.value}
              {spec.unit && <span style={{ fontSize: 28, color: COLORS.chrome, marginLeft: 8 }}>{spec.unit}</span>}
            </div>
            {spec.note && (
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 21, lineHeight: 1.3, color: COLORS.body }}>
                {spec.note}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
};

const Gauge: React.FC<{ specs?: AutoSpec[]; tone?: AutoTone; delay?: number }> = ({
  specs = [],
  tone = 'electric',
  delay = 92,
}) => {
  const frame = useCurrentFrame();
  if (specs.length === 0) return null;

  const color = toneColor[tone];
  const progress = interpolate(frame - delay, [0, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const primary = specs[0];

  return (
    <Panel delay={delay} style={{ marginTop: 28, height: 300, padding: 24 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: COLORS.muted, textTransform: 'uppercase' }}>
        Performance dial
      </div>
      <svg width="100%" height="190" viewBox="0 0 880 190" style={{ marginTop: 10 }}>
        <path d="M 110 160 A 330 330 0 0 1 770 160" fill="none" stroke={COLORS.faint} strokeWidth="24" strokeLinecap="round" />
        <path
          d="M 110 160 A 330 330 0 0 1 770 160"
          fill="none"
          stroke={color}
          strokeWidth="24"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress * 0.72}
        />
        <line
          x1="440"
          y1="160"
          x2={440 + Math.cos(Math.PI * (1 - progress * 0.72)) * 250}
          y2={160 - Math.sin(Math.PI * (1 - progress * 0.72)) * 250}
          stroke={COLORS.chrome2}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="440" cy="160" r="18" fill={color} />
      </svg>
      <div style={{ position: 'absolute', left: 34, bottom: 28, fontFamily: FONT_DISPLAY, fontSize: 56, fontWeight: 700, color }}>
        {primary.value}
        {primary.unit && <span style={{ fontSize: 25, color: COLORS.chrome, marginLeft: 8 }}>{primary.unit}</span>}
      </div>
      <div style={{ position: 'absolute', right: 34, bottom: 36, fontFamily: FONT_MAIN, fontSize: 22, color: COLORS.body }}>
        {primary.label}
      </div>
    </Panel>
  );
};

const FeatureList: React.FC<{ features?: AutoFeature[]; delay?: number }> = ({ features = [], delay = 82 }) => {
  if (features.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 28 }}>
      {features.slice(0, 4).map((feature, index) => {
        const tone = feature.tone ?? 'neutral';
        return (
          <Panel key={`${feature.label}-${index}`} delay={delay + index * 6} style={{ padding: 20, borderLeft: `6px solid ${toneColor[tone]}` }}>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 29, fontWeight: 850, color: COLORS.ink }}>{feature.label}</div>
            {feature.detail && (
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 23, lineHeight: 1.34, color: COLORS.body }}>
                {feature.detail}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
};

const CompareBoard: React.FC<{
  compare?: AutoSceneProps['compare'];
  delay?: number;
}> = ({ compare, delay = 84 }) => {
  if (!compare) return null;

  return (
    <Panel delay={delay} style={{ marginTop: 28, padding: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: 58,
          background: COLORS.panel2,
          borderBottom: `1px solid ${COLORS.faint}`,
          fontFamily: FONT_MONO,
          fontSize: 19,
          fontWeight: 700,
          color: COLORS.chrome2,
          textTransform: 'uppercase',
        }}
      >
        <div style={{ padding: '18px 22px', borderRight: `1px solid ${COLORS.faint}` }}>{compare.leftLabel}</div>
        <div style={{ padding: '18px 22px' }}>{compare.rightLabel}</div>
      </div>
      {compare.items.slice(0, 5).map((item: AutoCompareItem, index) => (
        <div
          key={`${item.label}-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr 1fr',
            minHeight: 64,
            alignItems: 'center',
            borderBottom: index === compare.items.length - 1 ? 'none' : `1px solid ${COLORS.faint}`,
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.table,
            color: COLORS.body,
          }}
        >
          <div style={{ padding: '0 18px', color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 17 }}>{item.label}</div>
          <div style={{ padding: '0 18px', color: item.winner === 'left' ? COLORS.blue : COLORS.ink, fontWeight: item.winner === 'left' ? 850 : 650 }}>
            {item.left}
          </div>
          <div style={{ padding: '0 18px', color: item.winner === 'right' ? COLORS.blue : COLORS.ink, fontWeight: item.winner === 'right' ? 850 : 650 }}>
            {item.right}
          </div>
        </div>
      ))}
    </Panel>
  );
};

const IssueList: React.FC<{ issues?: AutoIssue[]; delay?: number }> = ({ issues = [], delay = 84 }) => {
  if (issues.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {issues.slice(0, 4).map((issue, index) => {
        const tone = issue.tone ?? 'warning';
        return (
          <Panel
            key={`${issue.label}-${index}`}
            delay={delay + index * 7}
            style={{
              padding: 20,
              background: tone === 'warning' || tone === 'performance' ? 'rgba(34, 18, 16, 0.92)' : COLORS.panel,
              borderLeft: `7px solid ${toneColor[tone]}`,
            }}
          >
            <div style={{ fontFamily: FONT_MAIN, fontSize: 29, fontWeight: 850, color: COLORS.ink }}>{issue.label}</div>
            {issue.detail && (
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 23, lineHeight: 1.34, color: COLORS.body }}>
                {issue.detail}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
};

const QuoteBlock: React.FC<{ quote?: AutoSceneProps['quote']; delay?: number }> = ({ quote, delay = 84 }) => {
  if (!quote) return null;

  return (
    <Panel delay={delay} style={{ marginTop: 30, padding: 28, borderLeft: `7px solid ${COLORS.chrome}` }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: TYPOGRAPHY.quote, lineHeight: 1.08, color: COLORS.ink }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 18, fontFamily: FONT_MONO, fontSize: 20, color: COLORS.blue, fontWeight: 700 }}>
        {quote.source}
      </div>
      {quote.context && (
        <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 22, color: COLORS.body }}>{quote.context}</div>
      )}
    </Panel>
  );
};

const Checklist: React.FC<{ items?: string[]; delay?: number }> = ({ items = [], delay = 84 }) => {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {items.slice(0, 4).map((item, index) => (
        <Panel key={`${item}-${index}`} delay={delay + index * 7} style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                border: `1px solid ${COLORS.blue}99`,
                background: COLORS.blueDim,
                color: COLORS.blue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_MONO,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 28, lineHeight: 1.25, fontWeight: 750, color: COLORS.ink }}>
              {item}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
};

const SceneContent: React.FC<AutoSceneRenderProps> = (props) => {
  const {
    variant,
    tone = 'electric',
    badge,
    eyebrow,
    headline,
    accentWords,
    body,
    body2,
    media,
    mediaHeight,
    specs,
    features,
    compare,
    issues,
    quote,
    checklist,
    cta,
    hashtags,
    durationFrames,
  } = props;

  return (
    <AbsoluteFill
      style={{
        padding: `${LAYOUT.top}px ${LAYOUT.paddingX}px ${LAYOUT.subtitleBottom}px`,
        boxSizing: 'border-box',
      }}
    >
      <Badge label={badge} tone={tone} />
      <Headline
        eyebrow={eyebrow}
        headline={headline}
        accentWords={accentWords}
        body={body}
        tone={tone}
        hero={variant === 'showroomOpening'}
      />

      {variant === 'showroomOpening' && (
        <MediaHero media={media} height={mediaHeight ?? 440} durationFrames={durationFrames} />
      )}

      {(variant === 'priceAndLaunch' || variant === 'powertrainSpec') && <SpecGrid specs={specs} />}
      {variant === 'powertrainSpec' && <Gauge specs={specs} tone={tone} />}
      {variant === 'designFeature' && (
        <>
          <MediaHero media={media} height={mediaHeight ?? 380} durationFrames={durationFrames} />
          <FeatureList features={features} />
        </>
      )}
      {variant === 'marketPosition' && <CompareBoard compare={compare} />}
      {variant === 'safetyRecall' && <IssueList issues={issues} />}
      {variant === 'sourceQuote' && <QuoteBlock quote={quote} />}
      {variant === 'roadAhead' && <Checklist items={checklist} />}

      {body2 && (
        <Panel delay={108} style={{ marginTop: 26, padding: 22, background: COLORS.panel2 }}>
          <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.bodySmall, lineHeight: 1.36, color: COLORS.body }}>
            {body2}
          </div>
        </Panel>
      )}

      {variant === 'roadAhead' && (
        <div
          style={{
            position: 'absolute',
            left: LAYOUT.paddingX,
            right: LAYOUT.paddingX,
            bottom: 98,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 18,
            fontFamily: FONT_MONO,
            fontSize: 20,
            color: COLORS.muted,
          }}
        >
          <span>{cta ?? 'Theo dõi bản tin xe'}</span>
          {hashtags && <span style={{ color: COLORS.blue }}>{hashtags}</span>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const AutoScene: React.FC<AutoSceneRenderProps> = (props) => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <ShowroomBackground />
    <SceneContent {...props} />
  </AbsoluteFill>
);
