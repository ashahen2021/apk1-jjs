// Phase-1 documentary templates: Royal Pharaohs, Tomb Robbery, Priests Rewrapping.
// Built only from the studio's SVG primitives; every option comes from scene.params.
import React from "react";
import { spring } from "remotion";
import type { CameraId } from "../../../shared/catalog.ts";
import { paramOf } from "../../../shared/params.ts";
import { useClock } from "../components/AnimatedScene";
import { Dust, Flame, Glow } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { Cast } from "../components/Cast";
import { CoffinSide } from "../components/Coffins";
import { Backdrop, cameraMove, GROUND } from "../components/Environments";
import { Figure, GroundShadow, walkPhase } from "../components/Figures";
import { Ankh, Bier, CanopicJar, Chest, Column, Djed, Scarab, SeatedStatue, Statuette, Vase } from "../components/Objects";
import { Label, RPoly, RRect, Streaks, Stipple } from "../components/Print";
import { mix, pulse, ramp } from "../lib/anim";
import { C } from "../lib/theme";
import { Caption, TemplateProps } from "./common";

const G = GROUND;
const X0 = -760, WW = 2600; // wide enough for 16:9
const CAM: Record<string, CameraId> = { "slow push in": "push-in", "pan left": "pan-left", "pan right": "pan-right", rise: "rise" };

/** Caption for interior scenes: ink on a paper plaque, legible over painted walls in every format. */
const Plaque: React.FC<{ label?: string; sub?: string; t: number }> = ({ label, sub, t }) => {
  if (!label && !sub) return null;
  const w = Math.min(900, Math.max((label ?? "").length * 34, (sub ?? "").length * 19) + 120);
  const h = (label ? 70 : 0) + (sub ? 56 : 0) + 34;
  return (
    <g>
      <g opacity={t * 0.94}><RRect x={540 - w / 2} y={420} w={w} h={h} seed={7} fill={C.cream} amp={2} stroke={C.sand} strokeWidth={2} /></g>
      <Caption label={label} sub={sub} t={t} y={label ? 478 : 432} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Royal Pharaohs                                                      */
/* ------------------------------------------------------------------ */

/** Enthroned king in profile. Origin: floor under the throne; about 300 units tall. */
const SeatedPharaoh: React.FC<{ f: number; accent: string }> = ({ f, accent }) => {
  const sway = Math.sin(f * 0.05) * 2;
  return (
    <g>
      {/* throne */}
      <path d="M-78 0L-78 -236L-44 -236L-40 -112L46 -112L46 0Z" fill={C.teal} />
      <path d="M-78 -236L-44 -236L-44 -224L-78 -224ZM-78 -18L46 -18L46 0L-78 0Z" fill={C.gold} />
      <path d="M-66 -96L34 -96L34 -30L-66 -30Z" fill={C.gold} opacity={0.85} />
      <path d="M-54 -84L22 -84L22 -42L-54 -42Z" fill="none" stroke={C.terra} strokeWidth={4} />
      <path d="M46 -26L118 -26L118 0L46 0Z" fill={C.earth} />
      {/* far arm */}
      <path d="M-4 -206L10 -168L38 -160" stroke={C.earth} strokeWidth={15} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
      {/* legs */}
      <path d="M-14 -122L56 -122L60 -30L92 -28" stroke={C.earth} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* kilt */}
      <path d="M-30 -150L50 -142L66 -100L-30 -100Z" fill={C.cream} stroke={C.sand} strokeWidth={2} />
      <path d="M18 -142L28 -100L40 -100L30 -142Z" fill={C.gold} />
      {/* torso and broad collar */}
      <path d="M-30 -148L16 -148L22 -226L-26 -226Z" fill={C.earth} />
      <path d="M-28 -226L24 -226L26 -206Q0 -192 -30 -206Z" fill={C.gold} />
      <path d="M-27 -212Q0 -200 25 -212" stroke={accent} strokeWidth={4} fill="none" />
      <path d="M-30 -152L18 -152L18 -144L-30 -144Z" fill={C.gold} />
      {/* head, nemes headcloth, uraeus, beard */}
      <path d="M-8 -230L8 -230L8 -222L-8 -222Z" fill={C.earth} />
      <circle cx={2} cy={-250} r={22} fill={C.earth} />
      <path d="M-24 -222L-30 -250Q-30 -280 2 -282Q28 -280 27 -258L12 -262Q0 -264 -6 -252L-8 -222Z" fill={C.gold} />
      <path d="M12 -262L27 -258L30 -206L16 -210Z" fill={C.gold} />
      <path d="M-28 -236L-8 -238M-29 -250L-6 -252M-26 -264L0 -266M-14 -276L14 -276M15 -246L29 -244M16 -230L30 -228M16 -216L30 -214" stroke={accent} strokeWidth={3.4} />
      <path d="M24 -266Q34 -272 31 -284" stroke={C.terra} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M14 -232L20 -232L18 -210L14 -210Z" fill={accent} />
      {/* near arm with crook and flail */}
      <path d="M2 -208L24 -172L56 -178" stroke={C.earth} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`rotate(${sway} 56 -178)`}>
        <path d="M56 -150L56 -300Q56 -322 74 -320Q88 -316 84 -300" stroke={C.gold} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d="M56 -196L56 -208M56 -232L56 -244M56 -268L56 -280" stroke={accent} strokeWidth={8} />
        <path d="M48 -176L40 -262" stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
        {[0, 1, 2].map((i) => <path key={i} d={`M40 -262Q${28 - i * 6 + sway} -244 ${24 - i * 8 + sway * 2} -206`} stroke={i === 1 ? accent : C.gold} strokeWidth={4} fill="none" strokeLinecap="round" />)}
      </g>
    </g>
  );
};

