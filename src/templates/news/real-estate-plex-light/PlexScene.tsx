import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { GridBackground } from './Layout';
import { COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type { PlexImage, PlexSceneProps } from './types';

export interface PlexSceneRenderProps extends PlexSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const scanEase = Easing.bezier(0.22, 1, 0.36, 1);

const resolveSrc = (image: PlexImage) =>
  image.storage === 'remote' || /^https?:\/\//i.test(image.src) ? image.src : staticFile(image.src);

const appear = (frame: number, delay: number, distance = 18, duration = 28) => {
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

const splitHeadline = (headline: string) =>
  headline.includes('\n') ? headline.split('\n').filter(Boolean) : [headline];

const highlightText = (text: string, accentWords: string[] = []) => {
  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return text;

  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    const isAccent = accentWords.some((word) => word.toLowerCase() === part.toLowerCase());
    return isAccent ? (
      <span key={`${part}-${index}`} style={{ color: COLORS.accent }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const MetaLabel: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, delay, 8, 24),
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.meta,
        fontWeight: 500,
        lineHeight: 1,
        color: COLORS.accent,
      }}
    >
      <span
        style={{
          width: 56,
          height: 2,
          background: COLORS.accent,
          opacity: 0.7,
          display: 'inline-block',
        }}
      />
      {label}
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  size?: number;
  delay?: number;
  maxWidth?: number;
}> = ({
  text,
  accentWords,
  size = TYPOGRAPHY.headline,
  delay = 18,
  maxWidth = 930,
}) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        marginTop: 70,
        fontFamily: FONT_MAIN,
        fontSize: size,
        lineHeight: 1.14,
        letterSpacing: 0,
        fontWeight: 400,
        color: COLORS.ink,
      }}
    >
      {lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            ...appear(frame, delay + index * 7, 18, 30),
            marginBottom: 0,
          }}
        >
          {highlightText(line, accentWords)}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{
  text?: string;
  delay?: number;
  top?: number;
  size?: number;
  weight?: number;
  maxWidth?: number;
  centered?: boolean;
}> = ({
  text,
  delay = 46,
  top = 34,
  size = TYPOGRAPHY.body,
  weight = 500,
  maxWidth = 930,
  centered = false,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: top,
        maxWidth,
        textAlign: centered ? 'center' : 'left',
        fontFamily: FONT_MAIN,
        fontSize: size,
        lineHeight: 1.45,
        fontWeight: weight,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

const Hairline: React.FC<{ delay?: number; top?: number; bottom?: number }> = ({
  delay = 48,
  top = 42,
  bottom = 42,
}) => {
  const frame = useCurrentFrame();
  const scaleX = interpolate(frame - delay, [0, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <div
      style={{
        marginTop: top,
        marginBottom: bottom,
        width: '100%',
        height: 1,
        background: COLORS.rule,
        transform: `scaleX(${scaleX})`,
        transformOrigin: 'left center',
      }}
    />
  );
};

const NewsImage: React.FC<{
  image?: PlexImage;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ image, height, delay = 58, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!image) return null;

  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.045, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const reveal = interpolate(frame - delay, [0, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: scanEase,
  });
  const imageScaleX = 1 / Math.max(reveal, 0.01);

  return (
    <div style={{ ...appear(frame, delay, 18, 34), marginTop: 72 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          background: COLORS.accentSoft,
          transform: `scaleX(${reveal})`,
          transformOrigin: 'left center',
        }}
      >
        <Img
          src={resolveSrc(image)}
          alt={image.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: image.fit ?? 'cover',
            objectPosition: image.position ?? 'center',
            transform: `scaleX(${imageScaleX}) scale(${scale})`,
            transformOrigin: 'left center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(180deg, rgba(252,253,255,0) 62%, rgba(252,253,255,0.22) 100%), linear-gradient(90deg, rgba(18,101,255,0.12), rgba(18,101,255,0))',
            opacity: 0.52,
            mixBlendMode: 'soft-light',
          }}
        />
      </div>
      {image.credit ? (
        <div
          style={{
            marginTop: 12,
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.caption,
            fontWeight: 400,
            color: COLORS.muted,
          }}
        >
          Ảnh: {image.credit}
        </div>
      ) : null}
    </div>
  );
};

const StatusRows: React.FC<{ rows?: PlexSceneProps['rows']; delay?: number }> = ({
  rows = [],
  delay = 66,
}) => {
  const frame = useCurrentFrame();
  if (rows.length === 0) return null;

  return (
    <div style={{ marginTop: 46 }}>
      <Hairline delay={delay - 12} top={0} bottom={0} />
      {rows.slice(0, 4).map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            height: 138,
            borderBottom: `1px solid rgba(31, 32, 35, 0.07)`,
            display: 'grid',
            gridTemplateColumns: '1fr 250px',
            gap: 24,
            alignItems: 'center',
            fontFamily: FONT_MAIN,
          }}
        >
          <div
            style={{
              fontSize: TYPOGRAPHY.rowTitle,
              lineHeight: 1,
              fontWeight: 400,
              color: COLORS.ink,
            }}
          >
            {row.label}
          </div>
          <div
            style={{
              textAlign: 'right',
              fontSize: TYPOGRAPHY.rowMeta,
              lineHeight: 1.1,
              fontWeight: row.accent ? 700 : 500,
              color: row.accent ? COLORS.accent : COLORS.body,
              textTransform: 'uppercase',
            }}
          >
            {row.status}
          </div>
        </div>
      ))}
    </div>
  );
};

