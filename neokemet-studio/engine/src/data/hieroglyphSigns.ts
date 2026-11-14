/**
 * Gardiner sign shapes, intentionally simplified for the Tomb Painting Flat style.
 *
 * Each entry is a hand-drawn SVG path approximation of a documented Gardiner
 * hieroglyph, NOT an invented pictogram and NOT a hieroglyphic translation.
 * Extend this data map to add signs. No fonts, images or external services used.
 *
 * Sign identities cross-checked against:
 * https://www.egyptianhieroglyphs.net/gardiners-sign-list/
 * https://sesh-nefer.com/hieroglyphsoverview
 * https://thotsignlist.org/mysign?id=3049 (F35)
 */
export type GardinerCode =
  | "A1" | "D4" | "D21" | "G17" | "M17" | "N35"
  | "Q3" | "S34" | "R8" | "F35";
export type HieroglyphInk = "egyptianBlue" | "ochreRed" | "malachiteGreen" | "carbonBlack";
export type SignPath = { readonly d:string; readonly fill?:boolean };
export type GardinerSign = {
  readonly gardiner:GardinerCode;
  readonly name:string;
  readonly unicode:string;
  readonly meaning:string;
  readonly ink:HieroglyphInk;
  readonly paths:readonly SignPath[];
};
const p=(d:string,fill=false):SignPath=>({d,fill});

/** 100×100 sign coordinate space; the paths are designed to remain legible at 50–80px. */
export const GARDINER_SIGNS:Readonly<Record<GardinerCode,GardinerSign>>={
  A1:{
    gardiner:"A1",name:"seated man",unicode:"𓀀",meaning:"seated man (person determinative)",ink:"ochreRed",
    paths:[
      p("M35 17C35 9 41 5 48 5C55 5 60 11 60 19C60 27 55 32 48 32C41 32 35 27 35 17Z",true),
      p("M44 33L38 51L38 67L55 67L58 44L54 33Z",true),
      p("M53 38L70 48L78 61M42 43L30 59L39 64"),
      p("M38 67L51 79L72 79L78 89L91 89"),
      p("M51 67L36 77L25 88L52 88"),
      p("M17 91H94"),
    ],
  },
  D4:{
    gardiner:"D4",name:"eye",unicode:"𓁹",meaning:"frontal eye with eyebrow and cosmetic line",ink:"egyptianBlue",
    paths:[
      p("M8 52Q48 12 92 51Q49 88 8 52Z",true),
      p("M47 32C34 34 28 42 28 51C28 65 37 72 49 72C61 72 69 63 69 51C69 40 61 32 47 32Z"),
      p("M47 36V69M30 49H67"),
      p("M7 42Q45 15 84 32"),
      p("M14 54L6 71M86 52L95 65"),
    ],
  },
  D21:{
    gardiner:"D21",name:"mouth",unicode:"𓂋",meaning:"human mouth in profile / oval lip sign",ink:"ochreRed",
    paths:[
      p("M6 52Q25 33 50 33Q77 33 94 52Q74 68 49 68Q24 68 6 52Z",true),
      p("M13 52Q48 58 87 52"),
      p("M29 42Q49 47 71 42"),
    ],
  },
  G17:{
    gardiner:"G17",name:"owl",unicode:"𓅓",meaning:"owl, frontal head and winged body",ink:"ochreRed",
    paths:[
      p("M23 21L18 11L35 17Q50 7 65 17L82 10L77 29Q90 49 78 66L70 81L66 93H56L55 81H45L44 93H34L30 80Q13 63 16 42Q17 30 23 21Z",true),
      p("M23 35Q35 27 48 35Q62 27 77 36"),
      p("M27 42Q38 34 47 44Q40 54 29 50Z"),
      p("M53 44Q63 34 75 43Q66 54 56 50Z"),
      p("M49 45L43 56L55 55Z"),
      p("M28 56Q23 73 39 82M73 56Q78 73 63 82"),
      p("M38 62V79M48 60V84M58 62V79"),
      p("M26 92H45M57 92H75"),
    ],
  },
  M17:{
    gardiner:"M17",name:"reed leaf",unicode:"𓇋",meaning:"single reed leaf",ink:"malachiteGreen",
    paths:[
      p("M56 95V18"),
      p("M57 13Q22 22 29 52Q33 70 54 80L59 89Z",true),
      p("M37 48Q42 60 54 68"),
      p("M36 95H73"),
    ],
  },
  N35:{
    gardiner:"N35",name:"water ripple",unicode:"𓈖",meaning:"horizontal water ripple (n)",ink:"egyptianBlue",
    paths:[
      p("M5 42L17 55L30 42L43 55L56 42L69 55L82 42L95 55"),
      p("M5 58L17 71L30 58L43 71L56 58L69 71L82 58L95 71"),
    ],
  },
  Q3:{
    gardiner:"Q3",name:"stool",unicode:"𓊪",meaning:"low stool (p)",ink:"ochreRed",
    paths:[
      p("M18 27H83V73H18Z",true),
      p("M27 35V65H74V35Z"),
      p("M15 76H86"),
    ],
  },
  S34:{
    gardiner:"S34",name:"ankh",unicode:"𓋹",meaning:"ankh (life)",ink:"malachiteGreen",
    paths:[
      p("M50 47C30 46 26 35 27 23C27 12 37 6 50 6C63 6 74 13 73 25C72 38 62 46 50 47Z"),
      p("M49 46V95"),
      p("M15 53H85"),
      p("M45 77H54"),
    ],
  },
  R8:{
    gardiner:"R8",name:"netjer flag",unicode:"𓊹",meaning:"standard bearing a wrapped divine flag (nṯr)",ink:"carbonBlack",
    paths:[
      p("M55 13V94"),
      p("M55 16Q45 8 34 12Q19 18 12 16V43Q23 48 37 43Q46 40 55 46Z",true),
      p("M14 27Q32 32 55 27M14 36Q32 39 55 36"),
      p("M49 94H65"),
    ],
  },
  F35:{
    gardiner:"F35",name:"nefer",unicode:"𓄤",meaning:"heart and windpipe (nfr), not a flower or invented ornament",ink:"malachiteGreen",
    paths:[
      p("M47 12V63M55 12V63"),
      p("M22 19H81M22 30H81"),
      p("M40 60Q17 70 28 88Q44 101 51 88Q60 101 76 88Q89 70 60 60Z",true),
      p("M31 73Q51 63 72 73"),
      p("M51 42V62"),
    ],
  },
};
export const GARDINER_CODES=Object.freeze(Object.keys(GARDINER_SIGNS) as GardinerCode[]);
/** Direct lookup from a sign's English name to its reusable vector paths. */
export const GARDINER_PATHS_BY_NAME:Readonly<Record<string,readonly SignPath[]>>=
  Object.freeze(Object.fromEntries(Object.values(GARDINER_SIGNS).map(sign=>[sign.name,sign.paths])));

