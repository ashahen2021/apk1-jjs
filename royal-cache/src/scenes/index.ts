import React from "react";
import { C } from "../lib/theme";
import { Scene01Secret } from "./Scene01Secret";
import { Scene02Looted } from "./Scene02Looted";
import { Scene03Priests } from "./Scene03Priests";
import { Scene04Linen } from "./Scene04Linen";
import { Scene05Labels } from "./Scene05Labels";
import { Scene06Pharaohs } from "./Scene06Pharaohs";
import { Scene07DeirElBahari } from "./Scene07DeirElBahari";
import { Scene08TT320 } from "./Scene08TT320";
import { Scene09Fifty } from "./Scene09Fifty";
import { Scene10Sealed } from "./Scene10Sealed";
import { Scene11Family } from "./Scene11Family";
import { Scene12Goat } from "./Scene12Goat";
import { Scene13Chamber } from "./Scene13Chamber";
import { Scene14Market } from "./Scene14Market";
import { Scene15Revealed } from "./Scene15Revealed";
import { Scene16Removal } from "./Scene16Removal";
import { Scene17Parade } from "./Scene17Parade";
import { Scene18Hidden } from "./Scene18Hidden";

export type SceneDef = { id: number; title: string; bg: string; Component: React.FC };

export const SCENES: SceneDef[] = [
  { id: 1, title: "THE SECRET", bg: C.paper, Component: Scene01Secret },
  { id: 2, title: "THE LOOTED TOMBS", bg: C.paper, Component: Scene02Looted },
  { id: 3, title: "A PLAN TO SAVE THE KINGS", bg: C.paper, Component: Scene03Priests },
  { id: 4, title: "REWRAPPED IN LINEN", bg: C.paper, Component: Scene04Linen },
  { id: 5, title: "PRESERVING THEIR NAMES", bg: C.paper, Component: Scene05Labels },
  { id: 6, title: "THE GREAT PHARAOHS", bg: C.paper, Component: Scene06Pharaohs },
  { id: 7, title: "DEIR EL-BAHARI", bg: C.paper, Component: Scene07DeirElBahari },
  { id: 8, title: "TT320", bg: C.paper, Component: Scene08TT320 },
  { id: 9, title: "MORE THAN FIFTY", bg: C.night, Component: Scene09Fifty },
  { id: 10, title: "SEALED BY TIME", bg: C.paper, Component: Scene10Sealed },
  { id: 11, title: "THE FAMILY", bg: C.paper, Component: Scene11Family },
  { id: 12, title: "THE GOAT LEGEND", bg: C.paper, Component: Scene12Goat },
  { id: 13, title: "A CHAMBER OF KINGS", bg: C.night, Component: Scene13Chamber },
  { id: 14, title: "CLUES IN THE MARKET", bg: C.paper, Component: Scene14Market },
  { id: 15, title: "1881: THE SECRET REVEALED", bg: C.paper, Component: Scene15Revealed },
  { id: 16, title: "THE RUSHED REMOVAL", bg: C.paper, Component: Scene16Removal },
  { id: 17, title: "AN EXTRAORDINARY LEGACY", bg: C.paper, Component: Scene17Parade },
  { id: 18, title: "HIDDEN, NOT FORGOTTEN", bg: C.paper, Component: Scene18Hidden },
];
