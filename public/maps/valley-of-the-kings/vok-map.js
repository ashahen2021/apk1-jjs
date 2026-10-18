import * as THREE from './vendor/three.module.min.js';

// No runtime dependencies other than the supplied local three.js. All map
// distances are metres; north is -Z, east is +X, and elevation is +Y.
const COLORS = { king:'#e2b453', 'royal family':'#2e8b84', official:'#d8cba8', cache:'#a89c80', animal:'#a89c80', unknown:'#a89c80' };
const CREDIT = 'Terrain: Copernicus DEM GLO-30, produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.';
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;
const fmtYear = year => year < 0 ? `${-year} BCE` : `${year} CE`;
const firstDynasty = t => Number(String(t.dynasty).match(/\d+/)?.[0]) || null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const group = t => ['cache','animal'].includes(t.type) ? 'cache' : t.type;
const tick = () => new Promise(resolve => setTimeout(resolve,0));

// Tiny PNG reader: grayscale 16-bit, non-interlaced PNG, all five scanline
// filters. Native DecompressionStream inflates IDAT without a third-party lib.
// Browser image/canvas conversion would silently quantize the 16-bit samples.
async function decodePNG(buffer) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  if ([137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v)) throw Error('Invalid PNG signature.');
  let width, height, pieces=[], ended=false;
  for (let at=8; at+12<=bytes.length;) {
    const n=view.getUint32(at), type=String.fromCharCode(...bytes.subarray(at+4,at+8));
    if (at+12+n>bytes.length) throw Error('Truncated PNG chunk.');
    if (type==='IHDR') {
      width=view.getUint32(at+8); height=view.getUint32(at+12);
      if (n!==13 || bytes[at+16]!==16 || bytes[at+17]!==0 || bytes[at+18]!==0 || bytes[at+19]!==0 || bytes[at+20]!==0) throw Error('Expected a non-interlaced 16-bit grayscale PNG.');
      if (!width || !height || width*height>4000000) throw Error('Heightmap dimensions are unsupported.');
    }
    if (type==='IDAT') pieces.push(bytes.slice(at+8,at+8+n));
    if (type==='IEND') { ended=true; break; }
    at+=12+n;
  }
  if (!ended || !width || !pieces.length) throw Error('Incomplete PNG.');
  if (!globalThis.DecompressionStream) throw Error('This browser needs native DecompressionStream support to read the heightmap.');
  const raw=new Uint8Array(await new Response(new Blob(pieces).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const stride=width*2;
  if (raw.length!==(stride+1)*height) throw Error('Incorrect PNG scanline length.');
  const out=new Uint8Array(stride*height), samples=new Uint16Array(width*height);
  const paeth=(a,b,c)=>{ const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c); return pa<=pb&&pa<=pc?a:pb<=pc?b:c; };
  for(let y=0;y<height;y++) {
    const filter=raw[y*(stride+1)];
    if(filter>4) throw Error('Invalid PNG filter.');
    for(let x=0;x<stride;x++) {
      const i=y*stride+x,a=x>=2?out[i-2]:0,b=y?out[i-stride]:0,c=y&&x>=2?out[i-stride-2]:0;
      out[i]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
    }
  }
  for(let i=0;i<samples.length;i++) samples[i]=(out[i*2]<<8)|out[i*2+1];
  return {width,height,samples};
}

// Catmull-Rom bicubic interpolation, clamped to the source elevation range.
function cubic(a,b,c,d,t) { return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a))); }
function makeTerrain(png,meta) {
  const {bounds:b,elevation_m:e}=meta, latitude=(b.north+b.south)/2;
  const lonMetres=111320*Math.cos(latitude*Math.PI/180), latMetres=111320;
  const width=(b.east-b.west)*lonMetres, depth=(b.north-b.south)*latMetres;
  const sample=(x,y)=>png.samples[clamp(y,0,png.height-1)*png.width+clamp(x,0,png.width-1)];
  function heightAtUV(u,v) {
    const x=clamp(u,0,1)*(png.width-1),y=clamp(v,0,1)*(png.height-1),ix=Math.floor(x),iy=Math.floor(y),rows=[];
    for(let k=-1;k<=2;k++) rows.push(cubic(sample(ix-1,iy+k),sample(ix,iy+k),sample(ix+1,iy+k),sample(ix+2,iy+k),x-ix));
    return e.min+clamp(cubic(...rows,y-iy),0,65535)/65535*(e.max-e.min);
  }
  const toXZ=(lat,lon)=>({x:(lon-(b.east+b.west)/2)*lonMetres,z:(latitude-lat)*latMetres});
  const toLL=(x,z)=>({lat:latitude-z/latMetres,lon:(b.east+b.west)/2+x/lonMetres});
  const elevation=(x,z)=>heightAtUV(x/width+.5,z/depth+.5);
  return {width,depth,min:e.min,max:e.max,latitude,lonMetres,toXZ,toLL,elevation,heightAtUV};
}

function makeTimeline(data) {
  const bands=data.dynasty_bands_bce, start=Math.min(...bands.map(b=>b.start)), end=Math.max(...bands.map(b=>b.end));
  const modernStart=Math.min(...data.tombs.filter(t=>t.discovered_era==='modern'&&Number.isFinite(t.discovered_year)).map(t=>t.discovered_year));
  const modernEnd=2012;
  const builtYear=t=>t.begun_bce!==null?-t.begun_bce:(bands.find(b=>parseInt(b.dynasty,10)===firstDynasty(t))?.end??end);
  // Antiquity is a categorical band (0–12%), not an invented numeric year.
  // Modern years occupy 12–94%; the final 6% is explicitly date unknown.
  const discoveryPosition=t=>t.discovered_era==='antiquity'?0:t.discovered_era==='modern'&&Number.isFinite(t.discovered_year)? .12+.82*clamp((t.discovered_year-modernStart)/(modernEnd-modernStart),0,1):1;
  const threshold=(t,mode)=>mode==='built'?clamp((builtYear(t)-start)/(end-start),0,1):discoveryPosition(t);
  function dateAt(p,mode) {
    if(mode==='built') return Math.floor(lerp(start,end,p)+1e-7);
    if(p<.12) return null;
    if(p>=1) return Infinity;
    return Math.min(modernEnd,Math.floor(lerp(modernStart,modernEnd,clamp((p-.12)/.82,0,1))+1e-7));
  }
  const label=(p,mode)=>mode==='built'?fmtYear(dateAt(p,mode)):p<.12?'Antiquity':p>=1?'Date unknown':fmtYear(dateAt(p,mode));
  return {bands,start,end,modernStart,modernEnd,builtYear,threshold,dateAt,label};
}

/** Mount an isolated map. Returns a synchronous destroy() cleanup function.
 * destroy.ready resolves to {ok,error?}; destroy.getDiagnostics() returns local
 * timings only. No analytics, remote fonts, tile services or other requests.
 */
