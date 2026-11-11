import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {C,p} from './tokens';
import {Back,Reveal,base} from './primitives';
export const Scene5Ending:React.FC=()=>{const f=useCurrentFrame();return <AbsoluteFill style={base}><Back/><Reveal frame={f} at={0} style={{position:'absolute',left:80,top:480,fontSize:72,color:C.muted,fontWeight:600}}>AI hỗ trợ.</Reveal><div style={{position:'absolute',left:70,top:670,width:950,fontSize:112,lineHeight:1.18,letterSpacing:-5,color:C.lime,fontWeight:800,opacity:p(f,40),transform:`scale(${.95+.05*p(f,40,50)})`,transformOrigin:'left'}}>Bạn<br/>quyết định.<div style={{height:8,marginTop:36,width:825*p(f,75),background:C.lime}}/></div><Reveal frame={f} at={110} style={{position:'absolute',left:80,top:1160,width:860,fontSize:47,lineHeight:1.4}}>Bạn muốn thử<br/>cho công việc nào?</Reveal></AbsoluteFill>};
