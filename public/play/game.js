/* Rise of Waset. No dependencies or runtime network requests.
 * The economy is deliberately compressed; the city combines several eras.
 * Simulation uses fixed 0.1-second steps; visual randomness never changes the seed.
 */
const SITE = 'https://neokemetai.online/';
const LINKS = {
  pyramid: SITE + 'monuments/great-pyramid/',
  village: SITE + 'monuments/giza-plateau/',
  temple: SITE + 'monuments/karnak-temple-complex/',
  school: SITE + 'artifacts/narmer-palette/',
  granary: SITE + 'dynasties/6/'
};
const SEASONS = ['Akhet', 'Peret', 'Shemu'];
const DESCRIPTIONS = ['Inundation · fields rest, monuments rise', 'Growing · the black earth awakens', 'Harvest · gather the gifts of the Nile'];
const FLOODS = ['Low', 'Good', 'High'];
const SEASON_LENGTH = 75;
const SAVE_KEY = 'neokemetai.waset.v1';
const STAGES = [45, 65, 85, 105];
const TYPES = {
  house: { name:'Mud-brick house', gold:16, stone:0, jobs:0, effect:'+4 population', fact:'Mud brick was a common building material for Egyptian homes. Sun-dried bricks were made from Nile mud, often mixed with plant material.', link:SITE },
  field: { name:'Field', gold:8, stone:0, jobs:1, effect:'135 grain per good harvest; fertile land', fact:'Egyptian farmers grew cereals including emmer wheat and barley. The annual Nile flood watered the land and deposited sediment.', link:SITE },
  granary: { name:'Granary', gold:20, stone:5, jobs:0, effect:'+220 storage; reduces spoilage in low floods', fact:'Stored grain helped communities bridge the gap between harvests. The end of the Old Kingdom involved political and economic change; environmental stress is one factor scholars discuss.', link:LINKS.granary },
  bakery: { name:'Bakery & brewery', gold:24, stone:0, jobs:1, effect:'0.12 grain/sec → +0.10 Ma’at/sec', fact:'Bread and beer were staples of ancient Egyptian diets. Grain was also distributed as rations to workers.', link:SITE },
  quarry: { name:'Quarry', gold:18, stone:0, jobs:2, effect:'+0.45 stone/sec; desert only', fact:'Egyptian builders obtained stone from quarries in different regions. The logbook of Merer records boats carrying Tura limestone to Giza.', link:LINKS.pyramid },
  harbour: { name:'River harbour', gold:35, stone:8, jobs:2, effect:'+0.75 gold and +0.18 stone/sec; riverbank', fact:'The Nile was a major transport route for heavy goods. Merer’s logbook records the movement of Tura limestone by boat to Giza.', link:LINKS.pyramid },
  school: { name:'Scribe school', gold:45, stone:12, jobs:1, effect:'Unlocks monuments and workers’ villages', fact:'Scribes kept accounts and recorded deliveries and labor. The Narmer Palette combines images and early hieroglyphic signs; it is a ceremonial object, not a school exercise.', link:LINKS.school },
  village: { name:'Workers’ village', gold:35, stone:15, jobs:0, tier:1, effect:'+6 population; enables the pyramid', fact:'Excavations at Giza have revealed a settlement associated with the pyramid-building workforce. Evidence includes food preparation and administrative activity.', link:LINKS.village },
  temple: { name:'Temple of Amun', gold:55, stone:40, jobs:2, tier:1, effect:'+12 Ma’at on completion; +0.10/sec', fact:'Karnak was a major religious center dedicated especially to Amun. Successive rulers enlarged and altered its temples over many generations.', link:LINKS.temple },
  obelisk: { name:'Obelisk', gold:30, stone:35, jobs:0, tier:1, effect:'+6 Ma’at; +150 score', fact:'Obelisks were tall stone monuments with a pyramid-shaped tip. Rulers erected them at temple complexes, including Karnak.', link:LINKS.temple },
  pyramid: { name:'Pyramid', gold:20, stone:45, jobs:4, tier:2, effect:'4 stages: 45 / 65 / 85 / 105 stone + 20 gold each', fact:'The Great Pyramid stands at Giza, not Waset. Merer’s logbook records boats carrying Tura limestone to Giza during Khufu’s reign.', link:LINKS.pyramid }
};
const ICONS = {
  house:'M3 11 16 4l13 7v17H3Z M12 28V17h8v11 M3 11h26',
  field:'M2 24 16 30 30 24 16 18Z M8 22V9m0 5-4-4m4 1 4-5 M16 25V6m0 8-4-4m4 0 4-5 M24 22V10m0 6 4-5',
  granary:'M4 28V14a6 6 0 0 1 12 0v14 M16 28V10a6 6 0 0 1 12 0v18 M2 28h28 M8 20h4m8-4h4',
  bakery:'M4 28V16a12 12 0 0 1 24 0v12Z M12 28v-9a4 4 0 0 1 8 0v9 M10 5V2m12 3V1',
  quarry:'M2 28 6 15h10l4 13Z M15 15l4-9h8l3 22H20 M6 15l6 5 8-1',
  harbour:'M2 21h28l-6 7H8Z M16 21V2L28 17H16 M4 31h24',
  school:'M4 5h10l2 3 2-3h10v23H18l-2 2-2-2H4Z M16 8v22 M8 11h4m8 0h4M8 16h4m8 0h4',
  village:'M2 17 9 12l7 5v12H2Z M16 12l7-5 7 5v17H16 M7 29v-7m16 7V17',
  temple:'M2 29V8h9v21 M21 29V8h9v21 M2 8l2-5h5l2 5 M21 8l2-5h5l2 5 M11 12h10 M14 29V16h4v13 M1 29h30',
  obelisk:'M11 29 13 7l3-5 3 5 2 22Z M13 7h6 M8 30h16',
  pyramid:'M2 28 16 4l14 24Z M16 4l4 24 M2 28h28',
  workers:'M12 10a4 4 0 1 0 8 0 4 4 0 0 0-8 0 M7 29v-8a9 9 0 0 1 18 0v8',
  gold:'M3 14 8 5h16l5 9-13 15Z M3 14h26M8 5l8 24L24 5',
  maat:'M8 29C27 17 29 3 25 2 13 0 8 15 8 29 M8 29 23 7 M10 21l10-1M13 16l10-1'
};
const icon = type => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[type] || ICONS.pyramid}"/></svg>`;
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const center = y => 10 + Math.floor(Math.sin(y * .45) * 1.1);
function terrain(x, y) {
  const d = Math.abs(x - center(y));
  return d < 1.2 ? 'water' : d < 3.4 ? 'fertile' : 'desert';
}
const bank = (x,y) => [[1,0],[-1,0],[0,1],[0,-1]].some(([a,b]) => terrain(x+a,y+b)==='water');
function seedOf(text) {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0 || 1;
}
function initial(name='Waset', daily=false) {
  const day = new Date().toISOString().slice(0,10); // UTC: identical daily seed worldwide.
  return { version:1, name, daily:daily ? day : '', seed:seedOf(daily ? day : String(Date.now())),
    grain:180, stone:35, gold:150, maat:76, year:1, season:0, time:0, elapsed:0,
    flood:1, forecast:1, levy:true, status:'playing', eventAt:100, strike:0,
    seen:[], popups:[], buildings:[
      {type:'house',x:6,y:7,progress:1,damage:0},
      {type:'field',x:8,y:6,progress:1,damage:0,crop:0},
      {type:'field',x:7,y:8,progress:1,damage:0,crop:0},
      {type:'granary',x:6,y:6,progress:1,damage:0}
    ] };
}

