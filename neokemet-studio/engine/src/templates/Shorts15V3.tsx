/**
 * NeoKemetAI Shorts15 Cinematic V3
 * 4 narrative scenes / 10 distinct shot beats / 450 frames @30fps.
 * Hybrid visual design: original generated still plates (bundled locally),
 * Remotion-driven 2.5D cameras, torch and atmosphere motion, plus original SVG
 * illustration for anatomy, cloth handling and archaeological explanation.
 * Strict UI safe lanes: headlines y=212..362, essential actors y=440..1330,
 * captions y=1370..1510. No external API requests at render time.
 * This is a historical artistic reconstruction, not survey geometry.
 */
import React from "react";
import { staticFile } from "remotion";
import { useClock, ClockCtx } from "../components/AnimatedScene";
import { CinematicRoyalReveal, CinematicTT320 } from "./CinematicPilot";
import type { TemplateProps } from "./common";

const A={navy:"#071622", deep:"#040D18", blue:"#133858", lapis:"#235A87", gold:"#D9A84D", pale:"#FFDF9D", cream:"#FAE8C4", teal:"#3BA19B", brown:"#8C5A37", stone:"#C4A073", linen:"#EFE0BF"};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const v=clamp(x);return v*v*(3-2*v)};
const fade=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const num=(v:number)=>Number(v.toFixed(4));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const visible=(t:number,a:number,b:number)=>num((a<=0?1:fade(t,a-.016,a+.02))*(b>=1?1:1-fade(t,b-.02,b+.018)));
const photo={tomb:"v3/royal-tomb.webp",cliffs:"v3/theban-procession.webp"} as const;

/** Photo plate camera: fully local deterministic pan/zoom, 16:9 never substituted. */
const Plate:React.FC<{src:string;t:number;zoom?:number;panX?:number;panY?:number;dim?:number}>=({src,t,zoom=.09,panX=0,panY=0,dim=.08})=>{
 const z=1+zoom*t;
 const x=panX*t, y=panY*t;
 return <g>
   <g transform={`translate(${num(540+x)} ${num(960+y)}) scale(${num(z)}) translate(-540 -960)`}>
    <image href={staticFile(src)} x="0" y="0" width="1080" height="1920" preserveAspectRatio="xMidYMid slice" />
   </g>
   <rect width="1080" height="1920" fill={A.deep} opacity={dim}/>
 </g>;
};
const Defs:React.FC=()=> <defs>
 <linearGradient id="v3-night" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#04121E"/><stop offset=".53" stopColor="#19354A"/><stop offset="1" stopColor="#020910"/></linearGradient>
 <linearGradient id="v3-stone" x1="0" y1="0" x2=".9" y2=".8"><stop stopColor="#F6DCA9"/><stop offset=".32" stopColor="#AC8E65"/><stop offset=".67" stopColor="#625849"/><stop offset="1" stopColor="#302D31"/></linearGradient>
 <linearGradient id="v3-gold" x1="0" y1="0" x2=".8" y2=".85"><stop stopColor="#9C6A34"/><stop offset=".27" stopColor="#FFE8AA"/><stop offset=".57" stopColor="#C9944E"/><stop offset=".82" stopColor="#F2D58D"/><stop offset="1" stopColor="#8B5629"/></linearGradient>
 <linearGradient id="v3-linen" x1="0" y1="0" x2="1" y2=".65"><stop stopColor="#FFF3D3"/><stop offset=".55" stopColor="#D7BB8F"/><stop offset="1" stopColor="#91785C"/></linearGradient>
 <radialGradient id="v3-flame"><stop stopColor="#FFEEB4" stopOpacity=".94"/><stop offset=".25" stopColor="#FFBE59" stopOpacity=".45"/><stop offset="1" stopColor="#FF8A29" stopOpacity="0"/></radialGradient>
 <radialGradient id="v3-beam"><stop stopColor="#FCE5AF" stopOpacity=".32"/><stop offset="1" stopColor="#FCE5AF" stopOpacity="0"/></radialGradient>
 <filter id="v3-blur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="13"/></filter>
 </defs>;