const FeatureList: React.FC<{ items?: PlexSceneProps['items']; delay?: number }> = ({
  items = [],
  delay = 62,
}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ marginTop: 48, display: 'grid', gap: 25 }}>
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.label}-${item.text}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            display: 'grid',
            gridTemplateColumns: '52px 1fr',
            alignItems: 'baseline',
            gap: 28,
            fontFamily: FONT_MAIN,
          }}
        >
          <div
            style={{
              fontSize: TYPOGRAPHY.listIndex,
              fontWeight: 500,
              lineHeight: 1,
              color: COLORS.accent,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontSize: TYPOGRAPHY.listText,
              lineHeight: 1.22,
              fontWeight: 500,
              color: COLORS.ink,
            }}
          >
            {item.text}
          </div>
        </div>
      ))}
    </div>
  );
};

const MetricBlock: React.FC<{ metric?: PlexSceneProps['metric']; delay?: number }> = ({
  metric,
  delay = 30,
}) => {
  const frame = useCurrentFrame();
  if (!metric) return null;

  return (
    <div style={{ ...appear(frame, delay, 18, 34), marginTop: 96 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <div
          style={{
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.metric,
            lineHeight: 0.9,
            fontWeight: 400,
            color: COLORS.ink,
          }}
        >
          {metric.value}
        </div>
        {metric.unit ? (
          <div
            style={{
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.metricUnit,
              lineHeight: 1,
              fontWeight: 400,
              color: COLORS.body,
            }}
          >
            {metric.unit}
          </div>
        ) : null}
      </div>
      {metric.caption ? <Body text={metric.caption} delay={delay + 12} top={28} size={31} /> : null}
    </div>
  );
};

const QuoteBlock: React.FC<{ quote?: PlexSceneProps['quote']; delay?: number }> = ({
  quote,
  delay = 34,
}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  const lineScale = interpolate(frame - delay - 18, [0, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <div style={{ marginTop: 60, fontFamily: FONT_MAIN }}>
      <div
        style={{
          ...appear(frame, delay, 8, 26),
          fontSize: TYPOGRAPHY.quoteMark,
          lineHeight: 0.7,
          fontWeight: 700,
          color: COLORS.accent,
        }}
      >
        "
      </div>
      <div
        style={{
          ...appear(frame, delay + 14, 16, 34),
          marginTop: 84,
          maxWidth: 940,
          fontSize: TYPOGRAPHY.quote,
          lineHeight: 1.34,
          fontWeight: 400,
          color: COLORS.ink,
        }}
      >
        {quote.text}
      </div>
      <div
        style={{
          ...appear(frame, delay + 34, 10, 28),
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: '3px 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            width: 3,
            height: 74,
            background: COLORS.accent,
            transform: `scaleY(${lineScale})`,
            transformOrigin: 'top center',
          }}
        />
        <div>
          <div style={{ fontSize: 25, fontWeight: 700, color: COLORS.ink }}>
            {quote.name}
          </div>
          {quote.title ? (
            <div style={{ marginTop: 8, fontSize: 21, fontWeight: 400, color: COLORS.body }}>
              {quote.title}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const contentStyle: React.CSSProperties = {
  position: 'absolute',
  left: LAYOUT.paddingX,
  right: LAYOUT.paddingX,
  top: LAYOUT.top,
};

export const PlexScene: React.FC<PlexSceneRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const {
    variant,
    durationFrames,
    meta,
    headline,
    accentWords,
    body,
    body2,
    image,
    imageHeight,
    rows,
    items,
    metric,
    quote,
    cta,
    hashtags,
  } = props;
  const isImage = variant === 'image';
  const isClosing = variant === 'closing';
  const headlineSize =
    isImage ? TYPOGRAPHY.headlineHero : variant === 'status' || variant === 'list' ? TYPOGRAPHY.headlineSmall : TYPOGRAPHY.headline;

  return (
    <AbsoluteFill>
      <GridBackground />
      <div style={contentStyle}>
        <MetaLabel label={meta} />
        {variant === 'route' ? (
          <MetricBlock metric={metric} />
        ) : (
          <Headline
            text={headline}
            accentWords={accentWords}
            size={headlineSize}
            maxWidth={isImage ? 840 : 930}
          />
        )}

        {variant === 'route' && body ? <Body text={body} delay={46} top={32} size={32} /> : null}
        {variant === 'route' ? <Hairline delay={64} top={70} bottom={0} /> : null}
        {variant === 'route' && body2 ? <Body text={body2} delay={78} top={56} size={33} maxWidth={920} /> : null}

        {variant === 'image' || variant === 'text' ? (
          <NewsImage
            image={image}
            height={imageHeight ?? (isImage ? 630 : 610)}
            delay={isImage ? 56 : 54}
            durationFrames={durationFrames}
          />
        ) : null}

        {variant === 'text' && body ? <Body text={body} delay={70} top={64} centered size={32} weight={700} /> : null}
        {variant === 'status' ? <StatusRows rows={rows} /> : null}
        {variant === 'list' ? <FeatureList items={items} /> : null}
        {variant === 'quote' ? <QuoteBlock quote={quote} /> : null}

        {isClosing ? (
          <>
            <Hairline delay={48} top={54} bottom={44} />
            {body ? <Body text={body} delay={60} top={0} size={34} maxWidth={900} /> : null}
            {cta ? (
              <div
                style={{
                  ...appear(frame, 74, 10, 28),
                  marginTop: 46,
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 86,
                  padding: '0 40px',
                  background: COLORS.accent,
                  color: COLORS.white,
                  fontFamily: FONT_MAIN,
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {cta} →
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {hashtags ? (
        <div
          style={{
            position: 'absolute',
            left: LAYOUT.paddingX,
            right: LAYOUT.paddingX,
            bottom: 132,
            textAlign: 'center',
            fontFamily: FONT_MAIN,
            fontSize: 24,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {hashtags}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
