// V1 Visual Development Lab: inspect/propose/review/apply. No automatic project overwrite.
// Expects ui/app.js to load first, sharing its project, slug, post, runJob and touch helpers.
(() => {
  const q = (id) => document.getElementById(id);
  const ns = "http://www.w3.org/2000/svg";
  const colors = {
    paper:"#E9DCC0",paperDark:"#E9DCC0",cream:"#F4EFE3",sand:"#D9A441",
    gold:"#D9A441",earth:"#B5452B",terra:"#B5452B",teal:"#3E8E6E",
    shadow:"#1B1A17",ink:"#1B1A17",night:"#12100E",none:"none",
    red:"#B5452B",blue:"#2E6DA4",green:"#3E8E6E",white:"#F4EFE3",
  };
  let audit=null,draft=null,backup=null,activeSlug=null;
  const snapshot=()=>JSON.stringify(project);
  const note=(value)=>{q("labStatus").textContent=value;};
  const node=(tag,klass,text)=>{
    const n=document.createElement(tag);
    if(klass)n.className=klass;
    if(text!==undefined)n.textContent=String(text);
    return n;
  };
  const clearProposal=()=>{
    draft=null;
    q("labArtwork").replaceChildren();
    q("labArtwork").hidden=true;
    q("btnLabApply").disabled=true;
  };
  const reset=()=>{
    audit=null;activeSlug=null;backup=null;
    clearProposal();
    q("labAnalysis").replaceChildren();q("labAnalysis").hidden=true;
    q("btnLabOffline").disabled=true;
    q("btnLabOllama").disabled=true;
    q("btnLabUndo").disabled=true;
    note("Start with an analysis. Nothing is sent to paid AI services.");
  };
  window.resetVisualLab=reset;
  const isFresh=(signature,requestedSlug)=>slug===requestedSlug && snapshot()===signature;
  const previewSvg=(shot,large=false)=>{
    const svg=document.createElementNS(ns,"svg");
    svg.setAttribute("viewBox","0 0 1080 1920");
    svg.setAttribute("width",large?"540":"216");
    svg.setAttribute("height",large?"960":"384");
    svg.style.cssText="border:1px solid #C8952B;border-radius:8px;background:#E9DCC0;max-width:100%;";
    const bg=document.createElementNS(ns,"rect");
    Object.entries({x:0,y:0,width:1080,height:1920,fill:colors.paper}).forEach(([k,v])=>bg.setAttribute(k,String(v)));
    svg.append(bg);
    for(const shape of shot.shapes){
      const e=document.createElementNS(ns,shape.kind);
      const props={
        x:shape.x,y:shape.y,width:shape.width,height:shape.height,
        cx:shape.cx,cy:shape.cy,rx:shape.rx,ry:shape.ry,
        x1:shape.x1,y1:shape.y1,x2:shape.x2,y2:shape.y2,
        d:shape.d,points:shape.points,
        fill:colors[shape.fill]||"none",
        stroke:shape.stroke==="none"?"#1B1A17":colors[shape.stroke]||"#1B1A17",
        "stroke-width":Math.max(5,Math.min(40,shape.strokeWidth||5)),
        "stroke-linecap":"round","stroke-linejoin":"round",
        opacity:shape.opacity,
      };
      for(const [k,v] of Object.entries(props))if(v!==undefined)e.setAttribute(k,String(v));
      svg.append(e);
    }
    return svg;
  };
  const displayAudit=(result)=>{
    const box=q("labAnalysis");
    box.hidden=false;box.replaceChildren();
    box.append(node("h4","",result.subject));
    box.append(node("p","muted",result.scenes.length+" scenes · "+result.generated+" custom illustrated · "+result.missing+" need new drawings"));
    for(const s of result.scenes){
      const item=node("div","card");
      item.append(node("b","",`Scene ${s.scene}: ${s.coverage.toUpperCase()}`));
      item.append(node("p","",s.excerpt||"(no narration)"));
      item.append(node("p","muted",s.explanation));
      box.append(item);
    }
    box.append(node("p","muted",result.advice));
  };
  const showArtwork=(response)=>{
    const box=q("labArtwork");box.hidden=false;box.replaceChildren();
    box.append(node("h4","",response.scenes+" scenes of new proposed SVG art"));
    box.append(node("p","muted","Preview drawings below. Changes will apply only after approval. Individual shot compositions may need manual artistic refinement."));
    for(const proposal of response.proposals){
      const item=node("div","card");
      item.append(node("b","",`Scene ${proposal.id}: ${proposal.shots.length} new illustrated shots`));
      const gallery=node("div","row");
      for(const shot of proposal.shots){
        const card=node("div","");
        card.style.cssText="max-width:220px;display:flex;flex-direction:column;gap:6px;align-items:center;";
        const thumb=previewSvg(shot);
        thumb.style.cursor="zoom-in";
        thumb.setAttribute("role","button");thumb.setAttribute("tabindex","0");thumb.setAttribute("aria-label","Open larger illustration preview");
        const expand=()=>{
          const dialog=node("dialog","");
          dialog.style.cssText="padding:16px;border:1px solid #C8952B;border-radius:12px;background:#F4EFE3;max-height:95vh;max-width:95vw;";
          dialog.append(previewSvg(shot,true));
          const close=node("button","","Close preview");close.onclick=()=>dialog.close();dialog.append(close);
          dialog.addEventListener("close",()=>dialog.remove(),{once:true});
          document.body.append(dialog);dialog.showModal();
        };
        thumb.onclick=expand;
        thumb.onkeydown=(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();expand();}};
        card.append(thumb);
        card.append(node("small","",shot.label));
        gallery.append(card);
      }
      item.append(gallery);
      box.append(item);
    }
  };
  q("btnLabAnalyze").onclick=async()=>{
    const button=q("btnLabAnalyze"),signature=snapshot(),sourceSlug=slug;
    button.disabled=true;note("Scanning each scene for visual/story mismatches…");
    clearProposal();backup=null;q("btnLabUndo").disabled=true;
    try{
      const result=await post("/api/visual-lab/analyze",{project});
      if(!isFresh(signature,sourceSlug))throw new Error("The project changed. Analyze again.");
      audit={signature,slug:sourceSlug,result};activeSlug=sourceSlug;
      displayAudit(result);
      q("btnLabOffline").disabled=!result.offlineAvailable;
      q("btnLabOffline").textContent=result.offlineRecipe==="ramp"?"Generate pyramid ramp SVG (offline)":"Generate bespoke SVG art (offline)";
      q("btnLabOllama").disabled=false;
      note(result.offlineRecipe==="bespoke-painting"?"A curated tomb-painting SVG pack is ready. Review it before approval.":result.missing+" scenes need new illustrations; analysis did not change your project.");
    }catch(e){note(e.message||String(e));}
    finally{button.disabled=false;}
  };
  const generate=async(mode)=>{
    if(!audit || !isFresh(audit.signature,audit.slug)){note("Project changed. Run Analyze again.");return;}
    const button=q(mode==="offline"?"btnLabOffline":"btnLabOllama");
    button.disabled=true;clearProposal();
    note(mode==="offline"?"Composing new project-specific SVG illustrations locally…":"Local Ollama is proposing safe SVG geometry; this may take a while…");
    try{
      const {job}=await post("/api/visual-lab/generate",{project,mode});
      const result=await runJob(job,(j)=>note(j.status==="error"?(j.error||"Failed"):j.message));
      if(!isFresh(audit.signature,audit.slug))throw new Error("The project changed during illustration generation; draft discarded.");
      draft={signature:audit.signature,slug:audit.slug,proposals:result.proposals};
      showArtwork(result);
      q("btnLabApply").disabled=false;
      note(result.scenes+" scenes illustrated. Review drawings and explicitly approve.");
    }catch(e){note(e.message||String(e));}
    finally{button.disabled=false;}
  };
  q("btnLabOffline").onclick=()=>generate("offline");
  q("btnLabOllama").onclick=()=>generate("ollama");
  q("btnLabApply").onclick=async()=>{
    if(!draft || !isFresh(draft.signature,draft.slug)){note("Project changed. Analyze again before approving.");return;}
    const proposalMap=new Map(draft.proposals.map(s=>[s.id,s.shots]));
    if(proposalMap.size!==project.scenes.length){note("Generated art does not match the current storyboard.");return;}
    const candidate=JSON.parse(snapshot()),original=JSON.parse(snapshot());
    candidate.scenes=candidate.scenes.map((s,i)=>{
      const shots=proposalMap.get(s.id);
      if(!shots)throw new Error("Missing art for scene "+s.id);
      return {...s,template:"v1-topic-short",artShots:shots,params:{...(s.params||{}),hook:i===0}};
    });
    try{
      await post(`/api/projects/${slug}/timeline`,{project:candidate});
      if(!isFresh(draft.signature,draft.slug))throw new Error("Project changed during validation; approval aborted.");
      project=candidate;
      touch();renderScenes();refreshTimeline();
      backup={before:original,after:snapshot(),slug};
      q("btnLabUndo").disabled=false;
      q("btnLabApply").disabled=true;
      note("New drawings attached to this project. Visit Storyboard → Preview frame, then Save project. Old audio and narration preserved.");
    }catch(e){note(e.message||String(e));}
  };
  q("btnLabUndo").onclick=()=>{
    if(!backup||slug!==backup.slug||snapshot()!==backup.after){note("Other changes were made; cannot safely undo the old approval.");return;}
    project=backup.before;
    touch();renderScenes();refreshTimeline();
    q("btnLabUndo").disabled=true;backup=null;
    note("Restored the previous storyboard in memory. Click Save project if you want to keep this revert.");
  };
})();
