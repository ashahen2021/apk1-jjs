/**
 * Project-specific Egyptian mural artwork.
 *
 * Unlike freehand LLM coordinate generation, every shot is composed from
 * deliberately authored, reusable SVG objects. Add a new subject pack here
 * (or in a sibling module) for each new film; art is saved inside project.json
 * so the final production remains portable and works with no AI service.
 *
 * Canvas: 1080x1920, art occupies y=350..1225; title/caption-safe areas remain clear.
 * The figures are illustrative, not purported facsimiles or invented hieroglyphs.
 */
import type { ArtElement, ArtShot } from "./visualLab.ts";
import type { Project } from "./schema.ts";

type Color = ArtElement["fill"];
type Shapes = ArtElement[];
const rect = (x:number,y:number,width:number,height:number,fill:Color,stroke:Color="none",strokeWidth=5):ArtElement =>
  ({kind:"rect",x,y,width,height,fill,stroke,strokeWidth,opacity:1,motionX:0,motionY:0});
const oval = (cx:number,cy:number,rx:number,ry:number,fill:Color,stroke:Color="none",strokeWidth=5):ArtElement =>
  ({kind:"ellipse",cx,cy,rx,ry,fill,stroke,strokeWidth,opacity:1,motionX:0,motionY:0});
const line = (x1:number,y1:number,x2:number,y2:number,color:Color="ink",strokeWidth=7,motionX=0,motionY=0):ArtElement =>
  ({kind:"line",x1,y1,x2,y2,fill:"none",stroke:color,strokeWidth:Math.min(40,strokeWidth),opacity:1,motionX,motionY});
// SVG points are encoded as explicit x,y pairs.
const polygon = (pairs:[number,number][],fill:Color,stroke:Color="none",strokeWidth=5):ArtElement =>
  ({kind:"polygon",points:pairs.map(([x,y])=>x+","+y).join(" "),fill,stroke,strokeWidth,opacity:1,motionX:0,motionY:0});