/** Cartouche-style name plate, as if carved on the front of the dais. */
const NamePlate: React.FC<{ name: string; x: number; y: number; t: number }> = ({ name, x, y, t }) => {
  const w = name.length * 21 + 70;
  return (
    <g opacity={t} transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-25} width={w} height={50} rx={25} fill={C.cream} stroke={C.shadow} strokeWidth={4} />
      <rect x={w / 2 - 2} y={-29} width={7} height={58} fill={C.shadow} />
      <Label x={0} y={10} text={name.toUpperCase()} size={27} spacing={0.2} weight={600} />
    </g>
  );
};

const KING_ACCENT: Record<string, string> = { "Ramesses II": C.teal, "Seti I": C.shadow, "Thutmose III": C.terra, "Amenhotep I": C.teal, "Seqenenre Tao": C.earth, "Generic Pharaoh": C.teal };
const KING_ENV = { "temple courtyard with columns": "temple-courtyard", "theban limestone cliffs": "theban-cliffs", "royal burial chamber": "tomb-wall", "desert plateau": "open-desert" } as const;

/** A pharaoh — seated, standing, or as a colossal statue — with a name plate. */
export const RoyalPharaohsTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const name = paramOf(scene, "pharaohName");
  const pose = paramOf(scene, "pose");
  const envName = paramOf(scene, "environment") as keyof typeof KING_ENV;
  const env = KING_ENV[envName];
  const accent = KING_ACCENT[name] ?? C.teal;
  const indoors = env === "tomb-wall";
  const appear = ramp(f, 4, 44);
  const fan = Math.sin(f * 0.06) * 5;
  const statue = pose === "statue close-up";
  return (
    <Camera {...cameraMove(CAM[paramOf(scene, "camera")], p)} cy={statue ? 900 : 1000}>
      <Backdrop env={env} f={f} seed={seed} />
      <Layer depth={1}>
        {indoors && <Glow id={`rp${seed}`} x={540} y={G - 260} r={620} f={f} strength={0.34} />}
        {/* dais */}
        <ellipse cx={540} cy={G + 6} rx={statue ? 420 : 360} ry={18} fill={C.shadow} opacity={0.16} />
        <RRect x={statue ? 180 : 240} y={G - 62} w={statue ? 720 : 600} h={64} seed={seed + 3} fill={statue ? C.gold : C.earth} amp={2} />
        <RRect x={statue ? 150 : 200} y={G - 16} w={statue ? 780 : 680} h={22} seed={seed + 4} fill={statue ? C.earth : C.shadow} amp={1.6} />
        <Streaks x={statue ? 180 : 240} y={G - 60} w={statue ? 720 : 600} h={58} seed={seed + 5} count={18} color={C.paper} opacity={0.35} maxLen={110} thick={3} />
        <g opacity={appear} transform={`translate(0 ${(1 - appear) * 16})`}>
          {pose === "seated" && (
            <>
              {/* fan bearers */}
              {[-1, 1].map((side) => (
                <g key={side}>
                  <Figure x={540 + side * 300} y={G - 62} h={250} kind="bearer" dir={side === -1 ? 1 : -1} armF={128} />
                  <g transform={`translate(${540 + side * 250} ${G - 62 - 250}) rotate(${fan * side})`}>
                    <rect x={-3} y={-170} width={6} height={210} fill={C.earth} />
                    <path d="M0 -170Q-70 -210 -54 -290Q0 -330 54 -290Q70 -210 0 -170Z" fill={C.cream} stroke={C.sand} strokeWidth={3} />
                    <path d="M0 -176L0 -300M0 -190L-36 -280M0 -190L36 -280" stroke={accent} strokeWidth={4} />
                  </g>
                </g>
              ))}
              <g transform={`translate(520 ${G - 62}) scale(1.42)`}><SeatedPharaoh f={f} accent={accent} /></g>
            </>
          )}
          {pose === "standing" && (
            <>
              <Figure x={250} y={G - 62} h={250} kind="priest" dir={1} armF={30 + Math.sin(f * 0.05) * 4} />
              <Figure x={840} y={G - 62} h={250} kind="scribe" dir={-1} armF={64} />
              <GroundShadow x={556} y={G - 62} w={190} />
              <Figure x={540} y={G - 62 + Math.sin(f * 0.05) * 0.8} h={440} kind="pharaoh" dir={1} armF={62} armB={-8} />
              {/* tall staff */}
              <rect x={540 + 440 * 0.265 - 4} y={G - 62 - 440 * 1.06} width={8} height={440 * 1.06} fill={C.gold} />
              <path d={`M${540 + 440 * 0.265} ${G - 62 - 440 * 1.06}q-2 -30 20 -30q18 2 14 22`} stroke={C.gold} strokeWidth={8} fill="none" strokeLinecap="round" />
            </>
          )}
          {statue && (
            <>
              <g transform={`translate(520 ${G - 62}) scale(2.55)`}><SeatedStatue c={C.gold} /></g>
              <RPoly pts={[[300, G - 62], [330, G - 760], [372, G - 880], [400, G - 62]]} seed={seed + 9} fill={C.paper} opacity={0.16} />
              {/* a living figure for scale */}
              <GroundShadow x={880} y={G + 4} w={56} />
              <Figure x={872} y={G + 4} h={132} kind="priest" dir={-1} armF={70} />
            </>
          )}
        </g>
        {name !== "Generic Pharaoh" && <NamePlate name={name} x={540} y={G - 30} t={ramp(f, 36, 70)} />}
        <Dust f={f} x={120} y={420} w={840} h={720} seed={seed} count={22} color={indoors ? C.gold : C.sand} opacity={0.5} />
      </Layer>
      {indoors ? <Plaque label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} /> : <Caption label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} />}
    </Camera>
  );
};

