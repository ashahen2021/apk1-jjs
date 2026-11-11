// NeoKemetAI Animation Studio — browser UI (plain JavaScript, no build step).
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (v !== undefined && v !== false) n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
};
const api = async (path, opts = {}) => {
  const res = await fetch(path, opts);
  const type = res.headers.get("content-type") || "";
  if (!res.ok) throw new Error(type.includes("json") ? (await res.json()).error : `Request failed (${res.status})`);
  return type.includes("json") ? res.json() : res.blob();
};
const post = (path, data) => api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });

let catalog, project, slug, dirty = false, timeline = null, settings;
const thumbs = {}; // scene id → object URL

const say = (msg, ok = false) => { const b = $("banner"); b.hidden = !msg; b.textContent = msg || ""; b.className = "banner" + (ok ? " ok" : ""); if (ok && msg) setTimeout(() => { if (b.textContent === msg) b.hidden = true; }, 6000); };
const fail = (e) => say(e.message || String(e));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
const markDirty = () => { dirty = true; $("saved").textContent = "Unsaved changes"; };
const options = (obj, sel, blank) => [blank ? el("option", { value: "" }, blank) : null, ...Object.entries(obj).map(([k, v]) => el("option", { value: k, selected: k === sel }, typeof v === "string" ? v : v.label))];

const blankProject = (title) => ({ version: 1, title, topic: "", script: "", format: "9:16", fps: 30, subtitles: true, audio: { music: "generated", musicVolume: 0.5, musicSeed: 1881, sfx: true, sfxVolume: 0.55, narrationVolume: 1 }, scenes: [{ id: "s01", template: "title", environment: "giza-pyramids", label: title, narration: "", camera: "push-in", ambience: "auto" }] });

// ---------- jobs ----------
const runJob = async (id, onTick) => {
  for (;;) {
    const j = await api(`/api/jobs/${id}`);
    onTick?.(j);
    if (j.status === "done") return j.result;
    if (j.status === "error") throw new Error(j.error);
    await new Promise((r) => setTimeout(r, 600));
  }
};
const showJob = (j) => { $("job").hidden = false; $("jobBar").style.width = j.percent + "%"; $("jobMsg").textContent = j.status === "queued" ? "Waiting for the previous task…" : `${j.percent}% — ${j.message}`; };

