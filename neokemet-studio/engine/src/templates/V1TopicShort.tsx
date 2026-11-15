/** V1 Shorts only: Tomb Painting Flat theme. V3 and documentary presets are untouched. */
import React from "react";
import { useClock } from "../components/AnimatedScene";
import { tombPalette as P, tombTheme as T, getSceneLightingMode } from "../theme/tombPaintingFlat";
import { TombPerson, TombWall, TombLamp, TombPaletteTable, TombPapyrus, TombRiver, TombBoat, TombPyramid, TombBlock, TombRamp, TombSceneStyle, TombSceneTitle, TombSun, TombCameraPush, TombRegister } from "./TombPaintingParts";
import { V1LabShots } from "./V1LabShots";
import type { TemplateProps } from "./common";

const labels: Record<string,string> = {
 lamp:"WORKING BY LAMPLIGHT",pigments:"MINERAL PIGMENTS",artist:"PAINTING TOMBS",corridor:"INSIDE THE MOUNTAIN",mural:"PAINTED FOR ETERNITY",
 reeds:"FROM THE NILE",strip:"SLICED INTO STRIPS",layer:"CROSS-LAYERED FIBRES",press:"PRESSED INTO SHEETS",scribe:"WRITTEN BY SCRIBES",
 quarry:"CUT FROM LIMESTONE",load:"BLOCKS UP THE RAMP",ropes:"ROPES AND SLEDGES",sail:"SAILING THE NILE",unload:"DELIVERED TO GIZA",
};
const hooks: Record<string,string>={painting:"PAINTING IN DARKNESS?",papyrus:"PAPER FROM A PLANT?",transport:"HOW DID THE STONES MOVE?"};
type ArtProps = { id:string; f:number;t:number };
const tombIds=new Set(["lamp","artist","corridor","mural"]);
const V1Art:React.FC<ArtProps>=({id,f,t})=>{
 switch(id){
  case "lamp":return <><TombWall/><TombLamp x={540} y={1120} f={f}/><TombPerson x={360} y={1700} scale={1.5} pose="carry" progress={t}/></>;
  case "pigments":return <><TombWall/><TombPaletteTable/><TombPerson x={295} y={1650} scale={1.3} pose="paint" progress={t}/><TombLamp x={860} y={1000} f={f}/></>;
  case "artist":return <><TombWall/><g><TombPerson x={330} y={1650} scale={1.7} pose="paint" progress={t}/><TombLamp x={730} y={1250} f={f}/></g></>;
  case "corridor":return <><TombWall/><path d="M0 1800L300 630H780L1080 1800Z" fill={P.ochreRed} stroke={P.carbonBlack} strokeWidth={T.outline.width}/><path d="M240 1780L420 840H690L850 1780Z" fill={P.carbonBlack}/><TombLamp x={540} y={1240} f={f}/></>;
  case "mural":return <><TombWall/><TombPerson x={390} y={1690} scale={1.35} pose="paint" progress={t}/><TombPaletteTable/></>;
  case "reeds":return <><TombPapyrus stage={0} f={f}/><TombPerson x={250} y={1225} scale={1.25} pose="carry" progress={t}/></>;
  case "strip":return <><TombPapyrus stage={1}/><TombPerson x={250} y={1780} scale={1.3} pose="paint" progress={t}/></>;
  case "layer":return <><TombPapyrus stage={2}/><TombPerson x={300} y={1780} scale={1.16} pose="stand"/></>;
  case "press":return <><TombPapyrus stage={3}/><TombPerson x={270} y={1750} scale={1.22} pose="haul" progress={t}/></>;
  case "scribe":return <><TombPapyrus stage={2}/><TombPerson x={350} y={1780} scale={1.48} pose="scribe" progress={t}/></>;
  case "quarry":return <><TombSun/><TombPyramid x={850} floor={1240} height={560}/><TombBlock x={280} y={950} scale={1.4}/><TombPerson x={180} y={1810} scale={1.23} pose="haul" progress={t}/></>;
  case "load":return <><TombPyramid x={740} floor={1240} height={610}/><TombRamp height={550}/><g transform={"translate("+(t*55)+" "+(-t*28)+")"}><TombBlock x={380} y={900} scale={.8}/></g><TombPerson x={170} y={1225} scale={1.3} pose="haul" progress={t}/></>;
  case "ropes":return <><TombBlock x={255} y={810} scale={1.5}/><path d="M300 1250L70 1520" stroke={P.carbonBlack} strokeWidth={T.outline.width} fill="none"/><TombPerson x={170} y={1800} scale={1.4} pose="haul" progress={t}/></>;
  case "sail":return <><TombSun x={800} y={470}/><TombRiver f={f}/><TombBoat f={f}/></>;
  case "unload":return <><TombRiver f={f}/><TombBoat f={f}/><TombPerson x={200} y={1790} scale={1.26} pose="carry" progress={t}/></>;
  default:return <><TombWall/><TombSceneTitle mode="day" title="NEW ILLUSTRATION NEEDED"/></>;
 }
};
export const V1TopicShortTemplate:React.FC<TemplateProps>=({scene,captionActive=false})=>{
 const {f,D}=useClock();
 if(scene.artShots?.length)return <V1LabShots shots={scene.artShots} frame={f} duration={D} narration={scene.narration} captionActive={captionActive}/>;
 const shots=String(scene.params?.shots??"").split(",").map(s=>s.trim()).filter(Boolean);
 const count=Math.max(1,shots.length),pos=Math.min(count-.00001,Math.max(0,f/Math.max(1,D)*count));
 const index=Math.floor(pos),t=pos-index,id=shots[index]??"";
 const topic=String(scene.params?.topic??"missing");
 const mode=(getSceneLightingMode(scene)==="tomb"||tombIds.has(id))?"tomb" as const:"day" as const;
 const title=scene.params?.hook===true && f<90 && hooks[topic] ? hooks[topic] : labels[id]??"NEW ART NEEDED";
 // Align the sole radial lighting mask with the REAL bowl's wick position.
 const lamps:Record<string,[number,number]>={
   lamp:[540,1010],pigments:[860,890],artist:[730,1140],
   corridor:[540,1130],mural:[540,1080]
 };
 const [lightX,lightY]=lamps[id]??[580,1120];
 return <g>
  <TombSceneStyle mode={mode} lightX={lightX} lightY={lightY}>
    <TombCameraPush frame={f} duration={D}>
      <V1Art id={id} f={f} t={t}/>
      <TombRegister/>
    </TombCameraPush>
  </TombSceneStyle>
  <TombSceneTitle title={title} mode={mode} visible={!captionActive}/>
 </g>;
};