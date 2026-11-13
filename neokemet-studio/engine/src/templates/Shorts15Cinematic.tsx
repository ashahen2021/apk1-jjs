/**
 * NeoKemetAI Shorts15 Cinematic V2 — 4 scene types, ten directed mini-shots.
 * Real SVG artwork, no external images/APIs or credit calls. Deterministic.
 * Scene durations: 3s hook (2), 5s danger (3), 4s reveal (3), 3s CTA (2).
 * Each micro-shot has a distinct visual subject/layout, not a digital crop alone.
 * Earlier cinematic V1, other projects and presets are preserved.
 */
import React from "react";
import { useClock, ClockCtx } from "../components/AnimatedScene";
import type { TemplateProps } from "./common";
import { CinematicRoyalReveal, CinematicTT320 } from "./CinematicPilot";

const S = {
  night: "#0D1823", blue: "#173954", lapis: "#1F4E8C", teal: "#2E8B84",
  gold: "#C8952B", bright: "#FFDEA1", paper: "#E9D5AD", ink: "#14242B",
  rock: "#A48662", stone: "#D8CBA8", terra: "#A83A2C", copper: "#A66A41",
};
const cap = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { const t = cap(n); return t * t * (3 - 2 * t); };
const fade = (p: number, a: number, b: number) => smooth((p - a) / Math.max(0.001, b - a));
const num = (n: number) => Number(n.toFixed(4));
const tween = (a: number, b: number, t: number) => a + (b-a)*t;
const phase = (p: number, from: number, to: number) => cap((p-from)/(to-from));
const shotVisibility = (p: number, from: number, to: number) =>
  num(fade(p, from-0.012, from+0.018) * (1 - fade(p, to-0.014, to+0.02)));

/** Lightweight compositing frame. The original paper overlay is softened by StudioScene. */
const Look: React.FC<{children: React.ReactNode; p: number; dark?: boolean}> = ({children,p,dark=true}) => <g>
  <defs>
    <linearGradient id="s15-night" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#07131D"/><stop offset="0.52" stopColor="#18333F"/><stop offset="1" stopColor="#090E17"/></linearGradient>
    <linearGradient id="s15-rock" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#E4CE9D"/><stop offset="0.36" stopColor="#AC8B64"/><stop offset="0.72" stopColor="#776148"/><stop offset="1" stopColor="#423D39"/></linearGradient>
    <linearGradient id="s15-gold" x1="0" y1="0" x2="0.95" y2="0.8"><stop stopColor="#845329"/><stop offset="0.24" stopColor="#F1CC84"/><stop offset="0.48" stopColor="#FFE9B1"/><stop offset="0.79" stopColor="#B57C40"/><stop offset="1" stopColor="#F5CD7D"/></linearGradient>
    <linearGradient id="s15-blue" x1="0" y1="0" x2="1" y2="0.4"><stop stopColor="#102536"/><stop offset="0.55" stopColor="#28658E"/><stop offset="1" stopColor="#091C31"/></linearGradient>
    <radialGradient id="s15-torch"><stop stopColor="#FFE4A3" stopOpacity="0.96"/><stop offset="0.32" stopColor="#FFBB59" stopOpacity="0.45"/><stop offset="1" stopColor="#FFAB40" stopOpacity="0"/></radialGradient>
    <radialGradient id="s15-moon"><stop stopColor="#FDE6AB" stopOpacity="0.55"/><stop offset="1" stopColor="#FFE5AB" stopOpacity="0"/></radialGradient>
    <filter id="s15-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="17"/></filter>
    <filter id="s15-shadow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="35"/></filter>
  </defs>
  <rect width="1080" height="1920" fill={dark?"url(#s15-night)":"url(#s15-rock)"}/>
  {children}
  <path d="M26 132V28H125M955 28h99v104M26 1789v103h99M955 1892h99v-103" fill="none" stroke={S.gold} strokeWidth="4" opacity="0.65"/>
  {Array.from({length:32},(_,i)=>{
    const x=(i*163+97)%1080; const y=((i*317+Math.floor(p*65)*(i%3+1))%1830+35);
    return <circle key={i} cx={x} cy={y} r={i%4+1} fill={i%3?S.bright:S.teal} opacity={0.10+0.035*(i%5)} />;
  })}
