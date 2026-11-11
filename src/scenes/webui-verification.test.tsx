// @ts-nocheck
import React from 'react';
import {it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ensureBrowser} from '@remotion/renderer';
import {chromium} from 'playwright';
import spec from '../../videos/2026-09-20-test-san-xuat-video-ngan-gioi-thieu-cong-nghe-ai-trong-webui/spec.json';
import timeline from '../../public/2026-09-20-test-san-xuat-video-ngan-gioi-thieu-cong-nghe-ai-trong-webui/timeline.json';
const state=vi.hoisted(()=>({frame:0}));
vi.mock('remotion',async(importOriginal)=>({...await importOriginal(),useCurrentFrame:()=>state.frame}));
import {Scene1Hook} from './Scene1Hook';
import {Scene2System} from './Scene2System';
import {Scene3Prompt} from './Scene3Prompt';
import {Scene4Review} from './Scene4Review';
import {Scene5Ending} from './Scene5Ending';
const output='videos/2026-09-20-test-san-xuat-video-ngan-gioi-thieu-cong-nghe-ai-trong-webui/verification.json';
it('verifies timing, audio policy and 15 browser samples',async()=>{
 let browser;let report=[];
 try{
 expect(spec.totalFrames).toBe(Math.ceil(timeline.duration*30)+60);
 expect(spec.scenes.reduce((n,s)=>n+s.durationFrames,0)).toBe(spec.totalFrames);
 expect(spec.video.bgMusic).toBeNull();
 const dir=mkdtempSync(join(tmpdir(),'webui-frames-'));
 const binary=await ensureBrowser();
 browser=await chromium.launch({executablePath:binary.path,headless:true});
 const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 const scenes=[Scene1Hook,Scene2System,Scene3Prompt,Scene4Review,Scene5Ending];
 for(let i=0;i<scenes.length;i++)for(const frame of [40,Math.floor(spec.scenes[i].durationFrames/2),spec.scenes[i].durationFrames-12]){
 state.frame=frame;
 const html=renderToStaticMarkup(React.createElement(scenes[i]));
 await page.setContent(`<html><head><style>@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap');*{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;overflow:hidden}</style></head><body>${html}</body></html>`);
 await page.evaluate(async()=>{await document.fonts.ready;});
 const result=await page.evaluate(()=>{
 const errors=[];const labels=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while((n=walker.nextNode())){if(!n.textContent?.trim())continue;const el=n.parentElement;if(!el||el.closest('style,script'))continue;let visible=true;for(let a=el;a;a=a.parentElement){if(Number(getComputedStyle(a).opacity)<.1)visible=false;}if(!visible)continue;const range=document.createRange();range.selectNodeContents(n);const r=range.getBoundingClientRect();const text=n.textContent.trim();labels.push(text);if(r.x<47||r.right>1033||r.y<250||r.bottom>1480)errors.push({text,rect:[r.x,r.y,r.right,r.bottom]});}
 return {errors,labels};
 });
 await page.screenshot({path:join(dir,`scene-${i+1}-${frame}.png`)});
 report.push({scene:i+1,frame,...result});
 }
 expect(report.flatMap(r=>r.errors)).toEqual([]);
 writeFileSync(output,JSON.stringify({status:'passed',method:'automated browser text geometry; not human visual review',samples:report},null,2));
 console.log('15 early/middle/late browser samples passed safe-area inspection; stills stored outside repository.');
 }catch(error){writeFileSync(output,JSON.stringify({status:'failed',error:String(error),samples:report},null,2));throw error;}
 finally{if(browser)await browser.close();}
},180000);