/* ------------------------------------------------------------------ */
/* Tomb Robbery                                                        */
/* ------------------------------------------------------------------ */

const GOODS = [{ x: -390, S: Vase, s: 1.6 }, { x: 390, S: Chest, s: 1.6 }, { x: -300, S: Statuette, s: 1.7 }, { x: 300, S: Vase, s: 1.3 }, { x: -480, S: Chest, s: 1.2 }, { x: 470, S: Statuette, s: 1.3 }];
const AMULETS = [{ S: Ankh, to: [-240, 50], rot: 70 }, { S: Scarab, to: [160, 66], rot: -40 }, { S: Djed, to: [-120, 80], rot: 104 }, { S: Ankh, to: [320, 56], rot: -80 }, { S: Scarab, to: [20, 44], rot: 28 }];
const LEVEL = { intact: 0, opened: 1, looted: 2, damaged: 3 } as const;

/**
 * Coffin on its bier with grave goods. `k` (0 → 1) is how far the disturbance
 * has progressed, so every non-intact stage begins in its original order.
 */
const BurialSet: React.FC<{ x: number; y: number; s: number; level: number; k: number; scattered: boolean; seed: number }> = ({ x, y, s, level, k, scattered, seed }) => {
  const lid = [0, 0.35, 0.8, 1.15][level] * ramp(k, 0.1, 0.5);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {GOODS.map((g, i) => {
        const gone = level >= 2 ? ramp(k, 0.3 + i * 0.06, 0.42 + i * 0.06) : 0;
        return (
          <g key={i} transform={`translate(${g.x} 0) scale(${g.s})`}>
            <g opacity={gone * 0.55} stroke={C.paper} strokeWidth={1.4} strokeDasharray="4 4"><g.S c="none" /></g>
            <g opacity={1 - gone} transform={`translate(0 ${-gone * 10})`}><g.S c={C.gold} /></g>
          </g>
        );
      })}
      <path d="M-240 0L-240 -38L240 -38L240 0L220 0L220 -24L-220 -24L-220 0Z" fill={C.shadow} />
      <CoffinSide x={0} y={-38} len={470} tone="gold" royal seed={seed} lidShift={lid} />
      {level >= 3 && (
        <g opacity={ramp(k, 0.5, 0.7)}>
          <path d="M-20 -92L-6 -70L-16 -56L0 -40" stroke={C.shadow} strokeWidth={4} fill="none" />
          <path d="M96 -88L110 -66L102 -50" stroke={C.shadow} strokeWidth={3.5} fill="none" />
          {[[-150, 12, 20], [-60, 20, -30], [130, 10, 44], [210, 22, -12]].map(([cx, cy, r], i) => (
            <path key={i} d="M-16 8L-10 -10L8 -12L18 4L4 12Z" fill={i % 2 ? C.gold : C.paperDark} transform={`translate(${cx} ${cy}) rotate(${r})`} />
          ))}
        </g>
      )}
      {level >= 2 && scattered && AMULETS.map((a, i) => {
        const t = ramp(k, 0.55 + i * 0.04, 0.72 + i * 0.04);
        return (
          <g key={i} opacity={Math.min(1, t * 4)} transform={`translate(${mix(-60 + i * 30, a.to[0], t)} ${mix(-130, a.to[1], t) - Math.sin(t * Math.PI) * 26}) rotate(${a.rot * t}) scale(1.15)`}>
            <a.S c={i % 2 ? C.teal : C.terra} />
          </g>
        );
      })}
    </g>
  );
};

