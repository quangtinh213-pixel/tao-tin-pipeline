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
import { BusinessTerminalBackground } from './Layout';
import { COLORS, FONT_HEADLINE, FONT_MAIN, FONT_MONO, LAYOUT, TYPOGRAPHY } from './tokens';
import type {
  BusinessMedia,
  BusinessMetric,
  BusinessRiskItem,
  BusinessSceneProps,
  BusinessTableRow,
  ChartPoint,
  MarketTone,
  TickerItem,
} from './types';

export interface BusinessSceneRenderProps extends BusinessSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const toneColor: Record<MarketTone, string> = {
  up: COLORS.green,
  down: COLORS.red,
  neutral: COLORS.cyan,
  warning: COLORS.amber,
};

const toneBg: Record<MarketTone, string> = {
  up: COLORS.greenDim,
  down: COLORS.redDim,
  neutral: 'rgba(105, 211, 215, 0.14)',
  warning: COLORS.amberDim,
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

const resolveSrc = (media: BusinessMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const splitHeadline = (headline: string) =>
  headline.includes('\n') ? headline.split('\n').filter(Boolean) : [headline];

const highlightText = (text: string, accentWords: string[] = [], color: string = COLORS.amber) => {
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
            'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 28%, rgba(255,255,255,0.035) 100%)',
        }}
      />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
};

const SectionLabel: React.FC<{ section: string; tone?: MarketTone }> = ({ section, tone = 'neutral' }) => {
  const frame = useCurrentFrame();
  const color = toneColor[tone];

  return (
    <div
      style={{
        ...appear(frame, 0, 8, 20),
        display: 'inline-grid',
        gridTemplateColumns: '10px auto',
        alignItems: 'center',
        gap: 12,
        height: 42,
        padding: '0 15px 0 10px',
        border: `1px solid ${color}88`,
        background: toneBg[tone],
        color,
        fontFamily: FONT_MONO,
        fontSize: TYPOGRAPHY.marketLabel,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 10, height: 10, background: color, display: 'block' }} />
      {section}
    </div>
  );
};