</g>;
const Heading: React.FC<{title:string;kicker:string;accent?:string}> = ({title,kicker,accent=S.bright})=><g>
  <rect x="104" y="205" width="872" height="146" rx="10" fill="#07161E" opacity="0.83"/>
  <path d="M155 362H925" stroke={S.gold} strokeWidth="3" opacity="0.72" />
  <text x="540" y="252" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontWeight="700" fontSize="26" letterSpacing="5" fill={S.gold}>{kicker}</text>
  <text x="540" y="317" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontWeight="900" fontSize="59" letterSpacing="2" fill={accent} stroke="#07131C" strokeWidth="1.2" paintOrder="stroke">{title}</text>
</g>;
const Glow: React.FC<{x:number;y:number;r?:number;p:number}> = ({x,y,r=260,p})=><g>
  <ellipse cx={x} cy={y} rx={r} ry={r} fill="url(#s15-torch)" opacity={num(.78+.17*Math.sin(p*22))}/>
  <path d={`M${x} ${y+16}l-12 -30 12 -35 13 35Z`} fill="#FFEAB5" stroke="#CA7D38" strokeWidth="3"/>
</g>;
const Coffin: React.FC<{x:number;y:number;k?:number;open?:boolean}> = ({x,y,k=1,open=false})=><g transform={`translate(${x} ${y}) scale(${k})`}>
  <ellipse cx="0" cy="15" rx="148" ry="330" fill="#000" opacity="0.35" filter="url(#s15-shadow)"/>
  <path d="M-119 -230Q-114 -303 0 -312Q114 -303 119 -230L135 151Q128 276 0 310Q-128 276 -135 151Z" fill="url(#s15-gold)" stroke={S.bright} strokeWidth="12"/>
  <path d="M-93 -237L-107 150Q-96 232 0 274Q96 232 107 150L93 -237" stroke="#69492D" strokeWidth="8" fill="none"/>
  <ellipse cx="0" cy="-178" rx="70" ry="92" fill={open?"#A86A3F":"#D49C5C"} stroke={S.bright} strokeWidth="7"/>
  <path d="M-62 -219Q0 -287 62 -219L46 -242Q0 -259 -46 -242Z" fill="url(#s15-blue)" stroke={S.gold} strokeWidth="8"/>
  <path d="M-41 -166Q0 -185 41 -166M-32 -142H32M-19 -120H19" fill="none" stroke="#65442C" strokeWidth="6"/>
  {Array.from({length:9},(_,i)=><path key={i} d={`M-97 ${-23+i*28}Q0 ${-3+i*28} 97 ${-23+i*28}`} fill="none" stroke={i%3===0?S.teal:i%3===1?S.bright:S.lapis} strokeWidth={i%3===1?9:13}/>)}
  <path d="M-60 14L62 94M60 14L-62 94" stroke="#173848" strokeWidth="15"/>
</g>;
const StoneRows: React.FC<{p:number;light?:boolean}> = ({p,light})=><g>
  {Array.from({length:17},(_,i)=><g key={i}>
    <path d={`M-40 ${440+i*78}Q240 ${411+i*78} 550 ${447+i*78}T1120 ${430+i*78}`} fill="none" stroke={i%3===0?"#EBC894":"#69594C"} strokeWidth={i%3===0?7:3} opacity="0.32"/>
    <path d={`M${(i*67)%820+40} ${460+i*78}l${-27-i%4*8} ${20+i%5*6}`} stroke="#4B403A" strokeWidth="4" opacity="0.45"/>
  </g>)}
  {light && <ellipse cx="540" cy="1100" rx="440" ry="680" fill="url(#s15-moon)" opacity={.7+.2*Math.sin(p*9)}/>}