/** Blocking wall of rough stones; at stages beyond "intact" it is pulled down. */
const BlockingWall: React.FC<{ x: number; y: number; w: number; h: number; k: number; open: boolean; seed: number }> = ({ x, y, w, h, k, open, seed }) => {
  const cols = Math.max(3, Math.round(w / 90)), rows = Math.max(3, Math.round(h / 70));
  const bw = w / cols, bh = h / rows;
  return (
    <g>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const order = (rows - 1 - r) * 0.05 + ((c * 7 + seed) % 5) * 0.03; // top courses go first
        const t = open ? ramp(k, order, order + 0.3) : 0;
        const side = c < cols / 2 ? -1 : 1;
        const bx = x + c * bw + (r % 2 ? bw * 0.25 : 0) * (c === cols - 1 ? 0 : 1);
        const stay = open && r === rows - 1 && (c === 0 || c === cols - 1); // a few stones remain at the foot
        const tt = stay ? t * 0.25 : t;
        return (
          <g key={i} opacity={stay ? 1 : 1 - tt * 0.92} transform={`translate(${side * tt * (60 + c * 12)} ${tt * tt * (h - r * bh) * 0.9}) rotate(${side * tt * 36} ${bx + bw / 2} ${y + r * bh + bh / 2})`}>
            <RRect x={bx + 2} y={y + r * bh + 2} w={bw - 4} h={bh - 4} seed={seed + i} fill={(c + r) % 3 ? C.sand : C.paperDark} amp={2} />
          </g>
        );
      })}
      {!open && [0.3, 0.7].map((u) => <circle key={u} cx={x + w * u} cy={y + h * 0.42} r={16} fill={C.terra} opacity={0.7} />)}
    </g>
  );
};

/** Torch: carried by an intruder's silhouette once the tomb is disturbed, a wall lamp before. */
const TorchLight: React.FC<{ x: number; y: number; h: number; f: number; k: number; intruder: boolean; id: string }> = ({ x, y, h, f, k, intruder, id }) => {
  if (!intruder) {
    return (
      <g>
        <Glow id={id} x={x} y={y - h * 0.9} r={h * 1.3} f={f} strength={0.4} />
        <path d={`M${x - 12} ${y - h * 0.82}l24 0l-6 22l-12 0Z`} fill={C.earth} />
        <Flame x={x} y={y - h * 0.82} f={f} s={h / 190} />
      </g>
    );
  }
  const enter = ramp(k, 0, 0.3);
  const dist = enter * h * 0.9;
  const px = x - h * 0.9 + dist;
  const hx = px + Math.sin((118 * Math.PI) / 180) * 0.3 * h, hy = y + (-0.76 + Math.cos((118 * Math.PI) / 180) * 0.3) * h;
  return (
    <g>
      <Glow id={id} x={hx} y={hy - 20} r={h * 1.25} f={f} strength={0.46} />
      <Figure x={px} y={y} h={h} kind="villager" silhouette={C.shadow} phase={enter < 1 ? walkPhase(dist, h) : undefined} armF={118} lean={4} />
      <rect x={hx - 3} y={hy - 24} width={6} height={h * 0.16} fill={C.shadow} />
      <Flame x={hx} y={hy - 22} f={f} s={h / 170} />
    </g>
  );
};

