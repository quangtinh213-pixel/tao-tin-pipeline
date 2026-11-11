import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MediaMontage, type SceneProps, getSceneIds} from './MediaMontage';
import {COLORS, fontFamily} from './tokens';

export const Scene7Contact: React.FC<SceneProps> = ({assets, scene}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const title = scene?.visibleText?.[0] ?? 'THU PHẾ LIỆU QUÂN KIỀU';
  const website = scene?.visibleText?.[1] ?? 'thuphelieuquankieu.com';
  const hotline = scene?.visibleText?.[2] ?? '0376 706 626';

  return (
    <AbsoluteFill style={{background: COLORS.paper, color: COLORS.text, fontFamily, overflow: 'hidden'}}>
      <MediaMontage assets={assets} ids={getSceneIds(scene)} top={285} left={48} width={984} height={690} interval={68} accent={COLORS.accent} radius={14} />
      <div style={{position: 'absolute', top: 1015, left: 48, right: 48, color: COLORS.accent, fontSize: 21, fontWeight: 900, letterSpacing: '0.12em', opacity: enter}}>SẴN SÀNG TIẾP NHẬN YÊU CẦU</div>
      <div style={{position: 'absolute', top: 1055, left: 48, right: 48, fontSize: 59, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.05em', opacity: enter, transform: `translateY(${(1 - enter) * 20}px)`}}>
        {title}
      </div>
      <div style={{position: 'absolute', top: 1195, left: 48, right: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, opacity: enter}}>
        <div style={{padding: '24px 26px', background: '#F7E3D8', borderLeft: `9px solid ${COLORS.accent}`}}>
          <div style={{fontSize: 18, color: COLORS.muted, fontWeight: 800, letterSpacing: '0.08em'}}>WEBSITE</div>
          <div style={{marginTop: 10, fontSize: 28, fontWeight: 900}}>{website}</div>
        </div>
        <div style={{padding: '24px 26px', background: '#F8EDCF', borderLeft: `9px solid ${COLORS.accent2}`}}>
          <div style={{fontSize: 18, color: COLORS.muted, fontWeight: 800, letterSpacing: '0.08em'}}>HOTLINE</div>
          <div style={{marginTop: 10, fontSize: 32, fontWeight: 900}}>{hotline}</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1375, left: 48, right: 48, fontSize: 23, color: COLORS.muted, fontWeight: 600, lineHeight: 1.3}}>
        Gửi thông tin loại phế liệu và địa điểm cần thu gom để được tư vấn phù hợp.
      </div>
    </AbsoluteFill>
  );
};
