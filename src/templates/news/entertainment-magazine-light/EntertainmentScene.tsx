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
import { MagazineBackground } from './Layout';
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
      <span key={`${part}-${index}`} style={{ color: COLORS.coralDark, fontStyle: 'italic' }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const SectionTicket: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, delay, 8, 22),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        height: 46,
        padding: '0 20px',
        background: COLORS.ticket,
        border: `1px solid rgba(32, 22, 30, 0.14)`,
        boxShadow: `8px 8px 0 rgba(230, 79, 106, 0.18)`,
        transform: `${appear(frame, delay, 8, 22).transform} rotate(-1.5deg)`,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.section,
        fontWeight: 900,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLORS.plum,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 999, background: COLORS.coral }} />
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
        fontWeight: 800,
        color: COLORS.coralDark,
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
        marginTop: 26,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 0.98,
        letterSpacing: 0,
        fontWeight: 800,
        color: COLORS.ink,
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

  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.055, 1.01], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const rotate = interpolate(frame - delay, [0, 34], [poster ? -2.5 : 0.8, poster ? -1.2 : 0], {
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
          width: poster ? 780 : '100%',
          height,
          marginLeft: poster ? 36 : 0,
          overflow: 'hidden',
          borderRadius: poster ? 8 : LAYOUT.imageRadius,
          background: COLORS.white,
          border: `10px solid ${COLORS.white}`,
          boxShadow: `0 28px 70px ${COLORS.shadow}`,
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
        <div
          style={{
            position: 'absolute',
            left: 18,
            top: 18,
            padding: '9px 13px',
            borderRadius: 999,
            background: 'rgba(255, 248, 243, 0.92)',
            color: COLORS.plum,
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
          marginLeft: poster ? 38 : 0,
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
            background: index % 2 === 0 ? COLORS.white : COLORS.ticket,
            border: `1px solid ${COLORS.faint}`,
            borderRadius: 4,
            boxShadow: `8px 8px 0 rgba(74, 35, 61, 0.06)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.factLabel,
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.coralDark,
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
            background: index % 2 === 0 ? COLORS.plum : COLORS.coral,
            color: COLORS.white,
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
        background: COLORS.white,
        borderLeft: `12px solid ${COLORS.coral}`,
        boxShadow: `16px 16px 0 rgba(214, 216, 75, 0.42)`,
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
          color: COLORS.coralDark,
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
            borderTop: index === 0 ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.faint}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.timelineTime,
              fontWeight: 900,
              color: COLORS.coralDark,
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
        gridTemplateColumns: '260px 1fr',
        gap: 28,
        alignItems: 'center',
        padding: '30px 34px',
        background: COLORS.plum,
        color: COLORS.white,
        boxShadow: `14px 14px 0 rgba(230, 79, 106, 0.22)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 88,
          lineHeight: 0.9,
          fontWeight: 800,
          color: COLORS.citron,
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
            color: COLORS.blush,
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
      <MagazineBackground />
      <div style={contentStyle}>
        <SectionTicket label={section} />
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
              background: COLORS.coral,
              color: COLORS.white,
              fontFamily: FONT_MAIN,
              fontSize: 29,
              fontWeight: 900,
              boxShadow: `10px 10px 0 ${COLORS.citron}`,
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
            color: COLORS.plum,
            opacity: 0.46,
          }}
        >
          {hashtags}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