/** A royal burial in order, then opened, looted or damaged. Schematic and restrained. */
export const TombRobberyTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const stage = paramOf(scene, "stage") as keyof typeof LEVEL;
  const env = paramOf(scene, "environment");
  const torch = paramOf<boolean>(scene, "showTorch");
  const scattered = paramOf<boolean>(scene, "showScatteredObjects");
  const level = LEVEL[stage];
  const k = level === 0 ? 0 : ramp(p, 0.12, 0.78, (t) => t);
  const cam = cameraMove(CAM[paramOf(scene, "camera")], p);
  const ct = pulse(f, 20, 50, D - 30, D - 6);
  const caption = env === "hidden cliff tomb" ? <Caption label={scene.label} sub={scene.sublabel} t={ct} /> : <Plaque label={scene.label} sub={scene.sublabel} t={ct} />;

  if (env === "hidden cliff tomb") {
    const DX = 300, DW = 480, DH = 400;
    return (
      <Camera {...cam} cy={1000}>
        <Backdrop env="theban-cliffs" f={f} seed={seed} />
        <Layer depth={0.9}>
          {/* rock-cut doorway */}
          <RRect x={DX - 34} y={G - DH - 44} w={DW + 68} h={DH + 50} seed={seed + 2} fill={C.earth} amp={3} />
          <RRect x={DX} y={G - DH} w={DW} h={DH + 6} seed={seed + 3} fill={C.night} amp={2} />
          <rect x={DX - 44} y={G - DH - 62} width={DW + 88} height={24} fill={C.gold} />
          <defs><clipPath id={`trc${seed}`}><rect x={DX} y={G - DH} width={DW} height={DH + 6} /></clipPath></defs>
          <g clipPath={`url(#trc${seed})`}>
            <Glow id={`trg${seed}`} x={DX + DW / 2} y={G - 150} r={360} f={f} strength={level ? 0.3 + 0.2 * k : 0} />
            <BurialSet x={DX + DW / 2} y={G - 6} s={0.52} level={level} k={k} scattered={scattered} seed={seed} />
          </g>
          <BlockingWall x={DX} y={G - DH} w={DW} h={DH} k={k} open={level > 0} seed={seed} />
          {level >= 3 && <path d={`M${DX - 30} ${G - DH - 40}L${DX + 40} ${G - DH + 60}L${DX + 10} ${G - DH + 150}`} stroke={C.shadow} strokeWidth={5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(k, 0.3, 0.8)} />}
        </Layer>
        <Layer depth={1}>
          {torch && <TorchLight x={170} y={G + 16} h={230} f={f} k={k} intruder={level > 0} id={`trt${seed}`} />}
          <Stipple x={DX - 60} y={G - 20} w={DW + 120} h={70} seed={seed + 8} count={Math.round(140 * k)} color={C.paperDark} opacity={0.9} size={6} />
        </Layer>
        {caption}
      </Camera>
    );
  }

  if (env === "corridor with side chamber") {
    const top = G - 250;
    return (
      <Camera {...cam} cy={1000}>
        <Layer depth={1}>
          {/* rock in section */}
          <RRect x={X0} y={200} w={WW} h={1500} seed={seed + 1} fill={C.sand} amp={3} />
          <Streaks x={X0} y={210} w={WW} h={1480} seed={seed + 2} count={520} color={C.gold} opacity={0.7} maxLen={300} thick={4} />
          <Streaks x={X0} y={210} w={WW} h={1480} seed={seed + 3} count={320} color={C.paperDark} opacity={0.7} maxLen={260} thick={5} />
          {/* corridor and side chamber */}
          <RRect x={X0} y={top} w={X0 * -1 + 600} h={256} seed={seed + 4} fill={C.night} amp={2.4} step={28} />
          <RRect x={560} y={G - 470} w={560} h={476} seed={seed + 5} fill={C.night} amp={2.4} step={28} />
          <RRect x={X0} y={G} w={X0 * -1 + 1120} h={14} seed={seed + 6} fill={C.earth} amp={1.5} />
          <Glow id={`tcg${seed}`} x={840} y={G - 180} r={420} f={f} strength={level ? 0.24 + 0.2 * k : 0.16} />
          <BurialSet x={840} y={G - 4} s={0.5} level={level} k={k} scattered={scattered} seed={seed} />
          <BlockingWall x={540} y={top} w={70} h={250} k={k} open={level > 0} seed={seed} />
          {level >= 3 && <path d={`M700 ${G - 470}L744 ${G - 380}L720 ${G - 320}L790 ${G - 270}`} stroke={C.sand} strokeWidth={5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(k, 0.3, 0.8)} />}
          {torch && <TorchLight x={330} y={G} h={190} f={f} k={k} intruder={level > 0} id={`tct${seed}`} />}
          <Dust f={f} x={-200} y={top} w={1300} h={240} seed={seed} count={26} color={C.sand} opacity={0.3 + 0.4 * k} />
        </Layer>
        {caption}
      </Camera>
    );
  }

  return (
    <Camera {...cam} cy={1000}>
      <Backdrop env="tomb-wall" f={f} seed={seed} />
      <Layer depth={0.7}>
        {level >= 3 && (
          <>
            <path d="M196 412L250 498L232 560L330 640L372 742L352 800L470 862L520 842L610 930L716 950L760 1040L842 1196" fill="none" stroke={C.shadow} strokeWidth={6} strokeLinejoin="bevel" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(k, 0.15, 0.7)} />
            <RPoly pts={[[352, 800], [470, 862], [420, 900], [340, 860]]} seed={5} fill={C.paperDark} opacity={ramp(k, 0.55, 0.7)} />
          </>
        )}
      </Layer>
      <Layer depth={1}>
        {torch && <TorchLight x={130} y={G + 6} h={300} f={f} k={k} intruder={level > 0} id={`trb${seed}`} />}
        {!torch && <Glow id={`trn${seed}`} x={540} y={G - 120} r={520} f={f} strength={0.3} />}
        <BurialSet x={540} y={G} s={1} level={level} k={k} scattered={scattered} seed={seed} />
        <Stipple x={-300} y={G + 10} w={1700} h={90} seed={31} count={Math.round(160 * k)} color={C.paperDark} opacity={0.8} size={5} />
        <Dust f={f} x={60} y={430} w={960} h={740} seed={3} count={26} color={C.paper} opacity={0.3 + 0.3 * k} />
      </Layer>
      {caption}
    </Camera>
  );
};