const Atmospheric:React.FC<{p:number;seed?:number;intensity?:number}>=({p,seed=4,intensity=1})=><g pointerEvents="none">
 {Array.from({length:34},(_,i)=>{
  const x=(71+i*181+seed*17)%1080;
  const y=((i*257+seed*29+Math.round(p*140*(i%3+1)))%1560+230);
  return <circle key={i} cx={x} cy={y} r={i%5===0?4:1.7} fill={i%4===0?A.teal:A.pale} opacity={num((.10+(i%6)*.023)*intensity)}/>;
 })}
 <path d="M23 165V25H141M939 25h118v140M23 1752v144h118M939 1896h118v-144" fill="none" stroke={A.gold} strokeWidth="4" opacity=".47"/>
</g>;
const Lighting:React.FC<{p:number;x?:number;y?:number;r?:number}>=({p,x=560,y=1080,r=300})=><g pointerEvents="none">
 <ellipse cx={x} cy={y} rx={r} ry={r*1.15} fill="url(#v3-flame)" opacity={num(.65+.24*Math.sin(p*31))}/>
 <path d={`M${x} ${y+18}q-28 -31 0 -77q35 48 0 77`} fill="#FFF2C0" opacity={num(.6+.2*Math.cos(p*25))}/>
</g>;

/** A physically reserved title lane independent from every moving shot. */
const Head:React.FC<{kicker:string;line:string;t?:number;size?:number}>=({kicker,line,t=1,size})=>{
 const font=size??Math.min(64,Math.floor(790/Math.max(10,line.length)*1.6));
 return <g opacity={num(t)}>
  <rect x="108" y="212" width="864" height="157" rx="12" fill="#03101B" opacity=".88"/>
  <path d="M165 378H915" stroke={A.gold} strokeWidth="4"/>
  <text x="540" y="253" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontSize="25" fontWeight="700" letterSpacing="5" fill={A.gold}>{kicker}</text>
  <text x="540" y="324" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontSize={font} fontWeight="900" fill={A.cream} stroke="#061623" strokeWidth="1.3" paintOrder="stroke">{line}</text>
 </g>;
};
/** Art does not enter the final legible caption lane: 1360..1520. */
const CaptionLane:React.FC=()=> <g pointerEvents="none"><rect x="0" y="1350" width="1080" height="187" fill="url(#v3-night)" opacity=".24"/></g>;
const Shot:React.FC<{alpha:number;children:React.ReactNode}>=({alpha,children})=><g opacity={alpha}>{children}</g>;

