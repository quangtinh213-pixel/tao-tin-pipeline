import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MediaMontage, type SceneProps, getSceneIds} from './MediaMontage';
import {COLORS, fontFamily} from './tokens';

const GROUPS = [
  {label: 'KIM LOẠI', color: '#B53A2E'},
  {label: 'MÁY MÓC', color: '#D89B28'},
  {label: 'NHỰA · GIẤY', color: '#4D7B63'},
];

export const Scene6Sorting: React.FC<SceneProps> = ({assets, scene}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const lift = interpolate(frame, [0, 180], [18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});

  return (
    <AbsoluteFill style={{background: COLORS.bg, color: COLORS.text, fontFamily, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 258, left: 48, color: COLORS.green, fontSize: 21, fontWeight: 900, letterSpacing: '0.12em'}}>XỬ LÝ VÀ PHÂN LOẠI</div>
      <div style={{position: 'absolute', top: 300, left: 48, right: 48, fontSize: 58, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.05em', opacity: enter}}>
        Từ hỗn hợp thành
        <br />
        từng nhóm rõ ràng.
      </div>
      <div style={{transform: `translateY(${lift}px)`}}>
        <MediaMontage assets={assets} ids={getSceneIds(scene)} top={470} left={48} width={984} height={620} interval={26} fit="cover" accent={COLORS.green} radius={14} />
      </div>
      <div style={{position: 'absolute', top: 1160, left: 48, right: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, opacity: enter}}>
        {GROUPS.map((group, index) => (
          <div key={group.label} style={{minHeight: 180, padding: 22, background: COLORS.paper, borderTop: `8px solid ${group.color}`, boxShadow: '0 12px 30px rgba(44, 31, 20, 0.08)', transform: `translateY(${index * 8}px)`}}>
            <div style={{fontSize: 20, fontWeight: 900, color: group.color, letterSpacing: '0.06em'}}>{group.label}</div>
            <div style={{marginTop: 18, height: 10, width: `${88 - index * 16}%`, background: group.color, opacity: 0.75}} />
            <div style={{marginTop: 17, color: COLORS.muted, fontSize: 18, lineHeight: 1.25, fontWeight: 600}}>
              {index === 0 ? 'Sắt, thép, đồng, nhôm, inox' : index === 1 ? 'Thiết bị hư, máy móc cũ' : 'Giấy, carton và vật liệu khác'}
            </div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 1402, left: 48, color: COLORS.muted, fontSize: 20, fontWeight: 600}}>
        Phân loại giúp kho bãi gọn hơn và việc xử lý tiếp theo rõ ràng hơn.
      </div>
    </AbsoluteFill>
  );
};
