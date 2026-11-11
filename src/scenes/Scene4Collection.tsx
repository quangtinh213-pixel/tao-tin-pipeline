import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MediaMontage, type SceneProps, getSceneIds} from './MediaMontage';
import {COLORS, fontFamily} from './tokens';

export const Scene4Collection: React.FC<SceneProps> = ({assets, scene}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <AbsoluteFill style={{background: COLORS.dark, color: COLORS.paper, fontFamily, overflow: 'hidden'}}>
      <MediaMontage assets={assets} ids={getSceneIds(scene)} top={250} left={48} width={984} height={960} interval={35} accent={COLORS.accent2} radius={0} darken={0.2} />
      <div style={{position: 'absolute', top: 284, left: 78, color: '#FFE6A9', fontSize: 21, fontWeight: 900, letterSpacing: '0.13em', opacity: enter}}>
        THU GOM TẠI HIỆN TRƯỜNG
      </div>
      <div style={{position: 'absolute', top: 330, left: 78, right: 78, fontSize: 62, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.05em', opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`}}>
        Có đội xe chuyên dụng,
        <br />
        bốc xếp và vận chuyển.
      </div>
      <div style={{position: 'absolute', top: 1242, left: 48, right: 48, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(255,255,255,0.2)', opacity: enter}}>
        <div style={{display: 'flex', gap: 14, alignItems: 'center', fontSize: 24, fontWeight: 800}}>
          <span style={{width: 12, height: 12, borderRadius: '50%', background: COLORS.accent2}} />
          Đến tận nơi · Bốc xếp · Vận chuyển · Vệ sinh khu vực
        </div>
        <div style={{marginTop: 12, color: 'rgba(255,255,255,0.72)', fontSize: 19, lineHeight: 1.3}}>
          Thông tin được giới thiệu trên website của Phế Liệu Quân Kiều.
        </div>
      </div>
    </AbsoluteFill>
  );
};