/** Accurate body hierarchy: pelvis, torso, head, two legs, two arms with hand alignment. */
const Priest:React.FC<{x:number;y:number;mirror?:boolean;phase:number;lean?:number}>=({x,y,mirror=false,phase,lean=0})=>{
 const sign=mirror?-1:1;
 const step=Math.sin(phase*Math.PI*2);
 const armBob=Math.sin(phase*Math.PI*2+.5)*7;
 return <g transform={`translate(${num(x)} ${num(y)}) scale(${sign} 1)`}>
  {/* ground and feet */}
  <ellipse cx="0" cy="5" rx="117" ry="24" fill="#08111A" opacity=".5"/>
  <path d={`M-45 -188L${num(-62+step*24)} -28L${num(-105+step*16)} -12M47 -186L${num(61-step*24)} -28L${num(102-step*16)} -12`} stroke="#A2734D" strokeWidth="35" strokeLinecap="round" fill="none"/>
  <path d="M-121 -16q39 -9 72 3M45 -16q43 -12 92 5" stroke="#DEC7A1" strokeWidth="13" strokeLinecap="round"/>
  {/* pleated wrap skirt */}
  <path d="M-78 -342Q0 -366 78 -342L109 -172Q0 -118 -105 -176Z" fill="url(#v3-linen)" stroke="#EACF9B" strokeWidth="8"/>
  {[-70,-36,0,36,70].map((v,i)=><path key={i} d={`M${v} -334L${num(v*1.12)} -185`} stroke={i%2?"#A68C6D":"#FCECC9"} strokeWidth="5" opacity=".65"/>)}
  <path d="M-70 -359H72" stroke={A.gold} strokeWidth="24"/>
  {/* upper body with subtle torso motion */}
  <g transform={`rotate(${num(lean+step*1.2)} 0 -440)`}>
   <path d="M-100 -638Q-65 -664 -36 -660H36Q70 -664 102 -638L88 -348Q0 -319 -87 -348Z" fill="#C99565" stroke="#F1C992" strokeWidth="8"/>
   <path d="M-85 -630Q-3 -580 85 -630L67 -577Q0 -539 -67 -577Z" fill={A.lapis} stroke={A.gold} strokeWidth="9"/>
   {[-58,-29,0,29,58].map((v,i)=><path key={i} d={`M${v} -608L${v*.76} -575`} stroke={i%2?A.gold:A.teal} strokeWidth="7"/>)}
   {/* linen headcloth and anatomy */}
   <path d="M-66 -743Q0 -814 67 -744L91 -597L56 -613Q0 -638 -55 -613L-94 -597Z" fill="url(#v3-linen)" stroke="#F2DBAF" strokeWidth="7"/>
   <ellipse cx="0" cy="-695" rx="48" ry="69" fill="#C99465" stroke="#EBC18B" strokeWidth="6"/>
   <path d="M-28 -711q14 -8 25 0m11 0q14 -8 25 0" stroke="#3F3027" strokeWidth="6" fill="none"/>
   <path d="M-18 -667Q0 -654 18 -667" fill="none" stroke="#754634" strokeWidth="5"/>
   <path d="M-53 -763Q0 -807 53 -763" fill="none" stroke={A.lapis} strokeWidth="14"/>
   {/* articulated arms: wrists remain close to the linen being handled */}
   <path d={`M-89 -592Q-141 -490 -105 -436L${num(-95+armBob)} -410`} stroke="#B78256" strokeWidth="27" strokeLinecap="round" fill="none"/>
   <path d={`M89 -592Q140 -517 165 -505L${num(188+armBob)} -445`} stroke="#B78256" strokeWidth="27" strokeLinecap="round" fill="none"/>
   <ellipse cx={num(188+armBob)} cy="-445" rx="18" ry="16" fill="#DDB287"/>
  </g>
 </g>;
};
const Wrapping:React.FC<{p:number}>=({p})=>{
 const wave=Math.sin(p*16)*13;
 return <g>
   <path d="M78 1378H1004L916 1455H161Z" fill="url(#v3-stone)" stroke="#DEBD87" strokeWidth="13"/>
   <rect x="220" y="1170" width="640" height="160" rx="67" fill="#382F2C" stroke={A.gold} strokeWidth="12"/>
   <path d="M248 1258Q279 1174 355 1188H751Q837 1197 833 1258Q800 1304 247 1291Z" fill="url(#v3-linen)" stroke="#D4BA94" strokeWidth="7"/>
   {Array.from({length:13},(_,i)=><path key={i} d={`M${272+i*42} 1194q-12 36 3 84`} stroke={i%2===0?"#A69A83":"#FFF8E3"} strokeWidth="10" opacity=".8" fill="none"/>)}
   <g transform={`translate(370 ${num(-22+wave)})`}>
    <path d="M-105 1268Q118 1161 351 1268" stroke="#F9E7C3" strokeWidth="26" fill="none" strokeLinecap="round"/>
    <path d="M-104 1269Q116 1168 353 1268" stroke="#AB9476" strokeWidth="3" fill="none"/>
   </g>
   <Priest x={263} y={1522} phase={p*.68} />
   <Priest x={820} y={1522} mirror phase={p*.68+.4} />
   <Lighting p={p} x={545} y={1005} r={470}/>
 </g>;
};

