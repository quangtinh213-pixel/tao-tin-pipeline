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
import { PremiereBackground } from './Layout';
import { COLORS, FONT_DISPLAY, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type { EntertainmentMedia, EntertainmentSceneProps } from './types';

export interface EntertainmentSceneRenderProps extends EntertainmentSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveSrc = (media: EntertainmentMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const appear = (frame: number, delay: number, distance = 16, duration = 28) => {
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
      <span key={`${part}-${index}`} style={{ color: COLORS.gold, fontStyle: 'italic' }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const SectionPass: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const frame = useCurrentFrame();
  const base = appear(frame, delay, 8, 22);

  return (
    <div
      style={{
        ...base,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        height: 44,
        padding: '0 18px',
        borderRadius: 999,
        background: 'rgba(255, 247, 236, 0.08)',
        border: `1px solid ${COLORS.faint}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.section,
        fontWeight: 900,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.gold,
      }}
    >
      <span style={{ width: 28, height: 2, background: COLORS.coral, display: 'inline-block' }} />
      {label}
    </div>
  );
};

const Kicker: React.FC<{ text?: string; delay?: number }> = ({ text, delay = 16 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 10, 24),
        marginTop: 38,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.kicker,
        lineHeight: 1.15,
        fontWeight: 850,
        color: COLORS.coral,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  size?: number;
  delay?: number;
  maxWidth?: number;
}> = ({ text, accentWords, size = TYPOGRAPHY.headline, delay = 22, maxWidth = 910 }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        marginTop: 28,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 0.98,
        letterSpacing: 0,
        fontWeight: 800,
        color: COLORS.ink,
        textShadow: '0 18px 70px rgba(0,0,0,0.58)',
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={{ ...appear(frame, delay + index * 7, 18, 30) }}>
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
  maxWidth?: number;
  size?: number;
  weight?: number;
}> = ({ text, delay = 48, top = 28, maxWidth = 900, size = TYPOGRAPHY.body, weight = 650 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: top,
        maxWidth,
        fontFamily: FONT_MAIN,
        fontSize: size,
        lineHeight: 1.42,
        fontWeight: weight,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

const MediaFrame: React.FC<{
  media?: EntertainmentMedia;
  height: number;
  delay?: number;
  durationFrames: number;
  poster?: boolean;
}> = ({ media, height, delay = 58, durationFrames, poster = false }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.06, 1.015], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const reveal = interpolate(frame - delay, [0, 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const src = resolveSrc(media);

  return (
    <div style={{ ...appear(frame, delay, 22, 36), marginTop: poster ? 42 : 52 }}>
      <div
        style={{
          position: 'relative',
          width: poster ? 790 : '100%',
          height,
          marginLeft: poster ? 32 : 0,
          overflow: 'hidden',
          borderRadius: poster ? 7 : LAYOUT.imageRadius,
          background: COLORS.black,
          border: `1px solid rgba(255, 247, 236, 0.22)`,
          boxShadow: `0 34px 92px ${COLORS.shadow}, 0 0 0 10px rgba(255,247,236,0.045)`,
          clipPath: `inset(0 ${100 - reveal * 100}% 0 0 round ${poster ? 7 : LAYOUT.imageRadius}px)`,
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
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,0.34) 100%), linear-gradient(90deg, rgba(242,198,109,0.16), rgba(242,198,109,0))',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 18,
            top: 18,
            padding: '9px 13px',
            borderRadius: 999,
            background: 'rgba(13, 10, 16, 0.72)',
            border: `1px solid ${COLORS.faint}`,
            color: COLORS.gold,
            fontFamily: FONT_MAIN,
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          {media.mediaType ?? (isVideo ? 'VIDEO' : 'ẢNH')}
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          marginLeft: poster ? 34 : 0,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.caption,
          fontWeight: 700,
          color: COLORS.muted,
        }}
      >
        Nguồn: {media.credit}
      </div>
    </div>
  );
};

const FactStrip: React.FC<{ facts?: EntertainmentSceneProps['facts']; delay?: number }> = ({
  facts = [],
  delay = 62,
}) => {
  const frame = useCurrentFrame();
  if (facts.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 44,
        display: 'grid',
        gridTemplateColumns: facts.length === 1 ? '1fr' : 'repeat(2, 1fr)',
        gap: 16,
      }}
    >
      {facts.slice(0, 4).map((fact, index) => (
        <div
          key={`${fact.label}-${index}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 26),
            minHeight: 128,
            padding: '24px 24px 22px',
            background: index % 2 === 0 ? COLORS.panel : 'rgba(90, 31, 55, 0.72)',
            border: `1px solid ${COLORS.faint}`,
            borderRadius: 8,
            boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
          }}
        >
          <div
            style={{
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.factLabel,
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.gold,
            }}
          >
            {fact.label}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: FONT_DISPLAY,
              fontSize: TYPOGRAPHY.factValue,
              lineHeight: 0.96,
              fontWeight: 800,
              color: COLORS.ink,
            }}
          >
            {fact.value}
          </div>
          {fact.note ? (
            <div
              style={{
                marginTop: 12,
                fontFamily: FONT_MAIN,
                fontSize: 20,
                lineHeight: 1.25,
                fontWeight: 650,
                color: COLORS.body,
              }}
            >
              {fact.note}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const Tags: React.FC<{ tags?: string[]; delay?: number }> = ({ tags = [], delay = 58 }) => {
  const frame = useCurrentFrame();
  if (tags.length === 0) return null;

  return (
    <div style={{ marginTop: 34, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {tags.slice(0, 5).map((tag, index) => (
        <div
          key={`${tag}-${index}`}
          style={{
            ...appear(frame, delay + index * 6, 8, 22),
            padding: '10px 15px',
            borderRadius: 999,
            background: index % 2 === 0 ? COLORS.panel2 : 'rgba(241, 93, 114, 0.2)',
            border: `1px solid ${COLORS.faint}`,
            color: index % 2 === 0 ? COLORS.gold : COLORS.ink,
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.tag,
            fontWeight: 850,
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const QuoteBlock: React.FC<{ quote?: EntertainmentSceneProps['quote']; delay?: number }> = ({
  quote,
  delay = 48,
}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 14, 32),
        marginTop: 54,
        padding: '42px 42px 38px',
        background: COLORS.panel,
        border: `1px solid ${COLORS.faint}`,
        borderLeft: `10px solid ${COLORS.gold}`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.34)',
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: TYPOGRAPHY.quote,
          lineHeight: 1.12,
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        "{quote.text}"
      </div>
      <div
        style={{
          marginTop: 28,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.quoteSource,
          lineHeight: 1.3,
          fontWeight: 850,
          color: COLORS.gold,
        }}
      >
        {quote.source}
      </div>
      {quote.context ? (
        <div
          style={{
            marginTop: 6,
            fontFamily: FONT_MAIN,
            fontSize: 20,
            color: COLORS.muted,
            fontWeight: 650,
          }}
        >
          {quote.context}
        </div>
      ) : null}
    </div>
  );
};

const TimelineBlock: React.FC<{ timeline?: EntertainmentSceneProps['timeline']; delay?: number }> = ({
  timeline = [],
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (timeline.length === 0) return null;

  return (
    <div style={{ marginTop: 50 }}>
      {timeline.slice(0, 4).map((item, index) => (
        <div
          key={`${item.time}-${index}`}
          style={{
            ...appear(frame, delay + index * 9, 12, 28),
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 22,
            padding: '22px 0',
            borderTop: index === 0 ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.faint}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.timelineTime,
              fontWeight: 900,
              color: COLORS.gold,
            }}
          >
            {item.time}
          </div>
          <div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: TYPOGRAPHY.timelineLabel,
                lineHeight: 1.08,
                fontWeight: 800,
                color: COLORS.ink,
              }}
            >
              {item.label}
            </div>
            {item.detail ? (
              <div
                style={{
                  marginTop: 8,
                  fontFamily: FONT_MAIN,
                  fontSize: 21,
                  lineHeight: 1.3,
                  fontWeight: 650,
                  color: COLORS.body,
                }}
              >
                {item.detail}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const RatingBlock: React.FC<{ rating?: EntertainmentSceneProps['rating']; delay?: number }> = ({
  rating,
  delay = 50,
}) => {
  const frame = useCurrentFrame();
  if (!rating) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 30),
        marginTop: 42,
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gap: 28,
        alignItems: 'center',
        padding: '30px 34px',
        background: 'linear-gradient(135deg, rgba(90,31,55,0.92), rgba(20,12,23,0.9))',
        border: `1px solid ${COLORS.faint}`,
        color: COLORS.ink,
        boxShadow: '0 26px 80px rgba(0,0,0,0.34)',
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 86,
          lineHeight: 0.9,
          fontWeight: 800,
          color: COLORS.gold,
        }}
      >
        {rating.value}
      </div>
      <div>
        <div
          style={{
            fontFamily: FONT_MAIN,
            fontSize: 21,
            fontWeight: 900,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.coral,
          }}
        >
          {rating.label}
        </div>
        {rating.note ? (
          <div
            style={{
              marginTop: 12,
              fontFamily: FONT_MAIN,
              fontSize: 25,
              lineHeight: 1.25,
              fontWeight: 700,
              color: COLORS.body,
            }}
          >
            {rating.note}
          </div>
        ) : null}
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

export const EntertainmentScene: React.FC<EntertainmentSceneRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const {
    variant,
    durationFrames,
    section,
    headline,
    accentWords,
    kicker,
    body,
    body2,
    media,
    mediaHeight,
    facts,
    timeline,
    quote,
    rating,
    tags,
    cta,
    hashtags,
  } = props;
  const isOpening = variant === 'opening';
  const posterLike = variant === 'opening' || variant === 'media' || variant === 'gallery';
  const headlineSize = isOpening
    ? TYPOGRAPHY.headlineHero
    : variant === 'timeline' || variant === 'quote'
      ? TYPOGRAPHY.headlineSmall
      : TYPOGRAPHY.headline;

  return (
    <AbsoluteFill>
      <PremiereBackground />
      <div style={contentStyle}>
        <SectionPass label={section} />
        <Kicker text={kicker} />
        <Headline
          text={headline}
          accentWords={accentWords}
          size={headlineSize}
          maxWidth={isOpening ? 860 : 920}
        />
        <Tags tags={tags} delay={42} />

        {variant === 'quote' ? <QuoteBlock quote={quote} /> : null}
        {variant === 'timeline' ? <TimelineBlock timeline={timeline} /> : null}
        {variant === 'rank' || variant === 'review' ? <RatingBlock rating={rating} /> : null}

        {variant !== 'quote' && variant !== 'timeline' ? (
          <MediaFrame
            media={media}
            height={mediaHeight ?? (isOpening ? 590 : posterLike ? 640 : 520)}
            delay={isOpening ? 48 : 58}
            durationFrames={durationFrames}
            poster={posterLike}
          />
        ) : null}

        {body ? (
          <Body
            text={body}
            delay={media && variant !== 'quote' && variant !== 'timeline' ? 78 : 54}
            top={media && variant !== 'quote' && variant !== 'timeline' ? 32 : 28}
            size={isOpening ? 29 : TYPOGRAPHY.body}
          />
        ) : null}
        {facts ? <FactStrip facts={facts} delay={body ? 88 : 62} /> : null}
        {body2 ? <Body text={body2} delay={102} top={30} size={TYPOGRAPHY.bodySmall} weight={700} /> : null}

        {variant === 'closing' && cta ? (
          <div
            style={{
              ...appear(frame, 76, 10, 28),
              marginTop: 42,
              display: 'inline-flex',
              alignItems: 'center',
              height: 82,
              padding: '0 34px',
              background: COLORS.gold,
              color: COLORS.black,
              fontFamily: FONT_MAIN,
              fontSize: 29,
              fontWeight: 900,
              boxShadow: '0 22px 60px rgba(0,0,0,0.34)',
            }}
          >
            {cta}
          </div>
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
            fontSize: 23,
            fontWeight: 800,
            color: COLORS.gold,
            opacity: 0.5,
          }}
        >
          {hashtags}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
