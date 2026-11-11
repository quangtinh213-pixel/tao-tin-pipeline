import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { parseAccent } from '../shared/parseAccent';
import { Badge, type BadgeProps } from '../shared/Badge';
import { ImageCard } from '../shared/ImageCard';
import { StatCard, type StatCardProps } from '../shared/StatCard';
import { BarChart, type BarChartProps } from '../shared/BarChart';
import { CompareCard, type CompareCardProps } from '../shared/CompareCard';
import type { ImageSource, KenBurnsConfig, NewsTheme } from '../shared/types';

export interface CurrentAffairsHookProps {
  badge: Omit<BadgeProps, 'theme'>;
  headline: string;
  lead: string;
  tags?: string[];
  theme: NewsTheme;
}

export interface CurrentAffairsBodyProps {
  badge: Omit<BadgeProps, 'theme'>;
  headline: string;
  body: string;
  bodyItalic?: boolean;
  tags?: string[];
  stat?: Omit<StatCardProps, 'frame' | 'startFrame' | 'theme'>;
  chart?: Omit<BarChartProps, 'frame' | 'startFrame' | 'theme'>;
  compare?: Omit<CompareCardProps, 'frame' | 'startFrame' | 'theme'>;
  image?: ImageSource;
  imageKenBurns?: KenBurnsConfig;
  imageHeight?: number;
  theme: NewsTheme;
}

export interface CurrentAffairsEndingProps {
  badge?: Omit<BadgeProps, 'theme'>;
  headline: string;
  body: string;
  cta?: string;
  theme: NewsTheme;
}

const isDark = (theme: NewsTheme) => theme.useGradientAccent;

const accentText = (
  text: string,
  theme: NewsTheme,
  baseStyle: React.CSSProperties = {},
) => {
  const { colors, useGradientAccent } = theme;
  return parseAccent(text).map((seg, i) => {
    if (!seg.accent) return <span key={i}>{seg.text}</span>;
    const style: React.CSSProperties = useGradientAccent
      ? {
          background: `linear-gradient(90deg, ${colors.gradientA ?? colors.accent}, ${colors.gradientB ?? colors.accent2})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 900,
        }
      : { color: colors.accent, fontWeight: 900 };
    return <span key={i} style={{ ...baseStyle, ...style }}>{seg.text}</span>;
  });
};

const DossierTag: React.FC<{ label: string; theme: NewsTheme; delay?: number }> = ({
  label,
  theme,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = interpolate(f, [0, 14], [-14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      opacity,
      transform: `translateX(${x}px)`,
      border: `1px solid ${theme.colors.border}`,
      background: isDark(theme) ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.44)',
      borderRadius: 4,
      padding: '10px 12px',
      fontFamily: theme.fontFamily,
      fontSize: 18,
      fontWeight: 800,
      color: theme.colors.text,
      textTransform: 'uppercase',
    }}>
      {label}
    </div>
  );
};

const DocketLines: React.FC<{ theme: NewsTheme; items: string[] }> = ({ theme, items }) => (
  <div style={{ display: 'grid', gap: 13 }}>
    {items.map((item, i) => (
      <div key={i} style={{
        display: 'grid',
        gridTemplateColumns: '72px 1fr',
        gap: 14,
        alignItems: 'center',
        fontFamily: theme.fontFamily,
      }}>
        <div style={{
          color: theme.colors.accent,
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: '0.08em',
        }}>
          {String(i + 1).padStart(2, '0')}
        </div>
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: 10,
          color: theme.colors.muted,
          fontSize: 21,
          fontWeight: 700,
        }}>
          {item}
        </div>
      </div>
    ))}
  </div>
);

const Masthead: React.FC<{ theme: NewsTheme; label: string }> = ({ theme, label }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: `2px solid ${theme.colors.text}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    padding: '18px 0 16px',
    fontFamily: theme.fontFamily,
    color: theme.colors.text,
  }}>
    <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ display: 'flex', gap: 9 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 34,
          height: 8,
          background: i === 0 ? theme.colors.accent : theme.colors.border,
          display: 'block',
        }} />
      ))}
    </div>
  </div>
);