// ---------- projects ----------
const refreshProjects = async () => {
  const list = await api("/api/projects");
  $("projectList").replaceChildren(...list.map((p) => el("li", { class: p.slug === slug ? "on" : "", onclick: () => openProject(p.slug) }, p.title, el("small", {}, `${p.scenes} scenes · ${p.format}`))));
  return list;
};
const openProject = async (s) => {
  if (dirty && !confirm("Discard unsaved changes?")) return;
  try { project = await api(`/api/projects/${s}`); slug = s; dirty = false; $("saved").textContent = ""; for (const k in thumbs) delete thumbs[k]; fill(); await refreshProjects(); refreshTimeline(); say(""); } catch (e) { fail(e); }
};
const save = async () => {
  try { project = await api(`/api/projects/${slug}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(project) }); dirty = false; $("saved").textContent = "Saved"; await refreshProjects(); } catch (e) { fail(e); throw e; }
};

// ---------- form binding ----------
const bind = (id, get, set, ev = "input") => { const n = $(id); n.addEventListener(ev, () => { set(n.type === "checkbox" ? n.checked : n.type === "number" || n.type === "range" ? Number(n.value) : n.value); markDirty(); }); n._get = get; };
const fill = () => {
  for (const n of document.querySelectorAll("[id]")) if (n._get) { const v = n._get(); if (n.type === "checkbox") n.checked = !!v; else n.value = v ?? ""; }
  $("musicName").textContent = project.audio.musicFile || "";
  renderScenes();
};
const refreshTimeline = async () => {
  if (!project) return;
  try {
    timeline = await post(`/api/projects/${slug}/timeline`, { project });
    const mm = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
    $("timelineBox").replaceChildren(el("b", {}, `Film length: ${mm(timeline.seconds)} (${timeline.totalFrames} frames) · ${project.scenes.length} scenes`), ...timeline.warnings.map((w) => el("div", { class: "muted" }, "• " + w)));
    $("sbSummary").textContent = `${project.scenes.length} scenes · ${mm(timeline.seconds)} total`;
    document.querySelectorAll(".scene").forEach((n, i) => { const t = timeline.scenes[i]; const m = n.querySelector(".meta"); if (t && m) m.textContent = `${t.seconds.toFixed(1)} s · voice ${t.narrationSec.toFixed(1)} s ${t.estimated ? "(estimated)" : "(measured from audio)"}`; });
  } catch (e) { $("timelineBox").textContent = e.message; }
};
let tlTimer; const touch = () => { markDirty(); clearTimeout(tlTimer); tlTimer = setTimeout(refreshTimeline, 500); };

// ---------- storyboard ----------
const preview = async (i, box) => {
  box.replaceChildren(el("span", {}, "Rendering preview…"));
  try { const blob = await api(`/api/projects/${slug}/preview?scene=${i}&at=0.6`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project }) }); thumbs[project.scenes[i].id] = URL.createObjectURL(blob); box.replaceChildren(el("img", { src: thumbs[project.scenes[i].id] })); } catch (e) { box.replaceChildren(el("span", {}, e.message)); }
};
const renderScenes = () => {
  const uses = (s, f) => catalog.TEMPLATES[s.template].uses.includes(f);
  $("scenes").replaceChildren(...project.scenes.map((s, i) => {
    const set = (k, v) => { if (v === "" || v === undefined) delete s[k]; else s[k] = v; touch(); };
    const thumb = el("div", { class: "thumb" }, thumbs[s.id] ? el("img", { src: thumbs[s.id] }) : el("span", {}, "No preview yet"));
    const tpl = el("select", { onchange: (e) => { s.template = e.target.value; touch(); renderScenes(); } });
    for (const g of ["Generic", "Royal Cache presets"]) tpl.append(el("optgroup", { label: g }, ...Object.entries(catalog.TEMPLATES).filter(([, t]) => t.group === g).map(([k, t]) => el("option", { value: k, selected: k === s.template }, t.label))));
    const fields = [el("label", {}, "Template", tpl)];
    if (uses(s, "environment")) fields.push(el("label", {}, "Environment", el("select", { onchange: (e) => set("environment", e.target.value) }, options(catalog.ENVIRONMENTS, s.environment, "(default)"))));
    if (uses(s, "camera")) fields.push(el("label", {}, "Camera", el("select", { onchange: (e) => set("camera", e.target.value) }, options(catalog.CAMERAS, s.camera, "(default)"))));
    if (uses(s, "prop")) fields.push(el("label", {}, "Object", el("select", { onchange: (e) => set("prop", e.target.value) }, options(catalog.PROPS, s.prop, "(default)"))));
    if (uses(s, "variant")) fields.push(el("label", {}, "State", el("select", { onchange: (e) => set("variant", e.target.value) }, (catalog.TEMPLATES[s.template].variants || []).map((v) => el("option", { value: v, selected: v === s.variant }, v)))));
    if (uses(s, "label")) fields.push(el("label", {}, "On-screen label", el("input", { value: s.label || "", maxlength: 70, oninput: (e) => set("label", e.target.value) })));
    if (uses(s, "sublabel")) fields.push(el("label", {}, s.template === "map" ? "Places: A | B | C" : "Second line", el("input", { value: s.sublabel || "", maxlength: 120, oninput: (e) => set("sublabel", e.target.value) })));
    fields.push(el("label", {}, "Length (seconds, blank = follow narration)", el("input", { type: "number", min: 2, max: 60, step: 0.5, value: s.durationSec ?? "", oninput: (e) => set("durationSec", e.target.value ? Number(e.target.value) : undefined) })));
    if (uses(s, "cast")) {
      s.cast = s.cast || [];
      const cast = el("div", { class: "cast" }, el("b", {}, "Characters:"), ...s.cast.map((m, k) => el("span", { class: "member" },
        el("select", { onchange: (e) => { m.kind = e.target.value; touch(); } }, options(catalog.CHARACTERS, m.kind)),
        el("select", { onchange: (e) => { m.action = e.target.value; touch(); } }, options(catalog.ACTIONS, m.action)),
        el("button", { class: "small", onclick: () => { s.cast.splice(k, 1); touch(); renderScenes(); } }, "×"))),
        s.cast.length < 5 ? el("button", { class: "small", onclick: () => { s.cast.push({ kind: "priest", action: "stand" }); touch(); renderScenes(); } }, "+ character") : null);
      fields.push(cast);
    }
    fields.push(el("textarea", { rows: 3, placeholder: "Narration for this scene (also used for the subtitles)", oninput: (e) => { s.narration = e.target.value; touch(); } }, s.narration || ""));
    const file = el("input", { type: "file", accept: "audio/*,.wav,.mp3,.m4a", hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = await api(`/api/projects/${slug}/upload?kind=narration&name=${encodeURIComponent(String(i + 1).padStart(2, "0") + "-" + f.name)}`, { method: "POST", body: f }); s.narrationFile = r.file; touch(); renderScenes(); refreshTimeline(); } catch (err) { fail(err); } } });
    return el("div", { class: "scene" },
      el("div", { class: "side" }, thumb,
        el("button", { class: "small", onclick: () => preview(i, thumb) }, "Preview frame"),
        el("button", { class: "small", onclick: () => exportVideo(i) }, "Render this scene")),
      el("div", {},
        el("div", { class: "head" }, el("b", {}, `Scene ${i + 1}`), el("span", { class: "meta" }), el("span", { class: "sp" }),
          el("button", { class: "small", disabled: i === 0, onclick: () => { project.scenes.splice(i - 1, 0, project.scenes.splice(i, 1)[0]); touch(); renderScenes(); } }, "↑"),
          el("button", { class: "small", disabled: i === project.scenes.length - 1, onclick: () => { project.scenes.splice(i + 1, 0, project.scenes.splice(i, 1)[0]); touch(); renderScenes(); } }, "↓"),
          el("button", { class: "small", onclick: () => { const c = JSON.parse(JSON.stringify(s)); c.id = newId(); delete c.narrationFile; project.scenes.splice(i + 1, 0, c); touch(); renderScenes(); } }, "Duplicate"),
          el("button", { class: "small danger", disabled: project.scenes.length === 1, onclick: () => { project.scenes.splice(i, 1); touch(); renderScenes(); } }, "Delete")),
        el("div", { class: "muted" }, catalog.TEMPLATES[s.template].description),
        el("div", { class: "fields" }, fields),
        el("div", { class: "row" }, el("label", { class: "filebtn" }, "Import narration audio", file), el("span", { class: "muted" }, s.narrationFile ? `Audio: ${s.narrationFile}` : "No audio yet — length is estimated from the text"),
          s.narrationFile ? el("button", { class: "small", onclick: () => { delete s.narrationFile; touch(); renderScenes(); } }, "Remove audio") : null)));
  }));
  refreshTimeline();
};
const newId = () => { let n = project.scenes.length + 1; while (project.scenes.some((s) => s.id === "s" + String(n).padStart(2, "0"))) n++; return "s" + String(n).padStart(2, "0"); };

// ---------- actions ----------
const exportVideo = async (scene) => {
  try {
    await save(); say("");
    document.querySelector('[data-tab="export"]').click();
    $("result").hidden = true;
    const { job } = await post(`/api/projects/${slug}/render${scene === undefined ? "" : `?scene=${scene}`}`, { project });
    const r = await runJob(job, showJob);
    showJob({ percent: 100, message: "Done", status: "done" });
    const url = `/output/${encodeURIComponent(r.name)}?t=${Date.now()}`;
    $("result").hidden = false;
    $("result").replaceChildren(el("b", {}, r.name), el("div", { class: "muted" }, `${r.info.width}×${r.info.height} · ${r.info.fps} fps · ${r.info.frames} frames · ${r.info.seconds.toFixed(2)} s · ${(r.info.bytes / 1e6).toFixed(1)} MB · ${r.rendered} scenes rendered, ${r.reused} reused · took ${r.tookSec.toFixed(0)} s`), ...r.warnings.map((w) => el("div", { class: "muted" }, "• " + w)), el("div", { class: "row" }, el("video", { src: url, controls: true }), el("div", {}, el("a", { href: url, download: r.name }, "Download MP4"), el("div", { class: "muted" }, `Saved in: ${status.outputDir}`))));
    loadOutputs();
  } catch (e) { fail(e); }
};
const narrate = async (provider) => {
  if (provider === "elevenlabs" && !confirm("ElevenLabs is a paid cloud service. Your narration text will be sent to ElevenLabs and billed to your account. Continue?")) return;
  try {
    await save(); say("");
    $(provider === "piper" ? "piperState" : "ollamaState").textContent = "";
    const { job } = await post(`/api/projects/${slug}/narrate?provider=${provider}`, { project });
    const r = await runJob(job, (j) => { $("piperState").textContent = j.status === "running" ? `${j.percent}% — ${j.message}` : ""; });
    project = r.project; dirty = false; fill();
    say(`Narration ready: ${r.made} generated, ${r.total - r.made} already up to date.`, true); $("piperState").textContent = "";
  } catch (e) { fail(e); $("piperState").textContent = ""; }
};
const loadOutputs = async () => {
  const list = await api("/api/outputs");
  $("outputs").replaceChildren(...(list.length ? list.map((o) => el("li", {}, el("a", { href: `/output/${encodeURIComponent(o.name)}`, target: "_blank" }, o.name), el("span", { class: "muted" }, `${(o.bytes / 1e6).toFixed(1)} MB · ${new Date(o.mtime).toLocaleString()}`))) : [el("li", { class: "muted" }, "Nothing exported yet.")]));
};

let status = {};
const loadStatus = async () => {
  status = await api("/api/status");
  $("status").replaceChildren(
    el("span", { class: "pill ok" }, "Renderer ready"),
    el("span", { class: "pill " + (status.piper.installed && status.piper.model ? "ok" : "off") }, status.piper.installed ? (status.piper.model ? `Piper: ${status.piper.model.replace(".onnx", "")}` : "Piper: no voice") : "Piper not installed"),
    el("span", { class: "pill " + (status.ollama.reachable ? "ok" : "off") }, status.ollama.reachable ? `Ollama: ${status.ollama.models.length} models` : "Ollama off (optional)"),
    ...(status.elevenlabs.enabled ? [el("span", { class: "pill" }, "ElevenLabs enabled (paid)")] : []));
  $("btnPiper").disabled = !(status.piper.installed && status.piper.model);
  if (!status.piper.installed) $("piperState").textContent = "Piper is not installed yet — run scripts\\setup-piper.ps1 once (see README).";
  $("btnOllama").disabled = !status.ollama.reachable;
  $("ollamaState").textContent = status.ollama.reachable ? "" : "Ollama is not running — this step is optional.";
  $("elRow").hidden = !status.elevenlabs.enabled;
  $("ollamaModels").replaceChildren(...status.ollama.models.map((m) => el("option", { value: m })));
};
const loadSettings = async () => {
  settings = await api("/api/settings");
  $("sOllamaUrl").value = settings.ollamaUrl; $("sOllamaModel").value = settings.ollamaModel; $("sPiperPath").value = settings.piperPath; $("sPiperModel").value = settings.piperModel; $("sPiperSpeed").value = settings.piperSpeed; $("sConc").value = settings.renderConcurrency;
  $("sElOn").checked = settings.elevenlabs.enabled; $("sElVoice").value = settings.elevenlabs.voiceId; $("sElKey").value = ""; $("sElHas").textContent = settings.elevenlabs.hasKey ? "(a key is stored)" : "(no key stored)";
};

// ---------- wiring ----------
const init = async () => {
  catalog = await api("/api/catalog");
  $("fFormat").append(...options(catalog.FORMATS)); $("fFps").append(...catalog.FPS_OPTIONS.map((f) => el("option", { value: f }, `${f} fps`)));
  bind("fTitle", () => project.title, (v) => (project.title = v));
  bind("fTopic", () => project.topic, (v) => (project.topic = v));
  bind("fFormat", () => project.format, (v) => { project.format = v; for (const k in thumbs) delete thumbs[k]; renderScenes(); }, "change");
  bind("fFps", () => project.fps, (v) => { project.fps = Number(v); refreshTimeline(); }, "change");
  bind("fSubs", () => project.subtitles, (v) => (project.subtitles = v), "change");
  bind("fScript", () => project.script, (v) => (project.script = v));
  bind("fVoVol", () => project.audio.narrationVolume, (v) => (project.audio.narrationVolume = v));
  bind("fMusic", () => project.audio.music, (v) => (project.audio.music = v), "change");
  bind("fSeed", () => project.audio.musicSeed, (v) => (project.audio.musicSeed = Math.round(v) || 0));
  bind("fMusicVol", () => project.audio.musicVolume, (v) => (project.audio.musicVolume = v));
  bind("fSfx", () => project.audio.sfx, (v) => (project.audio.sfx = v), "change");
  bind("fSfxVol", () => project.audio.sfxVolume, (v) => (project.audio.sfxVolume = v));
  $("tabs").addEventListener("click", (e) => { const t = e.target.dataset.tab; if (!t) return; document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b === e.target)); document.querySelectorAll(".tab").forEach((s) => s.classList.toggle("on", s.id === "tab-" + t)); if (t === "export") loadOutputs(); });
  $("btnSave").onclick = () => save().then(() => say("Project saved.", true)).catch(() => {});
  $("btnNew").onclick = async () => {
    const title = prompt("Title of the new video:"); if (!title) return;
    let s = slugify(title); const have = (await api("/api/projects")).map((p) => p.slug); let n = 2; while (have.includes(s)) s = `${slugify(title)}-${n++}`;
    slug = s; project = blankProject(title); dirty = false; await save(); fill(); refreshTimeline();
  };
  $("fScriptFile").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; project.script = await f.text(); $("fScript").value = project.script; markDirty(); say(`Imported ${f.name}.`, true); };
  $("btnPlan").onclick = async () => {
    if (project.scenes.some((s) => s.narration) && !confirm("Replace the current storyboard with one built from the script?")) return;
    try { const r = await post("/api/plan", { title: project.title, script: project.script }); project.scenes = r.scenes; markDirty(); renderScenes(); document.querySelector('[data-tab="storyboard"]').click(); say(`Storyboard built: ${r.scenes.length} scenes. Check each scene, then generate narration.`, true); } catch (e) { fail(e); }
  };
  $("btnOllama").onclick = async () => {
    try {
      $("ollamaState").textContent = "Working — local models can take a minute…";
      const { job } = await post("/api/ollama/storyboard", { topic: project.topic || project.title, script: project.script, sceneCount: Number($("fAiScenes").value) });
      const r = await runJob(job); project.scenes = r.scenes; if (!project.script) project.script = r.scenes.map((s) => s.narration).join("\n\n");
      $("fScript").value = project.script; markDirty(); renderScenes(); $("ollamaState").textContent = ""; document.querySelector('[data-tab="storyboard"]').click(); say(`Ollama returned ${r.scenes.length} validated scenes. Review the facts before exporting.`, true);
    } catch (e) { $("ollamaState").textContent = ""; fail(e); }
  };
  $("btnAddScene").onclick = () => { project.scenes.push({ id: newId(), template: "landscape", environment: "open-desert", narration: "", camera: "pan-right", ambience: "auto" }); touch(); renderScenes(); };
  $("btnPiper").onclick = () => narrate("piper");
  $("btnEleven").onclick = () => narrate("elevenlabs");
  $("fMusicFile").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = await api(`/api/projects/${slug}/upload?kind=music&name=${encodeURIComponent(f.name)}`, { method: "POST", body: f }); project.audio.musicFile = r.file; project.audio.music = "file"; markDirty(); fill(); } catch (err) { fail(err); } };
  $("btnRender").onclick = () => exportVideo();
  $("btnSaveSettings").onclick = async () => {
    try {
      await api("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ollamaUrl: $("sOllamaUrl").value.trim(), ollamaModel: $("sOllamaModel").value.trim(), piperPath: $("sPiperPath").value.trim(), piperModel: $("sPiperModel").value.trim(), piperSpeed: Number($("sPiperSpeed").value) || 1.12, renderConcurrency: Number($("sConc").value) || 0, elevenlabs: { enabled: $("sElOn").checked, voiceId: $("sElVoice").value.trim(), apiKey: $("sElKey").value } }) });
      await loadSettings(); await loadStatus(); say("Settings saved.", true);
    } catch (e) { fail(e); }
  };
  window.addEventListener("beforeunload", (e) => { if (dirty) e.preventDefault(); });
  await loadSettings(); await loadStatus();
  const list = await refreshProjects();
  if (list.length) await openProject((list.find((p) => p.slug.startsWith("demo")) || list[0]).slug);
  else { slug = "my-first-video"; project = blankProject("My first video"); await save(); fill(); }
};
init().catch(fail);
