/* NeoKemetAI · Pyramid Builder Lab
 * Buildless ES module. No dependencies or requests. All arithmetic is local.
 * Historical reference values are separate from the illustrative model below.
 */
const REF = Object.freeze({ height: 146.6, base: 230.3, blocks: 2300000,
  volume: 2600000, courses: 200, target: 23, blockTonnes: 2.5 });
const RAMPS = {
  combination: { name: 'Combination', note: 'Straight ramp for the lower half; an internal route above it. This is one illustrative combination, not a reconstruction. Many Egyptologists favour some combination.' },
  straight: { name: 'Straight ramp', note: 'A straight ramp could exceed 1 km near the summit and require a volume comparable to the pyramid. Its construction time is not quantified here.' },
  zigzag: { name: 'Zigzag ramp', note: 'Switchbacks could shorten the footprint. Turning, support and access remain unresolved.' },
  spiral: { name: 'Spiral ramp', note: 'A wrapping ramp could obstruct corner measurements and alignment. That difficulty is not assigned a numerical penalty.' },
  internal: { name: 'Internal ramp', note: 'J.-P. Houdin proposed an internal route in 2007. It remains unconfirmed; the drawn route is illustrative.' }
};
const LINKS = {
  pyramid: 'https://neokemetai.online/monuments/great-pyramid/',
  giza: 'https://neokemetai.online/monuments/giza-plateau/',
  khufu: 'https://neokemetai.online/pharaohs/khufu/',
  film: 'https://youtu.be/4Be5bvWrKnQ', home: 'https://neokemetai.online/'
};
const DEFAULTS = { ramp: 'combination', workforce: 25000, teams: 240, wet: true,
  boats: true, posts: false, incline: 8, season: 'core', envelope: 'working', view: 'iso', speed: 1 };
const LABELS = { quarry: 'quarry output', hauling: 'hauling teams', traffic: 'ramp traffic', setting: 'setting space / crews' };
const KEYS = Object.keys(LABELS);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fmt = (x, digits = 0) => Number(x).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const range = (a, b, digits = 1) => `${fmt(a, digits)}–${fmt(b, digits)}`;
const badge = (s) => `<span class="nk-badge">${s}</span>`;
const link = (key, title) => `<a href="${LINKS[key]}" target="_blank" rel="noopener noreferrer">${title} ↗</a>`;

function clean(input = {}) {
  const s = { ...DEFAULTS };
  for (const k of ['wet', 'boats', 'posts']) if (typeof input[k] === 'boolean') s[k] = input[k];
  for (const [k, a, b] of [['workforce', 15000, 35000], ['teams', 10, 500], ['incline', 5, s.posts ? 12 : 10], ['speed', .5, 2]]) {
    if (typeof input[k] === 'number' && Number.isFinite(input[k])) s[k] = clamp(input[k], a, b);
  }
  s.workforce = Math.round(s.workforce / 1000) * 1000;
  s.teams = Math.round(s.teams);
  if (Object.hasOwn(RAMPS, input.ramp)) s.ramp = input.ramp;
  for (const [k, options] of Object.entries({ season: ['core', 'flood', 'mixed'], envelope: ['working', 'full'], view: ['iso', 'section'] })) {
    if (options.includes(input[k])) s[k] = input[k];
  }
  return s;
}

/* Scenario endpoints are sensitivity bounds, NOT confidence intervals.
 * Working bounds are calibrated choices inside the full requested ranges.
 * p=0 is optimistic, p=1 is cautious. Every worsening parameter is monotonic.
 */
function assumptions(s, p) {
  const lerp = (a, b) => a + (b - a) * p;
  const full = s.envelope === 'full';
  return {
    quarryTeam: full ? lerp(10, 20) : 15,
    quarryOutput: full ? lerp(1.5, .5) : lerp(1.2, .8),
    speed: full ? lerp(2000, 1000) : lerp(1600, 1200),
    handling: full ? lerp(.25, .5) : lerp(20 / 60, 25 / 60),
    spacing: full ? lerp(15, 25) : lerp(18, 22),
    setting: full ? lerp(8, 4) : lerp(7, 5),
    ground: lerp(300, 600), harbour: lerp(500, 1000),
    hours: 8, areaPerCrew: 250, settingCrew: 10
  };
}

function lanesAt(s, h) {
  if (s.ramp === 'straight' || (s.ramp === 'combination' && h <= REF.height / 2)) return 3;
  return s.ramp === 'zigzag' ? 2 : 1;
}

/* F = m g (mu cos(theta) + sin(theta)). Scaling by the same reference
 * mass and gravity cancels m and g: n = ceil(20 * (...) / 0.30).
 * This assumes equal sustained pull per person, NOT mechanical advantage
 * from posts. Posts only unlock 10–12 degrees as an exploratory scenario.
 */
function teamSize(s, angle = s.incline) {
  const t = angle * Math.PI / 180;
  return Math.ceil(20 * ((s.wet ? .30 : .55) * Math.cos(t) + Math.sin(t)) / .30);
}

function capacities(s, a, h, workforce) {
  const side = REF.base * (1 - h / REF.height);
  const length = h / Math.sin(s.incline * Math.PI / 180);
  const n = teamSize(s);
  const activeTeams = Math.min(s.teams, Math.floor(workforce * .15 / n));
  const trips = a.hours / (2 * (a.ground + length) / a.speed + a.handling);
  const lanes = lanesAt(s, h);
  /* Ramp occupancy uses a fluid-flow approximation L/spacing * lanes.
   * A loaded ascent plus an empty return occupies the route for 2L/v.
   * Loading happens OFF the ramp; adding loading time here would create
   * an artificial first-course bottleneck. L cancels in steady flow.
   * Both directions share the stated lane capacity conservatively.
   */
  const occupancy = length / a.spacing * lanes;
  const traffic = occupancy * a.hours / (2 * length / a.speed);
  const settingCrews = Math.max(1, Math.min(Math.floor(workforce * .10 / a.settingCrew), Math.floor(side * side / a.areaPerCrew)));
  const rates = {
    quarry: Math.floor(workforce * .35 / a.quarryTeam) * a.quarryOutput,
    hauling: activeTeams * trips,
    traffic,
    setting: settingCrews * a.setting
  };
  const binding = KEYS.reduce((x, y) => rates[x] <= rates[y] ? x : y);
  return { rates, binding, rate: rates[binding], activeTeams, trips, length, lanes, occupancy, settingCrews };
}