const stoneWall = (accent:Color="red"):Shapes => [
  rect(72,346,936,865,"paperDark","earth",8),
  rect(105,374,870,810,"paper","gold",5),
  line(109,655,972,655,accent,12),
  line(109,938,972,938,accent,12),
  line(110,1190,974,1190,"earth",10),
  rect(115,392,92,788,"sand","earth",7),
  rect(877,392,92,788,"sand","earth",7),
  rect(215,405,650,28,accent,"earth",5),
];
const tombInterior = ():Shapes => [
  rect(73,355,934,855,"night","gold",8),
  polygon([[76,358],[290,500],[290,1195],[76,1205]],"shadow","earth",7),
  polygon([[1004,358],[790,500],[790,1195],[1004,1205]],"shadow","earth",7),
  polygon([[292,504],[540,357],[788,504]],"earth","gold",9),
  rect(293,514,493,670,"paperDark","gold",8),
  line(300,1156,790,1156,"earth",12),
  line(300,690,787,690,"gold",8),
];
const register = ():Shapes => [
  line(135,731,946,731,"red",12),
  line(135,1135,946,1135,"red",12),
  rect(142,755,792,20,"gold","ink",3),
];
const lamp = (x:number,y:number,s=1):Shapes => {
  const X=(v:number)=>Math.round(x+v*s), Y=(v:number)=>Math.round(y+v*s);
  return [
    rect(X(-13),Y(23),26*s,164*s,"earth","ink",6),
    oval(X(0),Y(194),81*s,24*s,"earth","ink",6),
    oval(X(0),Y(9),109*s,40*s,"red","ink",8),
    oval(X(8),Y(-4),85*s,23*s,"gold","earth",4),
    polygon([[X(24),Y(-4)],[X(45),Y(-112)],[X(57),Y(-26)],[X(40),Y(-2)]],"gold","red",5),
    oval(X(39),Y(-45),12*s,42*s,"cream"),
    line(X(-56),Y(8),X(90),Y(8),"ink",6),
  ];
};
const person = (x:number,ground:number,s=1,painting=false):Shapes => {
  const X=(v:number)=>Math.round(x+v*s), Y=(v:number)=>Math.round(ground+v*s);
  return [
    // Historical composite-view convention: face in profile, torso near-frontal.
    oval(X(0),Y(-390),48*s,52*s,"earth","ink",6),
    polygon([[X(39),Y(-399)],[X(75),Y(-379)],[X(45),Y(-363)]],"earth","ink",5),
    oval(X(-18),Y(-431),55*s,28*s,"ink"),
    line(X(56),Y(-383),X(67),Y(-381),"ink",5),
    rect(X(-64),Y(-327),132*s,144*s,"cream","ink",6),
    line(X(-43),Y(-315),X(45),Y(-315),"blue",8),
    line(X(-61),Y(-188),X(66),Y(-188),"gold",10),
    polygon([[X(-77),Y(-185)],[X(82),Y(-185)],[X(94),Y(-129)],[X(-90),Y(-129)]],"white","red",6),
    line(X(-48),Y(-127),X(-64),Y(-14),"earth",27*s),
    line(X(61),Y(-127),X(93),Y(-13),"earth",27*s),
    oval(X(-79),Y(-7),56*s,15*s,"earth","ink",5),
    oval(X(100),Y(-7),52*s,15*s,"earth","ink",5),
    line(X(-63),Y(-302),X(-110),Y(-218),"earth",26*s),
    line(X(-110),Y(-218),X(-84),Y(-165),"earth",19*s),
    line(X(58),Y(-301),X(painting?160:107),Y(painting?-238:-196),"earth",23*s,painting?8:0,0),
    oval(X(painting?160:107),Y(painting?-238:-196),19*s,17*s,"earth"),
    ...(painting?[
      line(X(160),Y(-240),X(245),Y(-330),"ink",10,10,-4),
      polygon([[X(235),Y(-341)],[X(260),Y(-352)],[X(247),Y(-317)]],"blue","ink",4),
    ]:[]),
  ];
};
const pigmentTable = (x=126,y=958):Shapes => [
  rect(x,y,830,60,"red","ink",8),
  rect(x+60,y+60,46,154,"earth","ink",6),
  rect(x+725,y+60,46,154,"earth","ink",6),
  ...(["red","gold","blue","green"] as Color[]).flatMap((c,i)=>[
    oval(x+128+i*192,y-15,79,29,"white","ink",5),
    oval(x+128+i*192,y-24,53,17,c,"ink",3),
  ]),
  line(x+706,y-85,x+763,y-5,"earth",26),
];
const pigmentsClose = ():Shapes => [
  rect(90,356,900,845,"paperDark","red",9),
  rect(120,810,840,342,"earth","ink",9),
  oval(531,896,326,124,"white","ink",9),
  oval(531,877,259,72,"red","ink",5),
  oval(535,870,170,41,"gold"),
  line(641,536,490,862,"earth",48),
  oval(640,545,36,43,"sand","ink",6),
  oval(492,861,41,24,"earth","ink",5),
  oval(232,991,86,45,"blue","ink",7),
  oval(832,987,82,42,"green","ink",7),
  rect(154,423,252,96,"cream","red",6),
  line(159,535,425,535,"gold",9),
];
const brushDetail = ():Shapes => [
  rect(87,350,908,850,"paperDark","red",8),
  rect(122,396,835,754,"paper","gold",7),
  polygon([[258,925],[363,590],[529,525],[632,748],[564,1008]],"blue","ink",8),
  polygon([[364,592],[529,525],[509,716],[391,758]],"gold","ink",5),
  line(666,1096,554,755,"earth",56),
  line(555,760,475,657,"ink",15),
  polygon([[470,661],[477,614],[490,653]],"red"),
  oval(450,691,48,22,"red","ink",5),
  line(430,724,505,748,"blue",8),
  oval(692,1100,83,52,"earth","ink",6),
  line(121,1167,953,1167,"red",12),
];
const lotus = (x:number,y:number,s=1):Shapes => {
  const X=(n:number)=>Math.round(x+n*s),Y=(n:number)=>Math.round(y+n*s);
  return [
    line(X(0),Y(90),X(0),Y(-18),"green",10),
    polygon([[X(-74),Y(12)],[X(-16),Y(-67)],[X(-1),Y(11)]],"blue","ink",4),
    polygon([[X(74),Y(12)],[X(16),Y(-67)],[X(1),Y(11)]],"blue","ink",4),
    polygon([[X(-35),Y(5)],[X(0),Y(-94)],[X(35),Y(5)]],"gold","ink",4),
    line(X(-66),Y(30),X(66),Y(30),"red",7),
  ];
};
const muralFigures = (x:number,y:number,s=.6):Shapes => [
  ...person(x,y,s,false),
  oval(x+105*s,y-365*s,51*s,51*s,"gold","red",5),
];
const cracks = ():Shapes => [
  line(245,386,279,435,"earth",3),
  line(279,435,259,485,"earth",3),
  line(775,1020,739,1070,"earth",3),
  line(739,1070,760,1110,"earth",3),
];
const shot = (label:string,description:string,...groups:Shapes[]):ArtShot => ({
  label,description,shapes:groups.flat(),
});
const compositions:ArtShot[][] = [
  [
    shot("IN COMPLETE DARKNESS","A tomb corridor, a standing oil lamp and a silhouetted adult painter.",tombInterior(),lamp(530,1001,.75),person(285,1187,1.06),register()),
    shot("LIGHT FROM ONE FLAME","A large oil lamp illuminates the limestone wall.",stoneWall(),lamp(520,872,1.55),lotus(793,884,1.05)),
    shot("THE TOMB PAINTER","A painter approaches a painted wall with a brush and lamp.",stoneWall(),person(335,1193,1.07,true),lamp(767,991,.78)),
  ],
  [
    shot("MINERAL PIGMENTS","Mineral colours in stone bowls ready for a painter.",stoneWall(),pigmentTable(),lotus(542,579,.8)),
    shot("GRINDING RED OCHRE","A mortar, pestle and coloured mineral pigment samples shown close-up.",pigmentsClose()),
    shot("COLOUR BY LAMPLIGHT","A painter and a broad pigment table illuminated by a portable lamp.",stoneWall(),person(313,1191,.96,true),pigmentTable(155,960),lamp(846,647,.62)),
  ],
  [
    shot("BRUSH ON STONE","Close view of a brush painting a large figure on limestone.",brushDetail()),
    shot("THE PAINTED UNDERWORLD","The artist paints beside coloured adult figures on a tomb wall.",stoneWall(),muralFigures(605,1180,.89),person(250,1180,.86,true),lamp(846,854,.62)),
    shot("DEEP UNDERGROUND","A lamp and a working painter inside a stone-cut underground chamber.",tombInterior(),person(334,1170,1.04,true),lamp(752,944,.83)),
  ],
  [
    shot("PAINTED FOR ETERNITY","A full-width painted register with adult figures and a lotus design.",stoneWall("gold"),muralFigures(260,1184,.80),muralFigures(583,1184,.80),lotus(838,1005,1.25)),
    shot("COLOURS THAT SURVIVE","Mineral blue, red and gold figures remain visible on decorated stone.",stoneWall(),muralFigures(330,1190,.82),muralFigures(775,1190,.82),cracks()),
    shot("WALLS STILL SPEAK","A wide painted wall with two processional figures and surviving colours.",stoneWall("red"),muralFigures(270,1184,.78),lotus(556,983,1.35),muralFigures(828,1184,.78)),
  ],
];