/* ------------------------------------------------------------------ */
/* Priests Rewrapping                                                  */
/* ------------------------------------------------------------------ */

/** Interior rooms for the priests' work. */
const WorkRoom: React.FC<{ kind: string; f: number; seed: number }> = ({ kind, f, seed }) => {
  if (kind === "burial preparation room") {
    return (
      <>
        <Backdrop env="tomb-wall" f={f} seed={seed} />
        <Layer depth={0.85}>
          <RRect x={-160} y={G - 150} w={300} h={24} seed={seed + 2} fill={C.earth} amp={1.4} />
          <rect x={-140} y={G - 126} width={14} height={126} fill={C.shadow} /><rect x={106} y={G - 126} width={14} height={126} fill={C.shadow} />
          {[0, 1, 2, 3].map((i) => <g key={i} transform={`translate(${-118 + i * 70} ${G - 150}) scale(1.25)`}><CanopicJar lid={[C.teal, C.gold, C.earth, C.shadow][i]} /></g>)}
        </Layer>
      </>
    );
  }
  const temple = kind === "temple chamber";
  return (
    <>
      <Layer depth={0.6}>
        <RRect x={X0} y={330} w={WW} h={G - 320} seed={seed + 1} fill={temple ? C.sand : C.paperDark} amp={2} />
        <Streaks x={X0} y={340} w={WW} h={G - 340} seed={seed + 2} count={200} color={C.paper} opacity={0.45} maxLen={190} thick={3} />
        <rect x={X0} y={330} width={WW} height={34} fill={C.shadow} />
        <rect x={X0} y={364} width={WW} height={10} fill={C.gold} />
        <rect x={X0} y={G - 150} width={WW} height={10} fill={C.teal} opacity={0.7} />
        {temple ? (
          <>
            {[-520, -180, 900, 1240].map((x, i) => <Column key={x} x={x} y={G} h={G - 470} w={96} seed={seed + 10 + i} />)}
            <RRect x={980} y={G - 520} w={170} h={520} seed={seed + 6} fill={C.paper} amp={2} opacity={0.75} />
          </>
        ) : (
          <>
            {/* shelves with jars and rolls of linen */}
            {[G - 520, G - 370].map((y, r) => (
              <g key={y}>
                <RRect x={-320} y={y} w={520} h={16} seed={seed + r} fill={C.earth} amp={1.2} />
                <RRect x={820} y={y} w={520} h={16} seed={seed + r + 4} fill={C.earth} amp={1.2} />
                {[0, 1, 2, 3].map((i) => (
                  <g key={i}>
                    <g transform={`translate(${-270 + i * 130} ${y}) scale(${1.5 - r * 0.2})`}>{(i + r) % 2 ? <Vase c={C.gold} /> : <CanopicJar lid={C.teal} />}</g>
                    <g transform={`translate(${880 + i * 130} ${y - 26})`}><ellipse rx={30} ry={26} fill={C.cream} stroke={C.sand} strokeWidth={3} /><ellipse rx={12} ry={10} fill="none" stroke={C.sand} strokeWidth={2} /></g>
                  </g>
                ))}
              </g>
            ))}
          </>
        )}
      </Layer>
      <Layer depth={1}>
        <RRect x={X0} y={G - 4} w={WW} h={280} seed={seed + 25} fill={C.sand} amp={3} />
        <Streaks x={X0} y={G} w={WW} h={270} seed={seed + 26} count={150} color={C.gold} opacity={0.55} maxLen={170} />
        <Stipple x={X0} y={G} w={WW} h={270} seed={seed + 27} count={300} color={C.earth} opacity={0.35} />
        {/* hanging lamp */}
        <path d={`M540 330L${540 + Math.sin(f * 0.03) * 4} 470`} stroke={C.shadow} strokeWidth={3} />
        <g transform={`translate(${540 + Math.sin(f * 0.03) * 4} 470)`}><path d="M-22 0L22 0L14 22L-14 22Z" fill={C.earth} /><Flame x={0} y={2} f={f} s={0.9} /></g>
        <Glow id={`wr${seed}`} x={540} y={520} r={640} f={f} strength={0.3} />
      </Layer>
    </>
  );
};

