import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MediaMontage, type SceneProps, getSceneIds} from './MediaMontage';
import {COLORS, fontFamily} from './tokens';

const MATERIALS = ['SẮT THÉP', 'ĐỒNG', 'NHÔM', 'INOX', 'MÁY MÓC', 'NHỰA · GIẤY'];

export const Scene3Materials: React.FC<SceneProps> = ({assets, scene}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const drift = interpolate(frame, [0, 364], [0, -22], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: COLORS.bg, color: COLORS.text, fontFamily, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 254, left: 48, fontSize: 21, color: COLORS.accent, fontWeight: 900, letterSpacing: '0.12em'}}>DANH MỤC THU MUA</div>
      <div style={{position: 'absolute', top: 294, left: 48, right: 48, fontSize: 60, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.05em', opacity: enter}}>
        Nhiều nhóm vật liệu,
        <br />
        một đầu mối xử lý.
      </div>
      <div style={{transform: `translateY(${drift}px)`}}>
        <MediaMontage assets={assets} ids={getSceneIds(scene)} top={430} left={48} width={984} height={790} interval={45} fit="cover" accent={COLORS.accent} radius={16} />
      </div>
      <div style={{position: 'absolute', top: 1264, left: 48, right: 48, display: 'flex', flexWrap: 'wrap', gap: 12, opacity: enter}}>
        {MATERIALS.map((material, index) => (
          <div key={material} style={{padding: '11px 16px', border: `2px solid ${index % 2 === 0 ? COLORS.accent : COLORS.accent2}`, color: COLORS.dark, background: index % 2 === 0 ? '#FFF8EE' : '#F8EDCF', fontSize: 20, fontWeight: 800, letterSpacing: '0.04em'}}>
            {material}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 1408, left: 48, color: COLORS.muted, fontSize: 20, fontWeight: 600}}>
        Khung, ống, tấm, lưới, dây và nhiều vật tư cũ từ công trình, nhà xưởng, kho bãi.
      </div>
    </AbsoluteFill>
  );
};
