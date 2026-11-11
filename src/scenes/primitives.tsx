import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C,fontFamily,p} from './tokens';
export const Back: React.FC<{light?:boolean}> = ({light=false}) => <AbsoluteFill style={{background:C.bg, backgroundImage:light?'radial-gradient(ellipse at 85% 30%, #183E43 0%, transparent 65%)':'radial-gradient(ellipse at 0% 75%, #173B44 0%, transparent 65%)',fontFamily}}/>;
export const Label: React.FC<{children:React.ReactNode;style?:React.CSSProperties}> = ({children,style}) => <div style={{fontFamily,fontSize:25,letterSpacing:2,color:C.muted,fontWeight:600,...style}}>{children}</div>;
export const Reveal: React.FC<{frame:number;at:number;children:React.ReactNode;style?:React.CSSProperties}> = ({frame,at,children,style}) => <div style={{opacity:p(frame,at),transform:`translateY(${(1-p(frame,at))*25}px)`,...style}}>{children}</div>;
export const title:React.CSSProperties={position:'absolute',left:80,top:325,width:920,fontSize:76,fontWeight:800,lineHeight:1.18,letterSpacing:-3,color:C.ink,fontFamily};
export const base:React.CSSProperties={fontFamily,color:C.ink};