const Trestles: React.FC<{ cx: number; w: number; y: number }> = ({ cx, w, y }) => (
  <path d={`M${cx - w / 2} ${y}l16 -70l16 70M${cx + w / 2 - 32} ${y}l16 -70l16 70`} stroke={C.shadow} strokeWidth={10} fill="none" strokeLinejoin="round" />
);

/** Priests of Amun inspect, rewrap, label or carry a royal burial. */
export const PriestsRewrappingTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const action = paramOf(scene, "action");
  const room = paramOf(scene, "environment");
  const idp = `pr${seed}`;
  let stage: React.ReactNode;

  if (action === "carry remains") {
    const h = 170;
    const dist = (f + 20) * Math.min(1, 330 / Math.max(1, D));
    const cx = 250 + dist * 0.9;
    stage = (
      <>
        <Bier cx={cx} ground={G + 16} h={h} dist={dist} tone="gold" seed={seed} f={f} />
        <GroundShadow x={cx + h * 2.1} y={G + 16} w={h * 0.42} />
        <Figure x={cx + h * 2.05} y={G + 16} h={h} kind="priest" phase={walkPhase(dist, h)} armF={68} />
        <rect x={cx + h * 2.05 + h * 0.26} y={G + 16 - h * 1.12} width={6} height={h * 1.12} fill={C.earth} />
      </>
    );
  } else if (action === "rewrap mummy") {
    const N = 11;
    const wrap = ramp(p, 0.12, 0.82, (t) => t);
    const wx = mix(760, 330, wrap);
    const sway = Math.sin(f * 0.3) * 8 * (wrap > 0 && wrap < 1 ? 1 : 0.15);
    const BODY = `M300 ${G - 158}Q300 ${G - 196} 336 ${G - 196}Q366 ${G - 196} 372 ${G - 176}Q392 ${G - 204} 440 ${G - 204}L640 ${G - 190}L770 ${G - 180}Q790 ${G - 214} 800 ${G - 206}L800 ${G - 146}L300 ${G - 146}Z`;
    stage = (
      <>
        <Cast cast={[{ kind: "priest", action: "talk" }, { kind: "bearer", action: "stand" }, { kind: "priest", action: "talk" }]} f={f} D={D} ground={G - 6} h={262} spread={300} idp={idp} />
        {/* table */}
        <RRect x={240} y={G - 146} w={620} h={22} seed={seed + 2} fill={C.earth} amp={1.4} />
        <rect x={262} y={G - 124} width={16} height={124} fill={C.shadow} /><rect x={822} y={G - 124} width={16} height={124} fill={C.shadow} />
        <path d={`M252 ${G - 124}L848 ${G - 124}L836 ${G - 92}L264 ${G - 92}Z`} fill={C.cream} stroke={C.sand} strokeWidth={2} />
        {/* wrapped form — an outline only, no remains */}
        <defs><clipPath id={`${idp}b`}><path d={BODY} /></clipPath></defs>
        <path d={BODY} fill={C.sand} />
        <g clipPath={`url(#${idp}b)`}>
          {Array.from({ length: N }, (_, i) => {
            const t = ramp(wrap, i / N, (i + 0.8) / N);
            const x = 770 - i * 43;
            return <path key={i} d={`M${x} ${G - 220}l30 0l${-24} ${90 * t}l-30 0Z`} fill={C.cream} stroke={C.gold} strokeWidth={1.5} opacity={t > 0 ? 1 : 0} />;
          })}
        </g>
        {/* the free end of the band, and the roll it comes from */}
        <path d={`M${wx} ${G - 196}Q${wx + 30 + sway} ${G - 270} ${wx + 8 - sway} ${G - 330}`} stroke={C.cream} strokeWidth={15} fill="none" strokeLinecap="round" opacity={wrap < 1 ? 1 : 0} />
        <g transform={`translate(905 ${G - 30})`}><ellipse rx={34} ry={30} fill={C.cream} stroke={C.sand} strokeWidth={3} /><ellipse rx={14} ry={12} fill="none" stroke={C.sand} strokeWidth={2} /></g>
        <g transform={`translate(190 ${G}) scale(1.5)`}><CanopicJar lid={C.teal} /></g>
      </>
    );
  } else {
    const labels = action === "record labels";
    stage = (
      <>
        <Cast cast={labels ? [{ kind: "scribe", action: "read" }, { kind: "priest", action: "point" }] : [{ kind: "priest", action: "torch" }, { kind: "scribe", action: "read" }, { kind: "priest", action: "point" }]} f={f} D={D} ground={G - 6} h={262} spread={labels ? 680 : 340} idp={idp} />
        <ellipse cx={540} cy={G + 4} rx={300} ry={14} fill={C.shadow} opacity={0.16} />
        <Trestles cx={540} w={430} y={G} />
        <CoffinSide x={540} y={G - 70} len={520} tone={labels ? "earth" : "gold"} seed={seed} royal lidShift={labels ? 0 : 0.25 * ramp(p, 0.2, 0.6)} />
        {labels && [0, 1, 2].map((i) => {
          const t = spring({ frame: f - D * (0.18 + i * 0.2), fps: 30, config: { damping: 14, stiffness: 90 } });
          const x = 400 + i * 140;
          return (
            <g key={i} opacity={Math.min(1, t * 3)} transform={`translate(${x} ${mix(G - 420, G - 150, t)}) rotate(${mix(i % 2 ? 22 : -22, i % 2 ? 4 : -4, t)})`}>
              <path d="M0 0Q-10 -24 -2 -44" stroke={C.earth} strokeWidth={2.5} fill="none" />
              <RRect x={-46} y={0} w={92} h={58} seed={seed + i} fill={i === 1 ? C.cream : C.paper} amp={1.4} stroke={C.gold} strokeWidth={2} />
              <circle cx={0} cy={9} r={4} fill={C.shadow} />
              {[22, 34, 46].map((yy) => <path key={yy} d={`M-34 ${yy}q7 -5 14 0t14 0t14 0t14 0t12 0`} stroke={C.shadow} strokeWidth={2.2} fill="none" opacity={0.75} />)}
            </g>
          );
        })}
      </>
    );
  }

  return (
    <Camera {...cameraMove(CAM[paramOf(scene, "camera")], p)} cy={1000}>
      <WorkRoom kind={room} f={f} seed={seed} />
      <Layer depth={1}>
        {stage}
        <Dust f={f} x={100} y={430} w={880} h={740} seed={seed} count={22} color={C.gold} opacity={0.45} />
      </Layer>
      <Plaque label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} />
    </Camera>
  );
};
