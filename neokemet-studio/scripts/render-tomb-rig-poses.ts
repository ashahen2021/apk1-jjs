// Real full-resolution five-pose sheet from the Remotion source (no mockup).
import fs from "node:fs";
import path from "node:path";
import { openBrowser, selectComposition, renderStill } from "@remotion/renderer";
import { WORKSPACE } from "../server/paths.ts";
import { getBundle } from "../server/render.ts";
const folder=path.join(WORKSPACE,"tomb-flat-stills");
fs.mkdirSync(folder,{recursive:true});
const serveUrl=await getBundle();
const browser=await openBrowser("chrome");
try{
 const composition=await selectComposition({serveUrl,id:"EgyptianRigPoseSheet",puppeteerInstance:browser});
 const out=path.join(folder,"EgyptianRig-Five-Poses.png");
 await renderStill({serveUrl,composition,puppeteerInstance:browser,frame:38,output:out,scale:1,logLevel:"error"});
 const signature=fs.readFileSync(out).subarray(0,8).toString("hex");
 if(signature!=="89504e470d0a1a0a")throw new Error("Pose sheet did not render as PNG");
 console.log("PASS rendered official 1920x1080 five-pose sheet",out);
}finally{await browser.close({silent:true});}