/** Two visible art changes; the V1 portrait is used only for its detailed FIRST shot. */
export const Shorts15V3Hook:React.FC<TemplateProps>=({scene,seed})=>{
 const clock=React.useContext(ClockCtx), {p:raw}=useClock(),p=clamp(raw),cut=.48;
 const s1=visible(p,0,cut),s2=visible(p,cut,1);
 return <g>
  <Defs/>
  <Shot alpha={s1}>
   <ClockCtx.Provider value={{...clock,f:clock.D*(p/cut)*.35}}>
    <CinematicRoyalReveal scene={{...scene,label:"WHERE IS RAMSES?"}} seed={seed}/>
   </ClockCtx.Provider>
  </Shot>
  <Shot alpha={s2}>
   <Plate src={photo.tomb} t={clamp((p-cut)/(1-cut))} zoom={.18} panY={-95} dim={.22}/>
   <Head kicker="THE ROYAL CACHE" line="HIDDEN IN SECRET" t={fade(p,cut,cut+.08)} />
   <Atmospheric p={p} seed={seed}/>
  </Shot>
  <CaptionLane/>
 </g>;
};

/** Three distinct shots: disturbed tomb, active shrouding, physically grounded royal procession. */
export const Shorts15V3Danger:React.FC<TemplateProps>=({seed})=>{
 const {p:raw}=useClock(),p=clamp(raw); const t1=visible(p,0,1/3),t2=visible(p,1/3,2/3),t3=visible(p,2/3,1);
 return <g><Defs/>
  <Shot alpha={t1}>
   <Plate src={photo.tomb} t={p*3} zoom={.20} panX={-58} panY={-65} dim={.28}/>
   {/* Loosing the seal without inaccurate figures hovering over the plate. */}
   <path d="M700 1080L720 1057" stroke="#EFC073" strokeWidth="12" opacity={num(.4+.6*Math.sin(p*17)**2)}/>
   <Lighting p={p} x={815} y={798} r={205}/>
   <Head kicker="THE VALLEY OF THE KINGS" line="TOMBS ROBBED" />
   <Atmospheric p={p} seed={seed}/>
  </Shot>
  <Shot alpha={t2}>
   <rect width="1080" height="1920" fill="url(#v3-night)"/>
   <g opacity=".55"><Plate src={photo.tomb} t={(p-1/3)*3} zoom={.05} panY={-27} dim={.70}/></g>
   <Wrapping p={clamp((p-1/3)*3)}/>
   <Head kicker="PRIESTS OF AMUN" line="A DESPERATE RESCUE" size={52}/>
   <Atmospheric p={p} seed={seed}/>
  </Shot>
  <Shot alpha={t3}>
   <Plate src={photo.cliffs} t={clamp((p-2/3)*3)} zoom={.14} panX={-42} panY={-74} dim={.14}/>
   <Head kicker="THE THEBAN CLIFFS" line="MOVED TO SAFETY" size={57}/>
   <Atmospheric p={p} seed={seed}/>
  </Shot>
  <CaptionLane/>
 </g>;
};