function solve(s, p) {
  const a = assumptions(s, p), courses = [], phases = [{}, {}, {}];
  let years = 0;
  for (let i = 0; i < REF.courses; i++) {
    const h = (i + .5) / REF.courses * REF.height;
    // Exact layer-volume difference; fractions sum to 1 across 200 courses.
    const blocks = REF.blocks * ((1 - i / REF.courses) ** 3 - (1 - (i + 1) / REF.courses) ** 3);
    const full = capacities(s, a, h, s.workforce);
    const core = s.season === 'mixed' ? capacities(s, a, h, s.workforce * .6) : full;
    // Mixed schedule: 120 days at peak + 180 days with 60% core crew.
    // Take the minimum BEFORE adding seasons; bottlenecks cannot be traded.
    const annual = s.season === 'mixed' ? full.rate * 120 + core.rate * 180 : full.rate * (s.season === 'flood' ? 120 : 300);
    const duration = blocks / annual;
    const course = { i, h, blocks, start: years, end: years + duration, full, core, annual };
    courses.push(course);
    const phase = phases[Math.min(2, Math.floor(i * 3 / REF.courses))];
    for (const [cap, weight] of s.season === 'mixed' ? [[full, .4], [core, .6]] : [[full, 1]]) {
      phase[cap.binding] = (phase[cap.binding] || 0) + duration * weight;
    }
    years += duration;
  }
  return { years, courses, a, phases: phases.map(x => Object.keys(x).sort((a, b) => x[b] - x[a])[0]) };
}

function forecast(s) { return { low: solve(s, 0), mid: solve(s, .5), high: solve(s, 1) }; }

/* Ramp material is a geometric illustration only. No unsupported ramp
 * labour/time factor is silently folded into the calibrated block schedule.
 * Straight = triangular wedge; zigzag/spiral = supported ribbon prism;
 * internal = excavated tunnel. These unlike quantities are labelled apart.
 */
function rampMaterial(s, h = REF.height) {
  const theta = s.incline * Math.PI / 180;
  const straight = z => [10, 20].map(w => .5 * (z / Math.tan(theta)) * z * w);
  const ribbon = z => [6, 10].map(w => w * 2 * z / Math.sin(theta));
  const tunnel = z => [9, 16].map(area => area * z / Math.sin(theta));
  if (s.ramp === 'straight') return { fill: straight(h), excavation: [0, 0] };
  if (s.ramp === 'internal') return { fill: [0, 0], excavation: tunnel(h) };
  if (s.ramp === 'combination') return { fill: straight(Math.min(h, REF.height / 2)), excavation: tunnel(Math.max(0, h - REF.height / 2)) };
  return { fill: ribbon(h), excavation: [0, 0] };
}

const MILESTONES = [
  { id: 'quarter', label: '25% of estimated blocks', badge: 'Evidence', key: 'giza', text: 'Most core blocks came from local Giza limestone. Quarrying, feeding workers and moving stone were connected operations.' },
  { id: 'half', label: '50% of estimated blocks', badge: 'Evidence · estimate', key: 'giza', text: 'A rotating workforce is usually estimated at 20,000–30,000. Workers were housed and fed at Heit el-Ghurab, south of the plateau. They were not slaves.' },
  { id: 'king', label: 'King’s Chamber · about 43 m', badge: 'Evidence', key: 'pyramid', text: 'The King’s Chamber floor is about 43 m above the base. Aswan granite beams estimated at 25–80 tonnes had to reach about 43–60 m. Ordinary-block throughput does not solve that lifting problem.' },
  { id: 'cap', label: 'Capstone · model complete', badge: 'Evidence', key: 'khufu', text: 'Merer’s logbook records Tura limestone travelling by boat late in Khufu’s reign, through canals and a harbour near Giza. It documents supply, not a complete ramp design.' }
];

