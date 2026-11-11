import React from "react";
import type { TemplateId } from "../../../shared/catalog.ts";
import { C } from "../lib/theme";
import { Scene01Secret } from "../presets/royal-cache/Scene01Secret";
import { Scene02Looted } from "../presets/royal-cache/Scene02Looted";
import { Scene03Priests } from "../presets/royal-cache/Scene03Priests";
import { Scene04Linen } from "../presets/royal-cache/Scene04Linen";
import { Scene05Labels } from "../presets/royal-cache/Scene05Labels";
import { Scene06Pharaohs } from "../presets/royal-cache/Scene06Pharaohs";
import { Scene07DeirElBahari } from "../presets/royal-cache/Scene07DeirElBahari";
import { Scene08TT320 } from "../presets/royal-cache/Scene08TT320";
import { Scene09Fifty } from "../presets/royal-cache/Scene09Fifty";
import { Scene10Sealed } from "../presets/royal-cache/Scene10Sealed";
import { Scene11Family } from "../presets/royal-cache/Scene11Family";
import { Scene12Goat } from "../presets/royal-cache/Scene12Goat";
import { Scene13Chamber } from "../presets/royal-cache/Scene13Chamber";
import { Scene14Market } from "../presets/royal-cache/Scene14Market";
import { Scene15Revealed } from "../presets/royal-cache/Scene15Revealed";
import { Scene16Removal } from "../presets/royal-cache/Scene16Removal";
import { Scene17Parade } from "../presets/royal-cache/Scene17Parade";
import { Scene18Hidden } from "../presets/royal-cache/Scene18Hidden";
import { CharactersTemplate, LandscapeTemplate, ProcessionTemplate, TitleTemplate } from "./Basic";
import { CoffinChamberTemplate } from "./CoffinChamber";
import type { TemplateProps } from "./common";
import { CutawayTemplate } from "./Cutaway";
import { ArtifactTemplate, EndCardTemplate, MapTemplate, TombInteriorTemplate } from "./Special";

type Entry = { Component: React.FC<TemplateProps> | React.FC; bg?: string; preset?: boolean };

/**
 * Registry: template id → component.
 * Generic templates are driven entirely by the scene spec. The "rc-" entries are
 * the 18 hand-directed Royal Cache shots, kept as ready-made presets: they take no
 * options and are time-stretched to whatever length the narration needs.
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
  "rc-01": { Component: Scene01Secret, preset: true },
  "rc-02": { Component: Scene02Looted, preset: true },
  "rc-03": { Component: Scene03Priests, preset: true },
  "rc-04": { Component: Scene04Linen, preset: true },
  "rc-05": { Component: Scene05Labels, preset: true },
  "rc-06": { Component: Scene06Pharaohs, preset: true },
  "rc-07": { Component: Scene07DeirElBahari, preset: true },
  "rc-08": { Component: Scene08TT320, preset: true },
  "rc-09": { Component: Scene09Fifty, preset: true, bg: C.night },
  "rc-10": { Component: Scene10Sealed, preset: true },
  "rc-11": { Component: Scene11Family, preset: true },
  "rc-12": { Component: Scene12Goat, preset: true },
  "rc-13": { Component: Scene13Chamber, preset: true, bg: C.night },
  "rc-14": { Component: Scene14Market, preset: true },
  "rc-15": { Component: Scene15Revealed, preset: true },
  "rc-16": { Component: Scene16Removal, preset: true },
  "rc-17": { Component: Scene17Parade, preset: true },
  "rc-18": { Component: Scene18Hidden, preset: true },
};

export const resolveTemplate = (id: TemplateId): Entry => REGISTRY[id] ?? REGISTRY.landscape;