export function mountMap(container,{dataUrl='./vok-tombs.json',heightmapUrl='./vok-heightmap.png',heightmapMetaUrl='./vok-heightmap.json'}={}) {
  if(!(container instanceof HTMLElement)) throw TypeError('mountMap needs an HTML element.');
  const hadClass=container.classList.contains('nk-vok'); container.classList.add('nk-vok');
  const root=document.createElement('div'); root.className='nk-shell'; container.append(root);
  const abort=new AbortController(), listeners=[];
  let disposed=false, visible=true, raf=0,lastFrame=0,playing=false,fly=null,pulseUntil=0;
  let renderer=null,scene=null,camera=null,terrainMesh=null,pins=null,geometry=null,material=null,pinMaterial=null,pinGeometry=null;
  let resizeObserver,intersectionObserver, data,terrain,timeline,grid, hillCanvas, ctx2d, fallback=false;
  let w=1,h=1,mode='built',progress=1,exaggeration=1.5,selected=null,activeTab='layers',query='',sort='number';
  let points=[],landmarks=[],screenPoints=[],renderCounter=0,activeEvent=-1,draw2dDirty=true,navButtonsBound=false;
  let orbit={x:0,z:0,y:0,radius:9000,azimuth:.22,polar:.62}, flat={x:0,z:0,span:6500};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const uid=`nk-${Math.random().toString(36).slice(2,9)}`;
  const metrics={loadMs:0,decodeMs:0,meshMs:0,renderCpuMs:[],frameIntervalsMs:[],frames:0,renderer:'loading',vertices:0,triangles:0};
  const layerDefs=[['king','Kings',COLORS.king],['royal family','Royal family',COLORS['royal family']],['official','Officials',COLORS.official],['cache','Caches & animal burials',COLORS.cache],['unknown','Unknown',COLORS.unknown],['decorated','Decorated only'],['west','West Valley'],['landmarks','Landmarks'],['labels','Tomb labels'],['contours','Elevation contours · 25 m'],['hillshade','Hillshade']];
  const layers=Object.fromEntries(layerDefs.map(([key])=>[key,{on:!['decorated','contours'].includes(key),opacity:1}]));
  const uniforms={nkContours:{value:0},nkHillshade:{value:1},nkMin:{value:0}};
  root.innerHTML=`
    <header class="nk-header">
      <div class="nk-brand"><div class="nk-eyebrow">NeoKemetAI / Field atlas</div><h2>Valley of the Kings — Interactive 3D Map</h2></div>
      <label>Explore a view<select class="nk-presets" aria-label="Camera preset"><option value="whole">Whole west bank</option><option value="east">East Valley</option><option value="west">West Valley</option><option value="deir">Deir el-Medina</option></select></label>
      <label>Find an entrance<input class="nk-search" type="search" placeholder="Search KV62 or Seti" aria-label="Search all tombs" autocomplete="off"></label>
    </header>
    <div class="nk-main">
      <section class="nk-stage" aria-label="Interactive terrain">
        <canvas class="nk-canvas" tabindex="0" aria-label="Terrain map. Arrow keys orbit; Shift and arrows pan; plus and minus zoom; Home resets. Use the Tombs tab for an accessible list." aria-describedby="${uid}-instructions"></canvas>
        <div class="nk-stage-top"><div class="nk-eyebrow">Theban necropolis · Egypt</div><div class="nk-map-title">Whole west bank</div><span class="nk-count">Reading the landscape…</span></div>
        <div class="nk-overlay"></div>
        <button class="nk-compass" title="Face north" aria-label="Face north"><span>N</span><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="#5a4a2e"/><path d="M20 3L26 29L20 25L14 29Z" fill="#e2b453"/><path d="M20 25V35" stroke="#a89c80"/></svg></button>
        <div class="nk-map-actions"><button data-action="reset">Reset view</button><button data-action="in" aria-label="Zoom in">+</button><button data-action="out" aria-label="Zoom out">−</button><button data-action="about">About</button></div>
        <div class="nk-scale"><span></span><i class="nk-scale-line"></i></div>
        <div class="nk-hint" id="${uid}-instructions"><span class="nk-desktop-hint">Drag to orbit · Shift-drag to pan · Scroll to zoom</span><span>Double-click or double-tap to explore</span></div>
        <div class="nk-tooltip" hidden></div><div class="nk-status" role="status">Decoding the landscape…</div>
      </section>
      <aside class="nk-sidebar nk-collapsed" aria-label="Map panels">
        <div class="nk-tabs" role="tablist" aria-label="Map tools">
          ${[['layers','Layers'],['tombs','Tombs'],['events','Key events']].map(([key,name],i)=>`<button id="${uid}-tab-${key}" role="tab" aria-selected="${i===0}" aria-controls="${uid}-${key}" tabindex="${i===0?0:-1}" data-tab="${key}">${name}</button>`).join('')}
        </div>
        <section class="nk-panel" id="${uid}-layers" role="tabpanel" aria-labelledby="${uid}-tab-layers">
          <div class="nk-section-title">Read the landscape</div>
          ${layerDefs.map(([key,name,color],i)=>`<div class="nk-layer"><label><input type="checkbox" data-layer="${key}" ${layers[key].on?'checked':''}>${color?`<i class="nk-swatch" style="--swatch:${color}"></i>`:''}${name}</label><input type="range" min="0" max="100" value="100" data-opacity="${key}" aria-label="${name} opacity" ${layers[key].on?'':'disabled'}></div>`).join('')}
          <label class="nk-exaggeration">Vertical exaggeration <span>1.5×</span><input class="nk-exag" aria-label="Vertical exaggeration" type="range" min="1" max="3" step="0.1" value="1.5"></label>
          <p class="nk-subtle">Gold rings identify decorated tombs. Translucent pins indicate estimated positions.</p>
          <button class="nk-text-button" data-action="about">About this map & credits</button>
        </section>
        <section class="nk-panel" id="${uid}-tombs" role="tabpanel" aria-labelledby="${uid}-tab-tombs" hidden><div class="nk-details"><div class="nk-section-title">Tomb details</div><h3>Explore an entrance</h3><p class="nk-subtle">Select a pin or a tomb below. The list includes every supplied tomb, even when hidden by the timeline or a layer.</p></div><div class="nk-tomb-tools"><span class="nk-list-count"></span><label>Sort <select class="nk-sort" aria-label="Sort tombs"><option value="number">Number</option><option value="dynasty">Dynasty</option><option value="discovery">Discovery</option></select></label></div><div class="nk-tomb-list"></div></section>
        <section class="nk-panel" id="${uid}-events" role="tabpanel" aria-labelledby="${uid}-tab-events" hidden><div class="nk-section-title">A valley across time</div><p class="nk-subtle">Select an event to jump in time. All 16 supplied events remain available.</p><div class="nk-events"></div></section>
      </aside>
    </div>
    <footer class="nk-timeline" aria-label="Historical timeline"><div class="nk-time-top"><div class="nk-mode-switch" aria-label="Timeline mode"><button data-mode="built" aria-pressed="true">Built</button><button data-mode="discovered" aria-pressed="false">Discovered</button></div><button class="nk-play" aria-label="Play timeline" aria-pressed="false">Play</button><output class="nk-date"></output></div><div class="nk-axis"><div class="nk-event-track"></div><input class="nk-scrubber" type="range" min="0" max="10000" step="1" value="10000" aria-label="Timeline date"><div class="nk-bands"></div></div><p class="nk-time-note"></p></footer>
    <div class="nk-sr" role="status" aria-live="polite" aria-atomic="true"></div>
    <section class="nk-about" role="dialog" aria-modal="true" aria-label="About this map" hidden></section>`;
  const $=selector=>root.querySelector(selector), $$=selector=>[...root.querySelectorAll(selector)];
  let canvas=$('.nk-canvas');
  const stage=$('.nk-stage'),overlay=$('.nk-overlay'),status=$('.nk-status'),tooltip=$('.nk-tooltip'),live=$('.nk-sr');
  const on=(el,event,handler,options)=>{el.addEventListener(event,handler,options);listeners.push(()=>el.removeEventListener(event,handler,options));};
  function announce(message) { live.textContent=message; }
  function requestRender() { if(!disposed&&visible&&!document.hidden&&!raf) raf=requestAnimationFrame(frame); }
  function setTab(tab,allowCollapse=false) {
    if(allowCollapse&&activeTab===tab&&matchMedia('(max-width:759px)').matches) $('.nk-sidebar').classList.toggle('nk-collapsed');
    else $('.nk-sidebar').classList.remove('nk-collapsed');
    activeTab=tab;
    $$('[data-tab]').forEach(b=>{const current=b.dataset.tab===tab;b.setAttribute('aria-selected',current);b.tabIndex=current?0:-1;});
    $$('.nk-panel').forEach(p=>p.hidden=p.id!==`${uid}-${tab}`);
  }
  function layerAlpha(t) {
    if(!layers[group(t)]?.on || (t.valley==='West'&&!layers.west.on) || (layers.decorated.on&&!t.decorated)) return 0;
    return layers[group(t)].opacity*(t.valley==='West'?layers.west.opacity:1)*(layers.decorated.on?layers.decorated.opacity:1);
  }
  function shown(t) { return timeline.threshold(t,mode)<=progress+1e-8 && layerAlpha(t)>0; }
  function updateTombs() {
    if(!data)return;
    const matches=data.tombs.filter(t=>`${t.id} ${t.owner}`.toLowerCase().includes(query));
    const number=t=>Number(t.id.match(/\d+/)?.[0]??999);
    const sorter=sort==='dynasty'?t=>firstDynasty(t)??999:sort==='discovery'?t=>timeline.threshold(t,'discovered'):number;
    matches.sort((a,b)=>sorter(a)-sorter(b)||number(a)-number(b)||a.id.localeCompare(b.id));
    $('.nk-list-count').textContent=`${matches.length} / ${data.tombs.length} tombs`;
    $('.nk-tomb-list').innerHTML=matches.map(t=>`<button class="nk-tomb-row" data-tomb="${esc(t.id)}" aria-current="${t.id===selected?.id}"><strong>${esc(t.id)}</strong><span>${esc(t.owner)}<small>${esc(t.dynasty)} dynasty${t.begun_bce===null?' · date unknown':''}${shown(t)?'':' · hidden on map'}</small></span></button>`).join('')||'<p class="nk-subtle">No matching tombs.</p>';
  }
  function showDetails(t,move=true,open=true) {
    selected=t;
    const unknown=t.begun_bce===null;
    $('.nk-details').innerHTML=`<div class="nk-detail-badge">${esc(t.id)} / ${esc(t.valley)} Valley</div><h3>${esc(t.owner)}</h3><p class="nk-detail-meta">${esc(t.type)} · Dynasty ${esc(t.dynasty)}</p><dl><dt>Begun</dt><dd>${unknown?'Date unknown':`${t.begun_bce} BCE`}<br><span class="nk-subtle">${unknown?'Placed at the end of the first identified dynasty band; otherwise at the timeline end.':'Start of reign, approximate'}</span></dd><dt>Discovered</dt><dd>${esc(t.discovered)}${t.discovered_era==='unknown'?'<br><span class="nk-subtle">Date unknown</span>':''}</dd><dt>Decorated</dt><dd>${t.decorated?'Yes':'No'}</dd><dt>Position</dt><dd>${esc(t.position)}</dd></dl>${t.note?`<p class="nk-note">${esc(t.note)}</p>`:''}<p class="nk-subtle">${shown(t)?'Entrance visible at the selected date.':'This entrance is hidden by the current date or layers.'}</p>${safeLink(t.page)?`<a class="nk-link-button" href="${esc(safeLink(t.page))}">Read more on NeoKemetAI ↗</a>`:''}`;
    if(open)setTab('tombs'); updateTombs();
    if(move){const p=points.find(p=>p.t.id===t.id);flyTo(p.x,p.z,650);}
    requestRender();
  }
  function safeLink(value) { if(!value)return null; try {const url=new URL(value,location.href);return ['http:','https:'].includes(url.protocol)?url.href:null;}catch{return null;} }
  function setPlaying(value) { playing=value;lastFrame=0;$('.nk-play').textContent=value?'Pause':'Play';$('.nk-play').setAttribute('aria-label',value?'Pause timeline':'Play timeline');$('.nk-play').setAttribute('aria-pressed',value);requestRender(); }
  function eventPlacement(event) {
    if(mode==='built')return clamp((event.year-timeline.start)/(timeline.end-timeline.start),0,1);
    return event.year<0?.055:.12+.82*clamp((event.year-timeline.modernStart)/(2012-timeline.modernStart),0,1);
  }
  function updateAxis() {
    if(!timeline)return;
    $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
    $('.nk-bands').innerHTML=mode==='built'?timeline.bands.map(b=>`<div class="nk-band" style="width:${100*(b.end-b.start)/(timeline.end-timeline.start)}%" title="${esc(`${b.dynasty} Dynasty: ${fmtYear(b.start)}–${fmtYear(b.end)}`)}">${esc(b.dynasty)} Dynasty</div>`).join(''):'<div class="nk-band" style="width:12%">Antiquity</div><div class="nk-band" style="width:82%">'+timeline.modernStart+'–2012 CE</div><div class="nk-band" style="width:6%" title="Date unknown">?</div>';
    // All events are represented: off-axis events share a labelled boundary
    // button that cycles through them. The list gives every event its own row.
    const slots=new Map();
    data.events.forEach((event,i)=>{const percent=eventPlacement(event)*100,key=Math.round(percent*10);if(!slots.has(key))slots.set(key,{percent,ids:[]});slots.get(key).ids.push(i);});
    $('.nk-event-track').innerHTML=[...slots.values()].map(({percent,ids})=>`<button class="nk-event-dot" data-event-ids="${ids.join(',')}" style="left:${percent}%" title="${esc(ids.map(i=>`${fmtYear(data.events[i].year)}: ${data.events[i].label}`).join('\n'))}" aria-label="${esc(ids.length>1?`${ids.length} events near this boundary; click to cycle. ${ids.map(i=>fmtYear(data.events[i].year)).join(', ')}`:`${fmtYear(data.events[ids[0]].year)}: ${data.events[ids[0]].label}`)}">${ids.length>1?'◈':'◆'}</button>`).join('');
    $('.nk-events').innerHTML=data.events.map((e,i)=>`<button class="nk-event" data-event="${i}"><time>${fmtYear(e.year)}</time><span>${esc(e.label)}</span></button>`).join('');
    updateTimeline(false);
  }
  function updateTimeline(speak=false) {
    if(!timeline)return;
    $('.nk-scrubber').value=Math.round(progress*10000);$('.nk-scrubber').setAttribute('aria-valuetext',timeline.label(progress,mode));$('.nk-date').textContent=timeline.label(progress,mode);
    $('.nk-time-note').textContent=mode==='built'?'Reign-start proxy, not a construction date · Shaw chronology · Undated tombs enter at dynasty end.':'Antiquity is categorical · Modern dates use recorded years · “?” includes dates unknown.';
    const event=data.events[activeEvent];
    if(event) $('.nk-time-note').textContent=`${fmtYear(event.year)} — ${event.label}${mode==='built'&&(event.year<timeline.start||event.year>timeline.end)?' · Outside Built range; showing nearest endpoint.':''}`;
    const current=timeline.dateAt(progress,mode);
    $$('.nk-event').forEach((el,i)=>{const e=data.events[i];el.setAttribute('aria-current',i===activeEvent);el.classList.toggle('nk-future',mode==='built'?e.year>current:current===null?e.year>0:e.year>current);});
    $$('.nk-event-dot').forEach(el=>el.setAttribute('aria-current',el.dataset.eventIds.split(',').map(Number).includes(activeEvent)));
    points.forEach(p=>{const next=shown(p.t);if(next&&!p.show&&!reduced.matches){p.appear=performance.now();pulseUntil=p.appear+500;}p.show=next;});
    $('.nk-count').textContent=`${points.filter(p=>p.show).length} / ${data.tombs.length} entrances · Positions approximate`;
    const visibilityNote=$('.nk-details > .nk-subtle');
    if(selected&&visibilityNote)visibilityNote.textContent=shown(selected)?'Entrance visible at the selected date.':'This entrance is hidden by the current date or layers.';
    draw2dDirty=true;requestRender();
    if(speak)announce(`${timeline.label(progress,mode)}. ${points.filter(p=>p.show).length} entrances visible.`);
  }
  function jumpEvent(index) {
    setPlaying(false);activeEvent=index;const event=data.events[index];
    mode=event.year<0?'built':'discovered';progress=eventPlacement(event);
    updateAxis();updateTombs();
    const ids=event.label.match(/\b(?:KV|WV)\d+\b/g)||[];
    const point=points.find(p=>p.t.id===ids[0]);
    if(point){showDetails(point.t,false,false);flyTo(point.x,point.z,800);}
    announce(`${fmtYear(event.year)}. ${event.label}${mode==='built'&&event.year>timeline.end?'. Outside Built range; showing its endpoint.':''}`);
  }
  function about() {
    const panel=$('.nk-about');panel.hidden=false;
    panel.innerHTML=`<button class="nk-about-close">Close</button><div class="nk-eyebrow">NeoKemetAI / Field notes</div><h3>About this map</h3><p>${CREDIT}</p><p>Tomb data: compiled by NeoKemetAI from Wikipedia and Wikidata; positions approximate.</p><p>Tomb entrances only; tomb plans are not shown at true scale.</p><p>Terrain is smoothed from 30 m data using 3× bicubic interpolation. Smoothing adds no measured detail. This surface model includes surface objects. Vertical exaggeration is adjustable from 1× to 3×; contours show unexaggerated elevation above sea level.</p><p>North is at the top of the source heightmap. El-Qurn (approx.) is the highest sampled terrain point in the southern half of a 1.5 km radius around KV62. No Nile or cultivated strip is inferred.</p><p>The Built axis follows the supplied Shaw dynasty bands, 1550–1069 BCE. Events beyond it appear at a labelled boundary. The Discovered axis has categorical Antiquity and unknown-date bands; these are not numeric years. Unknown dynasty dates appear at the end of the Built axis.</p><ul>${data.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><p><a href="https://youtu.be/Nw6pvULzs1c" target="_blank" rel="noopener noreferrer">Valley of the Kings: How They Carved Tombs Into a Mountain</a></p><p><a href="https://neokemetai.online/tombs/" target="_blank" rel="noopener noreferrer">Explore the NeoKemetAI tomb archive</a></p><p>Mouse: drag to orbit, Shift-drag or right-drag to pan, wheel to zoom. Touch: one finger orbits, two fingers pan and pinch. Keyboard: arrows orbit, Shift + arrows pan, +/− zoom, Home resets. In 2D mode, dragging pans. On phones, tap the active panel tab to collapse it.</p><p>Fonts use the host’s Cinzel and Inter if installed or already loaded, otherwise Georgia and system-ui. No fonts are downloaded.</p>`;
    root.querySelector('.nk-main').inert=true;root.querySelector('.nk-header').inert=true;root.querySelector('.nk-timeline').inert=true;
    panel.querySelector('button').focus();
  }
  function closeAbout() { $('.nk-about').hidden=true;root.querySelector('.nk-main').inert=false;root.querySelector('.nk-header').inert=false;root.querySelector('.nk-timeline').inert=false;$('[data-action=about]').focus(); }
  function syncHeight() {
    if(terrainMesh)terrainMesh.scale.y=exaggeration;
    points.forEach(p=>p.y=surfaceHeight(p.x,p.z)*exaggeration+2);
    landmarks.forEach(p=>p.y=surfaceHeight(p.x,p.z)*exaggeration+4);
    orbit.y=surfaceHeight(orbit.x,orbit.z)*exaggeration;
    fly=null;draw2dDirty=true;requestRender();
  }
  // Match the actual piecewise-triangular mesh, rather than the continuous
  // bicubic surface, so pins cannot float below or above their triangle.
  function surfaceHeight(x,z) {
    if(!grid)return terrain.elevation(x,z)-terrain.min;
    const gx=clamp(x/terrain.width+.5,0,1)*(grid.nx-1),gz=clamp(z/terrain.depth+.5,0,1)*(grid.nz-1);
    const ix=Math.min(Math.floor(gx),grid.nx-2),iz=Math.min(Math.floor(gz),grid.nz-2),u=gx-ix,v=gz-iz;
    const a=grid.values[iz*grid.nx+ix],b=grid.values[iz*grid.nx+ix+1],c=grid.values[(iz+1)*grid.nx+ix],d=grid.values[(iz+1)*grid.nx+ix+1];
    return (u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v))-terrain.min;
  }
  function preset(name,animate=true) {
    if(!terrain)return;
    let x=0,z=0,radius=Math.max(terrain.depth,terrain.width/Math.max(w/h,.4))*1.65;
    if(fallback&&name==='whole')radius=Math.max(terrain.width,terrain.depth*w/h)*1.15;
    if(name==='east'||name==='west'){const members=points.filter(p=>p.t.valley===(name==='east'?'East':'West'));x=members.reduce((s,p)=>s+p.x,0)/members.length;z=members.reduce((s,p)=>s+p.z,0)/members.length;radius=name==='east'?1100:1500;}
    if(name==='deir'){const p=landmarks.find(p=>p.id==='deir-el-medina');x=p.x;z=p.z;radius=1300;}
    $('.nk-presets').value=name;$('.nk-map-title').textContent={whole:'Whole west bank',east:'East Valley',west:'West Valley',deir:'Deir el-Medina'}[name];
    flyTo(x,z,radius,animate,name==='whole'?.62:.72);
  }
  function flyTo(x,z,radius,animate=true,polar=orbit.polar) {
    if(!terrain)return;
    const target={x,z,y:surfaceHeight(x,z)*exaggeration,radius,polar,azimuth:orbit.azimuth};
    if(fallback){flat={x,z,span:radius};fly=null;draw2dDirty=true;}
    else if(animate&&!reduced.matches)fly={from:{...orbit},to:target,start:performance.now(),duration:850};
    else{orbit=target;fly=null;}
    requestRender();
  }

  async function buildMesh(png) {
    // Phones and coarse pointers get a lighter 2x mesh (about 140k vertices); desktops keep 3x.
    const up=matchMedia('(max-width: 760px), (pointer: coarse)').matches?2:3;
    const start=performance.now(),nx=(png.width-1)*up+1,nz=(png.height-1)*up+1;
    const values=new Float32Array(nx*nz),positions=new Float32Array(nx*nz*3),colors=new Float32Array(nx*nz*3),ao=new Float32Array(nx*nz);
    const low=new THREE.Color('#62573f'),high=new THREE.Color('#d0c19c'),color=new THREE.Color();
    for(let j=0;j<nz;j++){
      for(let i=0;i<nx;i++){
        const k=j*nx+i,u=i/(nx-1),v=j/(nz-1),x=(u-.5)*terrain.width,z=(v-.5)*terrain.depth,e=terrain.heightAtUV(u,v);
        values[k]=e;positions.set([x,e-terrain.min,z],k*3);
        const dx=(terrain.elevation(x+18,z)-terrain.elevation(x-18,z))/36,dz=(terrain.elevation(x,z+18)-terrain.elevation(x,z-18))/36;
        const slope=Math.hypot(dx,dz),near=(terrain.elevation(x+75,z)+terrain.elevation(x-75,z)+terrain.elevation(x,z+75)+terrain.elevation(x,z-75))/4;
        ao[k]=clamp((near-e)/50,0,.4);
        color.copy(low).lerp(high,clamp((e-terrain.min)/(terrain.max-terrain.min)*.7+slope*.16+.16,0,1));color.toArray(colors,k*3);
      }
      if(j%32===0){await tick();if(disposed)return;}
    }
    grid={nx,nz,values};metrics.vertices=nx*nz;metrics.triangles=(nx-1)*(nz-1)*2;
    if(!fallback){
      const indices=new Uint32Array((nx-1)*(nz-1)*6);let n=0;
      for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;indices.set([a,c,b,b,c,d],n);n+=6;}
      geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('nkAO',new THREE.BufferAttribute(ao,1));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeVertexNormals();geometry.computeBoundingSphere();
      material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.FrontSide});
      uniforms.nkMin.value=terrain.min;
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader='attribute float nkAO; varying float nkHeight; varying float nkValley; uniform float nkMin;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnkHeight=position.y+nkMin; nkValley=nkAO;');
        shader.fragmentShader='varying float nkHeight; varying float nkValley; uniform float nkContours; uniform float nkHillshade;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight=mix(diffuseColor.rgb,outgoingLight,nkHillshade); outgoingLight*=1.0-nkValley*nkHillshade; float q=nkHeight/25.0; float edge=abs(fract(q+0.5)-0.5); float line=1.0-smoothstep(0.0,max(fwidth(q)*1.15,0.012),edge); outgoingLight*=1.0-line*nkContours*0.48;\n#include <opaque_fragment>`);
      };
      material.customProgramCacheKey=()=> 'nk-vok-terrain-1';
      terrainMesh=new THREE.Mesh(geometry,material);terrainMesh.scale.y=exaggeration;scene.add(terrainMesh);
    }
    metrics.meshMs=performance.now()-start;
    // Full-resolution smoothed hillshade for the independent 2D fallback.
    hillCanvas=document.createElement('canvas');hillCanvas.width=nx;hillCanvas.height=nz;
    rebuildHillshade();
  }
  function rebuildHillshade() {
    if(!hillCanvas)return;
    const ctx=hillCanvas.getContext('2d'),image=ctx.createImageData(grid.nx,grid.nz),s=layers.hillshade.on?layers.hillshade.opacity:0;
    const at=(i,j)=>grid.values[clamp(j,0,grid.nz-1)*grid.nx+clamp(i,0,grid.nx-1)];
    for(let j=0;j<grid.nz;j++)for(let i=0;i<grid.nx;i++){
      const k=j*grid.nx+i,e=at(i,j),dx=(at(i+1,j)-at(i-1,j))/(2*terrain.width/(grid.nx-1))*exaggeration,dz=(at(i,j+1)-at(i,j-1))/(2*terrain.depth/(grid.nz-1))*exaggeration;
      const light=clamp((dx*.5+dz*.5+.75)/Math.hypot(dx,1,dz),0,1),tone=(e-terrain.min)/(terrain.max-terrain.min);
      let shade=lerp(1,.42+.58*light,s);
      if(layers.contours.on&&Math.abs(e/25-Math.round(e/25))<.025)shade*=1-layers.contours.opacity*.45;
      image.data.set([(140+65*tone)*shade,(123+66*tone)*shade,(90+65*tone)*shade,255],k*4);
    }
    ctx.putImageData(image,0,0);draw2dDirty=true;
  }
  function buildMarkers() {
    points=data.tombs.map(t=>{const p=terrain.toXZ(t.lat,t.lon);return {...p,t,y:surfaceHeight(p.x,p.z)*exaggeration+2,show:false,appear:0,label:null};});
    landmarks=data.landmarks.map(l=>{
      let p;
      if(l.id==='el-qurn'){
        const kv=points.find(p=>p.t.id==='KV62');let highest=-Infinity;
        for(let j=0;j<grid.nz;j++)for(let i=0;i<grid.nx;i++){
          const x=(i/(grid.nx-1)-.5)*terrain.width,z=(j/(grid.nz-1)-.5)*terrain.depth,e=grid.values[j*grid.nx+i];
          if(z>=kv.z&&Math.hypot(x-kv.x,z-kv.z)<=1500&&e>highest){highest=e;p={x,z};}
        }
      }else p=terrain.toXZ(l.lat,l.lon);
      return {...l,...p,name:l.id==='el-qurn'?'El-Qurn (approx.)':l.name,y:surfaceHeight(p.x,p.z)*exaggeration+4};
    });
    for(const p of [...points,...landmarks]){const label=document.createElement('span');label.className=`nk-label${p.t?'':' nk-landmark'}`;label.textContent=p.t?p.t.id:p.name;label.hidden=true;label.setAttribute('aria-hidden','true');overlay.append(label);p.label=label;}
    const cluster=document.createElement('button');cluster.className='nk-cluster';cluster.hidden=true;cluster.textContent='East Valley';overlay.append(cluster);on(cluster,'click',()=>preset('east'));
    if(fallback)return;
    const n=points.length;pinGeometry=new THREE.BufferGeometry();
    pinGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage));
    pinGeometry.setAttribute('aColor',new THREE.BufferAttribute(new Float32Array(n*3),3));
    for(const name of ['aOpacity','aRing','aPulse','aSelected'])pinGeometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(n),1).setUsage(THREE.DynamicDrawUsage));
    points.forEach((p,i)=>{new THREE.Color(COLORS[p.t.type]||COLORS.unknown).toArray(pinGeometry.attributes.aColor.array,i*3);pinGeometry.attributes.aRing.array[i]=p.t.decorated?1:0;});
    pinMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,uniforms:{pixelRatio:{value:Math.min(devicePixelRatio||1,2)},viewportHeight:{value:h}},vertexShader:`attribute vec3 aColor; attribute float aOpacity; attribute float aRing; attribute float aPulse; attribute float aSelected; varying vec3 vColor; varying float vOpacity; varying float vRing; varying float vPulse; varying float vSelected; uniform float pixelRatio; uniform float viewportHeight; void main(){vColor=aColor;vOpacity=aOpacity;vRing=aRing;vPulse=aPulse;vSelected=aSelected;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);p.y+=23.56/viewportHeight*p.w;gl_Position=p;gl_PointSize=38.0*pixelRatio;}`,fragmentShader:`varying vec3 vColor; varying float vOpacity; varying float vRing; varying float vPulse; varying float vSelected; void main(){if(vOpacity<0.005)discard;vec2 uv=vec2(gl_PointCoord.x,1.0-gl_PointCoord.y);float base=length((uv-vec2(.5,.19))*vec2(1.0,1.6));float glow=exp(-base*base*85.0)*.48;float ring=(1.0-smoothstep(.014,.036,abs(base-.16)))*vRing;float stem=(1.0-smoothstep(.018,.039,abs(uv.x-.5)))*step(.19,uv.y)*step(uv.y,.70);float head=1.0-smoothstep(.065,.085,length(uv-vec2(.5,.72)));float halo=(1.0-smoothstep(.015,.035,abs(base-(.12+vPulse*.25))))*(1.0-vPulse)*step(.001,vPulse);float selection=(1.0-smoothstep(.01,.03,abs(base-.24)))*vSelected;float alpha=max(max(max(glow,ring*.9),max(stem,head)),max(halo,selection));gl_FragColor=vec4(mix(vColor,vec3(1.0,.8,.38),max(ring,selection)),alpha*vOpacity);#include <colorspace_fragment>\n}`.replace(';#include',';\n#include')});
    pins=new THREE.Points(pinGeometry,pinMaterial);pins.frustumCulled=false;pins.renderOrder=2;scene.add(pins);
  }

  function updateCamera() {
    if(!camera)return;
    const sin=Math.sin(orbit.polar);camera.position.set(orbit.x+orbit.radius*sin*Math.sin(orbit.azimuth),orbit.y+orbit.radius*Math.cos(orbit.polar),orbit.z+orbit.radius*sin*Math.cos(orbit.azimuth));
    camera.lookAt(orbit.x,orbit.y,orbit.z);camera.updateMatrixWorld();
  }
  function project(x,y,z) {
    if(fallback){const mpp=flat.span/w;return {x:(x-flat.x)/mpp+w/2,y:(z-flat.z)/mpp+h/2,visible:true};}
    const v=new THREE.Vector3(x,y,z).project(camera);return {x:(v.x*.5+.5)*w,y:(-.5*v.y+.5)*h,visible:v.z>-1&&v.z<1};
  }
  function metresPerPixel() { return fallback?flat.span/w:2*orbit.radius*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/h; }
  function renderOverlay(now) {
    const east=points.filter(p=>p.t.valley==='East'&&p.show),clustered=metresPerPixel()>3.3&&east.length>1;
    const cluster=$('.nk-cluster');cluster.hidden=!clustered;
    const rectangles=[{x:0,y:0,w:Math.min(340,w-65),h:91},{x:w-76,y:0,w:76,h:85}];
    if(clustered){const centre=east.reduce((a,p)=>({x:a.x+p.x/east.length,y:a.y+p.y/east.length,z:a.z+p.z/east.length}),{x:0,y:0,z:0}),s=project(centre.x,centre.y,centre.z);cluster.hidden=!s.visible;cluster.style.left=`${s.x}px`;cluster.style.top=`${s.y}px`;cluster.textContent=`East Valley · ${east.length}`;cluster.setAttribute('aria-label',`Expand East Valley cluster, ${east.length} visible tombs`);rectangles.push({x:s.x-75,y:s.y-24,w:150,h:48});}
    screenPoints=[];
    points.forEach((p,i)=>{
      const s=project(p.x,p.y,p.z),alpha=p.show&&!(clustered&&p.t.valley==='East')?layerAlpha(p.t)*(p.t.position.startsWith('estimated')?.55:1):0;
      p.screen=s;p.alpha=alpha;
      if(alpha>0&&s.visible)screenPoints.push({...s,p,index:i});
      if(pinGeometry){pinGeometry.attributes.position.setXYZ(i,p.x,p.y,p.z);pinGeometry.attributes.aOpacity.setX(i,alpha);pinGeometry.attributes.aPulse.setX(i,!reduced.matches&&now-p.appear<500?(now-p.appear)/500:0);pinGeometry.attributes.aSelected.setX(i,selected?.id===p.t.id?1:0);}
      p.label.hidden=true;
    });
    if(pinGeometry)for(const name of ['position','aOpacity','aPulse','aSelected'])pinGeometry.attributes[name].needsUpdate=true;
    const priority=p=>p.t?(p.t.id===selected?.id?100:0)+(p.t.type==='king'?20:0)+(p.t.decorated?10:0):5;
    const candidates=[...points.filter(p=>p.alpha>0&&layers.labels.on),...landmarks.filter(()=>layers.landmarks.on)].sort((a,b)=>priority(b)-priority(a));
    landmarks.forEach(p=>p.label.hidden=true);
    for(const p of candidates){
      const s=p.screen&&p.t?p.screen:project(p.x,p.y,p.z),text=p.t?p.t.id:p.name,lw=text.length*(p.t?6.1:5.8)+14,lh=22;
      const rect={x:s.x+9,y:s.y-26,w:lw,h:lh};
      if(!s.visible||rect.x<4||rect.y<65||rect.x+lw>w-6||rect.y+lh>h-85||rectangles.some(r=>rect.x<r.x+r.w+5&&rect.x+lw+5>r.x&&rect.y<r.y+r.h+4&&rect.y+lh+4>r.y))continue;
      rectangles.push(rect);p.label.hidden=false;p.label.style.left=`${rect.x}px`;p.label.style.top=`${rect.y}px`;p.label.style.opacity=p.t?layers.labels.opacity*p.alpha:layers.landmarks.opacity;
    }
    const mpp=metresPerPixel(),wanted=90*mpp,base=10**Math.floor(Math.log10(wanted)),length=[1,2,5,10].map(n=>n*base).filter(n=>n<=wanted).pop()||base;
    $('.nk-scale span').textContent=`${length>=1000?`${length/1000} km`:`${length} m`} · at focus`;
    $('.nk-scale-line').style.width=`${length/mpp}px`;
    $('.nk-compass svg').style.transform=`rotate(${fallback?0:-orbit.azimuth}rad)`;
  }
  function render2D() {
    const ctx=ctx2d,ratio=Math.min(devicePixelRatio||1,2);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#0b0a08';ctx.fillRect(0,0,w,h);
    const mpp=flat.span/w,corner=project(-terrain.width/2,0,-terrain.depth/2);ctx.drawImage(hillCanvas,corner.x,corner.y,terrain.width/mpp,terrain.depth/mpp);
    for(const {x,y,p} of screenPoints){ctx.globalAlpha=p.alpha;ctx.strokeStyle=COLORS[p.t.type];ctx.fillStyle=COLORS[p.t.type];ctx.lineWidth=1.5;ctx.shadowColor=COLORS[p.t.type];ctx.shadowBlur=7;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-14);ctx.stroke();ctx.beginPath();ctx.arc(x,y-14,3,0,Math.PI*2);ctx.fill();if(p.t.decorated||p.t.id===selected?.id){ctx.strokeStyle='#e2b453';ctx.beginPath();ctx.ellipse(x,y,9,5,0,0,Math.PI*2);ctx.stroke();}}
    ctx.globalAlpha=1;draw2dDirty=false;
  }
  function frame(now) {
    raf=0;if(disposed||!visible||document.hidden||!terrain||!grid)return;
    const start=performance.now(),wasAnimating=playing||!!fly||now<pulseUntil;
    if(lastFrame&&wasAnimating){const interval=now-lastFrame;if(interval<500){metrics.frameIntervalsMs.push(interval);if(metrics.frameIntervalsMs.length>3000)metrics.frameIntervalsMs.shift();}}
    if(playing){if(lastFrame)progress=Math.min(1,progress+(now-lastFrame)/20000);activeEvent=-1;updateTimeline(false);if(progress>=1){setPlaying(false);updateTombs();announce('Timeline complete.');}}
    if(fly){const t=clamp((now-fly.start)/fly.duration,0,1),ease=t*t*(3-2*t);for(const key of Object.keys(orbit))orbit[key]=lerp(fly.from[key],fly.to[key],ease);if(t>=1)fly=null;}
    updateCamera();renderOverlay(now);
    if(renderer)renderer.render(scene,camera);else if(ctx2d)render2D();
    renderCounter++;metrics.frames=renderCounter;metrics.renderCpuMs.push(performance.now()-start);if(metrics.renderCpuMs.length>3000)metrics.renderCpuMs.shift();
    lastFrame=now;
    if(playing||fly||now<pulseUntil)requestRender();else lastFrame=0;
  }
  function resize() {
    const rect=stage.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);
    if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(pinMaterial){pinMaterial.uniforms.viewportHeight.value=h;pinMaterial.uniforms.pixelRatio.value=renderer.getPixelRatio();}}
    else {canvas.width=Math.round(w*Math.min(devicePixelRatio||1,2));canvas.height=Math.round(h*Math.min(devicePixelRatio||1,2));}
    draw2dDirty=true;requestRender();
  }
  function useFallback(reason) {
    fallback=true;metrics.renderer='2D canvas';
    if(renderer){renderer.dispose();renderer.forceContextLoss();renderer=null;}
    // A canvas that has acquired WebGL cannot also acquire a 2D context.
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;ctx2d=canvas.getContext('2d');
    if(!ctx2d)throw Error('Neither WebGL nor Canvas 2D is available.');
    $('.nk-map-title').textContent='2D terrain fallback';$('.nk-hint').innerHTML='<span>2D hillshade · Drag to pan · Scroll or pinch to zoom</span>';
    canvas.setAttribute('aria-label','2D hillshade map. Arrows pan; plus and minus zoom; Home resets. Tombs are also available in the Tombs tab.');
    metrics.fallbackReason=String(reason);resize();
  }
  function bindNavigation() {
    const pointers=new Map();let moved=false,down=null,previousTap=0,previousTapPoint=null;
    const local=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
    function pan(dx,dy) {
      const mpp=metresPerPixel();
      if(fallback){flat.x-=dx*mpp;flat.z-=dy*mpp;}
      else{const c=Math.cos(orbit.azimuth),s=Math.sin(orbit.azimuth);orbit.x-=mpp*(dx*c+dy*s);orbit.z+=mpp*(dx*s-dy*c);orbit.x=clamp(orbit.x,-terrain.width/2,terrain.width/2);orbit.z=clamp(orbit.z,-terrain.depth/2,terrain.depth/2);orbit.y=surfaceHeight(orbit.x,orbit.z)*exaggeration;}
      draw2dDirty=true;
    }
    function zoom(factor){fly=null;if(fallback)flat.span=clamp(flat.span*factor,200,20000);else orbit.radius=clamp(orbit.radius*factor,160,24000);draw2dDirty=true;requestRender();}
    const hit=p=>screenPoints.map(s=>({...s,d:Math.hypot(s.x-p.x,s.y-10-p.y)})).filter(s=>s.d<20).sort((a,b)=>a.d-b.d)[0];
    function flyAt(p) {
      const tomb=hit(p);if(tomb){showDetails(tomb.p.t);return;}
      if(fallback){const mpp=flat.span/w;flyTo(flat.x+(p.x-w/2)*mpp,flat.z+(p.y-h/2)*mpp,flat.span*.55);return;}
      const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(p.x/w*2-1,1-p.y/h*2),camera);const collision=ray.intersectObject(terrainMesh)[0];if(collision)flyTo(collision.point.x,collision.point.z,Math.max(400,orbit.radius*.5));
    }
    on(canvas,'contextmenu',e=>e.preventDefault());
    on(canvas,'pointerdown',e=>{if(!terrain)return;fly=null;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,local(e));down=local(e);moved=false;tooltip.hidden=true;});
    on(canvas,'pointermove',e=>{
      const p=local(e);
      if(!pointers.has(e.pointerId)){const nearest=hit(p);tooltip.hidden=!nearest;if(nearest){tooltip.textContent=`${nearest.p.t.id} · ${nearest.p.t.owner}`;tooltip.style.left=`${clamp(p.x+12,5,w-245)}px`;tooltip.style.top=`${clamp(p.y+15,5,h-65)}px`;}return;}
      const old=pointers.get(e.pointerId),dx=p.x-old.x,dy=p.y-old.y;
      if(down&&Math.hypot(p.x-down.x,p.y-down.y)>4)moved=true;
      if(pointers.size>=2){moved=true;const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];if(other){const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(p.x-other.x,p.y-other.y);if(before>5&&after>5)zoom(before/after);pan(dx/2,dy/2);}}
      else if(fallback||e.shiftKey||e.buttons===2)pan(dx,dy);
      else {orbit.azimuth-=dx*.006;orbit.polar=clamp(orbit.polar+dy*.005,.15,1.34);}
      pointers.set(e.pointerId,p);draw2dDirty=true;requestRender();
    });
    on(canvas,'pointerup',e=>{const p=local(e),now=performance.now();pointers.delete(e.pointerId);if(!moved){const nearest=hit(p);if(nearest)showDetails(nearest.p.t);if(e.pointerType==='touch'&&now-previousTap<330&&previousTapPoint&&Math.hypot(p.x-previousTapPoint.x,p.y-previousTapPoint.y)<25){flyAt(p);previousTap=0;}else{previousTap=now;previousTapPoint=p;}}if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
    on(canvas,'pointercancel',e=>{pointers.delete(e.pointerId);moved=true;});on(canvas,'pointerleave',()=>tooltip.hidden=true);
    on(canvas,'dblclick',e=>{e.preventDefault();flyAt(local(e));});
    on(canvas,'wheel',e=>{if(!terrain)return;e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-200,200)*.0015));},{passive:false});
    on(canvas,'keydown',e=>{
      if(!terrain)return;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)){e.preventDefault();fly=null;
        if(e.key==='Home')preset('whole');else if(['+','=','-'].includes(e.key))zoom(e.key==='-'?1.2:.8);
        else{const dx=e.key==='ArrowLeft'?30:e.key==='ArrowRight'?-30:0,dy=e.key==='ArrowUp'?30:e.key==='ArrowDown'?-30:0;if(e.shiftKey||fallback)pan(dx,dy);else{orbit.azimuth+=dx*.004;orbit.polar=clamp(orbit.polar+dy*.004,.15,1.34);}requestRender();}
      }
    });
    if(!navButtonsBound){on($('[data-action=in]'),'click',()=>zoom(.75));on($('[data-action=out]'),'click',()=>zoom(1.3));navButtonsBound=true;}
  }

  // Delegated DOM controls remain useful in the 2D fallback too.
  on(root,'click',e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.dataset.tab)setTab(button.dataset.tab,true);
    if(button.dataset.tomb)showDetails(data.tombs.find(t=>t.id===button.dataset.tomb));
    if(button.dataset.event!==undefined)jumpEvent(Number(button.dataset.event));
    if(button.dataset.eventIds){const ids=button.dataset.eventIds.split(',').map(Number),next=ids[(ids.indexOf(activeEvent)+1)%ids.length];jumpEvent(next);}
    if(button.dataset.mode&&timeline){setPlaying(false);mode=button.dataset.mode;activeEvent=-1;updateAxis();updateTombs();announce(`${mode==='built'?'Built':'Discovered'} mode. ${timeline.label(progress,mode)}.`);}
    if(button.dataset.action==='reset')preset('whole');
    if(button.dataset.action==='about'&&data)about();
    if(button.classList.contains('nk-about-close'))closeAbout();
  });
  on($('.nk-tabs'),'keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=$$('[data-tab]'),i=tabs.indexOf(document.activeElement),j=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;setTab(tabs[j].dataset.tab);tabs[j].focus();}});
  on($('.nk-about'),'keydown',e=>{if(e.key==='Escape')closeAbout();if(e.key==='Tab'){const items=[...$('.nk-about').querySelectorAll('button,a')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  on($('.nk-presets'),'change',e=>preset(e.target.value));
  on($('.nk-search'),'input',e=>{query=e.target.value.trim().toLowerCase();setTab('tombs');updateTombs();});
  on($('.nk-sort'),'change',e=>{sort=e.target.value;updateTombs();});
  on($('.nk-play'),'click',()=>{if(!timeline)return;if(!playing&&progress>=1){progress=0;activeEvent=-1;updateTimeline();}setPlaying(!playing);});
  on($('.nk-scrubber'),'input',e=>{if(!timeline)return;setPlaying(false);progress=Number(e.target.value)/10000;activeEvent=-1;updateTimeline();});
  on($('.nk-scrubber'),'change',()=>{updateTimeline(true);updateTombs();});
  on($('.nk-exag'),'input',e=>{exaggeration=Number(e.target.value);$('.nk-exaggeration span').textContent=`${exaggeration.toFixed(1)}×`;if(terrain){syncHeight();if(fallback)rebuildHillshade();}});
  on($('.nk-compass'),'click',()=>{orbit.azimuth=0;fly=null;requestRender();});
  on(root,'input',e=>{
    const key=e.target.dataset.layer||e.target.dataset.opacity;if(!key)return;
    if(e.target.dataset.layer){layers[key].on=e.target.checked;$$('[data-opacity]').find(el=>el.dataset.opacity===key).disabled=!e.target.checked;}else layers[key].opacity=Number(e.target.value)/100;
    uniforms.nkContours.value=layers.contours.on?layers.contours.opacity:0;uniforms.nkHillshade.value=layers.hillshade.on?layers.hillshade.opacity:0;
    if(fallback&&['hillshade','contours'].includes(key))rebuildHillshade();updateTimeline();updateTombs();
  });
  const suspend=()=>{if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;if(fly){orbit={...fly.to};fly=null;}};
  on(document,'visibilitychange',()=>{if(document.hidden)suspend();else requestRender();});
  on(reduced,'change',()=>{if(reduced.matches){pulseUntil=0;if(fly){orbit={...fly.to};fly=null;}}requestRender();});
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  if(globalThis.IntersectionObserver){intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestRender();else suspend();});intersectionObserver.observe(container);}

  async function load() {
    const began=performance.now();
    try {
      const urls=[dataUrl,heightmapUrl,heightmapMetaUrl].map(value=>new URL(value,document.baseURI));
      if(urls.some(u=>u.origin!==location.origin))throw Error('Map assets must be served from the same origin.');
      const responses=await Promise.all(urls.map(u=>fetch(u,{signal:abort.signal,credentials:'same-origin'})));
      if(responses.some(r=>!r.ok))throw Error(`Map asset failed to load (${responses.map(r=>r.status).join(', ')}). Serve the folder over HTTP, with all supplied assets.`);
      const [json,pngBytes,meta]=await Promise.all([responses[0].json(),responses[1].arrayBuffer(),responses[2].json()]);if(disposed)return {ok:false,error:'Destroyed'};
      data=json;if(!Array.isArray(data.notes)||!Array.isArray(data.tombs)||!Array.isArray(data.dynasty_bands_bce))throw Error('The supplied tomb data is missing required fields.');
      const start=performance.now(),png=await decodePNG(pngBytes);metrics.decodeMs=performance.now()-start;if(disposed)return {ok:false,error:'Destroyed'};
      if(png.width!==meta.width||png.height!==meta.height)throw Error('Heightmap dimensions do not match metadata.');
      terrain=makeTerrain(png,meta);timeline=makeTimeline(data);
      try{
        renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setClearColor('#0b0a08',0);renderer.outputColorSpace=THREE.SRGBColorSpace;
        scene=new THREE.Scene();scene.fog=new THREE.Fog('#18150f',9000,22000);
        camera=new THREE.PerspectiveCamera(43,1,1,40000);
        scene.add(new THREE.AmbientLight('#e3d6ba',1.5));const sun=new THREE.DirectionalLight('#fff0ce',2.3);sun.position.set(-3000,6000,-3000);scene.add(sun);
        metrics.renderer='WebGL2';
      }catch(error){useFallback(error.message);}
      resize();status.textContent='Smoothing 30 m terrain…';await buildMesh(png);if(disposed)return {ok:false,error:'Destroyed'};
      buildMarkers();bindNavigation();preset('whole',false);updateAxis();updateTombs();resize();
      status.hidden=true;metrics.loadMs=performance.now()-began;requestRender();
      // Context loss switches to a usable 2D map, without re-fetching assets.
      on(canvas,'webglcontextlost',e=>{e.preventDefault();if(disposed||fallback)return;const saved={...orbit};useFallback('WebGL context lost');flat={x:saved.x,z:saved.z,span:saved.radius};bindNavigation();announce('WebGL context lost. Switched to the interactive 2D hillshade.');requestRender();});
      return {ok:true};
    }catch(error){if(disposed||error.name==='AbortError')return {ok:false,error:'Destroyed'};status.hidden=false;status.textContent=`Unable to load this map. ${error.message}`;announce(status.textContent);return {ok:false,error:error.message};}
  }
  function destroy() {
    if(disposed)return;disposed=true;abort.abort();suspend();listeners.splice(0).forEach(remove=>remove());resizeObserver?.disconnect();intersectionObserver?.disconnect();
    const geometries=new Set(),materials=new Set(),textures=new Set();scene?.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const mat of Array.isArray(object.material)?object.material:[object.material]){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}});
    textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer?.renderLists.dispose();renderer?.dispose();renderer?.forceContextLoss();
    root.remove();if(!hadClass)container.classList.remove('nk-vok');hillCanvas=null;grid=null;data=null;points=[];landmarks=[];screenPoints=[];scene=null;renderer=null;terrainMesh=null;geometry=null;material=null;pins=null;pinGeometry=null;pinMaterial=null;
  }
  destroy.getDiagnostics=()=>{
    const summary=values=>{const v=[...values].sort((a,b)=>a-b);return {samples:v.length,mean:v.length?v.reduce((a,b)=>a+b,0)/v.length:0,p50:v[Math.floor(v.length*.5)]||0,p95:v[Math.min(v.length-1,Math.floor(v.length*.95))]||0};};
    return {renderer:metrics.renderer,fallbackReason:metrics.fallbackReason,loadMs:metrics.loadMs,decodeMs:metrics.decodeMs,meshMs:metrics.meshMs,vertices:metrics.vertices,triangles:metrics.triangles,renderedFrames:metrics.frames,renderCpuMs:summary(metrics.renderCpuMs),animationFrameIntervalsMs:summary(metrics.frameIntervalsMs),drawCalls:renderer?.info.render.calls??0,devicePixelRatio:Math.min(devicePixelRatio||1,2),viewport:{width:w,height:h},disposed};
  };
  destroy.ready=load();return destroy;
}