</g>;
const SandWave: React.FC<{p:number}> = ({p})=><g opacity="0.8">
  {Array.from({length:8},(_,i)=><path key={i} d={`M-80 ${1140+i*72}Q170 ${1090+i*72} 440 ${1140+i*72}T1160 ${1110+i*72}`} stroke={i%2?"#F9DFAB":"#776047"} strokeWidth="5" fill="none" opacity="0.28"/>)}
</g>;

/** Hook: V1's detailed portrait and coffin, timed as two distinct images. */
export const Shorts15Hook: React.FC<TemplateProps> = ({scene,seed}) => <CinematicRoyalReveal scene={scene} seed={seed}/>;

/** 5s danger: plundered burial / priests rewrapping / royal transfer, three distinct SVG shots. */
export const Shorts15Danger: React.FC<TemplateProps> = ({scene,seed}) => {
  const {p}=useClock();
  const v=cap(p);
  const a=shotVisibility(v,0,.333),b=shotVisibility(v,.333,.667),c=shotVisibility(v,.667,1);
  const qa=phase(v,0,.333),qb=phase(v,.333,.667),qc=phase(v,.667,1);
  return <Look p={v}>
    {/* 1 — active robbery scene: broken seal, thief, flame and coffin, with push-in. */}
    <g opacity={a}>
      <g transform={`translate(540 1030) scale(${num(1+qa*.11)}) translate(-540 -1030)`}>
        <StoneRows p={qa} light/>
        <path d="M100 1470V575L220 405H860L980 575V1470Z" fill="#10232C" stroke="#A88A61" strokeWidth="29"/>
        <path d="M250 1320L345 670L740 670L835 1320" fill="none" stroke="#D0AE7D" strokeWidth="19" opacity="0.5"/>
        <ellipse cx="540" cy="1140" rx="280" ry="400" fill="url(#s15-torch)" opacity=".6"/>
        <Coffin x={540} y={1180} k={.78} open/>
        <g transform={`translate(${num(800-qa*73)} 1150)`}>
          <ellipse cx="0" cy="-118" rx="64" ry="80" fill="#11151A"/>
          <path d="M-80 -44L60 -44L101 325H-116Z" fill="#0C1015" stroke="#3E4444" strokeWidth="12"/>
          <path d="M-18 -30L-89 98L-148 40M19 -32L73 51L83 -8" stroke="#14161A" strokeWidth="36" strokeLinecap="round" fill="none"/>
          <path d="M78 -5L99 -190" stroke="#694831" strokeWidth="15"/><Glow x={101} y={-208} p={qa} r={165}/>
        </g>
        <g transform={`translate(276 912) rotate(${-15+qa*17})`}><rect x="-65" y="-72" width="130" height="140" fill="#C99C63" stroke={S.gold} strokeWidth="14"/><path d="M-50 -45L52 42M43 -65L-55 51" stroke={S.terra} strokeWidth="10"/></g>
      </g>
      <Heading kicker="THE VALLEY OF THE KINGS" title="THE TOMBS WERE ROBBED" accent="#FFE5B2"/>
    </g>
    {/* 2 — hands working with actual animated linen layers; not a re-used still. */}
    <g opacity={b}>
      <StoneRows p={qb} light/>
      <path d="M155 1240L905 1240L1022 1510H42Z" fill="url(#s15-rock)" stroke="#E9C585" strokeWidth="12"/>
      <rect x="183" y="1100" width="714" height="185" rx="25" fill="#263F40" stroke={S.gold} strokeWidth="18"/>
      <g transform="translate(540 1193) scale(1.8 .42)"><Coffin x={0} y={0} k={.67}/></g>
      <g transform={`translate(${num(287+qb*35)} 923)`}>
        <circle cx="0" cy="-94" r="72" fill="#C99B69" stroke="#F1C991" strokeWidth="8"/>
        <path d="M-85 -30H85L145 386H-144Z" fill="#E7D1AB" stroke="#BDA577" strokeWidth="14"/>
        <path d="M-73 56L60 52" stroke={S.teal} strokeWidth="20"/>
        <path d="M60 86L215 170" stroke="#B88D62" strokeWidth="31" strokeLinecap="round"/>
      </g>
      <g transform={`translate(${num(796-qb*24)} 925)`}>
        <circle cy="-94" r="72" fill="#B88A60" stroke="#EAC38E" strokeWidth="8"/>
        <path d="M-83 -30H83L136 386H-130Z" fill="#D9C49E" stroke="#8F775A" strokeWidth="14"/>
        <path d="M-50 82L-218 168" stroke="#C69C71" strokeWidth="31" strokeLinecap="round"/>
      </g>
      <path d={`M390 ${num(1100+qb*26)}Q540 ${num(1030-qb*20)} 690 ${num(1110+qb*15)}`} stroke="#FFE6B9" strokeWidth="22" fill="none" strokeLinecap="round"/>
      <path d={`M405 ${num(1128+qb*19)}Q540 ${num(1065+qb*4)} 680 1143`} stroke="#A98564" strokeWidth="5" fill="none"/>
      <Glow x={207} y={787} p={qb} r={270}/>
      <Heading kicker="THE PRIESTS OF AMUN" title="A DESPERATE RESCUE"/>
    </g>
    {/* 3 — mountainous night transfer. Full compositional change. */}
    <g opacity={c}>
      <rect width="1080" height="1920" fill="url(#s15-night)"/>
      <circle cx="836" cy="494" r="118" fill="#FADCA3" opacity=".6"/>
      <ellipse cx="795" cy="515" rx="320" ry="350" fill="url(#s15-moon)"/>
      <g transform={`translate(${num(-qc*52)} ${num(qc*28)}) scale(${num(1+qc*.07)})`}>
        <path d="M-120 1150L135 580L325 950L535 420L740 790L920 480L1200 1120V1920H-120Z" fill="#76634F" stroke="#DDC49A" strokeWidth="6"/>
        <path d="M-30 1320L205 840L350 1130L602 670L772 1120L1080 870V1920H-30Z" fill="#4A5049"/>
        <path d="M150 1460Q436 1270 610 1325T1110 1280L1110 1920H0Z" fill="#24383B"/>
        <path d="M70 1515Q540 1420 1010 1515" stroke="#CAAB78" strokeWidth="28" fill="none" opacity="0.7"/>
        <SandWave p={qc}/>
        <g transform={`translate(${num(350+qc*140)} 1470)`}>
          <path d="M-110 0H102M-94 -55H88" stroke={S.gold} strokeWidth="15"/>
          <rect x="-66" y="-110" width="120" height="67" rx="29" fill="url(#s15-gold)" stroke={S.bright} strokeWidth="9"/>
          {[-110,102].map((x,i)=><g key={i}><circle cx={x} cy={-113} r={23} fill="#CCA47D"/><path d={`M${x-20} -85L${x+15} -85L${x+30} 17H${x-30}Z`} fill="#D2BA94"/><path d={`M${x-11} 12L${x-18} 93M${x+8} 12L${x+20} 93`} stroke="#987855" strokeWidth={12}/></g>)}
        </g>
        <path d="M680 1070L735 947L782 1090Z" fill="#0C1F25" stroke={S.gold} strokeWidth="10"/>
        <Glow x={745} y={1012} p={qc} r={250}/>
      </g>
      <Heading kicker="BENEATH THE THEBAN CLIFFS" title="MOVED TO SAFETY"/>
    </g>
  </Look>;
};

