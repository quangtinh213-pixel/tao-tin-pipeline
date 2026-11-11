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
import { AutoMarketBackground } from './Layout';
import { COLORS, FONT_HEADLINE, FONT_MAIN, FONT_MONO, LAYOUT, TYPOGRAPHY } from './tokens';
import type {
  AutoMarketCompareRow,
  AutoMarketMedia,
  AutoMarketMetric,
  AutoMarketReason,
  AutoMarketSceneProps,
  AutoMarketTimelineItem,
  AutoMarketTone,
} from './types';

export interface AutoMarketSceneRenderProps extends AutoMarketSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const toneColor: Record<AutoMarketTone, string> = {
  growth: COLORS.green,
  decline: COLORS.red,
  shift: COLORS.blue,
  watch: COLORS.amber,
  neutral: COLORS.navy,
};

const toneBg: Record<AutoMarketTone, string> = {
  growth: '#E2F1E8',
  decline: '#F5E1DE',
  shift: '#E1EDF4',
  watch: '#F3E7CE',
  neutral: '#E8EEEE',
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

const resolveSrc = (media: AutoMarketMedia) =>
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

const SectionHeader: React.FC<{ section: string; dateline?: string; tone?: AutoMarketTone }> = ({
  section,
  dateline,
  tone = 'neutral',
}) => {
  const frame = useCurrentFrame();
  const color = toneColor[tone];

  return (
    <div style={{ ...appear(frame, 0, 8, 22), display: 'grid', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 18,
          fontFamily: FONT_MONO,
          fontSize: TYPOGRAPHY.label,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
        }}
      >
        <span>{section}</span>
        {dateline && <span style={{ color: COLORS.muted }}>{dateline}</span>}
      </div>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${COLORS.rule})` }} />
    </div>
  );
};

const Headline: React.FC<{
  headline: string;
  accentWords?: string[];
  body?: string;
  tone?: AutoMarketTone;
  hero?: boolean;
}> = ({ headline, accentWords, body, tone = 'neutral', hero = false }) => {
  const frame = useCurrentFrame();
  const color = toneColor[tone];
  const lines = splitHeadline(headline);

  return (
    <>
      <div
        style={{
          marginTop: 28,
          maxWidth: 900,
          fontFamily: FONT_HEADLINE,
          fontSize: hero ? TYPOGRAPHY.headlineHero : TYPOGRAPHY.headline,
          lineHeight: 0.94,
          letterSpacing: 0,
          fontWeight: 700,
          textTransform: 'uppercase',
          color: COLORS.ink,
        }}
      >
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} style={{ ...appear(frame, 18 + index * 7, 18, 30) }}>
            {highlightText(line, accentWords, color)}
          </div>
        ))}
      </div>
      {body && (
        <div
          style={{
            ...appear(frame, 52, 12, 28),
            marginTop: 22,
            maxWidth: 880,
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

const Card: React.FC<{ children: React.ReactNode; delay?: number; style?: React.CSSProperties }> = ({
  children,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 28),
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${COLORS.rule}`,
        borderRadius: LAYOUT.radius,
        background: COLORS.card,
        boxShadow: `0 18px 42px ${COLORS.shadow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Metrics: React.FC<{ metrics?: AutoMarketMetric[]; delay?: number }> = ({ metrics = [], delay = 74 }) => {
  if (metrics.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: metrics.length === 1 ? '1fr' : '1fr 1fr', gap: 14, marginTop: 28 }}>
      {metrics.slice(0, 4).map((metric, index) => {
        const tone = metric.tone ?? 'neutral';
        return (
          <Card key={`${metric.label}-${index}`} delay={delay + index * 6} style={{ padding: 20, background: toneBg[tone] }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: TYPOGRAPHY.metricLabel, color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase' }}>
              {metric.label}
            </div>
            <div style={{ marginTop: 8, fontFamily: FONT_HEADLINE, fontSize: TYPOGRAPHY.metricValue, lineHeight: 1, fontWeight: 700, color: toneColor[tone] }}>
              {metric.value}
            </div>
            {metric.note && (
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 21, lineHeight: 1.3, color: COLORS.body }}>
                {metric.note}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

const MediaCard: React.FC<{
  media?: AutoMarketMedia;
  height: number;
  durationFrames: number;
  delay?: number;
}> = ({ media, height, durationFrames, delay = 82 }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const src = resolveSrc(media);
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const reveal = interpolate(frame - delay, [0, 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.04, 1.01], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ ...appear(frame, delay, 18, 32), marginTop: 28 }}>
      <div
        style={{
          position: 'relative',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.radius,
          border: `1px solid ${COLORS.rule}`,
          background: COLORS.cardCool,
          clipPath: `inset(0 ${100 - reveal * 100}% 0 0 round ${LAYOUT.radius}px)`,
        }}
      >
        {isVideo ? (
          <Video src={src} muted loop style={{ width: '100%', height: '100%', objectFit: media.fit ?? 'cover', objectPosition: media.position ?? 'center' }} />
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
            background: COLORS.ink,
            color: COLORS.white,
            fontFamily: FONT_MONO,
            fontSize: 16,
            fontWeight: 700,
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

const ReasonGrid: React.FC<{ reasons?: AutoMarketReason[]; delay?: number }> = ({ reasons = [], delay = 84 }) => {
  if (reasons.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {reasons.slice(0, 4).map((reason, index) => {
        const tone = reason.tone ?? 'neutral';
        return (
          <Card key={`${reason.label}-${index}`} delay={delay + index * 7} style={{ padding: 20, borderLeft: `7px solid ${toneColor[tone]}` }}>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 29, fontWeight: 850, color: COLORS.ink }}>{reason.label}</div>
            {reason.detail && <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 23, lineHeight: 1.34, color: COLORS.body }}>{reason.detail}</div>}
          </Card>
        );
      })}
    </div>
  );
};

const Timeline: React.FC<{ items?: AutoMarketTimelineItem[]; delay?: number }> = ({ items = [], delay = 84 }) => {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {items.slice(0, 5).map((item, index) => {
        const tone = item.tone ?? 'neutral';
        return (
          <Card key={`${item.time}-${index}`} delay={delay + index * 7} style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 18, alignItems: 'start' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: toneColor[tone] }}>{item.time}</div>
              <div>
                <div style={{ fontFamily: FONT_MAIN, fontSize: 28, fontWeight: 850, color: COLORS.ink }}>{item.label}</div>
                {item.detail && <div style={{ marginTop: 7, fontFamily: FONT_MAIN, fontSize: 22, lineHeight: 1.32, color: COLORS.body }}>{item.detail}</div>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const CompareTable: React.FC<{ rows?: AutoMarketCompareRow[]; delay?: number }> = ({ rows = [], delay = 84 }) => {
  if (rows.length === 0) return null;

  return (
    <Card delay={delay} style={{ marginTop: 28, padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 58, background: COLORS.cardCool, borderBottom: `1px solid ${COLORS.ruleStrong}`, fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: COLORS.navy, textTransform: 'uppercase' }}>
        <div style={{ padding: '18px 20px', borderRight: `1px solid ${COLORS.rule}` }}>Trước</div>
        <div style={{ padding: '18px 20px' }}>Sau / Hiện tại</div>
      </div>
      {rows.slice(0, 5).map((row, index) => {
        const tone = row.tone ?? 'neutral';
        return (
          <div key={`${row.label}-${index}`} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', minHeight: 62, alignItems: 'center', borderBottom: index === Math.min(rows.length, 5) - 1 ? 'none' : `1px solid ${COLORS.rule}`, fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.table }}>
            <div style={{ padding: '0 18px', color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 17 }}>{row.label}</div>
            <div style={{ padding: '0 18px', color: COLORS.body }}>{row.before}</div>
            <div style={{ padding: '0 18px', color: toneColor[tone], fontWeight: 850 }}>{row.after}</div>
          </div>
        );
      })}
    </Card>
  );
};

const QuoteBlock: React.FC<{ quote?: AutoMarketSceneProps['quote']; delay?: number }> = ({ quote, delay = 84 }) => {
  if (!quote) return null;

  return (
    <Card delay={delay} style={{ marginTop: 30, padding: 28, borderLeft: `8px solid ${COLORS.blue}` }}>
      <div style={{ fontFamily: FONT_HEADLINE, fontSize: TYPOGRAPHY.quote, lineHeight: 1.08, color: COLORS.ink }}>"{quote.text}"</div>
      <div style={{ marginTop: 18, fontFamily: FONT_MONO, fontSize: 20, color: COLORS.blue, fontWeight: 700 }}>{quote.source}</div>
      {quote.context && <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 22, color: COLORS.body }}>{quote.context}</div>}
    </Card>
  );
};

const Checklist: React.FC<{ items?: string[]; delay?: number }> = ({ items = [], delay = 84 }) => {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {items.slice(0, 4).map((item, index) => (
        <Card key={`${item}-${index}`} delay={delay + index * 7} style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: COLORS.cardCool, border: `1px solid ${COLORS.ruleStrong}`, color: COLORS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700 }}>
              {index + 1}
            </div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 28, lineHeight: 1.25, fontWeight: 750, color: COLORS.ink }}>{item}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const SceneContent: React.FC<AutoMarketSceneRenderProps> = (props) => {
  const {
    variant,
    tone = 'neutral',
    section,
    dateline,
    headline,
    accentWords,
    body,
    body2,
    media,
    mediaHeight,
    metrics,
    reasons,
    timeline,
    compareRows,
    quote,
    checklist,
    cta,
    hashtags,
    durationFrames,
  } = props;

  return (
    <AbsoluteFill style={{ padding: `${LAYOUT.top}px ${LAYOUT.paddingX}px ${LAYOUT.subtitleBottom}px`, boxSizing: 'border-box' }}>
      <SectionHeader section={section} dateline={dateline} tone={tone} />
      <Headline headline={headline} accentWords={accentWords} body={body} tone={tone} hero={variant === 'marketOpening'} />

      {(variant === 'marketOpening' || variant === 'launchBrief' || variant === 'priceShift') && <Metrics metrics={metrics} />}
      {media && <MediaCard media={media} height={mediaHeight ?? 390} durationFrames={durationFrames} />}
      {(variant === 'evTrendExplainer' || variant === 'consumerChoice' || variant === 'policyImpact') && <ReasonGrid reasons={reasons} />}
      {variant === 'discontinuedTimeline' && <Timeline items={timeline} />}
      {variant === 'priceShift' && <CompareTable rows={compareRows} />}
      {variant === 'sourceQuote' && <QuoteBlock quote={quote} />}
      {variant === 'closingWatchlist' && <Checklist items={checklist} />}

      {body2 && (
        <Card delay={108} style={{ marginTop: 26, padding: 22, background: COLORS.cardCool }}>
          <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.bodySmall, lineHeight: 1.35, color: COLORS.body }}>{body2}</div>
        </Card>
      )}

      {variant === 'closingWatchlist' && (
        <div style={{ position: 'absolute', left: LAYOUT.paddingX, right: LAYOUT.paddingX, bottom: 98, display: 'flex', justifyContent: 'space-between', gap: 18, fontFamily: FONT_MONO, fontSize: 19, color: COLORS.muted }}>
          <span>{cta ?? 'Theo dõi bản tin thị trường xe'}</span>
          {hashtags && <span style={{ color: COLORS.blue }}>{hashtags}</span>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const AutoMarketScene: React.FC<AutoMarketSceneRenderProps> = (props) => (
  <AbsoluteFill style={{ background: COLORS.paper }}>
    <AutoMarketBackground />
    <SceneContent {...props} />
  </AbsoluteFill>
);
