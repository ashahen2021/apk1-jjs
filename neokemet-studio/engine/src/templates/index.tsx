import React from "react";
import type { TemplateId } from "../../../shared/catalog.ts";
import { C } from "../lib/theme";
import { Scene01Secret } from "../presets/royal-cache/Scene01Secret";
import { Scene02Looted } from "../presets/royal-cache/Scene02Looted";
import { Scene03Priests } from "../presets/royal-cache/Scene03Priests";
import { Scene04Linen } from "../presets/royal-cache/Scene04Linen";
import { Scene05Labels } from "../presets/royal-cache/Scene05Labels";
import { Scene06Pharaohs } from "../presets/royal-cache/Scene06Pharaohs";
import { Scene09Fifty } from "../presets/royal-cache/Scene09Fifty";
import { Scene10Sealed } from "../presets/royal-cache/Scene10Sealed";
import { Scene13Chamber } from "../presets/royal-cache/Scene13Chamber";
import { Scene18Hidden } from "../presets/royal-cache/Scene18Hidden";
import { CharactersTemplate, LandscapeTemplate, ProcessionTemplate, TitleTemplate } from "./Basic";
import { CoffinChamberTemplate } from "./CoffinChamber";
import type { TemplateProps } from "./common";
import { CutawayTemplate } from "./Cutaway";
import { PriestsRewrappingTemplate, RoyalPharaohsTemplate, TombRobberyTemplate } from "./Documentary";
import { ArtifactTemplate, EndCardTemplate, MapTemplate, TombInteriorTemplate } from "./Special";
import { ReusableRoyalCacheShot } from "./RoyalCacheReusable";

type Entry = { Component: React.FC<TemplateProps> | React.FC; bg?: string; preset?: boolean };

/**
 * Registry: template id → component.
 * Generic templates are driven entirely by the scene spec. The "rc-" entries are
 * the 18 hand-directed Royal Cache shots. Eight are wrapped for optional
 * reuse controls; the original visuals remain untouched at default settings.
 * Every preset is time-stretched to the narration length.
 */
export const REGISTRY: Record<TemplateId, Entry> = {
  title: { Component: TitleTemplate },
  landscape: { Component: LandscapeTemplate },
  characters: { Component: CharactersTemplate },
  procession: { Component: ProcessionTemplate },
  artifact: { Component: ArtifactTemplate },
  "tomb-interior": { Component: TombInteriorTemplate },
  cutaway: { Component: CutawayTemplate },
  "coffin-chamber": { Component: CoffinChamberTemplate, bg: C.night },
  map: { Component: MapTemplate },
  "end-card": { Component: EndCardTemplate },
  "royal-pharaohs": { Component: RoyalPharaohsTemplate },
  "tomb-robbery": { Component: TombRobberyTemplate },
  "priests-rewrapping": { Component: PriestsRewrappingTemplate },
  "rc-01": { Component: Scene01Secret, preset: true },
  "rc-02": { Component: Scene02Looted, preset: true },
  "rc-03": { Component: Scene03Priests, preset: true },
  "rc-04": { Component: Scene04Linen, preset: true },
  "rc-05": { Component: Scene05Labels, preset: true },
  "rc-06": { Component: Scene06Pharaohs, preset: true },
  "rc-07": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-08": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-09": { Component: Scene09Fifty, preset: true, bg: C.night },
  "rc-10": { Component: Scene10Sealed, preset: true },
  "rc-11": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-12": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-13": { Component: Scene13Chamber, preset: true, bg: C.night },
  "rc-14": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-15": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-16": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-17": { Component: ReusableRoyalCacheShot, preset: true },
  "rc-18": { Component: Scene18Hidden, preset: true },
};

export const resolveTemplate = (id: TemplateId): Entry => REGISTRY[id] ?? REGISTRY.landscape;