const sceneWrap = (theme: NewsTheme): React.CSSProperties => ({
  justifyContent: 'center',
  paddingTop: theme.layout.paddingV,
  paddingBottom: theme.layout.paddingV,
  paddingLeft: theme.layout.paddingH,
  paddingRight: theme.layout.paddingH,
  boxSizing: 'border-box',
});

export const CurrentAffairsHook: React.FC<CurrentAffairsHookProps> = ({
  badge,
  headline,
  lead,
  tags = [],
  theme,
}) => {
  const frame = useCurrentFrame();
  const intro = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={sceneWrap(theme)}>
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 34, height: '100%' }}>
        <Masthead theme={theme} label={isDark(theme) ? 'Civic Situation Room' : 'Bản Tin Thời Sự'} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '250px 1fr',
          gap: 34,
          alignItems: 'center',
          opacity: intro,
          transform: `translateY(${(1 - intro) * 24}px)`,
        }}>
          <div style={{
            alignSelf: 'stretch',
            border: `1px solid ${theme.colors.border}`,
            borderLeft: `6px solid ${theme.colors.accent}`,
            background: isDark(theme) ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.52)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 600,
          }}>
            <div>
              <Badge {...badge} theme={theme} />
              <div style={{ height: 34 }} />
              <DocketLines
                theme={theme}
                items={[
                  'Ai bị tác động',
                  'Thay đổi từ khi nào',
                  'Điểm còn phải theo dõi',
                ]}
              />
            </div>
            <div style={{
              fontFamily: theme.fontFamily,
              fontSize: 22,
              fontWeight: 900,
              color: theme.colors.accent,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Public Impact
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 30 }}>
              {tags.slice(0, 4).map((tag, i) => (
                <DossierTag key={tag} label={tag} theme={theme} delay={i * 5} />
              ))}
            </div>
            <div style={{
              fontFamily: theme.fontFamily,
              fontSize: 76,
              lineHeight: 1.02,
              fontWeight: 900,
              color: theme.colors.text,
              letterSpacing: 0,
              maxWidth: 700,
            }}>
              {accentText(headline, theme)}
            </div>
            <div style={{
              marginTop: 30,
              width: 120,
              height: 7,
              background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accent2})`,
            }} />
            <div style={{
              marginTop: 34,
              fontFamily: theme.fontFamily,
              fontSize: 30,
              lineHeight: 1.45,
              fontWeight: 600,
              color: theme.colors.text,
              maxWidth: 720,
            }}>
              {lead}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          fontFamily: theme.fontFamily,
        }}>
          {['Chính sách', 'Dân sinh', 'Hạ tầng'].map((item) => (
            <div key={item} style={{
              borderTop: `1px solid ${theme.colors.border}`,
              paddingTop: 14,
              color: theme.colors.muted,
              fontSize: 18,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CurrentAffairsBody: React.FC<CurrentAffairsBodyProps> = ({
  badge,
  headline,
  body,
  bodyItalic = false,
  tags = [],
  stat,
  chart,
  compare,
  image,
  imageKenBurns,
  imageHeight = 360,
  theme,
}) => {
  const frame = useCurrentFrame();
  const hasEvidence = Boolean(stat || chart || compare || image);

  return (
    <AbsoluteFill style={sceneWrap(theme)}>
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 24, height: '100%' }}>
        <Masthead theme={theme} label="Hồ sơ tác động" />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          minHeight: 0,
        }}>
          <div style={{
            border: `1px solid ${theme.colors.border}`,
            borderLeft: `6px solid ${theme.colors.accent}`,
            background: isDark(theme) ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.46)',
            padding: '28px 30px 30px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 18,
              alignItems: 'flex-start',
            }}>
              <Badge {...badge} theme={theme} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
                {tags.slice(0, 4).map((tag, i) => (
                  <DossierTag key={tag} label={tag} theme={theme} delay={i * 4} />
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 34,
              fontFamily: theme.fontFamily,
              fontSize: 60,
              lineHeight: 1.04,
              fontWeight: 900,
              color: theme.colors.text,
              letterSpacing: 0,
              maxWidth: 860,
            }}>
              {accentText(headline, theme)}
            </div>

            <div style={{
              marginTop: 22,
              width: 112,
              height: 6,
              background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accent2})`,
            }} />

            <div style={{
              marginTop: 24,
              fontFamily: theme.fontFamily,
              fontSize: 28,
              lineHeight: 1.48,
              fontWeight: 500,
              fontStyle: bodyItalic ? 'italic' : 'normal',
              color: theme.colors.text,
              maxWidth: 900,
            }}>
              {accentText(body, theme)}
            </div>
          </div>

          {hasEvidence && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                fontFamily: theme.fontFamily,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '0.14em',
                color: theme.colors.muted,
                textTransform: 'uppercase',
              }}>
                <span style={{
                  width: 42,
                  height: 6,
                  background: theme.colors.accent,
                  display: 'block',
                }} />
                Bằng chứng từ bài viết
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                {image && (
                  <ImageCard
                    image={image}
                    height={imageHeight}
                    kenBurns={imageKenBurns}
                    frame={frame}
                    startFrame={12}
                    theme={theme}
                  />
                )}
                {stat && <StatCard {...stat} frame={frame} startFrame={16} theme={theme} />}
                {chart && <BarChart {...chart} frame={frame} startFrame={16} theme={theme} chartHeight={260} />}
                {compare && <CompareCard {...compare} frame={frame} startFrame={16} theme={theme} />}
              </div>
            </div>
          )}
        </div>

        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: 18,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 18,
          alignItems: 'start',
          fontFamily: theme.fontFamily,
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '0.12em',
            color: theme.colors.accent,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            Cần kiểm chứng tiếp
          </div>
          <div style={{
            fontSize: 22,
            lineHeight: 1.35,
            color: theme.colors.muted,
            fontWeight: 700,
          }}>
            thời điểm áp dụng · nhóm chịu tác động · dữ liệu địa phương
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CurrentAffairsEnding: React.FC<CurrentAffairsEndingProps> = ({
  badge,
  headline,
  body,
  theme,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={sceneWrap(theme)}>
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 42, height: '100%' }}>
        <Masthead theme={theme} label="Theo dõi tiếp" />

        <div style={{
          opacity,
          display: 'grid',
          gridTemplateColumns: '1fr 330px',
          gap: 34,
          alignItems: 'center',
        }}>
          <div>
            {badge && <Badge {...badge} theme={theme} />}
            <div style={{
              marginTop: 34,
              fontFamily: theme.fontFamily,
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 900,
              color: theme.colors.text,
            }}>
              {accentText(headline, theme)}
            </div>
            <div style={{
              marginTop: 34,
              borderLeft: `6px solid ${theme.colors.accent}`,
              paddingLeft: 24,
              fontFamily: theme.fontFamily,
              fontSize: 30,
              lineHeight: 1.48,
              color: theme.colors.text,
              fontWeight: 600,
            }}>
              {body}
            </div>
          </div>

          <div style={{
            border: `1px solid ${theme.colors.border}`,
            background: isDark(theme) ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
            padding: 26,
          }}>
            <DocketLines
              theme={theme}
              items={[
                'Văn bản hướng dẫn',
                'Phản hồi địa phương',
                'Tác động tới người dân',
              ]}
            />
            <div style={{
              marginTop: 34,
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent2})`,
              color: '#FFFFFF',
              fontFamily: theme.fontFamily,
              fontSize: 28,
              fontWeight: 900,
              textAlign: 'center',
              padding: '20px 22px',
              borderRadius: 4,
            }}>
              Bấm Theo Dõi
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