function markup() {
  return `<header class="nk-heading"><div><p class="nk-eyebrow">NEOKEMETAI / ENGINEERING ANCIENT EGYPT</p>
    <h2>Pyramid Builder Lab</h2><p class="nk-deck">Could you build the Great Pyramid?</p></div><span class="nk-seal">AN INTERACTIVE<br>SIMULATION</span></header>
    <p class="nk-intro">Step into the role of Khufu’s chief builder. Explore what a method <em>could</em> require—and where the evidence ends.</p>
    <div class="nk-workspace"><section class="nk-visual" aria-label="Construction view">
      <div class="nk-viewbar"><span>GIZA PLATEAU <span class="nk-dot"></span> KHUFU’S REIGN</span><div role="group" aria-label="View"><button type="button" data-view="iso" aria-pressed="true">Isometric</button><button type="button" data-view="section" aria-pressed="false">Cross-section</button></div></div>
      <canvas class="nk-scene" role="img" aria-label="Pyramid construction visualisation; progress and constraints are described below."></canvas>
      <div class="nk-scene-caption"><span data-text="sceneCaption">Course 0 / 200</span><span>Routes illustrative · chamber elevations scaled</span></div>
      <div class="nk-timeline"><div class="nk-time"><span data-text="clock">MODEL YEAR 0.0</span><strong data-text="progress">0% of blocks</strong></div><progress max="100" value="0" aria-label="Estimated blocks placed"></progress>
      <div class="nk-playback"><button type="button" class="nk-primary" data-action="play">Begin construction</button><button type="button" data-action="restart">Restart</button><label>Speed <select data-setting="speed"><option value="0.5">1 year / 10 sec</option><option value="1" selected>1 year / 5 sec</option><option value="2">1 year / 2.5 sec</option></select></label></div>
      <label class="nk-scrub">Inspect model year <input type="range" min="0" max="30" step="0.1" value="0" data-action="scrub" aria-label="Inspect model year"></label>
      <p class="nk-small">Playback follows the middle scenario. Forecasts show the selected assumption bounds. Reduced-motion mode removes moving teams; use the year slider to inspect any stage.</p></div>
      <div class="nk-limiter"><span class="nk-eyebrow">CURRENT CONSTRAINT</span><strong data-text="limiter">Limited by: quarry output</strong><p data-text="limiterDetail"></p></div>
      <div class="nk-milestones" aria-label="Evidence milestones">${MILESTONES.map(m => `<article data-milestone="${m.id}" class="nk-evidence"><p class="nk-small" data-state>Not reached</p>${badge(m.badge)}<h3>${m.label}</h3><p>${m.text}</p>${link(m.key, 'Read more')}</article>`).join('')}</div>
    </section>
    <aside class="nk-controls" aria-label="Construction settings"><div class="nk-panel-title"><span class="nk-eyebrow">YOUR CONSTRUCTION PLAN</span><span class="nk-small">Model assumptions</span></div>
      <label>Ramp theory <select data-setting="ramp">${Object.entries(RAMPS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></label><div class="nk-theory-note">${badge('Theory')}<p data-text="rampNote"></p></div>
      <label>Total peak workforce <output data-output="workforce"></output><input type="range" aria-label="Total peak workforce" data-setting="workforce" min="15000" max="35000" step="1000"></label><p class="nk-small">Evidence-based estimate: 20,000–30,000. Explore 15,000–35,000 as hypothetical scenarios.</p>
      <label>Requested hauling teams <output data-output="teams"></output><input type="range" aria-label="Requested hauling teams" data-setting="teams" min="10" max="500" step="1"></label><p class="nk-small" data-text="activeTeams"></p>
      <div class="nk-toggles"><label><input type="checkbox" data-setting="wet"> Wet sand ${badge('Experiment + Evidence')}</label><label><input type="checkbox" data-setting="boats"> River boats ${badge('Evidence')}</label><label><input type="checkbox" data-setting="posts"> Hauling posts ${badge('Evidence at Hatnub')}</label></div>
      <label>Ramp incline <output data-output="incline"></output><input type="range" aria-label="Ramp incline" data-setting="incline" min="5" max="10" step="0.5"></label><p class="nk-small">Posts permit exploration up to 12°. Their use here is a theory; no mechanical advantage is assumed.</p>
      <label>Working season <select data-setting="season"><option value="core">Year-round core crew · ≈300 days</option><option value="flood">Inundation only · ≈120 days</option><option value="mixed">Core + seasonal workers · 300 / 120 days</option></select></label>
      <label>Assumption envelope <select data-setting="envelope"><option value="working">Calibrated working ranges</option><option value="full">Full exploratory ranges</option></select></label><p class="nk-small">These are scenario bounds, not statistical confidence or an accepted chronology.</p>
      <div class="nk-supply" data-supply hidden>Supply constrained: Tura casing and Aswan granite have no scheduled river supply. Full completion is unresolved. Numbers below show the core-block schedule only.</div>
      <div class="nk-results"><p class="nk-eyebrow">PROJECTED BLOCK SCHEDULE</p><p class="nk-years" data-text="years"></p><p class="nk-status" data-text="status"></p><dl><div><dt>Needed for the 23-year target</dt><dd data-text="needed"></dd></div><div><dt>Peak workforce</dt><dd data-text="peak"></dd></div><div><dt>External ramp material</dt><dd data-text="volume"></dd></div><div data-excavation><dt>Internal excavation</dt><dd data-text="excavation"></dd></div></dl><p class="nk-small">Block schedule only. Ramp construction, casing finish and specialist beam lifting are not timed. Boats enable supply; they do not prove on-time delivery.</p></div>
      <button type="button" data-action="compare" aria-expanded="false" class="nk-wide">Compare all five theories</button>
    </aside></div>
    <section class="nk-compare" data-compare hidden><h3>Same people. Different routes.</h3><p>Bars show scenario ranges. All settings except the ramp stay identical. Equal outcomes are possible: an unmodelled difficulty is never assigned an invented penalty.</p><div data-chart></div><p class="nk-small">The line marks the debated 23-year target. Comparison covers block delivery and setting; ramp works are excluded.</p></section>
    <section class="nk-model" aria-label="How this model works"><div class="nk-panel-title"><h3>How this model works</h3>${badge('Model assumptions')}</div><p>This is a deliberately simplified capacity model, not a reconstruction. Every course waits for its slowest constraint. It assumes work can be organised continuously, without a quarry stockpile carried between courses.</p>
      <p class="nk-formula">Course time = course blocks ÷ min(quarry, hauling, ramp traffic, setting)</p><p class="nk-model-live" data-text="modelLimiter"></p><div class="nk-capacities" data-capacities></div>
      <details open><summary>Formulas, workforce and calibration</summary><div class="nk-model-grid"><div><h3>Volume and courses</h3><p>Height H ≈146.6 m; base B ≈230.3 m; slope ≈51.8° ${badge('Evidence')}. About 2.3 million blocks averaging ≈2.5 t, total ≈2.6 million m³ ${badge('Estimate')}.</p><p class="nk-formula">Remaining fraction = (1 − h/H)³<br>Layer blocks = 2,300,000 × [lower fraction − upper fraction]<br>200 equal-height courses; h uses each layer’s midpoint.</p><p>Layer fractions normalise the supplied volume and block estimates independently; rounding need not make B²H/3 exactly 2.6 million m³. Actual course heights vary.</p><h3>Workforce is shared</h3><p>35% quarrying; 15% hauling; 10% setting; 40% transport, ramp work, food, administration and other support. These allocations are assumptions, not excavated crew lists. Unused capacity is not automatically reassigned.</p><p>Quarry teams = floor(quarry workers ÷ quarry team size). Setting teams use 10 workers each. Requested hauling teams are capped by available haulers. Peak workforce includes everyone.</p><h3>Setting space</h3><p class="nk-formula">Course side = B(1 − h/H)<br>Setting crews = min(available crews, floor(side² / 250 m²)), at least 1<br>Setting output = crews × blocks per crew per day</p><p>We use the permitted area-based alternative: one crew per 250 m². A minimum crew handles the tiny upper courses. Their capacity falls near the summit, though individual upper courses can still take less time because they contain fewer blocks.</p></div>
      <div><h3>Force, travel and traffic</h3><p class="nk-formula">F = m·g·(μ cosθ + sinθ)<br>Haulers = ceil[20 × (μ cosθ + sinθ) / 0.30]<br>μ dry ≈0.55; μ wet ≈0.30<br>Ramp length L = h / sinθ<br>Trips/day = 8 / [2(land haul + L)/speed + handling hours]<br>Hauling output = active teams × trips/day<br>Occupancy = (L / spacing) × lanes<br>Traffic/day = occupancy × 8 / (2L/speed)</p><p>Level ground needs ≈20 wet or ≈37 dry haulers per 2.5 t. At 8°, wet hauling needs ≈1.45 times the level-ground pull (rounded to 30 people). Returning sledges share capacity. Loading is off-ramp. Fractional occupancy is a continuous-flow approximation; L cancels in the traffic formula. No corner delays or queue simulation are claimed.</p><p>Three shared-direction lanes for straight ramps, two for zigzags, one for spiral/internal. The combination switches from three to one at half height. All routes use the same incline and length formula; their footprint, lane count and material differ.</p><p>Local quarry haul: 300–600 m each way. Harbour haul: 500–1,000 m each way, added to the ramp. The harbour route is calculated separately below; no imported-block fraction was supplied, so it is not silently blended into core throughput.</p></div></div>
      <div class="nk-table-wrap"><table><caption>Assumption ranges used in the forecasts</caption><thead><tr><th>Input</th><th>Calibrated working range</th><th>Full exploratory range</th></tr></thead><tbody><tr><th>Quarry team size</th><td>15 workers</td><td>10–20 workers</td></tr><tr><th>Quarry output / team / day</th><td>0.8–1.2 blocks</td><td>0.5–1.5 blocks</td></tr><tr><th>Effective travel speed</th><td>1.2–1.6 km/hour</td><td>1–2 km/hour</td></tr><tr><th>Loading / unloading per trip</th><td>20–25 minutes</td><td>15–30 minutes</td></tr><tr><th>Sledge spacing</th><td>18–22 m</td><td>15–25 m</td></tr><tr><th>Setting output / crew / day</th><td>5–7 blocks</td><td>4–8 blocks</td></tr></tbody></table></div><p>Optimistic endpoints combine favourable inputs; cautious endpoints combine unfavourable inputs. They are sensitivity bounds. Calibration selects narrower working assumptions within the full ranges; it does not validate them historically. At the untouched defaults, the combination schedule should be about 18–26 years. The full envelope deliberately permits results outside 15–30 years.</p>
      <h3>Seasons and the reign target</h3><p class="nk-formula">Year-round: annual output = daily bottleneck × 300<br>Inundation: annual output = daily bottleneck × 120<br>Mixed: annual output = peak bottleneck × 120 + core bottleneck × 180<br>Mixed core = 60% of the selected peak workforce</p><p>300 and 120 working days, the 60% core share and 8-hour days are assumptions. The 23-year target follows the Turin King List interpretation; some scholars allow a longer reign ${badge('Evidence · debated')}. About 340 blocks/day over 20 years is an approximate continuous-calendar benchmark; 2.3 million ÷ 20 ÷ 365 ≈315. Our 300-day schedule would need ≈383/day over 20 years, or ≈333/day over 23 years.</p>
      <h3>Ramp material, not a hidden time penalty</h3><p class="nk-formula">Straight fill = ½ × [h/tanθ] × h × width (10–20 m)<br>Zigzag / spiral ribbon = [h/sinθ] × width (6–10 m) × thickness (2 m)<br>Internal excavation = [h/sinθ] × tunnel section (9–16 m²)</p><p>These dimensions are hypothetical. Ribbon estimates exclude foundations and supports. Straight fill excludes retaining walls. Combination uses a lower-half wedge plus upper-half excavation. Excavation and fill are different quantities. No time, extra quarry demand, removal or structural feasibility for these works is included.</p></details>
      <details><summary>Imported stone, chambers and evidence</summary><p data-text="imports"></p><p data-text="beams"></p><p>Core limestone was mostly local. Tura supplied fine white casing across the river; Aswan, about 800 km upstream, supplied granite ${badge('Evidence')}. Heavy beams require specialist rigging; scaling hauler counts alone cannot establish feasibility.</p><p>The subterranean chamber is about 30 m below the base; the Queen’s Chamber is about 21 m above it; the Grand Gallery rises from about 21 to 43 m; the King’s Chamber floor is about 43 m. Relieving-chamber beams reached about 43–60 m. Elevations are scaled in cross-section; chamber widths, horizontal positions, passages and internal-ramp geometry are illustrative.</p><p>Fall et al., <em>Physical Review Letters</em> 112 (2014), found that the right amount of water could roughly halve pulling force on sand ${badge('Experiment')}. The Djehutihotep tomb scene, about 1900 BC, shows water poured ahead of a sledge ${badge('Evidence')}; it is later than Khufu.</p><p>Hatnub’s Khufu-era quarry ramp, announced in 2018, has stairs and post holes, with steep sections about 20% (≈11°) ${badge('Evidence')}. The IFAO description reports sections reaching 22%. This supports a hauling system at a quarry, not proof of one at the Great Pyramid.</p><p>Merer’s logbook, found at Wadi al-Jarf in 2013, records Tura limestone transport by boat late in Khufu’s reign ${badge('Evidence')}. Boat travel time, fleet size, casing quantity and granite-beam counts are not supplied, so imported supply is an explicit unresolved schedule component.</p><p>${link('pyramid', 'Great Pyramid')} · ${link('giza', 'Giza Plateau')} · ${link('khufu', 'Khufu')} · ${link('film', 'How Were the Pyramids Built? Follow One Stone From Quarry to Summit')}</p></details>
    </section>
    <section class="nk-finish" data-finish hidden><div><p class="nk-eyebrow">YOUR MODEL, DOCUMENTED</p><h3 data-text="finishTitle">The block schedule is complete.</h3><p data-text="finishText"></p><p>This result describes a simplified model. It does not establish how the Great Pyramid was built.</p><div class="nk-actions"><button type="button" class="nk-primary" data-action="download">Download result PNG</button><button type="button" data-action="share">Share result</button></div><p data-text="shareStatus" role="status"></p><label data-copy hidden>Copy this link <input type="text" readonly value="${LINKS.home}"></label></div><canvas class="nk-card" role="img" aria-label="Downloadable model result card"></canvas></section>
    <footer class="nk-footer"><span>NEOKEMETAI <span class="nk-footer-dot">/</span> Evidence before certainty.</span>${link('film', 'Watch the documentary')}</footer>
    <p class="nk-sr" role="status" aria-live="polite" aria-atomic="true" data-live></p>`;
}

