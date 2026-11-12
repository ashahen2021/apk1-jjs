import React from "react";
import { useClock } from "../components/AnimatedScene";
import { Camera, Layer } from "../components/Camera";
import { Cast } from "../components/Cast";
import { Backdrop, cameraMove, GROUND } from "../components/Environments";
import { Bier } from "../components/Objects";
import { Figure, GroundShadow, walkPhase } from "../components/Figures";
import { pulse, ramp } from "../lib/anim";
import { Caption, TemplateProps, TitleBlock } from "./common";

/** Title card: an environment that inks in, with the film title in the sky. */
export const TitleTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const cam = cameraMove(scene.camera ?? "push-in", p);
  return (
    <Camera {...cam} cy={1040}>
      <Backdrop env={scene.environment ?? "theban-cliffs"} f={f} seed={seed} appear={ramp(f, 0, 40)} />
      <TitleBlock title={scene.label} sub={scene.sublabel} t={ramp(f, Math.min(50, D * 0.25), Math.min(90, D * 0.45))} />
    </Camera>
  );
};

/** Establishing shot. Any cast is small and far, so the place is the subject. */
export const LandscapeTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const cam = cameraMove(scene.camera ?? "pan-right", p);
  return (
    <Camera {...cam} cy={1040}>
      <Backdrop env={scene.environment ?? "open-desert"} f={f} seed={seed} />
      <Layer depth={1}>
        <Cast cast={scene.cast ?? []} f={f} D={D} ground={GROUND + 14} h={132} idp={`l${seed}`} />
      </Layer>
      <Caption label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} />
    </Camera>
  );
};

/** Figures acting in the foreground of an environment. */
export const CharactersTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const cam = cameraMove(scene.camera ?? "push-in", p);
  const cast = scene.cast?.length ? scene.cast : [{ kind: "priest" as const, action: "read" as const }, { kind: "priest" as const, action: "talk" as const }];
  return (
    <Camera {...cam} cy={1040}>
      <Backdrop env={scene.environment ?? "temple-courtyard"} f={f} seed={seed} />
      <Layer depth={1}>
        <Cast cast={cast} f={f} D={D} ground={GROUND + 4} h={cast.length > 3 ? 200 : 240} idp={`c${seed}`} />
      </Layer>
      <Caption label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} />
    </Camera>
  );
};

/** A coffin on a bier crosses the scene; the cast walks ahead of it. */
export const ProcessionTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const cam = cameraMove(scene.camera ?? "pan-right", p);
  const h = 160;
  const dist = (f + 20) * Math.min(1, 330 / Math.max(1, D)); // paced to the scene length
  const cx = 300 + dist * 0.9;
  const walkers = (scene.cast ?? [{ kind: "priest" as const, action: "staff" as const }]).slice(0, 4);
  return (
    <Camera {...cam} cy={1040}>
      <Backdrop env={scene.environment ?? "open-desert"} f={f} seed={seed} />
      <Layer depth={1}>
        <Bier cx={cx} ground={GROUND + 20} h={h} dist={dist} tone={seed % 2 ? "gold" : "teal"} seed={seed} f={f} />
        {walkers.map((w, i) => {
          const x = cx + h * 2.05 + i * h * 0.55;
          return (
            <g key={i}>
              <GroundShadow x={x + 8} y={GROUND + 20} w={h * 0.42} />
              <Figure x={x} y={GROUND + 20} h={h * 0.98} kind={w.kind} phase={walkPhase(dist, h) + i * 1.2} armF={i === 0 ? 68 : undefined} />
            </g>
          );
        })}
      </Layer>
      <Caption label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} />
    </Camera>
  );
};