/** Rock-cut chamber is illustrative; move from shaft POV to detailed explanatory geometry to sarcophagi. */
const ShaftDiagram:React.FC<{p:number}>=({p})=>{
 const traced=fade(p,.11,.72); const shadow=lerp(0,1,fade(p,0,.35));
 return <g>
  <rect width="1080" height="1920" fill="url(#v3-stone)"/>
  {Array.from({length:16},(_,i)=><path key={i} d={`M-35 ${430+i*75}Q290 ${415+i*76} 545 ${430+i*75}T1130 ${426+i*75}`} stroke={i%3===0?"#F5D5A4":"#665846"} strokeWidth={i%3===0?7:3} opacity=".45" fill="none"/>)}
  <path d="M302 481H443V1013H701L824 1188V1305" stroke="#172C3A" strokeWidth="97" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
  <path d="M302 481H443V1013H701L824 1188V1305" stroke={A.pale} strokeWidth="15" strokeDasharray={`${num(traced*1790)} 2000`} strokeLinecap="round" fill="none"/>
  <rect x="565" y="1200" width="385" height="159" rx="10" fill={A.navy} stroke={A.gold} strokeWidth="15"/>
  {Array.from({length:6},(_,i)=>{
   const x=617+(i%3)*124,y=1240+Math.floor(i/3)*64;
   return <g key={i}><path d={`M${x-46} ${y}q47 -23 94 0l5 40h-105Z`} fill="url(#v3-gold)" stroke={A.gold} strokeWidth="4"/><path d={`M${x-24} ${y+22}h48`} stroke={A.lapis} strokeWidth="5"/></g>;
  })}
  <ellipse cx="767" cy="1244" rx="310" ry="188" fill="url(#v3-beam)" opacity={num(shadow)}/>
  <path d="M242 489v475M225 489h34M225 963h34" stroke="#2B2D2B" strokeWidth="6" fill="none"/>
  <text x="193" y="790" fontFamily="Josefin Sans,sans-serif" fontWeight="700" fontSize="28" fill="#262C2B" textAnchor="middle" transform="rotate(-90 193 790)">SHAFT</text>
  <text x="759" y="1393" fontFamily="Josefin Sans,sans-serif" fontSize="30" fill="#3B3028" textAnchor="middle">CACHE · SCHEMATIC</text>
 </g>;
};
export const Shorts15V3Reveal:React.FC<TemplateProps>=({scene,seed})=>{
 const clock=React.useContext(ClockCtx),{p:raw}=useClock(),p=clamp(raw);
 return <g><Defs/>
  <Shot alpha={visible(p,0,1/3)}>
   <ClockCtx.Provider value={{...clock,f:clock.D*Math.min(.37,p*1.1)}}><CinematicTT320 scene={{...scene,label:"TT320"}} seed={seed}/></ClockCtx.Provider>
  </Shot>
  <Shot alpha={visible(p,1/3,2/3)}>
   <ShaftDiagram p={clamp((p-1/3)*3)}/>
   <Head kicker="INSIDE THE MOUNTAIN" line="THE HIDDEN SHAFT" size={58}/>
  </Shot>
  <Shot alpha={visible(p,2/3,1)}>
   <Plate src={photo.tomb} t={clamp((p-2/3)*3)} zoom={.23} panY={-68} dim={.18}/>
   <Head kicker="THE ROYAL CACHE" line="KINGS TOGETHER"/>
   <Atmospheric p={p} seed={seed}/>
  </Shot>
  <CaptionLane/>
 </g>;
};
export const Shorts15V3CTA:React.FC<TemplateProps>=({seed})=>{
 const {p:raw}=useClock(),p=clamp(raw); const split=.45;
 return <g><Defs/>
  <Shot alpha={visible(p,0,split)}>
   <Plate src={photo.tomb} t={clamp(p/split)} zoom={.19} panX={46} panY={-75} dim={.20}/>
   <Head kicker="DISCOVERED IN 1881" line="THE SECRET REVEALED" size={51}/>
  </Shot>
  <Shot alpha={visible(p,split,1)}>
   <Plate src={photo.tomb} t={clamp((p-split)/(1-split))} zoom={.10} panY={-50} dim={.73}/>
   <rect x="94" y="424" width="892" height="305" rx="20" fill={A.navy} opacity=".93" stroke={A.gold} strokeWidth="5"/>
   <text x="540" y="499" fontFamily="Josefin Sans,sans-serif" textAnchor="middle" fontSize="34" letterSpacing="7" fill={A.gold}>NEOKEMETAI</text>
   <text x="540" y="596" fontFamily="Josefin Sans,sans-serif" textAnchor="middle" fontSize="66" fontWeight="900" fill={A.cream}>WATCH THE FULL</text>
   <text x="540" y="668" fontFamily="Josefin Sans,sans-serif" textAnchor="middle" fontSize="67" fontWeight="900" fill={A.cream}>DOCUMENTARY</text>
   <path d="M220 1040H860" stroke={A.gold} strokeWidth="6" />
   <text x="540" y="1121" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontSize="59" fontWeight="800" fill={A.pale}>THE ROYAL CACHE</text>
   {/* The actual YouTube Related Video is attached via Studio after publishing. */}
   <text x="540" y="1248" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontSize="32" fill="#FFE4AB">FULL STORY ON THE CHANNEL</text>
  </Shot>
  <CaptionLane/>
 </g>;
};