/** 4s reveal: the upgraded V1 shaft and cutaway plus a unique close coffin detail. */
export const Shorts15Reveal: React.FC<TemplateProps> = ({scene,seed}) => {
  const clock=React.useContext(ClockCtx);
  const {p}=useClock(); const v=cap(p);
  const close=fade(v,.67,.71);
  const under=Math.min(1,v/.68);
  return <g>
    <g opacity={num(1-close)}>
      <ClockCtx.Provider value={{...clock,f:clock.D*under}}>
        <CinematicTT320 scene={{...scene,label:"THE SECRET SHAFT"}} seed={seed}/>
      </ClockCtx.Provider>
    </g>
    <g opacity={num(close)}>
      <Look p={v}>
        <StoneRows p={v} light/>
        <g transform={`translate(540 1020) scale(${num(1+(v-.68)*.28)}) translate(-540 -1020)`}>
          <path d="M65 1490V450L255 320H825L1015 450V1490Z" fill="#101E26" stroke="#C19B6E" strokeWidth="30"/>
          <path d="M205 1430V490H875V1430Z" fill="#06151F" stroke="#72827A" strokeWidth="7"/>
          <ellipse cx="540" cy="1100" rx="440" ry="460" fill="url(#s15-torch)" opacity="0.8"/>
          <Coffin x={520} y={1080} k={1.1}/>
          <g opacity="0.66"><Coffin x={255} y={1228} k={.6}/><Coffin x={825} y={1232} k={.6}/></g>
          <Glow x={280} y={780} p={v} r={270}/><Glow x={795} y={785} p={v} r={290}/>
        </g>
        <Heading kicker="DISCOVERED IN 1881" title="KINGS TOGETHER"/>
      </Look>
    </g>
  </g>;
};