/** Mount an isolated game. Call the returned function before removing the host. */
export function mountGame(container) {
  if (!container || typeof container.appendChild !== 'function') throw new TypeError('A container element is required.');
  const root = document.createElement('section');
  root.className = 'nk-game';
  root.setAttribute('aria-label','Rise of Waset city-building game');
  root.innerHTML = `
    <header class="nk-top"><div><div class="nk-brand">NeoKemetAI / Interactive histories</div><h2 class="nk-title">Rise of Waset</h2><div class="nk-sub">Build an Egyptian City on the Nile</div></div>
      <div class="nk-tools"><button data-action="sound" aria-label="Turn sound on" aria-pressed="false">Sound off</button><button data-action="help" aria-label="Game instructions">?</button><button data-action="pause" aria-label="Pause game">Pause</button></div></header>
    <div class="nk-hud">${[['grain','field','Grain'],['workers','workers','Workers'],['stone','quarry','Stone'],['gold','gold','Gold'],['maat','maat','Ma’at']].map(([key,img,label])=>`<div class="nk-resource">${icon(img)}<div><small>${label}</small><strong data-resource="${key}">0</strong></div></div>`).join('')}</div>
    <div class="nk-layout"><div class="nk-world"><canvas class="nk-map" tabindex="0" aria-label="City map. Arrow keys select tiles; Enter builds or inspects. Plus and minus zoom; Shift and arrows pan."></canvas>
      <div class="nk-season"><div class="nk-eyebrow" data-year></div><h2 data-season></h2><p data-season-desc></p><div class="nk-timebar"><span></span></div></div>
      <div class="nk-maptools"><button data-action="out" aria-label="Zoom out">−</button><button data-action="home" aria-label="Center map">⌖</button><button data-action="in" aria-label="Zoom in">+</button></div>
      <div class="nk-selection" hidden><div><strong></strong><p></p></div><button data-action="place">Build here</button><button data-action="cancel" aria-label="Cancel selection">×</button></div>
      <div class="nk-caption">Drag to explore · scroll or pinch to zoom · select a building to begin</div></div>
      <aside class="nk-sidebar"><div class="nk-objective"><div class="nk-eyebrow">Your path to eternity</div><h3 data-objective></h3><p data-goal></p></div>
        <div class="nk-buildhead"><h3>Build your city</h3><span>11 buildings</span></div><div class="nk-builds" role="group" aria-label="Choose a building">${Object.entries(TYPES).map(([id,b])=>`<button class="nk-build" data-build="${id}" aria-pressed="false" aria-label="${b.name}: ${b.gold} gold, ${b.stone} stone, ${b.jobs} workers. ${b.effect}">${icon(id)}<b>${b.name}</b><small>${b.gold} gold${b.stone ? ' · '+b.stone+' stone' : ''}</small></button>`).join('')}</div>
        <div class="nk-nilometer"><div class="nk-eyebrow">Nilometer / next Akhet</div><strong data-flood></strong><div class="nk-gauge"><i></i><i></i><i></i></div><p data-flood-desc></p><button data-action="levy" aria-pressed="true">Flood labor: on</button></div></aside></div>
    <footer class="nk-footer"><span data-status>On the banks of the Nile, a city begins.</span><span>History, made playable.</span></footer>
    <div class="nk-toast" role="status" hidden></div><div class="nk-sr" aria-live="polite" data-live></div><div class="nk-overlay" hidden></div>`;
  container.appendChild(root);
  const $ = selector => root.querySelector(selector);
  const canvas = $('.nk-map'), ctx = canvas.getContext('2d');
  if (!ctx) { root.remove(); throw new Error('Canvas 2D is not supported.'); }
  const overlay = $('.nk-overlay'), world = $('.nk-world');
  const abort = new AbortController(), signal = abort.signal;
  const listen = (el,type,fn,options={}) => el.addEventListener(type,fn,{...options,signal});
  let state = initial(), started=false, paused=false, destroyed=false, visible=true;
  let selected=null, inspected=null, hover={x:6,y:9}, modal='', previousFocus=null;
  let width=800, height=600, dpr=1, zoom=1, panX=0, panY=0;
  let raf=0, last=0, accumulator=0, visualTime=0, hudTime=0, saveTime=0, toastTimer=0;
  let sound=false, audio=null, storageOK=true, saved=null, cardURL='';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointers = new Map();
  let gesture=null, dragged=false;
  // Reject malformed or incompatible saves before they reach the simulation.
  try {
    const raw=localStorage.getItem(SAVE_KEY);
    if (raw) {
      const v=JSON.parse(raw);
      const numbers=['grain','stone','gold','maat','year','season','time','elapsed','seed','flood','forecast','eventAt','strike'];
      const positions=new Set();
      if (v.version===1 && typeof v.name==='string' && v.name.length<=32 &&
          numbers.every(k=>Number.isFinite(v[k])&&v[k]>=0) && v.maat<=100 &&
          Number.isInteger(v.season)&&v.season<3 && v.time<75 && v.flood<3 && v.forecast<3 &&
          ['playing','won','lost'].includes(v.status) && Array.isArray(v.seen) &&
          v.seen.every(k=>k in TYPES) && Array.isArray(v.popups) &&
          v.popups.every(p=>p && (p.kind==='fact' ? p.key in TYPES : p.kind==='event' && ['royal','low','strike','punt','robbers'].includes(p.key))) &&
          Array.isArray(v.buildings) && v.buildings.length<=256 && v.buildings.every(b=>{
            const key=b.x+','+b.y;
            const ok=b.type in TYPES && Number.isInteger(b.x)&&Number.isInteger(b.y)&&b.x>=0&&b.x<16&&b.y>=0&&b.y<16 &&
              !positions.has(key)&&Number.isFinite(b.progress)&&b.progress>=0&&b.progress<=1 &&
              Number.isFinite(b.damage)&&b.damage>=0&&b.damage<=1 &&
              (b.type!=='field'||Number.isFinite(b.crop)&&b.crop>=0) &&
              (b.type!=='pyramid'||Number.isInteger(b.stage)&&b.stage>=0&&b.stage<=4&&Number.isFinite(b.work)&&b.work>=0&&b.work<=75);
            positions.add(key); return ok;
          })) saved=v;
    }
  } catch { storageOK=false; }
  function random() { state.seed=(Math.imul(1664525,state.seed)+1013904223)>>>0; return state.seed/4294967296; }
  const count = type => state.buildings.filter(b=>b.type===type&&b.progress===1&&!b.damage).length;
  const population = () => 8+count('house')*4+count('village')*6;
  const free = () => population()-state.buildings.reduce((n,b)=>n+TYPES[b.type].jobs,0);
  const capacity = () => 180+count('granary')*220;
  const pyramid = () => state.buildings.find(b=>b.type==='pyramid');
  function save() {
    if (!started) return;
    try { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); storageOK=true; }
    catch { storageOK=false; }
  }
  function toast(text) {
    $('.nk-toast').textContent=text; $('.nk-toast').hidden=false;
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>{$('.nk-toast').hidden=true;},3500);
  }
  function announce(text) { $('[data-live]').textContent=text; }
  function tone() {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      audio.resume().catch(()=>{});
      const o=audio.createOscillator(), g=audio.createGain();
      o.type='sine'; o.frequency.setValueAtTime(440,audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(660,audio.currentTime+.12);
      g.gain.setValueAtTime(.035,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.25);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime+.26);
    } catch { sound=false; }
  }
  function showDialog(kind,html) {
    if (!modal) previousFocus=document.activeElement;
    modal=kind; overlay.hidden=false;
    overlay.innerHTML=`<div class="nk-dialog" role="dialog" aria-modal="true" aria-label="${kind==='start'?'Found your city':kind==='end'?'Your city’s legacy':'City information'}">${html}</div>`;
    [...root.children].filter(el=>el!==overlay).forEach(el=>el.inert=true);
    overlay.querySelector('input,button,a')?.focus();
    syncLoop();
  }
  function closeDialog() {
    overlay.hidden=true; overlay.innerHTML=''; modal='';
    [...root.children].forEach(el=>el.inert=false);
    if (previousFocus?.isConnected && !previousFocus.disabled) previousFocus.focus(); else canvas.focus({preventScroll:true});
    nextPopup(); syncLoop();
  }
  function startScreen() {
    showDialog('start',`<div class="nk-emblem">${icon('pyramid')}</div><div class="nk-eyebrow">A city. A river. An enduring legacy.</div><h2>From black earth<br>to golden horizons.</h2>
      <p>Found a city on the Nile. Feed your people, follow the flood, and raise a pyramid that outlasts the ages.</p>
      <label for="nk-city-${uid}">Name your city</label><input id="nk-city-${uid}" type="text" maxlength="32" value="Waset" autocomplete="off">
      <label class="nk-check"><input type="checkbox" data-daily> Daily challenge · shared UTC seed</label>
      <div class="nk-actions"><button class="nk-primary" data-action="new">Found my city</button>${saved?'<button data-action="resume">Resume city</button>':''}</div>
      <p class="nk-note">5–10 minute sessions · mouse, touch & keyboard<br>A playful blend of Egyptian periods, not a reconstruction of historical Waset. Saves stay in this browser.</p>`);
  }
  const uid = Math.random().toString(36).slice(2,9);
  function begin(resume) {
    if (resume && saved) state=saved;
    else {
      state=initial(overlay.querySelector('input[type="text"]').value.trim()||'Waset',overlay.querySelector('[data-daily]').checked);
      state.forecast=Math.floor(random()*3);
      // The founding settlement predates the player; newly built types unlock cards.
      state.seen=[];
    }
    started=true; paused=false; selected=null; inspected=null;
    closeDialog(); save(); updateHUD(); draw(); syncLoop();
  }
  function fact(type) {
    if (state.seen.includes(type)) return;
    state.seen.push(type); state.popups.push({kind:'fact',key:type});
  }
  function nextPopup() {
    if (modal || !started) return;
    const p=state.popups[0];
    if (p?.kind==='fact') {
      const b=TYPES[p.key];
      showDialog('fact',`<div class="nk-eyebrow">Did you know? / ${b.name}</div><h2>Written in history.</h2><p>${b.fact}</p><p><a href="${b.link}" target="_blank" rel="noopener noreferrer">Read more on NeoKemetAI ↗</a></p><div class="nk-actions"><button class="nk-primary" data-action="dismiss">Continue building</button></div>`);
    } else if (p) showEvent(p.key);
    else if (state.status!=='playing') endScreen();
  }
  const EVENTS = {
    royal:{title:'A royal visit',text:'The court approaches. A public feast could win favor, but your people need their grain.',choices:[['Offer a feast · −30 grain, +10 Ma’at',{grain:-30,maat:10}],['Offer a modest welcome · +5 gold, −3 Ma’at',{gold:5,maat:-3}]]},
    low:{title:'The river runs low',text:'A weak inundation means a smaller harvest. Low Nile floods could strain food supplies; the end of the Old Kingdom had multiple causes.',link:LINKS.granary,choices:[['Buy reserves · −20 gold, +70 grain',{gold:-20,grain:70}],['Ration carefully · +15 grain, −8 Ma’at',{grain:15,maat:-8}]]},
    strike:{title:'The workers lay down their tools',text:'At Deir el-Medina, royal tomb workers stopped work over delayed rations. This event draws on that later, New Kingdom record.',choices:[['Deliver rations · −25 grain, +8 Ma’at',{grain:-25,maat:8}],['Delay payment · work stops 25 sec, −10 Ma’at',{strike:25,maat:-10}]]},
    punt:{title:'An expedition to Punt',text:'Egyptian expeditions obtained valuable goods from Punt. In this game, an organized voyage can enrich your city.',choices:[['Equip the voyage · −20 grain, +35 gold',{grain:-20,gold:35}],['Keep the stores · no change',{}]]},
    robbers:{title:'Tomb robbers in the hills',text:'Ancient records describe investigations into tomb robbery. Your watchmen request resources to protect the necropolis.',choices:[['Support the watch · −15 gold, +5 Ma’at',{gold:-15,maat:5}],['Accept the losses · −15 stone, −5 Ma’at',{stone:-15,maat:-5}]]}
  };
  function showEvent(key) {
    const e=EVENTS[key];
    showDialog('event',`<div class="nk-eyebrow">A matter for the city governor</div><h2>${e.title}</h2><p>${e.text}</p>${e.link?`<a href="${e.link}" target="_blank" rel="noopener noreferrer">Read more on NeoKemetAI ↗</a>`:''}${e.choices.map(([label,cost],i)=>`<button class="nk-choice" data-choice="${i}" ${Object.entries(cost).some(([k,v])=>v<0&&k!=='maat'&&state[k]<-v)?'disabled':''}>${label}</button>`).join('')}<button data-action="defer">Defer · −3 Ma’at</button>`);
  }
  function resolveEvent(index) {
    const e=EVENTS[state.popups[0].key];
    const effect=index===-1?{maat:-3}:e.choices[index][1];
    if (Object.entries(effect).some(([k,v])=>v<0&&k!=='maat'&&state[k]<-v)) return;
    for (const [k,v] of Object.entries(effect)) state[k]+=v;
    state.maat=clamp(state.maat,0,100); state.grain=Math.min(state.grain,capacity());
    if (state.maat===0) state.status='lost';
    state.popups.shift(); save(); closeDialog(); updateHUD();
  }
  function locked(type) {
    if (TYPES[type].tier && !count('school')) return 'Complete a scribe school first.';
    if (type==='pyramid'&&!count('village')) return 'Complete a workers’ village first.';
    if (type==='pyramid'&&pyramid()) return 'Your pyramid already has a site.';
    return '';
  }
  function reason(type,x,y) {
    const b=TYPES[type];
    if (x<0||y<0||x>=16||y>=16) return 'Choose a tile inside the city.';
    if (state.buildings.some(b=>b.x===x&&b.y===y)) return 'This tile is occupied.';
    if (terrain(x,y)==='water') return 'Build on land.';
    if (type==='field'&&terrain(x,y)!=='fertile') return 'Fields need fertile black earth.';
    if (['quarry','pyramid'].includes(type)&&terrain(x,y)!=='desert') return 'Choose dry desert ground.';
    if (type==='harbour'&&!bank(x,y)) return 'Harbours need a tile beside the Nile.';
    if (locked(type)) return locked(type);
    if (state.gold<b.gold||state.stone<b.stone) return 'Gather more gold or stone.';
    if (free()<b.jobs) return 'Build a house for more workers.';
    return '';
  }
  function build() {
    if (!started||paused||modal||!selected||state.status!=='playing') return;
    const error=reason(selected,hover.x,hover.y);
    if (error) { toast(error); return; }
    const type=selected, spec=TYPES[type];
    state.gold-=spec.gold; state.stone-=spec.stone;
    state.buildings.push({type,x:hover.x,y:hover.y,progress:0,damage:0,...(type==='field'?{crop:0}:{}),...(type==='pyramid'?{stage:0,work:0,active:true}:{})});
    tone(); toast(spec.name+' commissioned.'); save(); updateHUD(); draw();
  }
  function objective() {
    const p=pyramid();
    if (count('quarry')<2) return ['Set the first stones','Build 2 quarries on desert tiles. Each needs 2 workers.'];
    if (!count('harbour')) return ['Open the river routes','Build a harbour beside the Nile for gold and stone.'];
    if (!count('school')) return ['Knowledge opens doors','Complete a scribe school to unlock the next tier.'];
    if (!count('village')) return ['A home for the builders','Build a workers’ village, then place your pyramid on the desert.'];
    if (!p) return ['Lay the foundation','Choose Pyramid. Each of its four stages needs stone and 20 gold.'];
    if (!p.active&&p.stage<4) return ['Raise the next course',`Select your pyramid and fund stage ${p.stage+1}: ${STAGES[p.stage]} stone + 20 gold.`];
    return ['A monument for the ages',`Stage ${Math.min(4,p.stage+1)} of 4 · ${Math.floor(p.work/75*100)}% · flood labor accelerates work.`];
  }
  function updateHUD() {
    for (const key of ['grain','stone','gold','maat']) $('[data-resource="'+key+'"]').textContent=Math.floor(state[key])+(key==='maat'?'%':'');
    $('[data-resource="workers"]').textContent=population()+' / '+Math.max(0,free());
    $('[data-resource="workers"]').parentElement.title='Population / unassigned workers';
    $('[data-resource="grain"]').parentElement.title=`Storage capacity: ${capacity()}. Consumption: ${(population()*.018+count('bakery')*.12).toFixed(2)}/sec.`;
    $('[data-year]').textContent=`${state.name} · Year ${state.year}${state.daily?' · Daily '+state.daily:''}`;
    $('[data-season]').textContent=SEASONS[state.season];
    $('[data-season-desc]').textContent=DESCRIPTIONS[state.season];
    $('.nk-timebar span').style.width=(1-state.time/75)*100+'%';
    $('[data-flood]').textContent=FLOODS[state.forecast]+' flood predicted';
    $('[data-flood-desc]').textContent=['Store grain for a lean harvest.','A favorable flood for the fields.','Floodplain buildings risk damage.'][state.forecast];
    root.querySelectorAll('.nk-gauge i').forEach((el,i)=>el.classList.toggle('nk-lit',i<=state.forecast));
    const [title,goal]=objective(); $('[data-objective]').textContent=title; $('[data-goal]').textContent=goal;
    $('[data-status]').textContent=state.strike>0?`Workers on strike · ${Math.ceil(state.strike)}s remaining`:(storageOK?'Autosave active':'Storage unavailable · session only')+' · '+Math.floor(state.grain)+' / '+capacity()+' grain';
    root.querySelectorAll('[data-build]').forEach(el=>{
      const type=el.dataset.build;
      el.setAttribute('aria-pressed',String(type===selected));
      el.title=locked(type)||TYPES[type].effect;
      // Locked buildings remain focusable: selecting one explains its prerequisite.
      el.setAttribute('aria-disabled',String(Boolean(locked(type))));
      el.style.opacity=locked(type)?'.5':'1';
    });
    const panel=$('.nk-selection'); panel.hidden=!selected&&!inspected;
    if (selected) {
      panel.querySelector('strong').textContent=TYPES[selected].name+' · '+(hover.x+1)+', '+(hover.y+1);
      panel.querySelector('p').textContent=reason(selected,hover.x,hover.y)||TYPES[selected].effect;
      $('[data-action="place"]').textContent='Build here'; $('[data-action="place"]').disabled=!!reason(selected,hover.x,hover.y);
    } else if (inspected) {
      panel.querySelector('strong').textContent=TYPES[inspected.type].name;
      const p=inspected;
      panel.querySelector('p').textContent=p.damage?'Flood damage · repair for 8 gold':p.type==='pyramid'?`Stage ${p.stage}/4 · ${p.active?'construction underway':STAGES[p.stage]+' stone + 20 gold for next stage'}`:TYPES[p.type].effect;
      const action=$('[data-action="place"]');
      action.textContent=p.damage?'Repair':p.type==='pyramid'?'Next stage':'Read fact';
      action.disabled=p.damage?state.gold<8:p.type==='pyramid'?p.active||p.stage===4||state.stone<STAGES[p.stage]||state.gold<20:false;
    }
    $('[data-action="pause"]').textContent=paused?'Resume':'Pause';
    $('[data-action="pause"]').setAttribute('aria-label',paused?'Resume game':'Pause game');
    $('[data-action="levy"]').textContent='Flood labor: '+(state.levy?'on':'off');
    $('[data-action="levy"]').setAttribute('aria-pressed',String(state.levy));
  }
  function nextSeason() {
    state.time-=75; state.season=(state.season+1)%3;
    if (state.season===0) {
      state.year++; state.flood=state.forecast; state.forecast=Math.floor(random()*3);
      if (state.flood===0) {
        state.grain*=count('granary')? .98:.75;
        state.popups.push({kind:'event',key:'low'});
      }
      if (state.flood===2) for (const b of state.buildings) {
        if (b.type!=='field'&&b.type!=='harbour'&&terrain(b.x,b.y)==='fertile'&&random()<.4) b.damage=1;
      }
      for (const b of state.buildings) if (b.type==='field') b.crop=0;
    }
    announce(`Year ${state.year}. ${SEASONS[state.season]}. ${DESCRIPTIONS[state.season]}.`);
    toast(SEASONS[state.season]+' · '+(state.season===0?FLOODS[state.flood]+' flood':DESCRIPTIONS[state.season].split(' · ')[1]));
    save();
  }
  // One fixed simulation step. All economic random draws come from saved state.
  function step(dt) {
    state.time+=dt; state.elapsed+=dt; state.strike=Math.max(0,state.strike-dt);
    const working=state.strike===0;
    state.gold+=dt*(.35+(working?count('harbour')*.75:0));
    if (working) state.stone+=dt*(count('quarry')*.45+count('harbour')*.18);
    state.grain=Math.max(0,state.grain-dt*(population()*.018+count('bakery')*.12));
    state.maat=clamp(state.maat+dt*(state.grain===0?-.65:-.035+count('bakery')*.10+count('temple')*.10),0,100);
    for (const b of state.buildings) {
      if (b.damage||!working) continue;
      if (b.progress<1) {
        b.progress=Math.min(1,b.progress+dt/5);
        if (b.progress===1 && b.type!=='pyramid') {
          if (b.type==='temple') state.maat=clamp(state.maat+12,0,100);
          if (b.type==='obelisk') state.maat=clamp(state.maat+6,0,100);
          fact(b.type); tone();
        }
      }
      if (b.progress<1) continue;
      if (b.type==='field') {
        if (state.season===1) b.crop+=dt*1.8*[.4,1,1.15][state.flood];
        if (state.season===2) { const harvest=Math.min(b.crop,dt*3); b.crop-=harvest; state.grain=Math.min(capacity(),state.grain+harvest); }
      }
      if (b.type==='pyramid'&&b.active) {
        const bonus=state.season===0&&state.levy?Math.min(.8,count('field')*.2):0;
        b.work=Math.min(75,b.work+dt*(1+bonus));
        if (b.work>=75) {
          b.stage++; b.active=false; b.work=0; tone();
          toast('Pyramid stage '+b.stage+' completed.');
          if (b.stage===4) { fact('pyramid'); state.status='won'; }
        }
      }
    }
    if (state.maat===0) state.status='lost';
    if (state.time>=75) nextSeason();
    if (state.elapsed>=state.eventAt && state.status==='playing') {
      state.eventAt=state.elapsed+90+random()*40;
      const keys=['royal','strike','punt','robbers'];
      state.popups.push({kind:'event',key:keys[Math.floor(random()*keys.length)]});
    }
    nextPopup();
  }

  // Canvas drawing: one shallow tile stack; tiny reusable primitives, no assets.
  const project=(x,y,z=0)=>({x:(x-y)*28,y:(x+y)*14-z});
  function poly(points,fill,stroke) {
    ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); if (stroke) {ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}
  }
  function box(x,y,w,d,h,color='#bba177',top='#d8c49b',side='#8c7450') {
    poly([[x-w,y],[x,y+d],[x,y+d-h],[x-w,y-h]],color);
    poly([[x,y+d],[x+w,y],[x+w,y-h],[x,y+d-h]],side);
    poly([[x-w,y-h],[x,y-d-h],[x+w,y-h],[x,y+d-h]],top);
  }
  function line(x1,y1,x2,y2,color,width=1) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function palm(x,y,size=1) {
    line(x,y,x+3*size,y-26*size,'#6d5631',3*size);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;line(x+3*size,y-26*size,x+3*size+Math.cos(a)*17*size,y-26*size+Math.sin(a)*8*size,'#587344',3*size);}
  }
  function building(b,x,y,t,ghost=false) {
    ctx.save(); ctx.translate(x,y);
    if (!ghost && b.progress<1) {
      box(0,0,19,10,2,'#ad9972','#c9b68e');
      for(const k of [-17,0,17]) line(k,8,k,-25,'#c3a577',1.4);
      line(-19,-13,19,-13,'#b39260',1.3);line(-19,-24,19,-24,'#b39260',1.3);line(-17,5,17,-24,'#b39260');
      ctx.globalAlpha=.25+b.progress*.75; ctx.scale(1,Math.max(.1,b.progress));
    }
    const roof=b.type==='house'?'#d1b582':'#d8cba8';
    switch(b.type) {
      case 'house': case 'village':
        box(-5,0,17,9,17,'#bda06e',roof,'#8b724b');
        box(-5,-17,17,9,3,'#d4bd91','#e0cda4','#b69a6d');
        poly([[-9,8],[-3,11],[-3,0],[-9,-3]],'#4b4030');
        line(2,-11,8,-14,'#786039',3);
        if(b.type==='village')box(13,7,11,6,12,'#bda06e','#dac396','#8b724b');
        break;
      case 'field':
        poly([[-24,0],[0,-12],[24,0],[0,12]],'#4c5031');
        for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++){
          const p=project(a*.15,c*.15);const growth=state.season===0?2:state.season===1?3+state.time/75*8:5+b.crop/135*6;
          line(p.x,p.y,p.x,p.y-growth,state.season===2?'#c5a754':'#8c9e57',1.8);
          if(state.season!==0)line(p.x,p.y-growth/2,p.x+3,p.y-growth/2-3,'#a7aa63');
        }
        if(state.season===0)poly([[-25,0],[0,-12],[25,0],[0,12]],'#357b8066');
        break;
      case 'granary':
        for(const [a,c] of [[-9,0],[8,5]]){
          ctx.fillStyle='#bb9d69';ctx.fillRect(a-8,c-22,16,24);ctx.beginPath();ctx.ellipse(a,c-22,8,5,0,0,Math.PI*2);ctx.fillStyle='#ddc391';ctx.fill();
          ctx.fillStyle='#665537';ctx.fillRect(a-2,c-24,4,3);line(a-6,c-12,a-6,c+1,'#d1b683',1);
        }break;
      case 'bakery':
        box(0,0,19,10,15,'#b28c58','#d4af78','#856137');
        ctx.fillStyle='#493625';ctx.beginPath();ctx.arc(-7,0,5,Math.PI,0);ctx.fill();ctx.fillRect(-12,0,10,7);
        box(8,-15,4,3,10,'#b3986e','#dac396','#8b724b');
        if(!motion.matches)for(let i=0;i<3;i++){
          const k=(t*.5+i*.33)%1;ctx.fillStyle=`rgba(211,198,166,${(1-k)*.24})`;ctx.beginPath();ctx.arc(8+Math.sin(t+i)*4,-30-k*24,3+k*6,0,7);ctx.fill();
        }break;
      case 'quarry':
        box(0,0,22,11,5,'#82745c','#afa28a','#5c5342');
        for(const [a,c,h] of [[-10,-3,10],[6,-5,17],[10,6,7]])box(a,c,8,5,h,'#b5aa90','#d1c5a8','#8a7e65');
        line(-17,9,15,-8,'#584630',2);break;
      case 'harbour':
        box(0,2,22,12,4,'#755738','#aa8657','#614a32');
        for(let i=-3;i<4;i++)line(i*5-10,i*2+2,i*5+5,i*2-6,'#5b472d');
        box(-6,-4,10,6,17,'#ba9f76','#cfb68c','#8d734f');
        line(16,5,16,-18,'#e1cf9d',2);break;
      case 'school':
        box(0,0,21,11,20,'#c5ac7d','#e0cda4','#927a52');
        box(0,-21,15,7,3,'#c8952b','#e2b453','#916923');
        for(let i=-1;i<=1;i++)line(-12+i*6,-5+i*3,-12+i*6,-13+i*3,'#274e69',3);break;
      case 'temple':
        box(0,-6,22,11,9,'#b7a17b','#d8cba8','#927b54');
        for(const a of [-14,14]){box(a,6,8,5,31,'#c2ae84','#e4d7b8','#95805c');line(a-4,-16,a+1,-13,'#8a6d3e');}
        box(0,3,7,4,19,'#254d67','#c8952b','#17334a');
        for(const a of [-22,22]){line(a,2,a,-40,'#bc9c55');poly([[a,-40],[a+9,-35],[a,-28]],'#a83a2c');}break;
      case 'obelisk':
        box(0,0,12,6,4,'#b9aa89','#ded1b1','#8e7d5e');
        poly([[-4,-3],[-3,-45],[0,-53],[0,0]],'#e4d7b8');poly([[0,0],[0,-53],[3,-45],[4,-3]],'#a99773');
        line(-2,-38,-2,-10,'#9a814d');break;
      case 'pyramid': {
        const stage=ghost?4:b.stage;
        box(0,1,26,13,3,'#b5a17a','#d5c49d','#8f7b56');
        for(let i=0;i<Math.min(stage,3);i++)box(0,-i*12,24-i*6,12-i*3,12,'#cbb991','#e7d7b2','#a48c63');
        if(stage===4){
          poly([[-26,0],[0,-55],[0,13]],'#e4d7b5');poly([[0,-55],[26,0],[0,13]],'#b7a079');
          poly([[-5,-44],[0,-55],[5,-44],[0,-41]],'#e2b453');
          for(let i=1;i<7;i++){const k=i/7;line(-26*k,-55+55*k,0,-55+68*k,'#cbb993',.6);line(0,-55+68*k,26*k,-55+55*k,'#9c875f',.6);}
        }else if(b.active){
          const top=-stage*12;line(-22,0,-22,top-20,'#9f7f4d');line(22,0,22,top-20,'#9f7f4d');line(-22,top-18,22,top-18,'#c6a36e');
          box(0,top-3,Math.max(5,22-stage*6),Math.max(3,11-stage*3),4,'#cbb991','#e7d7b2','#a48c63');
        }break;
      }
    }
    if(b.damage){line(-16,-23,16,7,'#a83a2c',3);line(16,-23,-16,7,'#a83a2c',3);}
    ctx.restore();
  }
  function draw() {
    if(destroyed)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const scale=Math.min(width/900,height/580)*zoom;
    ctx.save();ctx.translate(width*.5+panX,height*.50-210*scale+panY);ctx.scale(scale,scale);
    const t=motion.matches?0:visualTime;
    // Tile surfaces are drawn before all upright objects for correct overlap.
    for(let sum=0;sum<31;sum++)for(let x=0;x<16;x++){
      const y=sum-x;if(y<0||y>15)continue;
      const p=project(x,y), land=terrain(x,y), noise=((x*17+y*13)%9)/9;
      if(x===15||y===15)box(p.x,p.y,28,14,0,'#86734e');
      const color=land==='water'?`hsl(183,${30+noise*10}%,${24+noise*3}%)`:land==='fertile'?`hsl(68,22%,${27+noise*6}%)`:`hsl(37,30%,${48+noise*8}%)`;
      poly([[p.x-28,p.y],[p.x,p.y-14],[p.x+28,p.y],[p.x,p.y+14]],color,land==='water'?'#52888822':'#51483244');
      if(land==='water'){
        const q=Math.sin(t*.8+x+y)*3;
        line(p.x-12+q,p.y-2,p.x+6+q,p.y-2,'#8bb7ac44');
        line(p.x+2-q,p.y+5,p.x+13-q,p.y+5,'#8bb7ac33');
      }else if(state.season===0&&land==='fertile'&&bank(x,y)){
        poly([[p.x-28,p.y],[p.x,p.y-14],[p.x+28,p.y],[p.x,p.y+14]],`rgba(48,123,129,${.22+.08*state.flood+.03*Math.sin(t)})`);
      }else if(land==='desert'&&(x*7+y*11)%13===0){line(p.x-8,p.y,p.x+4,p.y-3,'#e2cd9c55');}
    }
    // Riverboats stay on the curved river centerline.
    for(let i=0;i<3;i++){
      const y=(t*.18+i*5)%15,x=center(y),p=project(x,y);
      poly([[p.x-17,p.y],[p.x+12,p.y-4],[p.x+17,p.y],[p.x,p.y+7]],'#513e29');
      line(p.x,p.y+1,p.x,p.y-29,'#decba4',1.4);
      poly([[p.x-1,p.y-28],[p.x-1,p.y-7],[p.x-17,p.y-10]],'#e0d4b2');
    }
    const objects=[];
    for(const b of state.buildings)objects.push({x:b.x,y:b.y,b});
    for(let y=1;y<16;y+=3)for(const x of [center(y)-3,center(y)+3]){
      if(x>=0&&x<16&&!state.buildings.some(b=>b.x===x&&b.y===y))objects.push({x,y,palm:true});
    }
    objects.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
    for(const o of objects){const p=project(o.x,o.y);if(o.palm)palm(p.x+8,p.y-3,.8);else building(o.b,p.x,p.y,t);}
    if(!motion.matches&&state.buildings.length>1)for(let i=0;i<7;i++){
      const a=state.buildings[i%state.buildings.length],b=state.buildings[(i+1)%state.buildings.length];
      if(terrain(a.x,a.y)==='water'||terrain(b.x,b.y)==='water')continue;
      const k=(t*.045+i*.14)%1,p=project(a.x+(b.x-a.x)*k,a.y+(b.y-a.y)*k);
      ctx.fillStyle='#dec79e';ctx.beginPath();ctx.arc(p.x+12,p.y-3,1.8,0,7);ctx.fill();
      line(p.x+12,p.y-1,p.x+12,p.y+4,'#f0dfba',2);line(p.x+11,p.y+4,p.x+10+Math.sin(t*6+i),p.y+7,'#594731');
    }
    if(selected||document.activeElement===canvas){
      const p=project(hover.x,hover.y);const valid=!selected||!reason(selected,hover.x,hover.y);
      poly([[p.x-28,p.y],[p.x,p.y-14],[p.x+28,p.y],[p.x,p.y+14]],valid?'#58c5a444':'#d55b4e66',valid?'#8ae0b9':'#ff9580');
      if(selected){ctx.globalAlpha=.55;building({type:selected,progress:1,damage:0,crop:60,stage:4},p.x,p.y,t,true);ctx.globalAlpha=1;}
    }
    ctx.restore();
    // Modest day/night tint preserves visibility; disabled with reduced motion.
    if(!motion.matches){ctx.fillStyle=`rgba(12,24,53,${.11*(1+Math.sin(visualTime/35))})`;ctx.fillRect(0,0,width,height);}
    if(paused){ctx.fillStyle='#0b0a0877';ctx.fillRect(0,0,width,height);ctx.textAlign='center';ctx.fillStyle='#e9e0c9';ctx.font='24px Georgia';ctx.fillText('City paused',width/2,height/2);}
  }
  function resize() {
    const rect=world.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw();
  }
  function tileAt(clientX,clientY) {
    const rect=canvas.getBoundingClientRect(),s=Math.min(width/900,height/580)*zoom;
    const a=(clientX-rect.left-width*.5-panX)/s,b=(clientY-rect.top-height*.50+210*s-panY)/s;
    return {x:Math.round((a/28+b/14)/2),y:Math.round((b/14-a/28)/2)};
  }
  function setHover(x,y) {hover={x:clamp(x,0,15),y:clamp(y,0,15)};updateHUD();draw();}
  function zoomAt(factor,x=width/2,y=height/2) {
    const old=zoom;zoom=clamp(zoom*factor,.65,2.5);const ratio=zoom/old;
    panX=x-width/2-(x-width/2-panX)*ratio;
    panY=y-height*.50-(y-height*.50-panY)*ratio;boundPan();draw();
  }
  function boundPan(){panX=clamp(panX,-width*.8,width*.8);panY=clamp(panY,-height*.7,height*.7);}
  listen(canvas,'pointerdown',e=>{
    if(modal)return; canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    dragged=false;gesture={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};
    if(pointers.size===2){const [a,b]=[...pointers.values()];gesture.distance=Math.hypot(a.x-b.x,a.y-b.y);dragged=true;}
  });
  listen(canvas,'pointermove',e=>{
    if(!pointers.has(e.pointerId)) {const p=tileAt(e.clientX,e.clientY);setHover(p.x,p.y);return;}
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y),rect=canvas.getBoundingClientRect();
      if(gesture.distance)zoomAt(dist/gesture.distance,(a.x+b.x)/2-rect.left,(a.y+b.y)/2-rect.top);
      gesture.distance=dist;dragged=true;
    }else if(gesture){
      if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>6)dragged=true;
      if(dragged){panX+=e.clientX-gesture.x;panY+=e.clientY-gesture.y;boundPan();draw();}
      gesture.x=e.clientX;gesture.y=e.clientY;
    }
  });
  function endPointer(e,cancel=false){
    const wasDrag=dragged;pointers.delete(e.pointerId);
    if(pointers.size){const a=[...pointers.values()][0];gesture={...a,startX:a.x,startY:a.y};dragged=true;}
    else gesture=null;
    if(cancel||wasDrag)return;
    const p=tileAt(e.clientX,e.clientY);
    if(p.x<0||p.x>15||p.y<0||p.y>15)return;
    setHover(p.x,p.y);
    if(selected)build();else{inspected=state.buildings.find(b=>b.x===p.x&&b.y===p.y)||null;updateHUD();}
  }
  listen(canvas,'pointerup',e=>endPointer(e));listen(canvas,'pointercancel',e=>endPointer(e,true));
  listen(canvas,'wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.001),e.clientX-r.left,e.clientY-r.top);},{passive:false});

  function inspectAction(){
    if(!inspected||paused||state.status!=='playing')return;
    if(inspected.damage){if(state.gold>=8){state.gold-=8;inspected.damage=0;tone();}}
    else if(inspected.type==='pyramid'){
      const p=inspected;if(!p.active&&p.stage<4&&state.stone>=STAGES[p.stage]&&state.gold>=20){state.stone-=STAGES[p.stage];state.gold-=20;p.active=true;tone();}
    }else{state.popups.unshift({kind:'fact',key:inspected.type});nextPopup();}
    save();updateHUD();draw();
  }
  function help(){showDialog('help',`<div class="nk-eyebrow">The governor’s guide</div><h2>Follow the river.</h2><p><b>First:</b> build quarries on sand and a harbour beside the Nile. Add houses when workers run short, and fields on green land to feed them.</p><p><b>Then:</b> a scribe school unlocks a workers’ village and monuments. Build the village, place a pyramid, and select it to fund each new stage. A bakery and temple keep Ma’at high.</p><p>Akhet floods the fields. Peret grows the crop; Shemu brings it into storage. Each season lasts 75 seconds. Low floods cut yields; high floods can damage buildings on fertile land. Select damaged buildings to repair them for 8 gold.</p><p>Workers shows <b>population / unassigned</b>. Flood labor sends resting farmers to your pyramid. Keep grain above zero and Ma’at above zero.</p><p>Drag to pan; pinch or scroll to zoom. Tab to a build button and press Enter. On the map, arrows choose a tile and Enter builds or inspects; Shift + arrows pans. Escape cancels a selection. Space pauses when the map has focus.</p><p class="nk-note">History is compressed across periods. Each pyramid stage takes 75 seconds before labor bonuses. Events and fact cards pause time. Daily challenges use the UTC date and saved seeded randomness; choices can change later outcomes.</p><div class="nk-actions"><button class="nk-primary" data-action="close">Return to city</button></div>`);}
  listen(root,'click',e=>{
    const choice=e.target.closest('[data-choice]');if(choice&&!choice.disabled){resolveEvent(Number(choice.dataset.choice));return;}
    const button=e.target.closest('button');if(!button||button.disabled)return;
    const type=button.dataset.build;
    if(type){const why=locked(type);if(why){toast(why);return;}selected=type;inspected=null;updateHUD();draw();announce(TYPES[type].name+' selected. '+TYPES[type].effect);canvas.focus({preventScroll:true});
      // On narrow screens the build list sits below the map: bring the map back into view.
      if(matchMedia('(max-width:700px)').matches)world.scrollIntoView({block:'center',behavior:motion.matches?'auto':'smooth'});
      return;}
    switch(button.dataset.action){
      case 'new':begin(false);break;
      case 'resume':begin(true);break;
      case 'dismiss':state.popups.shift();save();closeDialog();break;
      case 'defer':resolveEvent(-1);break;
      case 'close':closeDialog();break;
      case 'help':help();break;
      case 'pause':paused=!paused;updateHUD();draw();syncLoop();break;
      case 'sound':sound=!sound;button.textContent=sound?'Sound on':'Sound off';button.setAttribute('aria-pressed',String(sound));button.setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');tone();break;
      case 'in':zoomAt(1.2);break;
      case 'out':zoomAt(1/1.2);break;
      case 'home':zoom=1;panX=panY=0;draw();break;
      case 'levy':state.levy=!state.levy;save();updateHUD();break;
      case 'cancel':selected=null;inspected=null;updateHUD();draw();break;
      case 'place':selected?build():inspectAction();break;
      case 'again':saved=null;started=false;selected=null;inspected=null;paused=false;startScreen();draw();break;
      case 'download':{const a=document.createElement('a');a.download='rise-of-waset-city.png';a.href=cardURL;a.click();break;}
      case 'share':share();break;
    }
  });
  listen(root,'keydown',e=>{
    if(modal){
      if(e.key==='Tab'){
        const els=[...overlay.querySelectorAll('button:not(:disabled),input,a[href]')];const first=els[0],end=els.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}
      }
      if(e.key==='Escape'&&['help','fact'].includes(modal)){e.preventDefault();if(modal==='fact'){state.popups.shift();save();}closeDialog();}
      return;
    }
    if(e.key==='Escape'){selected=null;inspected=null;updateHUD();draw();return;}
    if(e.target!==canvas)return;
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(directions[e.key]){e.preventDefault();const [x,y]=directions[e.key];if(e.shiftKey){panX-=x*25;panY-=y*25;boundPan();draw();}else{setHover(hover.x+x,hover.y+y);announce(`Tile ${hover.x+1}, ${hover.y+1}, ${terrain(hover.x,hover.y)}. ${selected?reason(selected,hover.x,hover.y)||'Can build here.':''}`);}}
    if(e.key==='Enter'){e.preventDefault();if(selected)build();else{inspected=state.buildings.find(b=>b.x===hover.x&&b.y===hover.y)||null;updateHUD();if(inspected)announce(TYPES[inspected.type].name+' selected. Tab to its action button.');}}
    if(e.key===' '){e.preventDefault();paused=!paused;updateHUD();draw();syncLoop();}
    if(e.key==='+'||e.key==='=')zoomAt(1.2);if(e.key==='-')zoomAt(1/1.2);
  });
  function score(){return Math.max(0,Math.round(2600-state.elapsed*2+population()*20+state.maat*10+count('obelisk')*150+count('temple')*200+(state.status==='won'?1500:0)));}
  function makeCard(){
    const card=document.createElement('canvas');card.width=1000;card.height=700;const c=card.getContext('2d');
    c.fillStyle='#0b0a08';c.fillRect(0,0,1000,700);c.strokeStyle='#c8952b';c.strokeRect(24,24,952,652);
    c.fillStyle='#c8952b';c.font='14px sans-serif';c.fillText('NEOKEMETAI / RISE OF WASET',55,65);
    c.fillStyle='#e9e0c9';c.font='40px Georgia';c.fillText(state.name,55,120,870);
    c.font='15px sans-serif';c.fillStyle='#a89c80';c.fillText(`${state.status==='won'?'A legacy in limestone':'A city remembered'} · Year ${state.year} · Score ${score()}`,55,156);
    // Render a centered city regardless of the player's current camera position.
    const old=[zoom,panX,panY];zoom=1;panX=panY=0;draw();
    c.fillStyle='#29271c';c.fillRect(55,185,890,420);
    const ratio=Math.min(890/canvas.width,420/canvas.height);const w=canvas.width*ratio,h=canvas.height*ratio;
    c.drawImage(canvas,55+(890-w)/2,185+(420-h)/2,w,h);[zoom,panX,panY]=old;draw();
    c.fillStyle='#e9e0c9';c.font='16px sans-serif';c.fillText(`${population()} people   /   ${Math.floor(state.maat)}% Ma’at   /   ${state.year} years   /   ${pyramid()?.stage||0} pyramid stages`,55,640);
    c.fillStyle='#c8952b';c.font='12px sans-serif';c.fillText('neokemetai.online',800,640);
    return card.toDataURL('image/png');
  }
  function endScreen(){
    save();selected=null;inspected=null;draw();cardURL=makeCard();
    showDialog('end',`<div class="nk-eyebrow">${state.status==='won'?'Your legacy is written':'The city falls silent'}</div><h2>${state.status==='won'?'Built for eternity.':'The balance is lost.'}</h2><p>${state.status==='won'?'Your pyramid crowns the Nile.':'Ma’at reached zero. Try more fields, stored grain, and a bakery.'} <b>Score ${score()}</b> · Year ${state.year}</p><img class="nk-cardpreview" src="${cardURL}" alt="City card for ${escapeHTML(state.name)}"><div class="nk-actions"><button class="nk-primary" data-action="again">Play again</button><button data-action="download">Download card</button><button data-action="share">Share</button></div><p><a href="${SITE}timeline/" target="_blank" rel="noopener noreferrer">Explore Egypt’s timeline on NeoKemetAI ↗</a></p><p class="nk-note" data-share-status></p>`);
  }
  async function share(){
    const status=overlay.querySelector('[data-share-status]');
    try{
      if(navigator.share){await navigator.share({title:'Rise of Waset',text:`${state.name}: ${score()} points in Rise of Waset.`,url:SITE});if(status)status.textContent='Shared.';}
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(SITE);if(status)status.textContent='NeoKemetAI link copied.';}
      else throw new Error('Clipboard unavailable');
    }catch(e){if(e.name!=='AbortError'&&status){status.textContent='Copy this link: '+SITE;const input=document.createElement('input');input.type='text';input.readOnly=true;input.value=SITE;input.setAttribute('aria-label','Share link');status.appendChild(input);input.select();}}
  }
  const canRun=()=>!destroyed&&visible&&!document.hidden&&started&&!paused&&!modal&&state.status==='playing';
  function frame(now){
    raf=0;if(!canRun())return;
    const dt=last?Math.min((now-last)/1000,.25):0;last=now;accumulator+=dt;visualTime+=dt;
    while(accumulator>=.1&&canRun()){step(.1);accumulator-=.1;}
    hudTime+=dt;saveTime+=dt;if(hudTime>=.25){updateHUD();hudTime=0;}
    if(saveTime>=5){save();saveTime=0;}draw();
    if(canRun())raf=requestAnimationFrame(frame);
  }
  function syncLoop(){
    if(!canRun()){cancelAnimationFrame(raf);raf=0;last=0;accumulator=0;}
    else if(!raf){last=0;raf=requestAnimationFrame(frame);}
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(world);
  const intersection='IntersectionObserver' in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncLoop();},{threshold:.01}):null;
  intersection?.observe(root);
  listen(document,'visibilitychange',()=>{if(document.hidden)save();syncLoop();});
  listen(window,'pagehide',save);listen(motion,'change',draw);
  resize();updateHUD();startScreen();
  return function destroy(){
    if(destroyed)return;save();destroyed=true;cancelAnimationFrame(raf);clearTimeout(toastTimer);
    abort.abort();resizeObserver.disconnect();intersection?.disconnect();audio?.close().catch(()=>{});root.remove();
  };
}