const TickerStrip: React.FC<{ items?: TickerItem[]; delay?: number }> = ({ items = [], delay = 72 }) => {
  const frame = useCurrentFrame();
  const visibleItems = items.length > 0 ? items : [
    { symbol: 'VNINDEX', value: '1.280', change: '+0,8%', tone: 'up' as const },
    { symbol: 'USD/VND', value: '25.450', change: '+20', tone: 'warning' as const },
    { symbol: 'GOLD', value: '76,8', change: '-0,3%', tone: 'down' as const },
  ];
  const slide = interpolate(frame, [0, 180], [0, -110], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'extend',
  });

  return (
    <Panel delay={delay} style={{ marginTop: 28, height: 62, background: COLORS.panel2 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          height: 62,
          transform: `translateX(${slide % 110}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {[...visibleItems, ...visibleItems].slice(0, 10).map((item, index) => {
          const tone = item.tone ?? 'neutral';
          return (
            <div
              key={`${item.symbol}-${index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                height: 62,
                padding: '0 18px',
                borderRight: `1px solid ${COLORS.faint}`,
                fontFamily: FONT_MONO,
                fontSize: TYPOGRAPHY.ticker,
                color: COLORS.ink,
              }}
            >
              <span style={{ color: COLORS.muted, fontWeight: 700 }}>{item.symbol}</span>
              {item.value && <span style={{ fontWeight: 700 }}>{item.value}</span>}
              {item.change && <span style={{ color: toneColor[tone], fontWeight: 700 }}>{item.change}</span>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const HeadlineBlock: React.FC<{
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  tone?: MarketTone;
  size?: number;
}> = ({ eyebrow, headline, accentWords, body, tone = 'neutral', size = TYPOGRAPHY.headline }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(headline);
  const color = tone === 'neutral' ? COLORS.amber : toneColor[tone];

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
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          marginTop: 18,
          maxWidth: 930,
          fontFamily: FONT_HEADLINE,
          fontSize: size,
          lineHeight: 0.94,
          letterSpacing: 0,
          fontWeight: 700,
          color: COLORS.ink,
          textTransform: 'uppercase',
        }}
      >
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} style={{ ...appear(frame, 22 + index * 6, 20, 30) }}>
            {highlightText(line, accentWords, color)}
          </div>
        ))}
      </div>
      {body && (
        <div
          style={{
            ...appear(frame, 50, 14, 26),
            marginTop: 24,
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

const MetricGrid: React.FC<{ metrics?: BusinessMetric[]; delay?: number }> = ({ metrics = [], delay = 78 }) => {
  if (metrics.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: metrics.length === 1 ? '1fr' : '1fr 1fr',
        gap: 14,
        marginTop: 28,
      }}
    >
      {metrics.slice(0, 4).map((metric, index) => {
        const tone = metric.tone ?? 'neutral';
        return (
          <Panel key={`${metric.label}-${index}`} delay={delay + index * 6} style={{ padding: 20 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: TYPOGRAPHY.metricLabel,
                fontWeight: 700,
                color: COLORS.muted,
                textTransform: 'uppercase',
              }}
            >
              {metric.label}
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: FONT_MONO,
                fontSize: TYPOGRAPHY.metricValue,
                lineHeight: 1,
                fontWeight: 700,
                color: toneColor[tone],
              }}
            >
              {metric.value}
            </div>
            {(metric.change || metric.note) && (
              <div style={{ marginTop: 9, fontFamily: FONT_MAIN, fontSize: 20, lineHeight: 1.3, color: COLORS.body }}>
                {metric.change && <span style={{ color: toneColor[tone], fontWeight: 800 }}>{metric.change}</span>}
                {metric.change && metric.note ? ' · ' : ''}
                {metric.note}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
};

const LineChart: React.FC<{ points?: ChartPoint[]; tone?: MarketTone; delay?: number; height?: number }> = ({
  points = [],
  tone = 'neutral',
  delay = 88,
  height = 330,
}) => {
  const frame = useCurrentFrame();
  if (points.length < 2) return null;

  const color = toneColor[tone];
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const width = 840;
  const chartHeight = height - 84;
  const progress = interpolate(frame - delay, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = 32 + (1 - (point.value - min) / span) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <Panel delay={delay} style={{ marginTop: 28, padding: 24, height }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: FONT_MONO,
          fontSize: TYPOGRAPHY.monoSmall,
          color: COLORS.muted,
          textTransform: 'uppercase',
        }}
      >
        <span>Price action</span>
        <span style={{ color }}>{tone === 'down' ? 'SELL PRESSURE' : tone === 'up' ? 'BID ACTIVE' : 'WATCH'}</span>
      </div>
      <svg width={width} height={height - 48} viewBox={`0 0 ${width} ${height - 48}`} style={{ marginTop: 10 }}>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1={0}
            x2={width}
            y1={32 + line * 58}
            y2={32 + line * 58}
            stroke={COLORS.gridStrong}
            strokeWidth={1}
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
        />
        {points.map((point, index) => {
          const x = (index / Math.max(1, points.length - 1)) * width;
          const y = 32 + (1 - (point.value - min) / span) * chartHeight;
          return (
            <g key={`${point.label}-${index}`} opacity={progress > index / points.length ? 1 : 0.2}>
              <circle cx={x} cy={y} r={6} fill={color} />
              <text x={x} y={height - 62} fill={COLORS.muted} fontFamily={FONT_MONO} fontSize={16} textAnchor="middle">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Panel>
  );
};

const DataTable: React.FC<{ rows?: BusinessTableRow[]; delay?: number }> = ({ rows = [], delay = 86 }) => {
  if (rows.length === 0) return null;

  return (
    <Panel delay={delay} style={{ marginTop: 26, padding: 22 }}>
      {rows.slice(0, 5).map((row, index) => {
        const tone = row.tone ?? 'neutral';
        return (
          <div
            key={`${row.label}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 16,
              alignItems: 'center',
              minHeight: 58,
              borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${COLORS.faint}`,
              fontFamily: FONT_MONO,
              fontSize: TYPOGRAPHY.tableText,
            }}
          >
            <div style={{ color: COLORS.ink, fontWeight: 700 }}>{row.label}</div>
            <div style={{ color: COLORS.body }}>{row.value}</div>
            {row.change && <div style={{ color: toneColor[tone], fontWeight: 700 }}>{row.change}</div>}
          </div>
        );
      })}
    </Panel>
  );
};

const RiskList: React.FC<{ risks?: BusinessRiskItem[]; delay?: number }> = ({ risks = [], delay = 86 }) => {
  if (risks.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {risks.slice(0, 4).map((risk, index) => {
        const tone = risk.tone ?? 'warning';
        return (
          <Panel
            key={`${risk.label}-${index}`}
            delay={delay + index * 7}
            style={{
              padding: 20,
              borderLeft: `6px solid ${toneColor[tone]}`,
              background: tone === 'down' || tone === 'warning' ? COLORS.panelWarm : COLORS.panel,
            }}
          >
            <div style={{ fontFamily: FONT_MAIN, fontSize: 29, fontWeight: 850, color: COLORS.ink }}>
              {risk.label}
            </div>
            {risk.detail && (
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 23, lineHeight: 1.34, color: COLORS.body }}>
                {risk.detail}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
};

const MediaFrame: React.FC<{
  media?: BusinessMedia;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ media, height, delay = 76, durationFrames }) => {
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
    <div style={{ ...appear(frame, delay, 18, 30), marginTop: 30 }}>
      <div
        style={{
          position: 'relative',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.panelRadius,
          border: `1px solid ${COLORS.faint}`,
          background: COLORS.panel2,
          clipPath: `inset(0 ${100 - reveal * 100}% 0 0 round ${LAYOUT.panelRadius}px)`,
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
            color: COLORS.amber,
            fontFamily: FONT_MONO,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {media.mediaType ?? (isVideo ? 'VIDEO' : 'ẢNH')}
        </div>
      </div>
      <div style={{ marginTop: 10, fontFamily: FONT_MAIN, fontSize: 18, color: COLORS.muted }}>
        Ảnh: {media.credit}
      </div>
    </div>
  );
};

const QuoteBlock: React.FC<{ quote?: BusinessSceneProps['quote']; delay?: number }> = ({ quote, delay = 84 }) => {
  if (!quote) return null;

  return (
    <Panel delay={delay} style={{ marginTop: 30, padding: 28, borderLeft: `6px solid ${COLORS.amber}` }}>
      <div style={{ fontFamily: FONT_HEADLINE, fontSize: TYPOGRAPHY.quote, lineHeight: 1.05, color: COLORS.ink }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 18, fontFamily: FONT_MONO, fontSize: 20, color: COLORS.amber, fontWeight: 700 }}>
        {quote.source}
      </div>
      {quote.context && (
        <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 22, color: COLORS.body }}>
          {quote.context}
        </div>
      )}
    </Panel>
  );
};

const OutlookList: React.FC<{ items?: string[]; delay?: number }> = ({ items = [], delay = 84 }) => {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
      {items.slice(0, 4).map((item, index) => (
        <Panel key={`${item}-${index}`} delay={delay + index * 7} style={{ padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: COLORS.amberDim,
                border: `1px solid ${COLORS.amber}88`,
                color: COLORS.amber,
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

const VariantContent: React.FC<BusinessSceneRenderProps> = (props) => {
  const {
    variant,
    tone = 'neutral',
    section,
    eyebrow,
    headline,
    accentWords,
    body,
    body2,
    ticker,
    metrics,
    chart,
    table,
    risks,
    quote,
    media,
    mediaHeight,
    outlook,
    cta,
    hashtags,
    durationFrames,
  } = props;
  const headlineSize = variant === 'marketOpening' ? TYPOGRAPHY.headlineHero : TYPOGRAPHY.headline;

  return (
    <AbsoluteFill
      style={{
        padding: `${LAYOUT.top}px ${LAYOUT.paddingX}px ${LAYOUT.subtitleBottom}px`,
        boxSizing: 'border-box',
      }}
    >
      <SectionLabel section={section} tone={tone} />
      <HeadlineBlock
        eyebrow={eyebrow}
        headline={headline}
        accentWords={accentWords}
        body={body}
        tone={tone}
        size={headlineSize}
      />

      {variant === 'marketOpening' && <TickerStrip items={ticker} />}

      {variant !== 'riskWatch' && variant !== 'closingOutlook' ? (
        <MetricGrid metrics={metrics} />
      ) : null}

      {(variant === 'indexMove' || variant === 'commodityPrice' || variant === 'macroSignal') && (
        <LineChart points={chart} tone={tone} />
      )}

      {(variant === 'companyEarnings' || variant === 'macroSignal') && <DataTable rows={table} />}

      {variant === 'riskWatch' && <RiskList risks={risks} />}

      {variant === 'sourceQuote' && <QuoteBlock quote={quote} />}

      {media && <MediaFrame media={media} height={mediaHeight ?? 430} durationFrames={durationFrames} />}

      {body2 && (
        <Panel delay={108} style={{ marginTop: 26, padding: 22, background: COLORS.panel2 }}>
          <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.bodySmall, lineHeight: 1.36, color: COLORS.body }}>
            {body2}
          </div>
        </Panel>
      )}

      {variant === 'closingOutlook' && (
        <>
          <OutlookList items={outlook} />
          <div
            style={{
              position: 'absolute',
              left: LAYOUT.paddingX,
              right: LAYOUT.paddingX,
              bottom: 98,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 18,
              alignItems: 'center',
              fontFamily: FONT_MONO,
              fontSize: 20,
              color: COLORS.muted,
            }}
          >
            <span>{cta ?? 'Theo dõi bản tin thị trường'}</span>
            {hashtags && <span style={{ color: COLORS.amber }}>{hashtags}</span>}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const BusinessScene: React.FC<BusinessSceneRenderProps> = (props) => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <BusinessTerminalBackground />
    <VariantContent {...props} />
  </AbsoluteFill>
);