/** Only a positively identified painting/tomb-painting film receives this custom pack. */
export const supportsPaintingBespoke = (project:Project):boolean => {
  const text=[project.title,project.topic,project.script,...project.scenes.map(s=>s.narration)].join(" ").toLowerCase();
  return /paint|pigment|brush|murals?|lamplight/.test(text) &&
    /tomb|underground|dark|pigment|brush|limestone|wall/.test(text);
};

const stageFor = (text:string,index:number,total:number):number => {
  if(/surviv|thousand|eternity|painted walls|last(?:ed)? for/.test(text))return 3;
  if(/pigment|grind|colour|color|ochre|powder/.test(text))return 1;
  if(/brush|underworld|transform|artist at work/.test(text))return 2;
  if(index===total-1)return 3;
  return index===0?0:2;
};

/** Generate three independent drawings per scene, preserving scene order and IDs. */
export const proposePaintingBespokeArt = (project:Project):{scenes:{id:string;shots:ArtShot[]}[]} => {
  if(!supportsPaintingBespoke(project))throw new Error("No painting mural asset pack matches this script.");
  if(project.scenes.length>10)throw new Error("A custom illustration batch supports at most 10 scenes.");
  return {scenes:project.scenes.map((scene,i)=>({
    id:scene.id,
    shots:compositions[stageFor(scene.narration.toLowerCase(),i,project.scenes.length)]
      .map(s=>({label:s.label,description:s.description,shapes:s.shapes.map(shape=>({...shape}))})),
  }))};
};
