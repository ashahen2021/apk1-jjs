/**
 * NeoKemetAI Visual Upgrade V1: two genuinely NEW, opt-in, vertically-directed
 * animated SVG scenes. No raster assets, external services or AI calls.
 *
 * Scene 1: close-up royal portrait -> hidden royal coffin.
 * Scene 5: shaft POV -> detailed schematic reconstruction of the Royal Cache.
 *
 * Original Royal Cache presets, documentary templates and all narration files
 * are untouched. These are new template IDs with deterministic motion.
 */
import React from "react";
import { useClock } from "../components/AnimatedScene";
import type { TemplateProps } from "./common";

const P = {
  night: "#101C25", dark: "#152A33", deep: "#0B1720", teal: "#2E817C",
  blue: "#285B88", paleBlue: "#87B0B0", gold: "#DBAD60", bright: "#FFE7A8",
  sand: "#D7BB82", ochre: "#AA7541", stone: "#BCA079", bone: "#F0D5A0",
  copper: "#A45A3C", shadow: "#392D2A", ink: "#1D252A",
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const reveal = (p: number, from: number, to: number) => ease((p - from) / (to - from));
const n = (v: number) => Number(v.toFixed(3));

/** Readable royal typography kept in the upper video-safe region. */
const Headline: React.FC<{ line: string; kicker: string; opacity?: number }> = ({ line, kicker, opacity = 1 }) => (
  <g opacity={opacity}>
    <rect x={125} y={244} width={830} height={118} rx={12} fill="#0C1920" opacity={0.82} />
    <path d="M176 373H904" stroke={P.gold} strokeWidth={3} opacity={0.75} />
    <text x="540" y="290" textAnchor="middle" fontSize="23" letterSpacing="7" fontFamily="Josefin Sans, sans-serif" fill={P.gold}>{kicker}</text>
    <text x="540" y="340" textAnchor="middle" fontSize="65" letterSpacing="2.2" fontWeight="800" fontFamily="Josefin Sans, sans-serif" fill={P.bright}>{line}</text>
  </g>
);

/** Beaded broad collar with individual bands and inset turquoise gems. */
const RoyalCollar: React.FC = () => (
  <g>
    <path d="M287 1210Q540 1320 793 1210L819 1382Q540 1543 261 1382Z" fill="#C18E49" stroke={P.bright} strokeWidth={9} />
    {Array.from({ length: 6 }, (_, i) => (
      <path key={i} d={`M${296 - i * 4} ${1240 + i * 23}Q540 ${1351 + i * 24} ${784 + i * 4} ${1240 + i * 23}`} fill="none" stroke={[P.teal, P.bright, P.blue, P.gold, P.teal, P.bright][i]} strokeWidth={i % 2 ? 12 : 16} />
    ))}
    {Array.from({ length: 17 }, (_, i) => {
      const x = 316 + i * 28;
      const y = 1330 + 96 * Math.sin((i / 16) * Math.PI);
      return <ellipse key={i} cx={x} cy={n(y)} rx={7} ry={14} fill={i % 3 === 0 ? P.bright : P.blue} stroke={P.gold} strokeWidth={2} />;
    })}
    <path d="M540 1388L564 1430L540 1470L516 1430Z" fill={P.bright} stroke={P.ochre} strokeWidth={4} />
  </g>
);

/** Stylised but recognisable New Kingdom royal portrait; face, nemes, uraeus and beard. */
const RoyalPortrait: React.FC<{ p: number }> = ({ p }) => {
  const glint = Math.sin(p * Math.PI * 4) * 0.5 + 0.5;
  return <g>
    <ellipse cx="540" cy="1284" rx="355" ry="305" fill="#060D12" opacity="0.64" />
    {/* shoulders, blue-gold nemes lappets */}
    <path d="M262 1130Q199 1230 182 1504H898Q882 1230 817 1130L718 1068L362 1068Z" fill="url(#cv1-tunic)" stroke="#563A34" strokeWidth="11" />
    <path d="M318 910Q277 1047 226 1380L364 1440L405 1070Z" fill="url(#cv1-blue)" stroke={P.gold} strokeWidth="8" />
    <path d="M762 910Q803 1047 854 1380L716 1440L675 1070Z" fill="url(#cv1-blue)" stroke={P.gold} strokeWidth="8" />
    {Array.from({ length: 7 }, (_, i) => <g key={i}>
      <path d={`M${321 - i * 7} ${987 + i * 49}l${-40 + i * 2} ${i > 3 ? 51 : 39}`} stroke={P.gold} strokeWidth="15" opacity="0.9" />
      <path d={`M${759 + i * 7} ${987 + i * 49}l${40 - i * 2} ${i > 3 ? 51 : 39}`} stroke={P.gold} strokeWidth="15" opacity="0.9" />
    </g>)}
    <path d="M367 1154Q540 1210 713 1154L753 1347Q540 1420 327 1347Z" fill={P.ochre} />
    <RoyalCollar />
    {/* nemes crown behind head */}
    <path d="M324 924Q298 660 400 544Q540 468 680 544Q782 660 756 924L705 1078L375 1078Z" fill="url(#cv1-blue)" stroke={P.bright} strokeWidth="12" />
    <path d="M370 563Q540 480 710 563" fill="none" stroke={P.gold} strokeWidth="28" />
    {Array.from({ length: 7 }, (_, i) => (
      <path key={i} d={`M${334 + 5 * i} ${636 + i * 52}Q540 ${562 + i * 50} ${746 - 5 * i} ${636 + i * 52}`} fill="none" stroke={i % 2 ? P.ochre : P.bright} strokeWidth={i % 2 ? 8 : 13} opacity="0.76" />
    ))}
    {/* ears and rendered face with cheekbones */}
    <path d="M368 844Q339 809 336 864Q342 921 378 936M712 844Q741 809 744 864Q738 921 702 936" fill={P.ochre} stroke={P.bright} strokeWidth={6} />
    <path d="M390 724Q540 665 690 724L706 932Q677 1110 540 1160Q403 1110 374 932Z" fill="url(#cv1-face)" stroke="#7B563E" strokeWidth={8} />
    <path d="M395 779Q432 735 475 756L480 922Q460 1005 410 1031" fill="#F2CF91" opacity="0.21" />
    <path d="M682 780Q651 735 600 761L599 959Q640 1031 676 1048" fill="#4D4236" opacity="0.31" />
    <path d="M410 846Q467 810 511 850Q469 883 418 860" fill="#FFF1C8" stroke="#4B3830" strokeWidth={8} />
    <path d="M670 846Q613 810 569 850Q611 883 662 860" fill="#FFF1C8" stroke="#4B3830" strokeWidth={8} />
    <path d="M465 828Q476 835 471 871Q453 867 456 844Z" fill="#112A35" />
    <path d="M615 828Q626 835 621 871Q603 867 606 844Z" fill="#112A35" />
    <path d="M410 824Q468 784 510 821M670 824Q612 784 570 821" fill="none" stroke="#372D30" strokeWidth="16" strokeLinecap="round" />
    <path d="M536 845Q510 952 514 978Q540 1007 565 977Q563 948 544 843" fill="url(#cv1-nose)" stroke="#806040" strokeWidth="5" />
    <path d="M474 1044Q540 1062 607 1044Q540 1090 474 1044Z" fill="#995A4B" />
    <path d="M478 1049Q540 1060 603 1049" fill="none" stroke="#E9AF80" strokeWidth="5" />
    <path d="M470 1110Q540 1131 610 1110" fill="none" stroke="#784D35" strokeWidth="6" />
    {/* ceremonial beard */}
    <path d="M513 1144Q540 1160 566 1144L572 1355Q540 1380 508 1355Z" fill="url(#cv1-blue)" stroke={P.gold} strokeWidth="9" />
    {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M513 ${1180 + i * 37}h55`} stroke={P.bright} strokeWidth="9" />)}
    {/* uraeus cobra */}
    <path d="M522 588Q510 541 521 514Q539 501 540 522Q566 492 576 525Q572 555 551 582" fill={P.gold} stroke="#7E4E33" strokeWidth="5" />
    <path d="M543 586Q543 549 540 519" stroke={P.blue} strokeWidth="9" fill="none" />
    <circle cx={526} cy={529} r={4} fill={P.ink}/>
    {/* warm moving glint, anchored to jewelry */}
    <path d="M302 1257Q540 1393 778 1257" fill="none" stroke={P.bright} strokeWidth="5" opacity={n(glint * 0.6)} />
  </g>;
};

const GoldCoffin: React.FC<{ x: number; y: number; scale?: number; glow?: number }> = ({ x, y, scale = 1, glow = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="26" rx="148" ry="305" fill={P.gold} opacity={n(0.15 * glow)} filter="url(#cv1-glow)" />
    <path d="M-115 -257Q-106 -301 0 -306Q106 -301 115 -257L130 169Q126 266 0 295Q-126 266 -130 169Z" fill="url(#cv1-gold)" stroke={P.bright} strokeWidth={10} />
    <path d="M-100 -230L-106 164Q-96 233 0 267Q96 233 106 164L100 -230" stroke="#866036" strokeWidth={7} fill="none" />
    <ellipse cy="-176" rx="73" ry="104" fill="#C7934D" stroke={P.bright} strokeWidth={9} />
    <path d="M-75 -198Q-64 -285 0 -292Q64 -285 75 -198L47 -220Q0 -235 -47 -220Z" fill={P.blue} stroke={P.gold} strokeWidth={6} />
    <path d="M-43 -182Q0 -202 43 -182M-36 -154H36M-27 -127H27" stroke="#694735" strokeWidth={8} fill="none" />
    {Array.from({length: 7}, (_, i) => <path key={i} d={`M-95 ${-25 + i * 36}Q0 ${-6 + i * 36} 95 ${-25 + i * 36}`} stroke={i % 2 ? P.teal : P.bright} strokeWidth={i % 2 ? 10 : 7} fill="none" />)}
    <path d="M-58 21L58 79M58 21L-58 79" stroke={P.ink} strokeWidth={15} opacity="0.8"/>
  </g>
);

const movingDust = (p: number, seed: number, dark = false) => Array.from({length: 44}, (_, i) => {
  const x = ((i * 137 + seed * 19) % 1080);
  const y = ((i * 191 + seed * 11 + p * (i % 2 ? 120 : -95)) % 1920 + 1920) % 1920;
  const r = 1.4 + (i % 4) * 0.82;
  return <circle key={i} cx={x} cy={n(y)} r={r} fill={dark ? P.bright : P.gold} opacity={0.10 + (i % 5) * 0.055} />;
});

/** High-detail two-beat visual hook for the pilot Short only. */
export const CinematicRoyalReveal: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { p: raw } = useClock();
  const p = clamp(raw);
  const split = reveal(p, 0.42, 0.53);
  const zoomA = 1 + p * 0.14;
  const zoomB = 1.04 + Math.max(0, p - 0.5) * 0.19;
  const glow = 0.48 + 0.25 * Math.sin(p * 5 * Math.PI);
  return <g>
    <defs>
      <linearGradient id="cv1-bg" x1="0" y1="0" x2="0.96" y2="1"><stop stopColor="#273E42"/><stop offset="0.55" stopColor="#121F2A"/><stop offset="1" stopColor="#080F18"/></linearGradient>
      <linearGradient id="cv1-gold" x1="0" y1="0" x2="1" y2="0.8"><stop stopColor="#86542E"/><stop offset="0.26" stopColor="#E9BF73"/><stop offset="0.5" stopColor="#FFE4A1"/><stop offset="0.78" stopColor="#AD723B"/><stop offset="1" stopColor="#F1CD81"/></linearGradient>
      <linearGradient id="cv1-blue" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#122E48"/><stop offset="0.42" stopColor="#347CA1"/><stop offset="0.7" stopColor="#1D4E80"/><stop offset="1" stopColor="#071D32"/></linearGradient>
      <linearGradient id="cv1-face" x1="0" y1="0" x2="1" y2="0.8"><stop stopColor="#E9B778"/><stop offset="0.47" stopColor="#C99661"/><stop offset="0.7" stopColor="#B88152"/><stop offset="1" stopColor="#74503E"/></linearGradient>
      <linearGradient id="cv1-nose"><stop stopColor="#B57F54"/><stop offset="0.45" stopColor="#F5C68B"/><stop offset="1" stopColor="#906442"/></linearGradient>
      <linearGradient id="cv1-tunic" x1="0" x2="0.8" y1="0" y2="1"><stop stopColor="#F9DB9F"/><stop offset="0.6" stopColor="#B39B74"/><stop offset="1" stopColor="#664D3D"/></linearGradient>
      <radialGradient id="cv1-light"><stop stopColor="#FFE2A0" stopOpacity="0.74"/><stop offset="0.33" stopColor="#E6A052" stopOpacity="0.23"/><stop offset="1" stopColor="#CF7A35" stopOpacity="0"/></radialGradient>
      <filter id="cv1-glow" x="-130%" y="-130%" width="360%" height="360%"><feGaussianBlur stdDeviation="24"/></filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#cv1-bg)" />
    {/* Shot A — royal face. Graphics are intentionally much richer than basic geometric statue. */}
    <g opacity={n(1-split)}>
      <g opacity="0.48">
        {Array.from({ length: 5 }, (_, i) => <g key={i} transform={`translate(${60 + i * 234} 0)`}>
          <rect x="0" y="410" width="88" height="1320" fill="#9A7857" opacity="0.54" />
          <path d="M-26 412H114V466H-26ZM-31 1670H119V1727H-31Z" fill="#F6C987" />
          {Array.from({length:5}, (_,j)=><path key={j} d={`M${12+j*14} 470V1667`} stroke="#1F3638" strokeWidth={5} opacity="0.65"/>)}
        </g>)}
      </g>
      <path d="M840 0L1080 0L770 1700L490 1770Z" fill="#E2B56C" opacity="0.08" />
      <ellipse cx="805" cy="950" rx="500" ry="740" fill="url(#cv1-light)" opacity="0.8" />
      <g transform={`translate(540 1060) scale(${n(zoomA)}) translate(-540 -1060)`}>
        <RoyalPortrait p={p}/>
      </g>
      <path d="M0 1540Q540 1480 1080 1540V1920H0Z" fill="#0B141C" opacity="0.55" />
      <Headline line={(scene.label || "WHERE IS RAMSES?").toUpperCase()} kicker="THE ROYAL CACHE" opacity={reveal(p,0,0.09)} />
    </g>
    {/* Shot B — new location; different picture, not a zoom of the same drawing. */}
    <g opacity={n(split)}>
      <rect width="1080" height="1920" fill="#101A21" />
      {Array.from({length: 17}, (_,i)=><g key={i}>
        <path d={`M0 ${450+i*82}Q270 ${425+i*83} 540 ${455+i*82}T1080 ${450+i*82}`} stroke="#8B775B" strokeWidth={i%3===0?7:3} fill="none" opacity="0.38" />
      </g>)}
      <path d="M160 530L256 420L830 420L924 530V1540H160Z" fill="#182A30" stroke="#9D8761" strokeWidth={19} />
      <path d="M257 416L289 790L342 1050L415 1440H665L740 1050L791 790L826 416Z" fill="#050F17" />
      <path d="M460 515L620 515L660 1540H420Z" fill="#F4C077" opacity="0.07" />
      <ellipse cx="540" cy="1030" rx="410" ry="620" fill="url(#cv1-light)" opacity={n(glow)} />
      <g transform={`translate(540 1060) scale(${n(zoomB)}) translate(-540 -1060)`}>
        <GoldCoffin x={540} y={1100} scale={1.05} glow={1.3}/>
        <g opacity="0.7"><path d="M290 1500H790" stroke={P.gold} strokeWidth={7}/><path d="M330 1530H750" stroke={P.teal} strokeWidth={4}/></g>
      </g>
      <Headline line="HIDDEN IN SECRET" kicker="A KING WITHOUT HIS TOMB" opacity={reveal(p,0.48,0.58)} />
    </g>
    {movingDust(p,seed,true)}
    <rect x="12" y="14" width="1056" height="1892" fill="none" stroke="#D9B17A" opacity="0.38" strokeWidth="3" />
  </g>;
};

const RockStrata: React.FC<{ p: number; seed: number }> = ({ p, seed }) => <g>
  {Array.from({length: 21}, (_,i) => {
    const y = 340 + i * 66;
    const offset = ((seed*19 + i*87) % 38)-19;
    return <g key={i}>
      <path d={`M${-24 + offset} ${y}Q240 ${y-26} 480 ${y+11}T1100 ${y-2}`} stroke={i%4===0 ? "#F3CB91" : "#7B6958"} strokeWidth={i%4===0?6:3} opacity={i%4===0 ? 0.44:0.32} fill="none" />
      {i%3===0 && <path d={`M${(i*131)%650+80} ${y}l-${30+i%5*10} ${18+i%4*9}`} stroke="#504A40" strokeWidth="4" opacity="0.5"/>}
    </g>;
  })}
  <path d={`M0 ${1200+p*13}Q240 1170 420 1200T1080 1200V1920H0Z`} fill="#6B6050" opacity="0.09" />
</g>;

const CutawayCoffin: React.FC<{ x:number; y:number; scale?:number; lit?: boolean }> = ({ x,y,scale=1,lit=false })=><g transform={`translate(${x} ${y}) scale(${scale})`}>
  {lit && <ellipse cy="2" rx="106" ry="39" fill={P.gold} opacity="0.4" filter="url(#tt1-blur)"/>}
  <path d="M-90 -24L-106 -10L-90 24L90 24L106 -10L90 -24Z" fill="url(#tt1-coffin)" stroke="#EDC17A" strokeWidth="5"/>
  <path d="M-61 -19L-61 19M61 -19L61 19M-48 -15L48 15M-48 15L48 -15" stroke={P.teal} strokeWidth={4}/>
  <path d="M-23 -17L-23 17M0 -18V18M23 -17V17" stroke="#E2C57F" strokeWidth={5}/>
  <ellipse cx="-75" cy="0" rx="16" ry="13" fill="#F1CD8A" stroke={P.gold} strokeWidth={4}/>
</g>;

const Lamp: React.FC<{ x:number; y:number; power?:number }> = ({x,y,power=1})=><g>
  <circle cx={x} cy={y} r={74*power} fill="url(#tt1-torch)" opacity="0.75"/>
  <circle cx={x} cy={y} r={8} fill={P.bright} />
  <path d={`M${x} ${y}l-8 -19L${x} ${y-30}L${x+8} ${y-19}Z`} fill="#FFEFC2" />
</g>;

export const CinematicTT320: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { p: raw } = useClock();
  const p = clamp(raw);
  const split = reveal(p,0.36,0.46);
  const pulse = 0.75+0.25*Math.sin(p*8*Math.PI);
  const crawl = reveal(p, 0.4, 0.86);
  return <g>
    <defs>
      <linearGradient id="tt1-rock" x1="0.12" y1="0" x2="1" y2="1"><stop stopColor="#E0C797"/><stop offset="0.52" stopColor="#9D8262"/><stop offset="1" stopColor="#574A3E"/></linearGradient>
      <linearGradient id="tt1-depth" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#122C35"/><stop offset="0.6" stopColor="#0B161F"/><stop offset="1" stopColor="#040C10"/></linearGradient>
      <linearGradient id="tt1-coffin"><stop stopColor="#825B39"/><stop offset="0.3" stopColor="#D8A95D"/><stop offset="0.55" stopColor="#F5D28B"/><stop offset="1" stopColor="#A77A43"/></linearGradient>
      <radialGradient id="tt1-torch"><stop stopColor="#FFE7A5" stopOpacity="0.76"/><stop offset="0.24" stopColor="#FFD17E" stopOpacity="0.32"/><stop offset="1" stopColor="#FFA13D" stopOpacity="0"/></radialGradient>
      <radialGradient id="tt1-shaft"><stop stopColor="#F2CE88" stopOpacity="0.53"/><stop offset="1" stopColor="#F2CE88" stopOpacity="0"/></radialGradient>
      <filter id="tt1-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="15"/></filter>
    </defs>
    <rect width="1080" height="1920" fill="#1B2A31" />
    {/* Shot A: atmospheric descent down the shaft. */}
    <g opacity={n(1-split)}>
      <rect width="1080" height="1920" fill="url(#tt1-depth)" />
      <g transform={`translate(540 1040) scale(${n(1+p*0.19)}) translate(-540 -1040)`}>
        <path d="M0 0H1080L910 1590L720 1920H360L170 1590Z" fill="url(#tt1-rock)"/>
        <RockStrata p={p} seed={seed}/>
        <path d="M350 370L730 370L775 1610L645 1920H435L305 1610Z" fill="url(#tt1-depth)" stroke="#D6B581" strokeWidth={29}/>
        <path d="M406 395L473 1410L540 1640L602 1410L674 395" fill="none" stroke="#483A30" strokeWidth={15} opacity="0.85"/>
        <path d="M409 392L476 1414" fill="none" stroke="#E7C48B" strokeWidth="4" opacity="0.54" />
        <path d="M660 392L599 1414" fill="none" stroke="#E7C48B" strokeWidth="4" opacity="0.54" />
        <path d="M475 -60L550 790L595 1290" fill="none" stroke="#B89A67" strokeWidth={6}/>
        <ellipse cx="540" cy="1630" rx="330" ry="470" fill="url(#tt1-shaft)" opacity={n(pulse)}/>
        <Lamp x={586} y={1430} power={1.6} />
        <path d="M380 1510Q540 1420 700 1510" stroke="#9F7043" strokeWidth={12} opacity="0.36" fill="none" />
        {movingDust(p,seed,false)}
      </g>
      <Headline line={(scene.label || "THE HIDDEN SHAFT").toUpperCase()} kicker="BEYOND THE TOMB DOOR" opacity={reveal(p,0,0.1)}/>
    </g>
    {/* Shot B: exploded/sectional view, deliberately schematic (NOT a surveyed floor plan). */}
    <g opacity={n(split)}>
      <rect width="1080" height="1920" fill="url(#tt1-rock)" />
      <RockStrata p={p} seed={seed+4}/>
      <g transform={`translate(540 990) scale(${n(1.04 + Math.max(0,p-0.45)*0.12)}) translate(-540 -990)`}>
        {/* Entrance near top, vertical shaft, sloping passage and terminal chamber. */}
        <path d="M272 520H444V895H690L841 1122V1322H320L298 1148L572 1148L539 1064H262Z" fill="none" stroke="#F2D29B" strokeWidth={55} strokeLinejoin="round" opacity="0.4" />
        <path d="M272 520H444V895H690L841 1122V1322H320L298 1148L572 1148L539 1064H262Z" fill="none" stroke="#3A3B36" strokeWidth={41} strokeLinejoin="round" opacity="0.64" />
        <path d="M272 520H444V895H690L841 1122V1322H320L298 1148L572 1148L539 1064H262Z" fill="none" stroke="#0A1E28" strokeWidth={31} strokeLinejoin="round" />
        <path d="M272 520H444V895H690L841 1122V1322H320L298 1148L572 1148L539 1064H262Z" fill="none" stroke={P.gold} strokeWidth={3.5} strokeDasharray="11 19" opacity="0.65"/>
        {/* Distinct burial cavity with ranks of coffins and pool of lamplight. */}
        <path d="M282 1140L862 1140L888 1424L310 1424Z" fill="#0B212B" stroke="#E6BD7E" strokeWidth={18}/>
        <path d="M325 1368H850M325 1404H850" stroke="#557C7A" strokeWidth={5} opacity="0.8"/>
        <ellipse cx="590" cy="1290" rx="266" ry="138" fill="url(#tt1-torch)" opacity={n(pulse)} />
        {Array.from({length:3}, (_,row)=>Array.from({length:3},(_,col)=> <CutawayCoffin key={`${row}-${col}`} x={410+col*170+(row%2)*16} y={1203+row*77} scale={0.67} lit={row===0&&col===1} />))}
        <Lamp x={778} y={1164} power={1.05}/>
        {/* Survey-style depth arrows not claiming precise distances. */}
        <path d="M203 556V901M190 570L203 548L216 570M190 885L203 907L216 885" stroke={P.shadow} strokeWidth={7} fill="none" />
        <path d="M220 734h35" stroke={P.shadow} strokeWidth={4}/>
        <text x="178" y="755" textAnchor="end" fontFamily="Josefin Sans,sans-serif" fontSize="27" fill={P.shadow}>SHAFT</text>
        <path d="M850 1393L956 1489" stroke={P.gold} strokeWidth={4}/>
        <circle cx={850} cy={1393} r="7" fill={P.gold}/>
        <text x="960" y="1511" textAnchor="end" fontFamily="Josefin Sans,sans-serif" fontWeight="700" fontSize="30" fill={P.shadow}>CACHE</text>
        {/* Animated path highlight sweeping down toward chamber. */}
        <path d="M350 533V965H632L733 1110" stroke="#FFDA91" strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${n(crawl)} 1`} opacity="0.9"/>
      </g>
      <Headline line="INSIDE TT320" kicker="THE ROYAL MUMMY CACHE" opacity={reveal(p,0.46,0.56)}/>
      <g opacity={reveal(p,0.51,0.65)}>
        <rect x="240" y="407" width="600" height="62" rx="7" fill="#0C2028" opacity="0.83"/>
        <text x="540" y="448" textAnchor="middle" fontFamily="Josefin Sans, sans-serif" fontSize="24" letterSpacing="2.6" fill="#F0D39A">SCHEMATIC RECONSTRUCTION</text>
      </g>
    </g>
    {movingDust(p,seed+3,true)}
    <rect x="12" y="14" width="1056" height="1892" fill="none" stroke="#DDB77B" strokeWidth={3} opacity="0.38" />
  </g>;
};
