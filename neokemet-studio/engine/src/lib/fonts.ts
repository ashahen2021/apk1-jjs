import { loadFont } from "@remotion/fonts";
import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are bundled locally (SIL OFL) so renders never depend on the network.
const faces: [string, string, string][] = [
  ["Cormorant Garamond", "500", "cormorant-garamond-latin-500-normal.woff2"],
  ["Cormorant Garamond", "600", "cormorant-garamond-latin-600-normal.woff2"],
  ["Cormorant Garamond", "700", "cormorant-garamond-latin-700-normal.woff2"],
  ["Josefin Sans", "400", "josefin-sans-latin-400-normal.woff2"],
  ["Josefin Sans", "500", "josefin-sans-latin-500-normal.woff2"],
  ["Josefin Sans", "600", "josefin-sans-latin-600-normal.woff2"],
];

let started = false;
export const ensureFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading fonts");
  Promise.all(faces.map(([family, weight, file]) => loadFont({ family, weight, url: staticFile(`fonts/${file}`) })))
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error("Font loading failed", err);
      continueRender(handle);
    });
};
