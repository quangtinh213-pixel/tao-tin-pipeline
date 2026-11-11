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
import { LedgerBackground } from './Layout';
import { COLORS, FONT_MAIN, FONT_MONO, FONT_SERIF, LAYOUT, TYPOGRAPHY } from './tokens';
import type {
  LedgerMedia,
  LedgerMetric,
  LedgerRow,
  LedgerSceneProps,
  LedgerTimelineItem,
  LedgerTone,
} from './types';

export interface LedgerSceneRenderProps extends LedgerSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const toneColor: Record<LedgerTone, string> = {
  gain: COLORS.green,
  loss: COLORS.red,
  watch: COLORS.gold,
  neutral: COLORS.blue,
};

const toneBg: Record<LedgerTone, string> = {
  gain: '#E6F1E8',
  loss: '#F3E1DA',
  watch: '#F1E5C8',
  neutral: '#E7EEF3',
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

const resolveSrc = (media: LedgerMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const splitHeadline = (headline: string) =>
  headline.includes('\n') ? headline.split('\n').filter(Boolean) : [headline];

const highlightText = (text: string, accentWords: string[] = [], color: string = COLORS.red) => {
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

const SectionRule: React.FC<{ section: string; dateline?: string; tone?: LedgerTone }> = ({
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
          gap: 18,
          alignItems: 'center',
          fontFamily: FONT_MONO,
          fontSize: TYPOGRAPHY.section,
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
  tone?: LedgerTone;
  hero?: boolean;
}> = ({ headline, accentWords, body, tone = 'neutral', hero = false }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(headline);
  const color = toneColor[tone];

  return (
    <>
      <div
        style={{
          marginTop: 30,
          fontFamily: FONT_SERIF,
          fontSize: hero ? TYPOGRAPHY.headlineHero : TYPOGRAPHY.headline,
          lineHeight: 0.94,
          letterSpacing: 0,
          fontWeight: 800,
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
            ...appear(frame, 50, 12, 28),
            marginTop: 24,
            maxWidth: 860,
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

const PaperCard: React.FC<{
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
        border: `1px solid ${COLORS.rule}`,
        borderRadius: LAYOUT.radius,
        background: COLORS.card,
        boxShadow: `0 18px 44px ${COLORS.shadow}`,
        ...style,
      }}
    >
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
};

const MetricCards: React.FC<{ metrics?: LedgerMetric[]; delay?: number }> = ({ metrics = [], delay = 74 }) => {
  if (metrics.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: metrics.length === 1 ? '1fr' : '1fr 1fr',
        gap: 14,
        marginTop: 30,
      }}
    >
      {metrics.slice(0, 4).map((metric, index) => {
        const tone = metric.tone ?? 'neutral';
        return (
          <PaperCard key={`${metric.label}-${index}`} delay={delay + index * 6} style={{ padding: 20 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: TYPOGRAPHY.metricLabel,
                color: COLORS.muted,
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {metric.label}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: FONT_SERIF,
                fontSize: TYPOGRAPHY.metricValue,
                lineHeight: 1,
                fontWeight: 800,
                color: toneColor[tone],
              }}
            >
              {metric.value}
            </div>
            {metric.note && (
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 21, lineHeight: 1.3, color: COLORS.body }}>
                {metric.note}
              </div>
            )}
          </PaperCard>
        );
      })}
    </div>
  );
};

const LedgerTable: React.FC<{ rows?: LedgerRow[]; delay?: number; title?: string }> = ({
  rows = [],
  delay = 84,
  title = 'Ledger',
}) => {
  if (rows.length === 0) return null;

  return (
    <PaperCard delay={delay} style={{ marginTop: 28, padding: 0 }}>
      <div
        style={{
          height: 54,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${COLORS.ruleStrong}`,
          fontFamily: FONT_MONO,
          fontSize: 18,
          fontWeight: 700,
          textTransform: 'uppercase',
          color: COLORS.navy,
          background: COLORS.cardCool,
        }}
      >
        <span>{title}</span>
        <span style={{ color: COLORS.muted }}>Value / Note</span>
      </div>
      {rows.slice(0, 5).map((row, index) => {
        const tone = row.tone ?? 'neutral';
        return (
          <div
            key={`${row.label}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 16,
              minHeight: 60,
              alignItems: 'center',
              padding: '0 20px',
              borderBottom: index === Math.min(rows.length, 5) - 1 ? 'none' : `1px solid ${COLORS.rule}`,
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.table,
            }}
          >
            <div>
              <span style={{ fontWeight: 850, color: COLORS.ink }}>{row.label}</span>
              {row.note && <span style={{ color: COLORS.muted }}> · {row.note}</span>}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, color: toneColor[tone] }}>{row.value}</div>
          </div>
        );
      })}
    </PaperCard>
  );
};