/** 3s two-shot ending: discovered artifact to legible native Related video CTA. */
export const Shorts15CTA: React.FC<TemplateProps> = ({scene,seed}) => {
  const {p}=useClock(); const v=cap(p);
  const split=fade(v,.45,.52);
  const a=phase(v,0,.5),b=phase(v,.5,1);
  return <Look p={v}>
    <g opacity={num(1-split)}>
      <StoneRows p={a} light/>
      <g transform={`translate(540 1035) scale(${num(1+a*.16)}) translate(-540 -1035)`}>
        <ellipse cx="520" cy="1050" rx="400" ry="610" fill="url(#s15-moon)"/>
        <path d="M100 1600L230 610L850 610L980 1600Z" fill="#06151C" stroke="#BA9A70" strokeWidth="24"/>
        <path d="M300 1500V707H780V1500" fill="none" stroke="#D9B887" strokeWidth="10"/>
        <Coffin x={540} y={1150} k={1.0}/>
        <Glow x={300} y={914} p={a} r={240}/>
      </g>
      <Heading kicker="THE ROYAL CACHE · 1881" title="SECRET REVEALED"/>
    </g>
    <g opacity={num(split)}>
      <rect width="1080" height="1920" fill="url(#s15-night)"/>
      {Array.from({length:13},(_,i)=><path key={i} d={`M-90 ${570+i*75}Q540 ${565+i*72} 1180 ${570+i*75}`} stroke={i%3===0?S.gold:S.teal} strokeWidth={i%3===0?4:2} opacity="0.23" fill="none"/>)}
      <ellipse cx="540" cy="1080" rx="460" ry="590" fill="url(#s15-moon)" opacity=".92"/>
      <g transform={`translate(540 1130) scale(${num(.62+b*.13)}) translate(-540 -1130)`}>
        <Coffin x={540} y={1040} k={1.15}/>
      </g>
      <path d="M145 544H935M145 1425H935" stroke={S.gold} strokeWidth="5" opacity=".8"/>
      <text x="540" y="463" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontWeight="800" fontSize="31" letterSpacing="8" fill={S.gold}>NEOKEMETAI</text>
      <text x="540" y="610" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontWeight="900" fontSize="61" fill={S.bright}>WATCH THE FULL</text>
      <text x="540" y="688" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontWeight="900" fontSize="82" fill={S.bright}>DOCUMENTARY</text>
      <text x="540" y="1326" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontWeight="700" fontSize="36" fill={S.gold} letterSpacing="3">THE ROYAL CACHE</text>
      <rect x="255" y="1373" width="570" height="78" rx="39" fill={S.gold} opacity="0.92"/>
      <text x="540" y="1427" textAnchor="middle" fontFamily="Josefin Sans,sans-serif" fontWeight="900" fontSize="36" fill={S.ink}>RELATED VIDEO ↓</text>
    </g>
  </Look>;
};
