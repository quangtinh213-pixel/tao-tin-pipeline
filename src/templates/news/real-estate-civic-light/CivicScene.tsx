import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { COLORS, FONT_BODY, FONT_HEADLINE, FONT_META, LAYOUT, TYPOGRAPHY } from './tokens';
import type { CivicImage, CivicSceneProps } from './types';

export interface CivicSceneRenderProps extends CivicSceneProps {
  durationFrames: number;
}

const resolveSrc = (image: CivicImage) =>
  image.storage === 'remote' || /^https?:\/\//i.test(image.src) ? image.src : staticFile(image.src);

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const scanEase = Easing.bezier(0.22, 1, 0.36, 1);

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

const highlightText = (text: string, highlightWords: string[] = []) => {
  if (highlightWords.length === 0) return text;
  const escaped = highlightWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return text;

  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    const isHighlight = highlightWords.some((word) => word.toLowerCase() === part.toLowerCase());
    return isHighlight ? (
      <span key={`${part}-${index}`} style={{ color: COLORS.accent, fontWeight: 900 }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const Meta: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const frame = useCurrentFrame();
  const style = appear(frame, delay, 10);

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT_META,
        fontSize: TYPOGRAPHY.meta,
        fontWeight: 900,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        color: COLORS.accent,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          background: COLORS.accent,
          display: 'inline-block',
        }}
      />
      {label}
    </div>
  );
};

const Rule: React.FC<{ delay?: number; width?: number }> = ({ delay = 0, width = 78 }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const scaleX = interpolate(f, [0, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <div
      style={{
        width,
        height: 4,
        marginTop: 28,
        marginBottom: 26,
        background: COLORS.accent,
        transform: `scaleX(${scaleX})`,
        transformOrigin: 'left center',
      }}
    />
  );
};

const Headline: React.FC<{
  text: string;
  delay?: number;
  color?: string;
  size?: number;
  maxWidth?: number;
}> = ({ text, delay = 12, color = COLORS.text, size = TYPOGRAPHY.headlineLarge, maxWidth = 760 }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        fontFamily: FONT_HEADLINE,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: 0,
        color,
        fontWeight: 700,
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={{ ...appear(frame, delay + index * 9, 24, 32), marginBottom: 3 }}>
          {line}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{
  text?: string;
  delay?: number;
  highlightWords?: string[];
  size?: number;
  weight?: number;
  maxWidth?: number;
}> = ({ text, delay = 28, highlightWords, size = TYPOGRAPHY.body, weight = 700, maxWidth = 890 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay),
        maxWidth,
        fontFamily: FONT_BODY,
        fontSize: size,
        lineHeight: 1.62,
        fontWeight: weight,
        color: COLORS.body,
      }}
    >
      {highlightText(text, highlightWords)}
    </div>
  );
};

const FramedImage: React.FC<{
  image?: CivicImage;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ image, height, delay = 42, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!image) return null;

  const container = appear(frame, delay, 12, 28);
  const reveal = interpolate(frame - delay, [0, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: scanEase,
  });
  const imageScaleX = 1 / Math.max(reveal, 0.01);
  const zoomStart = delay + 18;
  const zoomEnd = zoomStart + 170;
  const scale = interpolate(frame, [zoomStart, zoomEnd], [1.055, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <div style={{ ...container, marginTop: 34 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          borderRadius: LAYOUT.imageRadius,
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
              'linear-gradient(180deg, rgba(255,255,255,0) 58%, rgba(255,246,248,0.24) 100%), linear-gradient(90deg, rgba(240,79,100,0.12), rgba(240,79,100,0))',
            opacity: 0.48,
            mixBlendMode: 'soft-light',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT_META,
          fontSize: TYPOGRAPHY.caption,
          fontWeight: 600,
          color: COLORS.imageCaption,
        }}
      >
        Ảnh: {image.credit}
      </div>
    </div>
  );
};

const Timeline: React.FC<{
  items?: CivicSceneProps['timeline'];
  delay?: number;
}> = ({ items = [], delay = 40 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ marginTop: 48, display: 'grid', gap: 35 }}>
      {items.slice(0, 4).map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          style={{
            ...appear(frame, delay + index * 12, 16, 30),
            display: 'grid',
            gridTemplateColumns: '138px 1fr',
            gap: 22,
            alignItems: 'start',
            fontFamily: FONT_BODY,
            fontSize: 30,
            lineHeight: 1.58,
            color: COLORS.body,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              color: COLORS.accent,
              fontWeight: 900,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: COLORS.accent,
                display: 'inline-block',
              }}
            />
            {item.label}
          </div>
          <div>{item.text}</div>
        </div>
      ))}
    </div>
  );
};