const Timeline: React.FC<{ items?: LedgerTimelineItem[]; delay?: number }> = ({ items = [], delay = 86 }) => {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {items.slice(0, 4).map((item, index) => (
        <PaperCard key={`${item.time}-${index}`} delay={delay + index * 7} style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 18, alignItems: 'start' }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.red,
              }}
            >
              {item.time}
            </div>
            <div>
              <div style={{ fontFamily: FONT_MAIN, fontSize: 27, fontWeight: 850, color: COLORS.ink }}>
                {item.label}
              </div>
              {item.detail && (
                <div style={{ marginTop: 7, fontFamily: FONT_MAIN, fontSize: 22, lineHeight: 1.32, color: COLORS.body }}>
                  {item.detail}
                </div>
              )}
            </div>
          </div>
        </PaperCard>
      ))}
    </div>
  );
};

const Checklist: React.FC<{ items?: string[]; delay?: number }> = ({ items = [], delay = 86 }) => {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 30 }}>
      {items.slice(0, 4).map((item, index) => (
        <PaperCard key={`${item}-${index}`} delay={delay + index * 7} style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: COLORS.goldSoft,
                color: COLORS.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_MONO,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 27, lineHeight: 1.26, fontWeight: 750, color: COLORS.ink }}>
              {item}
            </div>
          </div>
        </PaperCard>
      ))}
    </div>
  );
};

const MediaClip: React.FC<{
  media?: LedgerMedia;
  height: number;
  durationFrames: number;
  delay?: number;
}> = ({ media, height, durationFrames, delay = 78 }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const src = resolveSrc(media);
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const rotate = interpolate(frame - delay, [0, 32], [-1.6, -0.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.05, 1.01], {
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
          border: `10px solid ${COLORS.white}`,
          background: COLORS.white,
          boxShadow: `0 24px 54px ${COLORS.shadow}`,
          transform: `rotate(${rotate}deg)`,
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
      </div>
      <div style={{ marginTop: 16, fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.caption, color: COLORS.muted }}>
        Ảnh: {media.credit}
      </div>
    </div>
  );
};

const QuoteColumn: React.FC<{ quote?: LedgerSceneProps['quote']; delay?: number }> = ({ quote, delay = 82 }) => {
  if (!quote) return null;

  return (
    <PaperCard delay={delay} style={{ marginTop: 32, padding: 30, borderLeft: `8px solid ${COLORS.navy}` }}>
      <div style={{ fontFamily: FONT_SERIF, fontSize: TYPOGRAPHY.quote, lineHeight: 1.08, color: COLORS.ink }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 18, fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, color: COLORS.navy }}>
        {quote.source}
      </div>
      {quote.context && (
        <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 22, color: COLORS.body }}>
          {quote.context}
        </div>
      )}
    </PaperCard>
  );
};

const SceneBody: React.FC<LedgerSceneRenderProps> = (props) => {
  const {
    variant,
    tone = 'neutral',
    section,
    dateline,
    headline,
    accentWords,
    body,
    body2,
    metrics,
    rows,
    timeline,
    quote,
    media,
    mediaHeight,
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
      <SectionRule section={section} dateline={dateline} tone={tone} />
      <Headline
        headline={headline}
        accentWords={accentWords}
        body={body}
        tone={tone}
        hero={variant === 'frontPage'}
      />

      {(variant === 'frontPage' || variant === 'marketLedger' || variant === 'companySheet' || variant === 'commodityNotebook') && (
        <MetricCards metrics={metrics} />
      )}

      {(variant === 'marketLedger' || variant === 'companySheet' || variant === 'macroMemo' || variant === 'commodityNotebook') && (
        <LedgerTable rows={rows} title={variant === 'companySheet' ? 'Company Sheet' : 'Key Ledger'} />
      )}

      {variant === 'policyImpact' && <Timeline items={timeline} />}
      {variant === 'quoteColumn' && <QuoteColumn quote={quote} />}
      {variant === 'closingBrief' && <Checklist items={checklist} />}

      {media && <MediaClip media={media} height={mediaHeight ?? 420} durationFrames={durationFrames} />}

      {body2 && (
        <PaperCard delay={108} style={{ marginTop: 26, padding: 22, background: COLORS.cardCool }}>
          <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.bodySmall, lineHeight: 1.35, color: COLORS.body }}>
            {body2}
          </div>
        </PaperCard>
      )}

      {variant === 'closingBrief' && (
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
            fontSize: 19,
            color: COLORS.muted,
          }}
        >
          <span>{cta ?? 'Theo dõi bản tin kinh doanh'}</span>
          {hashtags && <span style={{ color: COLORS.red }}>{hashtags}</span>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const LedgerScene: React.FC<LedgerSceneRenderProps> = (props) => (
  <AbsoluteFill style={{ background: COLORS.paper }}>
    <LedgerBackground />
    <SceneBody {...props} />
  </AbsoluteFill>
);
