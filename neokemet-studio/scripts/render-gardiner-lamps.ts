// Actual 1080x1920 Remotion rendering for Gardiner signs and authentic Egyptian lamps.
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
 const composition=await selectComposition({serveUrl,id:"HieroglyphLampProof",puppeteerInstance:browser});
 const out=path.join(folder,"Gardiner-Ten-Signs-Clay-Lamps.png");
 await renderStill({serveUrl,composition,puppeteerInstance:browser,frame:38,output:out,scale:1,logLevel:"error"});
 const buf=fs.readFileSync(out);
 if(buf.subarray(0,8).toString("hex")!=="89504e470d0a1a0a")throw new Error("Missing PNG still");
 const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20);
 if(w!==1080||h!==1920)throw new Error("Wrong still resolution: "+w+"x"+h);
 console.log("PASS Gardiner + lamps rendered at",w+"x"+h,out);
}finally{await browser.close({silent:true});}
