import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { COLORS, FONT_SANS, FONT_SERIF, LAYOUT, TYPOGRAPHY } from './tokens';
import { TravelPaperBackground } from './Layout';
import type { TravelImage, TravelSceneProps } from './types';

export interface TravelSceneRenderProps extends TravelSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveSrc = (image: TravelImage) =>
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
      <span key={`${part}-${index}`} style={{ color: COLORS.coral }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const MetaLabel: React.FC<{ label: string; destination?: string }> = ({ label, destination }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, 0, 8, 24),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 22,
        fontFamily: FONT_SANS,
        fontSize: TYPOGRAPHY.meta,
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.forest,
      }}
    >
      <span>{label}</span>
      {destination ? <span style={{ color: COLORS.coral }}>{destination}</span> : null}
    </div>
  );
};

const Stamp: React.FC<{ text?: string; delay?: number }> = ({ text, delay = 18 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 10, 26),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 34,
        minHeight: 66,
        padding: '0 26px',
        border: `3px solid ${COLORS.stamp}`,
        borderRadius: 8,
        transform: `${appear(frame, delay, 10, 26).transform} rotate(-3deg)`,
        fontFamily: FONT_SANS,
        fontSize: TYPOGRAPHY.stamp,
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.stamp,
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
}> = ({
  text,
  accentWords,
  size = TYPOGRAPHY.headline,
  delay = 30,
  maxWidth = 930,
}) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        marginTop: 44,
        fontFamily: FONT_SERIF,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: 0,
        fontWeight: 800,
        color: COLORS.ink,
      }}
    >
      {lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            ...appear(frame, delay + index * 7, 18, 32),
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
}> = ({
  text,
  delay = 54,
  top = 28,
  size = TYPOGRAPHY.body,
  weight = 600,
  maxWidth = 900,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: top,
        maxWidth,
        fontFamily: FONT_SANS,
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

const TagRail: React.FC<{ tags?: string[]; delay?: number }> = ({ tags = [], delay = 54 }) => {
  const frame = useCurrentFrame();
  if (tags.length === 0) return null;

  return (
    <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {tags.slice(0, 4).map((tag, index) => (
        <div
          key={tag}
          style={{
            ...appear(frame, delay + index * 5, 8, 22),
            padding: '10px 16px',
            borderRadius: 999,
            background: COLORS.white,
            border: `1px solid ${COLORS.rule}`,
            fontFamily: FONT_SANS,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '0.06em',
            color: COLORS.forest,
            textTransform: 'uppercase',
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const PostcardImage: React.FC<{
  image?: TravelImage;
  height: number;
  delay?: number;
  durationFrames: number;
  tilt?: number;
}> = ({ image, height, delay = 58, durationFrames, tilt = 0 }) => {
  const frame = useCurrentFrame();
  if (!image) return null;

  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const reveal = interpolate(frame - delay, [0, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <div
      style={{
        ...appear(frame, delay, 20, 34),
        marginTop: 54,
        padding: 18,
        borderRadius: LAYOUT.postcardRadius,
        background: COLORS.white,
        boxShadow: `0 24px 70px ${COLORS.shadow}`,
        transform: `${appear(frame, delay, 20, 34).transform} rotate(${tilt}deg) scale(${reveal})`,
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          position: 'relative',
          height,
          overflow: 'hidden',
          borderRadius: 18,
          background: COLORS.sand,
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
            transform: `scale(${scale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.22) 100%)',
          }}
        />
      </div>
      {image.credit ? (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 18,
            fontFamily: FONT_SANS,
            fontSize: TYPOGRAPHY.caption,
            fontWeight: 700,
            color: COLORS.muted,
          }}
        >
          <span>Nguồn: {image.credit}</span>
          <span style={{ color: COLORS.coral }}>POSTCARD</span>
        </div>
      ) : null}
    </div>
  );
};

const FactCard: React.FC<{ fact?: TravelSceneProps['fact']; delay?: number }> = ({
  fact,
  delay = 46,
}) => {
  const frame = useCurrentFrame();
  if (!fact) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 18, 32),
        marginTop: 74,
        padding: '42px 42px 48px',
        borderRadius: 34,
        background: COLORS.white,
        border: `2px dashed ${COLORS.sea}`,
        boxShadow: `0 18px 60px ${COLORS.shadow}`,
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLORS.forest,
        }}
      >
        {fact.label}
      </div>
      <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: TYPOGRAPHY.factValue,
            lineHeight: 0.9,
            fontWeight: 900,
            color: COLORS.coral,
          }}
        >
          {fact.value}
        </div>
        {fact.unit ? (
          <div
            style={{
              fontSize: TYPOGRAPHY.factUnit,
              lineHeight: 1,
              fontWeight: 800,
              color: COLORS.ink,
            }}
          >
            {fact.unit}
          </div>
        ) : null}
      </div>
      {fact.note ? <Body text={fact.note} delay={delay + 12} top={28} size={29} /> : null}
    </div>
  );
};

const RouteStrip: React.FC<{ route?: TravelSceneProps['route']; delay?: number }> = ({
  route = [],
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (route.length === 0) return null;

  return (
    <div style={{ marginTop: 62, display: 'grid', gap: 0 }}>
      {route.slice(0, 5).map((stop, index) => (
        <div
          key={`${stop.label}-${index}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 26),
            display: 'grid',
            gridTemplateColumns: '58px 1fr 100px',
            gap: 22,
            minHeight: 116,
            fontFamily: FONT_SANS,
          }}
        >
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: 22,
                height: 22,
                marginTop: 8,
                borderRadius: '50%',
                background: index === 0 ? COLORS.coral : COLORS.forest,
                boxShadow: `0 0 0 8px ${index === 0 ? COLORS.coralSoft : 'rgba(31, 91, 77, 0.1)'}`,
              }}
            />
            {index < route.length - 1 ? (
              <div
                style={{
                  position: 'absolute',
                  top: 36,
                  bottom: -6,
                  width: 2,
                  background: COLORS.rule,
                }}
              />
            ) : null}
          </div>
          <div style={{ borderBottom: `1px solid ${COLORS.rule}`, paddingBottom: 24 }}>
            <div style={{ fontSize: TYPOGRAPHY.routeStop, fontWeight: 900, color: COLORS.ink }}>
              {stop.label}
            </div>
            {stop.detail ? (
              <div style={{ marginTop: 8, fontSize: 23, lineHeight: 1.32, fontWeight: 600, color: COLORS.body }}>
                {stop.detail}
              </div>
            ) : null}
          </div>
          <div
            style={{
              borderBottom: `1px solid ${COLORS.rule}`,
              paddingTop: 5,
              textAlign: 'right',
              fontSize: TYPOGRAPHY.routeTitle,
              fontWeight: 900,
              color: COLORS.sea,
            }}
          >
            {stop.time}
          </div>
        </div>
      ))}
    </div>
  );
};

const NoteList: React.FC<{ notes?: TravelSceneProps['notes']; delay?: number }> = ({
  notes = [],
  delay = 62,
}) => {
  const frame = useCurrentFrame();
  if (notes.length === 0) return null;

  return (
    <div style={{ marginTop: 48, display: 'grid', gap: 22 }}>
      {notes.slice(0, 5).map((item, index) => (
        <div
          key={`${item.label}-${item.text}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            display: 'grid',
            gridTemplateColumns: '96px 1fr',
            alignItems: 'start',
            gap: 24,
            padding: '24px 0',
            borderTop: `1px solid ${COLORS.rule}`,
            fontFamily: FONT_SANS,
          }}
        >
          <div
            style={{
              fontSize: TYPOGRAPHY.listIndex,
              fontWeight: 900,
              color: COLORS.coral,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontSize: TYPOGRAPHY.listText,
              lineHeight: 1.22,
              fontWeight: 700,
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

const contentStyle: React.CSSProperties = {
  position: 'absolute',
  left: LAYOUT.paddingX,
  right: LAYOUT.paddingX,
  top: LAYOUT.top,
};

export const TravelScene: React.FC<TravelSceneRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const {
    variant,
    durationFrames,
    meta,
    destination,
    stamp,
    headline,
    accentWords,
    body,
    body2,
    image,
    imageHeight,
    secondaryImage,
    fact,
    route,
    notes,
    tags,
    cta,
    hashtags,
  } = props;

  const headlineSize =
    variant === 'opening'
      ? TYPOGRAPHY.headlineHero
      : variant === 'note' || variant === 'route'
        ? TYPOGRAPHY.headlineSmall
        : TYPOGRAPHY.headline;

  return (
    <AbsoluteFill>
      <TravelPaperBackground />
      <div style={contentStyle}>
        <MetaLabel label={meta} destination={destination} />
        <Stamp text={stamp ?? destination} />
        <Headline text={headline} accentWords={accentWords} size={headlineSize} />
        {body ? <Body text={body} /> : null}
        <TagRail tags={tags} />

        {variant === 'fact' ? <FactCard fact={fact} /> : null}
        {variant === 'route' ? <RouteStrip route={route} /> : null}
        {variant === 'note' ? <NoteList notes={notes} /> : null}

        {variant === 'opening' || variant === 'experience' || variant === 'gallery' ? (
          <PostcardImage
            image={image}
            height={imageHeight ?? (variant === 'opening' ? 720 : 600)}
            delay={variant === 'opening' ? 64 : 58}
            durationFrames={durationFrames}
            tilt={variant === 'gallery' ? -2 : 0}
          />
        ) : null}

        {variant === 'gallery' && secondaryImage ? (
          <PostcardImage
            image={secondaryImage}
            height={330}
            delay={82}
            durationFrames={durationFrames}
            tilt={3}
          />
        ) : null}

        {body2 ? <Body text={body2} delay={88} top={42} size={TYPOGRAPHY.bodySmall} /> : null}

        {variant === 'closing' ? (
          <div
            style={{
              ...appear(frame, 70, 10, 30),
              marginTop: 56,
              padding: '34px 38px',
              borderRadius: 30,
              background: COLORS.forest,
              color: COLORS.white,
              fontFamily: FONT_SANS,
              fontSize: 30,
              fontWeight: 900,
              lineHeight: 1.25,
              boxShadow: `0 18px 60px ${COLORS.shadow}`,
            }}
          >
            {cta ?? 'Lưu lại cho chuyến đi tiếp theo'}
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
            fontFamily: FONT_SANS,
            fontSize: 23,
            fontWeight: 800,
            color: COLORS.faint,
          }}
        >
          {hashtags}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