const Chips: React.FC<{ chips?: string[]; delay?: number }> = ({ chips = [], delay = 34 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 34 }}>
      {chips.slice(0, 4).map((chip, index) => (
        <div
          key={chip}
          style={{
            ...appear(frame, delay + index * 8, 8, 26),
            border: `1.5px solid ${COLORS.accent}`,
            borderRadius: 999,
            padding: '9px 22px 10px',
            background: 'rgba(255, 216, 224, 0.48)',
            color: COLORS.accent,
            fontFamily: FONT_BODY,
            fontSize: TYPOGRAPHY.chip,
            fontWeight: 900,
          }}
        >
          {chip}
        </div>
      ))}
    </div>
  );
};

const QuoteBlock: React.FC<{ quote?: CivicSceneProps['quote']; delay?: number }> = ({ quote, delay = 44 }) => {
  const frame = useCurrentFrame();
  if (!quote) return null;
  const lineHeight = interpolate(frame - delay, [0, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <div
      style={{
        ...appear(frame, delay + 10, 16, 32),
        marginTop: 44,
        display: 'grid',
        gridTemplateColumns: '5px 1fr',
        gap: 26,
        maxWidth: 880,
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          background: COLORS.accent,
          transform: `scaleY(${lineHeight})`,
          transformOrigin: 'top center',
        }}
      />
      <div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 34,
            lineHeight: 1.68,
            fontStyle: 'italic',
            fontWeight: 600,
            color: COLORS.body,
          }}
        >
          "{quote.text}"
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT_META,
            fontSize: 24,
            lineHeight: 1.35,
            fontWeight: 900,
            color: COLORS.accent,
          }}
        >
          {quote.attribution}
        </div>
      </div>
    </div>
  );
};

const layoutBase: React.CSSProperties = {
  paddingLeft: LAYOUT.paddingX,
  paddingRight: LAYOUT.paddingX,
  paddingTop: LAYOUT.top,
  boxSizing: 'border-box',
};

export const CivicScene: React.FC<CivicSceneRenderProps> = ({
  durationFrames,
  variant,
  meta,
  headline,
  body,
  body2,
  highlightWords,
  image,
  imageHeight,
  timeline,
  chips,
  quote,
  cta,
  hashtags,
}) => {
  const headlineSize =
    variant === 'opening' ? TYPOGRAPHY.headlineHuge : variant === 'text' ? TYPOGRAPHY.headlineLarge : TYPOGRAPHY.headlineMedium;
  const isStat = variant === 'stat' || variant === 'chips';

  return (
    <AbsoluteFill style={layoutBase}>
      <Meta label={meta} />
      <Headline
        text={headline}
        color={isStat ? COLORS.accent : COLORS.text}
        size={isStat ? 104 : headlineSize}
        maxWidth={variant === 'opening' ? 650 : 860}
      />

      {variant === 'timeline' ? <Timeline items={timeline} /> : null}

      {variant === 'quote' ? <QuoteBlock quote={quote} /> : null}

      {variant === 'chips' ? <Chips chips={chips} /> : null}

      {variant !== 'timeline' && variant !== 'quote' ? (
        <>
          {variant === 'legal' || variant === 'stat' || variant === 'closing' ? <Rule delay={30} /> : null}
          {variant === 'closing' && cta ? (
            <Body
              text={cta}
              delay={38}
              highlightWords={[cta]}
              size={34}
              weight={900}
              maxWidth={880}
            />
          ) : null}
          <Body
            text={body}
            delay={variant === 'closing' ? 54 : variant === 'opening' ? 32 : 38}
            highlightWords={highlightWords}
            size={variant === 'opening' ? TYPOGRAPHY.bodySmall : TYPOGRAPHY.body}
            maxWidth={variant === 'text' ? 930 : 890}
          />
          <Body
            text={body2}
            delay={54}
            highlightWords={highlightWords}
            size={TYPOGRAPHY.body}
            maxWidth={variant === 'text' ? 930 : 890}
          />
          {variant !== 'closing' && cta ? (
            <Body
              text={cta}
              delay={48}
              highlightWords={[cta]}
              size={34}
              weight={900}
              maxWidth={880}
            />
          ) : null}
        </>
      ) : null}

      <FramedImage
        image={image}
        height={imageHeight ?? (variant === 'opening' ? 640 : variant === 'closing' ? 440 : 620)}
        delay={variant === 'opening' ? 46 : 58}
        durationFrames={durationFrames}
      />

      {hashtags ? (
        <div
          style={{
            position: 'absolute',
            left: LAYOUT.paddingX,
            right: LAYOUT.paddingX,
            bottom: 118,
            textAlign: 'center',
            fontFamily: FONT_BODY,
            fontSize: 24,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.62)',
          }}
        >
          {hashtags}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