/** Mount into a host element; returns an idempotent destroy() function. */
export function mountLab(container) {
  if (!container || typeof container.append !== 'function') throw new TypeError('mountLab requires a container element.');
  const root = document.createElement('div');
  root.className = 'nk-lab';
  root.innerHTML = markup();
  container.append(root);
  const $ = q => root.querySelector(q), $$ = q => [...root.querySelectorAll(q)];
  const put = (k, v) => { $(`[data-text="${k}"]`).textContent = v; };
  const scene = $('.nk-scene'), ctx = scene.getContext('2d'), card = $('.nk-card');
  if (!ctx || !card.getContext('2d')) { root.remove(); throw new Error('This lab requires Canvas 2D support.'); }
  let settings = { ...DEFAULTS };
  try { settings = clean(JSON.parse(localStorage.getItem('nk-pyramid-lab-v1') || '{}')); } catch { /* Storage can be disabled. */ }
  let models, elapsed = 0, playing = false, visible = true, destroyed = false;
  let raf = 0, lastFrame = 0, lastUI = 0, announceTimer = 0, resizeObserver, intersectionObserver;
  let compareOpen = false, cardURL = null, pulse = 0;
  const reached = new Set(), removers = [];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  const on = (el, event, fn, options) => { el.addEventListener(event, fn, options); removers.push(() => el.removeEventListener(event, fn, options)); };
  const save = () => { try { localStorage.setItem('nk-pyramid-lab-v1', JSON.stringify(settings)); } catch { /* Optional persistence only. */ } };
  function announce(message) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { if (!destroyed) $('[data-live]').textContent = message; }, 350);
  }
  function syncControls() {
    $$('[data-setting]').forEach(el => { const value = settings[el.dataset.setting]; if (el.type === 'checkbox') el.checked = value; else el.value = value; });
    $('[data-setting="incline"]').max = settings.posts ? 12 : 10;
    $('[data-output="workforce"]').textContent = fmt(settings.workforce);
    $('[data-output="teams"]').textContent = fmt(settings.teams);
    $('[data-output="incline"]').textContent = `${fmt(settings.incline, 1)}°`;
    $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === settings.view)));
  }
  function current() {
    const courses = models.mid.courses;
    const c = courses.find(c => c.end > elapsed) || courses[courses.length - 1];
    const fraction = clamp((elapsed - c.start) / (c.end - c.start), 0, 1);
    const layer = c.i + fraction;
    const h = layer / REF.courses * REF.height;
    // Interpolate blocks in the current layer, rather than confuse height with volume.
    const blocks = REF.blocks * (1 - (1 - c.i / REF.courses) ** 3) + c.blocks * fraction;
    return { c, h, layer, blocks, progress: blocks / REF.blocks * 100 };
  }
  function targetText() {
    if (!settings.boats) return 'Full completion unresolved · river supply off';
    if (models.high.years <= REF.target) return 'Both block-schedule bounds fit 23 years';
    if (models.low.years > REF.target) return 'Both block-schedule bounds exceed 23 years';
    return 'The range crosses the 23-year target';
  }
  function rebuild() {
    models = forecast(settings);
    elapsed = 0; reached.clear(); playing = false;
    $('[data-finish]').hidden = true;
    put('shareStatus', ''); $('[data-copy]').hidden = true;
    syncControls();
    put('rampNote', RAMPS[settings.ramp].note);
    put('years', `${range(models.low.years, models.high.years)} years`);
    put('status', targetText());
    const days = settings.season === 'flood' ? 120 : 300;
    put('needed', `≈${fmt(REF.blocks / REF.target / days)} blocks / active day${settings.season === 'mixed' ? ' (annual average)' : ''}`);
    put('peak', `${fmt(settings.workforce)} people${settings.season === 'mixed' ? ` · ${fmt(settings.workforce * .6)} core` : ''}`);
    const mat = rampMaterial(settings);
    put('volume', `${range(mat.fill[0], mat.fill[1], 0)} m³`);
    put('excavation', `${range(mat.excavation[0], mat.excavation[1], 0)} m³`);
    $('[data-excavation]').hidden = mat.excavation[1] === 0;
    $('[data-supply]').hidden = settings.boats;
    // A range input with step=.1 cannot reach an arbitrary fractional max.
    // Round its endpoint UP; the input handler clamps back to exact completion.
    $('[data-action="scrub"]').max = Math.ceil(models.mid.years * 10) / 10;
    if (compareOpen) comparison();
    update(); draw(); schedule();
    announce(`Settings applied; timeline restarted. Projected block schedule ${range(models.low.years, models.high.years)} years. ${targetText()}.`);
  }
  function update() {
    const now = current(), cap = now.c.full, core = now.c.core;
    put('clock', `MODEL YEAR ${fmt(elapsed, 1)}`);
    put('progress', `${fmt(now.progress, 1)}% of blocks`);
    put('sceneCaption', `Course ${Math.min(200, Math.floor(now.layer))} / 200 · ${fmt(now.h, 1)} m`);
    $('progress').value = now.progress;
    $('[data-action="scrub"]').value = elapsed;
    $('[data-action="play"]').textContent = playing ? 'Pause' : elapsed >= models.mid.years ? 'Run again' : elapsed ? 'Resume' : 'Begin construction';
    const limit = cap.binding === 'setting' && now.h > REF.height * 2 / 3 ? 'setting space at the top' : LABELS[cap.binding];
    const message = `Limited by: ${limit}${settings.season === 'mixed' && core.binding !== cap.binding ? `; core season: ${LABELS[core.binding]}` : ''}`;
    put('limiter', message);
    put('modelLimiter', `${message}. Middle scenario, current course; ${fmt(cap.rate)} blocks per peak working day.`);
    put('limiterDetail', `Quarry ${fmt(cap.rates.quarry)} · Hauling ${fmt(cap.rates.hauling)} · Traffic ${fmt(cap.rates.traffic)} · Setting ${fmt(cap.rates.setting)} blocks/day. ${settings.boats ? '' : 'Imported stone supply remains unresolved.'}`);
    put('activeTeams', `${cap.activeTeams} active teams × ${teamSize(settings)} haulers on this incline. Capped at 15% of the workforce; ${cap.settingCrews} setting crews available here.`);
    $('[data-capacities]').innerHTML = KEYS.map(k => `<div${k === cap.binding ? ' class="nk-binding"' : ''}><span>${LABELS[k]}</span><strong>${fmt(cap.rates[k])}</strong><small>blocks / working day</small></div>`).join('');
    const trip = a => a.hours / (2 * (a.harbour + cap.length) / a.speed + a.handling);
    put('imports', `At this height, the harbour route could allow ${range(trip(models.high.a), trip(models.low.a))} round trips per team per working day for a nominal 2.5 t load. This includes 500–1,000 m of land haul plus the ramp. ${settings.boats ? 'Boats are enabled; actual arrival timing is unquantified.' : 'Boats are off: this route has no scheduled imported supply.'}`);
    const perBlock = 20 * (((settings.wet ? .3 : .55) * Math.cos(settings.incline * Math.PI / 180)) + Math.sin(settings.incline * Math.PI / 180)) / .3;
    put('beams', `Pure force scaling would need approximately ${fmt(Math.ceil(perBlock * 25 / 2.5))}–${fmt(Math.ceil(perBlock * 80 / 2.5))} haulers for 25–80 t at ${fmt(settings.incline, 1)}°. This is not a rigging design, lane-feasibility check or heavy-lift schedule.`);
    const conditions = { quarter: now.progress >= 25, half: now.progress >= 50, king: now.h >= 43, cap: elapsed >= models.mid.years };
    MILESTONES.forEach(m => {
      const el = $(`[data-milestone="${m.id}"]`), done = conditions[m.id];
      el.classList.toggle('nk-reached', done);
      el.querySelector('[data-state]').textContent = done ? 'Reached in this model' : 'Ahead in the model';
      if (done && !reached.has(m.id)) { reached.add(m.id); announce(`${m.label}. ${m.text}`); }
      if (!done) reached.delete(m.id);
    });
    if (elapsed >= models.mid.years) finish();
    else $('[data-finish]').hidden = true;
  }
  function comparison() {
    const data = Object.keys(RAMPS).map(k => ({ key: k, result: forecast({ ...settings, ramp: k }) }));
    const maximum = Math.max(REF.target, ...data.map(d => d.result.high.years)) * 1.08;
    $('[data-chart]').innerHTML = data.map(d => {
      const lo = d.result.low.years, hi = d.result.high.years;
      return `<div class="nk-chart-row"><div><strong>${RAMPS[d.key].name}</strong>${badge('Theory')}<span>${range(lo, hi)} years</span></div><div class="nk-chart-track" role="img" aria-label="${RAMPS[d.key].name}: ${range(lo, hi)} years; target 23 years"><i class="nk-chart-target" style="left:${23 / maximum * 100}%"></i><i class="nk-chart-base" style="width:${lo / maximum * 100}%"></i><i class="nk-chart-range" style="left:${lo / maximum * 100}%;width:${(hi - lo) / maximum * 100}%"></i></div></div>`;
    }).join('');
  }
  function finish() {
    playing = false;
    const fresh = $('[data-finish]').hidden;
    $('[data-finish]').hidden = false;
    put('finishTitle', settings.boats ? 'Your model has reached the summit.' : 'Core schedule complete. Imported supply unresolved.');
    put('finishText', `${RAMPS[settings.ramp].name} · ${fmt(settings.workforce)} people · ${settings.wet ? 'wet' : 'dry'} sand · ${range(models.low.years, models.high.years)} model years. ${targetText()}.`);
    if (fresh) drawCard();
    $('[data-action="play"]').textContent = 'Run again';
  }
  function drawCard() {
    card.width = 1200; card.height = 680;
    const c = card.getContext('2d');
    c.fillStyle = '#0b0a08'; c.fillRect(0, 0, 1200, 680);
    c.strokeStyle = '#5a4a2e'; c.lineWidth = 2; c.strokeRect(24, 24, 1152, 632);
    c.fillStyle = '#c8952b'; c.font = '18px Georgia, serif'; c.fillText('NEOKEMETAI / PYRAMID BUILDER LAB', 64, 84);
    c.fillStyle = '#e9e0c9'; c.font = '42px Georgia, serif'; c.fillText('Could this method meet the reign?', 64, 155);
    c.fillStyle = '#e2b453'; c.font = '62px Georgia, serif'; c.fillText(`${range(models.low.years, models.high.years)} years`, 64, 258);
    c.fillStyle = '#e9e0c9'; c.font = '24px sans-serif';
    c.fillText(`${fmt(settings.workforce)} people · ${RAMPS[settings.ramp].name}`, 64, 320);
    c.fillText(`${settings.wet ? 'Wet' : 'Dry'} sand · ${fmt(settings.incline, 1)}° incline · ${settings.boats ? 'Boats enabled' : 'NO IMPORTED SUPPLY'}`, 64, 362);
    c.font = '19px sans-serif'; c.fillStyle = '#a89c80';
    c.fillText(settings.season === 'flood' ? 'Inundation only · 120 working days' : settings.season === 'mixed' ? 'Core + seasonal crew · 300 / 120 working days' : 'Year-round crew · 300 working days', 64, 410);
    c.fillText(settings.envelope === 'full' ? 'Full exploratory assumptions' : 'Calibrated working assumptions', 64, 442);
    c.fillText(targetText(), 64, 484);
    c.strokeStyle = '#3a3224'; c.beginPath(); c.moveTo(64, 520); c.lineTo(1136, 520); c.stroke();
    c.font = '18px sans-serif'; c.fillText('Simplified block schedule. Ramp works and specialist lifting are not timed.', 64, 562);
    c.fillText('This result does not establish how the Great Pyramid was built.', 64, 592);
    c.fillStyle = '#c8952b'; c.fillText('neokemetai.online', 64, 630);
    c.fillStyle = '#5a4a2e'; c.beginPath(); c.moveTo(900, 420); c.lineTo(1020, 190); c.lineTo(1140, 420); c.closePath(); c.fill();
    c.fillStyle = '#a89c80'; c.beginPath(); c.moveTo(1020, 190); c.lineTo(1020, 420); c.lineTo(1140, 420); c.closePath(); c.fill();
  }
  async function png() { return new Promise(resolve => card.toBlob(resolve, 'image/png')); }
  async function copyLink() {
    try { await navigator.clipboard.writeText(LINKS.home); if (!destroyed) put('shareStatus', 'Website link copied.'); }
    catch { if (!destroyed) { $('[data-copy]').hidden = false; $('[data-copy] input').focus(); $('[data-copy] input').select(); put('shareStatus', 'Select and copy the website link below.'); } }
  }

  /* Canvas artwork is generated locally. The polygon mesh uses real base and
   * height proportions; landscape, ramp routes and vehicles are illustrative.
   */
  function draw() {
    if (destroyed || !visible || document.hidden) return;
    const rect = scene.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr)), hpx = Math.max(1, Math.round(rect.height * dpr));
    if (scene.width !== w || scene.height !== hpx) { scene.width = w; scene.height = hpx; }
    ctx.setTransform(w / 840, 0, 0, hpx / 600, 0, 0);
    const c = ctx, now = current(), height = now.h;
    const poly = (pts, fill, stroke, width = 1) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } };
    const path = (pts, color, width = 1) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.strokeStyle = color; c.lineWidth = width; c.stroke(); };
    const text = (str, x, y, color = '#a89c80', font = '12px sans-serif') => { c.fillStyle = color; c.font = font; c.fillText(str, x, y); };
    const sky = c.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, '#111b20'); sky.addColorStop(.38, '#333023'); sky.addColorStop(1, '#1b1812'); c.fillStyle = sky; c.fillRect(0, 0, 840, 600);
    c.fillStyle = '#ddc49612'; c.beginPath(); c.arc(655, 90, 45, 0, Math.PI * 2); c.fill();
    poly([[0, 169], [115, 143], [260, 167], [407, 150], [570, 172], [724, 145], [840, 166], [840, 250], [0, 250]], '#48402a');
    poly([[0, 201], [170, 185], [410, 211], [640, 194], [840, 207], [840, 237], [610, 216], [390, 230], [140, 207], [0, 220]], '#285b58');
    path([[0, 214], [140, 201], [390, 223], [610, 210], [840, 229]], '#6a9c8a66', 1);
    poly([[0, 244], [180, 223], [400, 244], [640, 225], [840, 255], [840, 600], [0, 600]], '#342d1d');
    poly([[630, 220], [713, 222], [733, 246], [650, 246]], '#223d37', '#736443');
    path([[625, 222], [646, 252], [738, 251], [716, 220]], '#9e8b5e', 4);
    for (let i = 0; i < 3; i++) { const x = 140 + i * 33; poly([[x, 232], [x + 23, 231], [x + 25, 248], [x, 250]], '#6b5c3d'); }
    text('NILE & HARBOUR', 623, 183, '#b2b99c', '11px sans-serif');
    if (settings.boats) {
      const x = 550 + (reduced ? 0 : Math.sin(pulse * .15) * 26);
      poly([[x, 210], [x + 37, 210], [x + 29, 218], [x + 8, 218]], '#b09a66');
      path([[x + 20, 209], [x + 20, 185]], '#d8cba8'); poly([[x + 18, 187], [x + 3, 207], [x + 18, 207]], '#d8cba8');
    } else text('RIVER SUPPLY OFF', 610, 272, '#e3a58a');
    if (settings.view === 'section') {
      const scale = 1.62, baseY = 494, center = 390;
      const P = (x, z) => [center + x * scale, baseY - z * scale];
      const half = REF.base / 2, tip = P(0, REF.height), left = P(-half, 0), right = P(half, 0);
      poly([left, tip, right], '#9b896c22', '#8b785144');
      const sh = half * (1 - height / REF.height);
      poly([left, P(-sh, height), P(sh, height), right], '#c0ac82', '#dfcda4');
      for (let i = 1; i <= Math.floor(now.layer); i += 2) { const z = i * REF.height / 200, side = half * (1 - z / REF.height); path([P(-side, z), P(side, z)], '#65563e66', .6); }
      path([[65, baseY], [775, baseY]], '#9d895d', 1);
      const chamber = (x, z, label, labelY, width = 12) => { const p = P(x, z); c.fillStyle = '#171610'; c.fillRect(p[0] - width / 2, p[1] - 10, width, 10); path([[p[0] + width / 2, p[1] - 4], [613, labelY - 4]], '#d8cba888'); text(label, 619, labelY, '#e9e0c9', '11px sans-serif'); };
      chamber(-12, -30, 'Subterranean · −30 m', 550, 25);
      chamber(-5, 21, 'Queen’s Chamber · 21 m', 465, 16);
      chamber(22, 43, 'King’s Chamber · 43 m', 414, 25);
      for (let z = 48; z <= 60; z += 4) path([P(14, z), P(30, z)], '#8d5142', 4);
      text('Relieving chambers · to 60 m', 619, 384, '#d9a28e', '11px sans-serif'); path([P(30, 60), [611, 380]], '#ad7766', 1);
      path([P(-35, 21), P(16, 43)], '#181810', 8); path([P(-35, 21), [135, 434]], '#d8cba888'); text('Grand Gallery · 21–43 m', 45, 427, '#e9e0c9', '11px sans-serif');
      path([P(-100, 0), P(-12, -30)], '#807153', 3);
      let ramp = [];
      const internal = settings.ramp === 'internal' || settings.ramp === 'combination';
      if (internal) {
        const start = settings.ramp === 'combination' ? REF.height / 2 : 0;
        if (start) path([[68, 525], P(-half * .5, Math.min(height, start))], '#c8952b', 7);
        for (let z = start; z <= Math.min(height, REF.height - 2); z += 7) { const side = half * (1 - z / REF.height) * .68; ramp.push(P(Math.floor((z - start) / 7) % 2 ? side : -side, z)); }
        c.setLineDash([6, 5]); if (ramp.length > 1) path(ramp, '#1f4e8c', 4); c.setLineDash([]);
        text('INTERNAL ROUTE · THEORY', 52, 301, '#c1cbd8', '11px sans-serif');
      } else if (height > 0) { ramp = [[58, 535], P(-sh, height)]; path(ramp, '#c8952b', 9); }
      text('CROSS-SECTION / CHAMBER ELEVATIONS', 34, 38, '#cbbd9a');
      text('Widths, horizontal positions and ramp path are illustrative.', 34, 576, '#b5a98d', '11px sans-serif');
    } else {
      const P = (x, y, z) => [425 + (x - y) * 1.15, 412 + (x + y) * .49 - z * 1.38];
      const half = REF.base / 2;
      const corners = z => { const s = half * (1 - z / REF.height); return [P(-s, -s, z), P(s, -s, z), P(s, s, z), P(-s, s, z)]; };
      const base = corners(0), top = corners(height), apex = P(0, 0, REF.height);
      poly([base[1], base[2], base[3], [208, 566], [647, 567], [782, 459]], '#100f0b55');
      path([...base, base[0]], '#aa926444', 2);
      c.setLineDash([4, 7]); path([base[3], apex, base[1]], '#e0ca9955'); path([apex, base[2]], '#e0ca9933'); c.setLineDash([]);
      poly([base[3], base[2], top[2], top[3]], '#c1aa7b', '#ddc89d');
      poly([base[1], base[2], top[2], top[1]], '#8a744d', '#ba9f6d');
      poly(top, '#d8cba8', '#e8d9ae');
      for (let i = 1; i <= Math.floor(now.layer); i += 2) { const q = corners(i * REF.height / 200); path([q[3], q[2], q[1]], '#453c2b70', .65); }
      const ramp = [], stop = Math.max(.5, height);
      const rampPoint = (z, fraction) => {
        const side = half * (1 - z / REF.height) + 3;
        if (settings.ramp === 'zigzag') return P(side * (Math.floor(fraction) % 2 ? .82 : -.82), side, z);
        const turn = Math.floor(fraction) % 4;
        return [P(-side, side, z), P(side, side, z), P(side, -side, z), P(-side, -side, z)][turn];
      };
      if (settings.ramp === 'straight' || settings.ramp === 'combination') {
        const z = settings.ramp === 'combination' ? Math.min(stop, REF.height / 2) : stop;
        const side = half * (1 - z / REF.height);
        ramp.push([128, 570], P(-side * .25, side, z));
        path(ramp, '#55452d', 18); path(ramp, '#b29155', 12); path(ramp, '#dfbd7e', 1);
      } else {
        for (let i = 0; i <= Math.ceil(stop / 7); i++) ramp.push(rampPoint(Math.min(stop, i * 7), i));
        if (settings.ramp === 'internal') c.setLineDash([5, 5]);
        path(ramp, settings.ramp === 'internal' ? '#285c92' : '#715638', 8);
        path(ramp, settings.ramp === 'internal' ? '#85a9cc' : '#e2b453', 2); c.setLineDash([]);
      }
      if (settings.ramp === 'combination' && height > REF.height / 2) {
        const route = [];
        for (let z = REF.height / 2, i = 0; z < height; z += 6, i++) route.push(rampPoint(z, i));
        route.push(P(0, 0, height)); c.setLineDash([5, 5]); path(route, '#6f9ec7', 3); c.setLineDash([]);
      }
      if (height > .2 && ramp.length > 1 && !reduced) {
        const a = ramp[ramp.length - 2], b = ramp[ramp.length - 1];
        for (let i = 0; i < 4; i++) { const t = (pulse * .06 + i / 4) % 1, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; c.fillStyle = '#eee0be'; c.fillRect(x - 4, y - 4, 8, 5); c.fillStyle = '#452b1e'; c.fillRect(x + 5, y, 2, 4); c.fillRect(x + 9, y + 2, 2, 4); }
      }
      text('THE GREAT PYRAMID / GIZA', 34, 38, '#cbbd9a');
      text('ORIGINAL HEIGHT ≈146.6 M', 34, 62, '#8f8b74', '10px sans-serif');
      text(`${RAMPS[settings.ramp].name.toUpperCase()} · THEORY`, 34, 584, '#d3b371', '11px sans-serif');
      if (settings.ramp === 'internal' || settings.ramp === 'combination') text('Dashed blue: proposed internal route', 520, 584, '#9ab3ca', '11px sans-serif');
    }
  }
  function tick(time) {
    raf = 0;
    if (destroyed || !visible || document.hidden || !playing) return;
    const dt = lastFrame ? Math.min((time - lastFrame) / 1000, .1) : 0;
    lastFrame = time;
    elapsed = Math.min(models.mid.years, elapsed + dt * settings.speed / 5);
    if (!reduced) pulse += dt;
    // Normal mode uses rAF; reduced motion redraws only at the text cadence.
    if (!reduced || time - lastUI > 250) draw();
    if (time - lastUI > 250 || elapsed >= models.mid.years) { update(); lastUI = time; }
    schedule();
  }
  function schedule() { if (!destroyed && playing && visible && !document.hidden && !raf) raf = requestAnimationFrame(tick); }
  function suspend() { if (raf) cancelAnimationFrame(raf); raf = 0; lastFrame = 0; }
  function revealCanvas() {
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    // Scroll the view, not keyboard focus. 'auto' avoids motion on every change.
    $('.nk-visual').scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  on(root, 'change', event => {
    const el = event.target.closest('[data-setting]'); if (!el) return;
    const key = el.dataset.setting;
    settings[key] = el.type === 'checkbox' ? el.checked : ['workforce', 'teams', 'incline', 'speed'].includes(key) ? Number(el.value) : el.value;
    settings = clean(settings); save();
    if (key === 'speed') { syncControls(); announce('Playback speed updated.'); }
    else { suspend(); rebuild(); }
    revealCanvas();
  });
  on(root, 'input', event => {
    const el = event.target;
    if (el.matches('[data-setting][type="range"]')) { const out = $(`[data-output="${el.dataset.setting}"]`); if (out) out.textContent = `${fmt(Number(el.value), el.dataset.setting === 'incline' ? 1 : 0)}${el.dataset.setting === 'incline' ? '°' : ''}`; }
    if (el.matches('[data-action="scrub"]')) { playing = false; suspend(); elapsed = clamp(Number(el.value), 0, models.mid.years); update(); draw(); announce(`Model year ${fmt(elapsed, 1)}. ${$('[data-text="limiter"]').textContent}.`); }
  });
  on(root, 'click', async event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.view) { settings.view = button.dataset.view; syncControls(); save(); draw(); return; }
    const action = button.dataset.action;
    if (action === 'play') { if (elapsed >= models.mid.years) { elapsed = 0; reached.clear(); } playing = !playing; suspend(); update(); draw(); schedule(); announce(`${playing ? 'Construction running' : 'Paused'} at model year ${fmt(elapsed, 1)}. ${$('[data-text="limiter"]').textContent}.`); }
    if (action === 'restart') { suspend(); rebuild(); }
    if (action === 'compare') { compareOpen = !compareOpen; $('[data-compare]').hidden = !compareOpen; button.setAttribute('aria-expanded', String(compareOpen)); if (compareOpen) comparison(); }
    if (action === 'download') {
      const blob = await png(); if (destroyed) return;
      if (!blob) { put('shareStatus', 'PNG export was unavailable in this browser.'); return; }
      if (cardURL) URL.revokeObjectURL(cardURL);
      cardURL = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = cardURL; a.download = 'neokemetai-pyramid-lab.png'; root.append(a); a.click(); a.remove(); put('shareStatus', 'Result PNG prepared for download.');
    }
    if (action === 'share') {
      const data = { title: 'Pyramid Builder Lab', text: `${range(models.low.years, models.high.years)} model years · ${fmt(settings.workforce)} people · ${RAMPS[settings.ramp].name}. Simplified block schedule; specialist works unquantified.`, url: LINKS.home };
      // Invoke share during the click's user activation; PNG has its own download.
      if (navigator.share) { try { await navigator.share(data); if (!destroyed) put('shareStatus', 'Result shared.'); } catch (error) { if (error.name !== 'AbortError' && !destroyed) await copyLink(); } }
      else await copyLink();
    }
  });
  on(document, 'visibilitychange', () => { suspend(); if (!document.hidden) { draw(); schedule(); } });
  on(motion, 'change', () => { reduced = motion.matches; draw(); });
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; suspend(); if (visible) { draw(); schedule(); } }, { threshold: 0 });
    intersectionObserver.observe(scene);
  }
  if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(draw); resizeObserver.observe(scene); }
  else on(window, 'resize', draw);
  rebuild();
  return function destroy() {
    if (destroyed) return;
    destroyed = true; suspend(); clearTimeout(announceTimer);
    intersectionObserver?.disconnect(); resizeObserver?.disconnect();
    removers.forEach(remove => remove());
    if (cardURL) URL.revokeObjectURL(cardURL);
    root.remove();
  };
}
